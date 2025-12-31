import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as OpenIDConnectStrategy } from "passport-openidconnect";
import jwt from "jsonwebtoken";

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
  res.json({
    status: "UP",
    message: "MindX API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
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
  passport.authenticate("openidconnect")(req, res, next);
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
    res.json({ success: true, message: "Logged out successfully" });
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
  // Server started
});
