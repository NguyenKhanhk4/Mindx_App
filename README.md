# MindX Engineer Onboarding - Week 1

Full-stack application deployed on Azure Cloud with OpenID authentication.

## 🚀 Live Deployment

### Azure Web Apps (Step 1 & 4)

- **Frontend**: https://mindxweb06.azurewebsites.net
- **Backend API**: https://mindxapi06.azurewebsites.net
- **API Health Check**: https://mindxapi06.azurewebsites.net/health
- **API Info**: https://mindxapi06.azurewebsites.net/api/info

### Azure Kubernetes Service (AKS)

- **🌐 HTTPS URL**: https://20.18.237.151.nip.io
- **Cluster**: mindxaks06 (Japan East)
- **Frontend**: https://20.18.237.151.nip.io/
- **Backend API**: https://20.18.237.151.nip.io/api/info
- **Health Check**: https://20.18.237.151.nip.io/health
- **SSL**: Let's Encrypt (Staging Certificate)

**Note:** Browser may show SSL warning - this is expected with staging certificates. Connection is still encrypted.

## 🏗️ Architecture

### Architecture 1: Azure Web Apps (Completed)

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD                              │
│                                                             │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │  Frontend          │      │  Backend API       │        │
│  │  React App         │◄─────┤  Node.js/Express   │        │
│  │  (Static + Nginx)  │ HTTPS│  + OpenID Auth     │        │
│  │                    │      │                    │        │
│  │ mindxweb06         │      │ mindxapi06         │        │
│  │ .azurewebsites.net │      │ .azurewebsites.net │        │
│  └────────────────────┘      └────────────────────┘        │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        │                                    │
│                        ▼                                    │
│              ┌──────────────────┐                           │
│              │  OpenID Provider │                           │
│              │ id-dev.mindx.edu.vn                          │
│              └──────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Architecture 2: Azure Kubernetes Service (AKS)

