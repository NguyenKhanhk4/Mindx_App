import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as OpenIDConnectStrategy } from "passport-openidconnect";
import jwt from "jsonwebtoken";
import * as appInsights from "applicationinsights";

// [Week 2] Setup Azure Application Insights
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  appInsights
    .setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, false)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .start();

  console.log("✅ Azure Application Insights with Live Metrics enabled");
} else {
  console.warn("⚠️  APPINSIGHTS_CONNECTION_STRING not set - metrics disabled");
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
    }
  }
}

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mindx-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// OpenID Connect Configuration
const OPENID_CONFIG = {
  issuer: "https://id-dev.mindx.edu.vn",
  authorizationURL: "https://id-dev.mindx.edu.vn/auth",
  tokenURL: "https://id-dev.mindx.edu.vn/token",
  userInfoURL: "https://id-dev.mindx.edu.vn/userinfo",
  clientID: process.env.OPENID_CLIENT_ID || "mindx-onboarding",
  clientSecret:
    process.env.OPENID_CLIENT_SECRET ||
    "cHJdmVudGJvdWskYmFQdHJlZJlIZWV4GxvcmVjZWxsbVydm91c2ZhcG9ydiZhZhbnNOZWU=",
  callbackURL:
    process.env.OPENID_CALLBACK_URL ||
    "https://mindxapi06.azurewebsites.net/auth/callback",
  scope: ["openid", "profile", "email"],
  skipUserProfile: false,
};

// Passport OpenID Strategy
passport.use(
  new OpenIDConnectStrategy(
    OPENID_CONFIG,
    (
      issuer: string,
      profile: any,
      context: any,
      idProfile: any,
      done: (error: any, user?: any) => void
    ) => {
      // Extract user info from profile or idProfile
      const userInfo = {
        id: profile.id || idProfile?.sub || profile._json?.sub,
        email:
          profile.emails?.[0]?.value ||
          profile._json?.email ||
          idProfile?.email,
        displayName:
          profile.displayName || profile._json?.name || idProfile?.name,
        name: profile.name || profile._json?.name || idProfile?.name,
      };

      return done(null, userInfo);
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// [Task 1.1] Health Check - Required for Kubernetes probes
app.get("/health", (req, res) => {
  // Track health check
  appInsights.defaultClient?.trackEvent({
    name: "HealthCheck",
    properties: { status: "UP" },
  });

  res.json({
    status: "UP",
    message: "MindX API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// [Week 2] Test endpoint for slow response alert
app.get("/api/slow", async (req, res) => {
  const delay = parseInt(req.query.delay as string) || 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));
  res.json({ message: "Slow response test", delay });
});

// [Task 5.2] Authentication Middleware with JWT
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authorization header is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mindx-jwt-secret"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};

// OpenID Authentication Routes
app.get("/auth/login", (req, res, next) => {
  appInsights.defaultClient?.trackEvent({
    name: "LoginAttempt",
    properties: { method: "OpenID" },
  });
  // Add prompt=login to force re-authentication
  passport.authenticate("openidconnect", {
    prompt: "login",
  })(req, res, next);
});

app.get(
  "/auth/callback",
  (req, res, next) => {
    next();
  },
  passport.authenticate("openidconnect", {
    failureRedirect: "/auth/error",
    failureMessage: true,
  }),
  (req: any, res) => {
    // Track successful authentication
    appInsights.defaultClient?.trackEvent({
      name: "LoginSuccess",
      properties: {
        userId: req.user.id,
        email: req.user.email,
      },
    });

    // Generate JWT token for the authenticated user
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.emails?.[0]?.value || req.user.email,
        name: req.user.displayName || req.user.name,
      },
      process.env.JWT_SECRET || "mindx-jwt-secret",
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token (root path, not /auth/success)
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}?token=${token}`);
  }
);

app.get("/auth/error", (req, res) => {
  console.error("❌ Authentication error:", req.session);

  appInsights.defaultClient?.trackException({
    exception: new Error("Authentication failed"),
    properties: { details: req.query },
  });

  res.status(401).json({
    error: "Authentication failed",
    message: "Failed to authenticate with OpenID provider",
    details: req.query,
  });
});

app.get("/auth/logout", (req: any, res) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    // Clear session completely
    req.session.destroy(() => {
      // Clear cookies
      res.clearCookie("connect.sid");
      // Redirect to frontend
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(frontendURL);
    });
  });
});

// Public API endpoint
app.get("/api/info", (req, res) => {
  res.json({
    app: "MindX Engineer Onboarding",
    version: "1.0.0",
    week: "Week 1",
    features: ["Authentication", "Azure AKS", "Kubernetes", "Ingress"],
  });
});

// Protected API endpoint - requires authentication
app.get("/api/dashboard", authMiddleware, (req, res) => {
  appInsights.defaultClient?.trackEvent({
    name: "DashboardAccess",
    properties: {
      userId: (req as any).user?.id,
      email: (req as any).user?.email,
    },
  });

  res.json({
    success: true,
    message: "Welcome to protected dashboard",
    user: req.user,
    data: {
      stats: {
        deployments: 42,
        containers: 8,
        uptime: "99.9%",
      },
      environment: "Azure AKS",
      region: "Southeast Asia",
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} does not exist`,
    availableRoutes: [
      "GET /health",
      "GET /api/info",
      "GET /api/dashboard (requires auth)",
    ],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📊 Metrics: ${
      process.env.APPINSIGHTS_CONNECTION_STRING ? "Enabled" : "Disabled"
    }`
  );
});
