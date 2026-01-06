# Week 1: OpenID Authentication Flow

## Authentication Overview

Ứng dụng sử dụng **OpenID Connect (OIDC)** authentication với MindX OpenID Provider (`id-dev.mindx.edu.vn`). Backend xử lý authentication và generate JWT tokens cho authorization.

## Authentication Flow Diagram

```
┌─────────────┐                                           ┌─────────────────┐
│   Browser   │                                           │  OpenID Provider│
│   (User)    │                                           │ id-dev.mindx.edu│
└──────┬──────┘                                           └────────┬────────┘
       │                                                            │
       │ 1. Click "Login"                                          │
       │────────────────────────────────────────►                  │
       │                                        │                  │
       │                          ┌─────────────▼─────────────┐    │
       │                          │      Frontend React       │    │
       │                          │  (http://localhost:5173)  │    │
       │                          └─────────────┬─────────────┘    │
       │                                        │                  │
       │ 2. Redirect to /auth/login             │                  │
       │◄───────────────────────────────────────┘                  │
       │                                                            │
       │ 3. Request /auth/login                                    │
       │─────────────────────────────────────────────────►         │
       │                                      ┌───────────▼────────┴──┐
       │                                      │   Backend API         │
       │                                      │  (Express + Passport) │
       │                                      └───────────┬───────────┘
       │                                                  │
       │ 4. Redirect to OpenID Provider                  │
       │◄─────────────────────────────────────────────────┘
       │  (https://id-dev.mindx.edu.vn/auth?...)
       │                                                            │
       │ 5. Redirect to OpenID Login                               │
       │────────────────────────────────────────────────────────────►
       │                                                            │
       │                    6. User enters credentials             │
       │                       (email + password)                  │
       │◄───────────────────────────────────────────────────────────┤
       │                                                            │
       │ 7. OpenID validates & redirects back                      │
       │    to callback URL with authorization code                │
       │◄───────────────────────────────────────────────────────────┤
       │  (https://.../auth/callback?code=xxx)                     │
       │                                                            │
       │ 8. Backend receives callback                              │
       │─────────────────────────────────────────────────►         │
       │                                      ┌───────────▼─────────┐
       │                                      │   Backend API       │
       │                                      │  Exchange code for  │
       │                                      │  user info (ID token)│
       │                                      └───────────┬─────────┘
       │                                                  │
       │                         9. Backend generates JWT token     │
       │                            with user info                  │
       │                                                  │
       │ 10. Redirect to Frontend with JWT token         │
       │◄─────────────────────────────────────────────────┘
       │  (https://.../?token=eyJhbGc...)
       │
       │                          ┌─────────────▼─────────────┐
       │                          │      Frontend React       │
       │                          │  Store token in           │
       │                          │  localStorage             │
       │                          └─────────────┬─────────────┘
       │                                        │
       │ 11. Access protected pages             │
       │     Include token in API requests      │
       │────────────────────────────────────────►
       │     Authorization: Bearer eyJhbGc...   │
       │                                        │
       │                          ┌─────────────▼─────────────┐
       │                          │   Backend API             │
       │                          │  Validate JWT token       │
       │                          │  Return protected data    │
       │                          └─────────────┬─────────────┘
       │                                        │
       │ 12. Protected data returned            │
       │◄───────────────────────────────────────┘
       │  { user: {...}, data: {...} }
       │
```

## Detailed Flow Steps

### 1. User Initiates Login

**Frontend (App.tsx)**:

```typescript
const handleLogin = () => {
  // Redirect đến backend login endpoint
  window.location.href = `${API_URL}/auth/login`;
};
```

### 2. Backend Initiates OpenID Authentication

**Backend (index.ts)**:

```typescript
app.get("/auth/login", passport.authenticate("openidconnect"));
```

Passport.js xử lý redirect đến OpenID Provider với các parameters:

- `client_id`: Application identifier
- `redirect_uri`: Callback URL
- `response_type`: code
- `scope`: openid profile email

### 3. User Authenticates with OpenID Provider

User được redirect đến `id-dev.mindx.edu.vn` và nhập:

- Email
- Password

OpenID Provider validates credentials.

### 4. OpenID Redirects Back with Authorization Code

Sau khi authenticate thành công, OpenID Provider redirects về:

```
https://mindxapi06.azurewebsites.net/auth/callback?code=AUTHORIZATION_CODE
```

### 5. Backend Exchanges Code for Tokens

**Backend callback handler**:

```typescript
app.get(
  "/auth/callback",
  passport.authenticate("openidconnect", {
    failureRedirect: "/auth/login",
  }),
  (req, res) => {
    // Exchange authorization code for ID token
    // Passport automatically handles this

    // User info available in req.user
    const user = req.user;

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  }
);
```