```
┌──────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Azure Kubernetes Service (AKS)                 │ │
│  │                                                        │ │
│  │   ┌──────────────────────────────────────────────┐    │ │
│  │   │         Nginx Ingress Controller             │    │ │
│  │   │  (External LoadBalancer with Public IP)      │    │ │
│  │   └────────────────┬─────────────────────────────┘    │ │
│  │                    │                                   │ │
│  │         ┌──────────┴──────────┐                        │ │
│  │         │                     │                        │ │
│  │   ┌─────▼─────┐        ┌─────▼─────┐                  │ │
│  │   │ Frontend  │        │ Backend   │                  │ │
│  │   │  Service  │        │  Service  │                  │ │
│  │   │(ClusterIP)│        │(ClusterIP)│                  │ │
│  │   └─────┬─────┘        └─────┬─────┘                  │ │
│  │         │                     │                        │ │
│  │   ┌─────▼─────┐        ┌─────▼─────┐                  │ │
│  │   │ Frontend  │        │ Backend   │                  │ │
│  │   │   Pods    │        │   Pods    │                  │ │
│  │   │(2 replicas)        │(2 replicas)                  │ │
│  │   └───────────┘        └─────┬─────┘                  │ │
│  │                              │                         │ │
│  │   ┌──────────────────────────▼──────────┐             │ │
│  │   │          Secrets                    │             │ │
│  │   │  (JWT, Session, OpenID credentials) │             │ │
│  │   └─────────────────────────────────────┘             │ │
│  │                                                        │ │
│  │   ┌──────────────────────────────────────┐            │ │
│  │   │   Azure Container Registry (ACR)     │            │ │
│  │   │   - mindx-backend:latest             │            │ │
│  │   │   - mindx-frontend:latest            │            │ │
│  │   └──────────────────────────────────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│              ┌──────────────────────┐                        │
│              │   OpenID Provider    │                        │
│              │ id-dev.mindx.edu.vn  │                        │
│              └──────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

## ✨ Features

- ✅ **Backend API** deployed on Azure Web App and AKS with HTTPS
- ✅ **Frontend React App** deployed on Azure Web App and AKS with HTTPS
- ✅ **Azure Kubernetes Service (AKS)** cluster with 2-node configuration
- ✅ **Nginx Ingress Controller** for traffic routing
- ✅ **Kubernetes Deployments** with health checks and resource limits
- ✅ **OpenID Connect Authentication** via `id-dev.mindx.edu.vn`
- ✅ **JWT Token-based Authorization** for protected routes
- ✅ **Protected Dashboard** accessible after authentication
- ✅ **Health Check Endpoint** for monitoring
- ✅ **Dockerized** backend and frontend with multi-stage builds
- ✅ **CORS** configured for cross-origin requests
- ✅ **Azure Container Registry (ACR)** integration with AKS

## 📁 Project Structure

```
mindx-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   └── index.ts        # Main API server with OpenID auth
│   ├── Dockerfile          # Backend container image
│   ├── package.json
│   ├── tsconfig.json
│   ├── tasks.md           # Implementation guide
│   ├── architecture.md    # Architecture documentation
│   └── overview.md        # Week 1 objectives
│
├── frontend/              # React Application
│   ├── src/
│   │   ├── App.tsx       # Main React component with auth flow
│   │   └── main.tsx
│   ├── dist/             # Built static files
│   ├── Dockerfile        # Frontend container image
│   ├── nginx.conf        # Nginx configuration
│   ├── package.json
│   └── vite.config.ts
│
├── k8s/                  # Kubernetes Manifests
│   ├── backend-deployment.yaml    # Backend K8s deployment & service
│   ├── frontend-deployment.yaml   # Frontend K8s deployment & service
│   ├── backend-secrets.yaml       # Secrets for backend
│   ├── ingress.yaml              # Ingress routing configuration
│   ├── cert-issuer.yaml          # Cert-manager for SSL
│   ├── deploy-aks.sh            # Automated deployment (Bash)
│   ├── deploy-aks.ps1           # Automated deployment (PowerShell)
│   └── README.md                # AKS deployment guide
│
└── README.md             # This file
```

## 🔐 Authentication Flow

1. User clicks **"Login with MindX OpenID"** on frontend
2. Frontend redirects to: `https://mindxapi06.azurewebsites.net/auth/login`
3. Backend redirects to OpenID provider: `https://id-dev.mindx.edu.vn`
4. User authenticates with MindX credentials
5. OpenID redirects back to: `https://mindxapi06.azurewebsites.net/auth/callback`
6. Backend generates JWT token and redirects to: `https://mindxweb06.azurewebsites.net/?token=<JWT>`
7. Frontend stores token in localStorage
8. Frontend uses token in `Authorization: Bearer <token>` header for protected API calls

## 🔌 API Endpoints

### Public Endpoints

- `GET /health` - Health check endpoint
- `GET /api/info` - Public API information
- `GET /auth/login` - Initiate OpenID authentication
- `GET /auth/callback` - OpenID callback handler
- `GET /auth/logout` - Logout endpoint

### Protected Endpoints (Requires JWT Token)

- `GET /api/dashboard` - User dashboard with stats

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:3000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

### Environment Variables

#### Backend (.env)

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://mindxweb06.azurewebsites.net
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# OpenID Configuration
OPENID_CLIENT_ID=mindx-onboarding
OPENID_CLIENT_SECRET=your-openid-secret
OPENID_CALLBACK_URL=https://mindxapi06.azurewebsites.net/auth/callback
```

#### Frontend (.env)

```env
VITE_API_URL=https://mindxapi06.azurewebsites.net
```

## 🐳 Docker Deployment

### Build Backend Image

```bash
cd backend
docker build -t mindx-backend .
```

### Build Frontend Image

```bash
cd frontend
docker build -t mindx-frontend .
```

### Run with Docker

```bash
# Backend
docker run -p 3000:3000 mindx-backend

