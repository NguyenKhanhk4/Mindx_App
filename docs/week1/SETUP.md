# Week 1: Local Development Setup

## Prerequisites

### Required Software

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))
- **Azure CLI** ([Install Guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- **kubectl** (cho AKS deployment)

### Verify Installation

```bash
node --version    # v18.x.x or higher
npm --version     # v9.x.x or higher
docker --version  # Docker version 20.x.x or higher
git --version     # git version 2.x.x or higher
az --version      # azure-cli 2.x.x or higher
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-local-session-secret-min-32-chars
JWT_SECRET=your-local-jwt-secret-min-32-chars

# OpenID Configuration
OPENID_CLIENT_ID=mindx-onboarding
OPENID_CLIENT_SECRET=your-openid-secret
OPENID_CALLBACK_URL=http://localhost:3000/auth/callback
```

> **Lưu ý**: Để lấy OpenID credentials, liên hệ với team MindX hoặc Sys Admin.

### 3. Run Backend

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Backend sẽ chạy tại: **http://localhost:3000**

### 4. Test Backend

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api/info
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create Environment File

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

### 3. Run Frontend

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend sẽ chạy tại: **http://localhost:5173**

### 4. Test Frontend

Mở browser: http://localhost:5173

- Click "Login with MindX OpenID"
- Test authentication flow
- Verify dashboard access sau khi login

## Docker Setup (Local)

### Build Docker Images

```bash
# Backend
cd backend
docker build -t mindx-backend:local .

# Frontend
cd frontend
docker build -t mindx-frontend:local .
```

### Run with Docker

```bash
# Backend
docker run -p 3000:3000 \
  -e FRONTEND_URL=http://localhost:8080 \
  -e JWT_SECRET=your-secret \
  -e SESSION_SECRET=your-secret \
  mindx-backend:local

# Frontend
docker run -p 8080:8080 \
  mindx-frontend:local
```

### Run with Docker Compose (Optional)

Tạo file `docker-compose.yml` trong root folder:

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - FRONTEND_URL=http://localhost:8080
      - JWT_SECRET=your-secret
      - SESSION_SECRET=your-secret
      - OPENID_CLIENT_ID=mindx-onboarding
      - OPENID_CLIENT_SECRET=your-secret
      - OPENID_CALLBACK_URL=http://localhost:3000/auth/callback

  frontend:
    build: ./frontend
    ports:
      - "8080:8080"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend
```

Run with:

```bash
docker-compose up -d
```

## Azure CLI Setup

### Login to Azure

```bash
az login
```

### Set Active Subscription

```bash
# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "your-subscription-id"

# Verify
az account show
```

### Login to Azure Container Registry

```bash
az acr login --name mindxacr06
```

## kubectl Setup (cho AKS)

### Install kubectl

```bash
# Windows (using Azure CLI)
az aks install-cli

# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

### Get AKS Credentials

```bash
az aks get-credentials --resource-group mindx-rg --name mindxaks06
```

### Verify Connection

```bash
kubectl cluster-info
kubectl get nodes
```

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t mindx-backend:local .
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### OpenID Authentication Not Working

1. Verify OpenID credentials trong `.env`
2. Check callback URL match với OpenID configuration
3. Ensure `FRONTEND_URL` được set đúng
4. Check browser console cho errors

## Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend** (terminal mới): `cd frontend && npm run dev`
3. **Make Changes**: Edit code, changes auto-reload
4. **Test**: Test locally trước khi commit
5. **Commit**: `git add . && git commit -m "message"`
6. **Build Docker Images**: Test Docker build trước khi deploy
7. **Deploy**: Follow deployment guide

## Next Steps

- ✅ Local development working
- 📚 Xem [Deployment Guide](./DEPLOYMENT.md) để deploy lên Azure
- 🔐 Xem [Authentication Flow](./AUTH_FLOW.md) để hiểu authentication