### 6. Frontend Stores JWT Token

**Frontend (App.tsx)**:

```typescript
useEffect(() => {
  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    // Store token in localStorage
    localStorage.setItem("token", token);

    // Clean URL
    window.history.replaceState({}, "", "/");

    // Fetch user data
    fetchDashboard();
  }
}, []);
```

### 7. Frontend Makes Authenticated Requests

**Frontend API calls**:

```typescript
const fetchDashboard = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  setDashboard(data);
};
```

### 8. Backend Validates JWT Token

**Backend middleware**:

```typescript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

// Protected route
app.get("/api/dashboard", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    data: {
      /* protected data */
    },
  });
});
```

## Key Components

### Backend - Passport.js Configuration

```typescript
import passport from "passport";
import { Strategy as OpenIDConnectStrategy } from "passport-openidconnect";

passport.use(
  new OpenIDConnectStrategy(
    {
      issuer: "https://id-dev.mindx.edu.vn",
      authorizationURL: "https://id-dev.mindx.edu.vn/auth",
      tokenURL: "https://id-dev.mindx.edu.vn/token",
      userInfoURL: "https://id-dev.mindx.edu.vn/userinfo",
      clientID: process.env.OPENID_CLIENT_ID,
      clientSecret: process.env.OPENID_CLIENT_SECRET,
      callbackURL: process.env.OPENID_CALLBACK_URL,
      scope: "openid profile email",
    },
    (issuer, profile, done) => {
      return done(null, profile);
    }
  )
);
```

### Backend - JWT Token Generation

```typescript
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.displayName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
      issuer: "mindx-api",
    }
  );
};
```

### Frontend - Token Management

```typescript
// Store token
localStorage.setItem("token", token);

// Get token
const token = localStorage.getItem("token");

// Remove token (logout)
localStorage.removeItem("token");

// Include in requests
fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Security Considerations

### 1. Token Security

- JWT tokens stored in localStorage (XSS vulnerable)
- Consider httpOnly cookies for production
- Set appropriate token expiration (24h)

### 2. HTTPS Required

- All authentication flows MUST use HTTPS
- Prevents token interception

### 3. Token Validation

- Backend validates every protected request
- Check token signature
- Verify token not expired

### 4. Environment Variables

- Never commit secrets to git
- Use Azure Key Vault for production secrets
- Rotate secrets regularly

## Endpoints

### Public Endpoints

| Method | Path             | Description             |
| ------ | ---------------- | ----------------------- |
| GET    | `/health`        | Health check            |
| GET    | `/api/info`      | Public API info         |
| GET    | `/auth/login`    | Initiate OpenID login   |
| GET    | `/auth/callback` | OpenID callback handler |
| GET    | `/auth/logout`   | Logout user             |

### Protected Endpoints

| Method | Path             | Description    | Auth Required |
| ------ | ---------------- | -------------- | ------------- |
| GET    | `/api/dashboard` | User dashboard | ✅ JWT Token  |

## Testing Authentication

### Test Login Flow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open Browser**: http://localhost:5173
4. **Click Login**: Redirects to OpenID
5. **Enter Credentials**: MindX account
6. **Verify**: Should see dashboard with user info

### Test Protected Endpoint

```bash
# Get token from localStorage after login

# Test protected endpoint
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Token Expiration

```typescript
// Frontend: Check if token expired
const isTokenExpired = () => {
  const token = localStorage.getItem("token");
  if (!token) return true;

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
```

## Logout Flow

```typescript
// Frontend
const handleLogout = () => {
  // Remove token
  localStorage.removeItem("token");

  // Redirect to login
  window.location.href = "/";

  // Optional: Call backend logout
  fetch(`${API_URL}/auth/logout`);
};
```

## Common Issues

### 1. Callback URL Mismatch

**Error**: "redirect_uri mismatch"  
**Fix**: Ensure `OPENID_CALLBACK_URL` matches registered URL

### 2. CORS Errors

**Error**: "CORS policy blocked"  
**Fix**: Configure CORS in backend for frontend URL

### 3. Invalid Token

**Error**: "Invalid token"  
**Fix**: Check JWT_SECRET matches, token not expired

### 4. OpenID Provider Unreachable

**Error**: "Cannot connect to OpenID provider"  
**Fix**: Check network, VPN, firewall settings

## Next Steps

- ✅ Authentication working
- 📚 Xem [Deployment Guide](./DEPLOYMENT.md) để deploy
- 📊 Setup monitoring (Week 2)