# Frontend
docker run -p 8080:8080 mindx-frontend
```

## ☁️ Azure Deployment

### Deployment Option 1: Azure Web Apps (Completed - Step 1 & 4)

#### Backend Deployment (Azure Web App)

1. Create Azure Container Registry (if not exists):

```bash
az acr create --resource-group mindx-rg --name mindxacr --sku Basic
```

2. Login to ACR:

```bash
az acr login --name mindxacr
```

3. Build and push backend image:

```bash
cd backend
docker build -t mindxacr.azurecr.io/mindx-backend:latest .
docker push mindxacr.azurecr.io/mindx-backend:latest
```

4. Create Azure Web App:

```bash
az webapp create \
  --resource-group mindx-rg \
  --plan mindx-plan \
  --name mindxapi06 \
  --deployment-container-image-name mindxacr.azurecr.io/mindx-backend:latest
```

5. Configure environment variables:

```bash
az webapp config appsettings set \
  --resource-group mindx-rg \
  --name mindxapi06 \
  --settings FRONTEND_URL=https://mindxweb06.azurewebsites.net \
             JWT_SECRET=your-secret \
             SESSION_SECRET=your-secret
```

### Frontend Deployment (Azure Web App)

1. Build and push frontend image:

```bash
cd frontend
npm run build
docker build -t mindxacr.azurecr.io/mindx-frontend:latest .
docker push mindxacr.azurecr.io/mindx-frontend:latest
```

2. Create Azure Web App:

```bash
az webapp create \
  --resource-group mindx-rg \
  --plan mindx-plan \
  --name mindxweb06 \
  --deployment-container-image-name mindxacr.azurecr.io/mindx-frontend:latest
```

### Deployment Option 2: Azure Kubernetes Service (Step 2, 3 & 6)

For complete AKS deployment instructions, see **[k8s/README.md](k8s/README.md)**

#### Quick Start

**Automated Deployment (Recommended):**

```bash
# For Linux/Mac
cd k8s
chmod +x deploy-aks.sh
./deploy-aks.sh

# For Windows PowerShell
cd k8s
.\deploy-aks.ps1
```

**Manual Deployment:**

```bash
# 1. Create AKS cluster
az aks create --resource-group mindx-rg --name mindx-aks --node-count 2 --attach-acr mindxacr

# 2. Get credentials
az aks get-credentials --resource-group mindx-rg --name mindx-aks

# 3. Install ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx --namespace ingress-nginx

# 4. Deploy application
kubectl apply -f k8s/backend-secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 5. Get external IP
kubectl get service nginx-ingress-ingress-nginx-controller -n ingress-nginx
```

**Key Features of AKS Deployment:**

- ✅ Kubernetes orchestration with 2 replicas per service
- ✅ Nginx Ingress Controller for traffic routing
- ✅ Health checks and resource limits
- ✅ ACR integration for container images
- ✅ Ready for SSL/TLS with cert-manager
- ✅ Scalable and production-ready

**Detailed documentation:** [k8s/README.md](k8s/README.md)

## 🧪 Testing

### Test Azure Web Apps

**Test Backend Health:**

```bash
curl https://mindxapi06.azurewebsites.net/health
```

Expected response:

```json
{
  "status": "UP",
  "message": "MindX API is running",
  "timestamp": "2025-12-30T16:00:00.000Z",
  "environment": "production"
}
```

### Test API Info

```bash
curl https://mindxapi06.azurewebsites.net/api/info
```

Expected response:

```json
{
  "app": "MindX Engineer Onboarding",
  "version": "1.0.0",
  "week": "Week 1",
  "features": ["Authentication", "Azure AKS", "Kubernetes", "Ingress"]
}
```

**Test Frontend:**

Open browser: https://mindxweb06.azurewebsites.net

- Click "Login with MindX OpenID"
- Login with MindX credentials
- Verify dashboard shows user information

### Test AKS Deployment

```bash
# Get ingress external IP
kubectl get ingress mindx-ingress

# Test health endpoint (replace with your domain or external IP)
curl http://<EXTERNAL-IP>/health
curl https://your-domain.com/health

# Test API info
curl http://<EXTERNAL-IP>/api/info
curl https://your-domain.com/api/info

# Check pods status
kubectl get pods

# View backend logs
kubectl logs -f deployment/mindx-backend

# Port forward for local testing
kubectl port-forward deployment/mindx-backend 3000:3000
```

**Test Frontend on AKS:**

Open browser: `http://<EXTERNAL-IP>` or `https://your-domain.com`

For detailed testing and troubleshooting, see [k8s/README.md](k8s/README.md)

## 📝 Week 1 Acceptance Criteria

### ✅ Completed

- [x] The back-end API is deployed and accessible via a public HTTPS endpoint (Azure Web Apps & AKS)
- [x] The front-end React web app is deployed and accessible via a public HTTPS domain (Azure Web Apps & AKS)
- [x] HTTPS is enforced for all endpoints (Azure Web Apps - auto SSL)
- [x] Authentication is integrated and functional using OpenID with https://id-dev.mindx.edu.vn
- [x] Users can log in and log out via the front-end using OpenID
- [x] After login, authenticated users can access protected routes/pages on the front-end
- [x] The back-end API validates and authorizes requests using JWT tokens
- [x] All services are running on Azure Cloud infrastructure (Web Apps & AKS)
- [x] Deployment scripts/configs are committed and pushed to the repository (including K8s manifests)
- [x] Documentation is provided for setup, deployment, and authentication flow

### 📋 Implementation Summary

- **Step 1**: ✅ Azure Container Registry & Azure Web Apps Deployment
- **Step 2**: ✅ Azure Kubernetes Service (AKS) Cluster Setup & Deployment
- **Step 3**: ✅ Ingress Controller Installation & Configuration
- **Step 4**: ✅ Frontend Deployment to both Azure Web Apps & AKS
- **Step 5**: ✅ OpenID Authentication with JWT Token Authorization
- **Step 6**: ⚠️ HTTPS with Azure-managed SSL (Custom domain optional)

## 📚 Documentation

- [Kubernetes Deployment Guide](k8s/README.md) - Complete AKS deployment instructions
- [Week 1 Tasks Guide](backend/tasks.md) - Step-by-step implementation guide
- [Architecture Documentation](backend/architecture.md) - Detailed architecture overview
- [Week 1 Overview](backend/overview.md) - Objectives and acceptance criteria

## 🔧 Troubleshooting

### Azure Web Apps Issues

**Frontend can't connect to Backend:**

- Check CORS configuration in backend
- Verify `FRONTEND_URL` environment variable
- Ensure backend is running and accessible

**Authentication fails:**

- Verify OpenID credentials
- Check callback URL configuration
- Ensure `OPENID_CALLBACK_URL` matches Azure deployment URL

**Docker build fails:**

- Ensure all dependencies are in package.json
- Check Node.js version compatibility
- Verify Dockerfile syntax

### AKS Issues

For comprehensive AKS troubleshooting, see [k8s/README.md](k8s/README.md#-troubleshooting)

**Pods not starting:**

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Can't pull images from ACR:**

```bash
az aks check-acr --name mindx-aks --resource-group mindx-rg --acr mindxacr.azurecr.io
```

**Ingress not working:**

```bash
kubectl get ingress
kubectl describe ingress mindx-ingress
kubectl logs -n ingress-nginx deployment/nginx-ingress-ingress-nginx-controller
```

## 👥 Team

- **Developer**: Your Name
- **Project**: MindX Engineer Onboarding - Week 1
- **Date**: December 2025

## 📄 License

This project is part of MindX Engineer Onboarding program.

---

**Last Updated**: December 31, 2025  
**Status**: ✅ Production Ready (Azure Web Apps & AKS)
