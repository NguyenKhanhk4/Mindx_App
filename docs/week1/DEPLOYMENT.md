# Week 1: Azure Deployment Guide

## Deployment Overview

Có 2 options để deploy ứng dụng lên Azure:

1. **Azure Web Apps** - Đơn giản, nhanh, managed service
2. **Azure Kubernetes Service (AKS)** - Production-ready, scalable

## Option 1: Azure Web Apps Deployment

### Step 1: Create Azure Container Registry (ACR)

```bash
# Create resource group
az group create --name mindx-rg --location japaneast

# Create ACR
az acr create \
  --resource-group mindx-rg \
  --name mindxacr06 \
  --sku Basic

# Login to ACR
az acr login --name mindxacr06
```

### Step 2: Build and Push Backend Image

```bash
cd backend

# Build Docker image
docker build -t mindxacr06.azurecr.io/mindx-backend:latest .

# Push to ACR
docker push mindxacr06.azurecr.io/mindx-backend:latest

# Verify
az acr repository list --name mindxacr06 --output table
```

### Step 3: Create App Service Plan

```bash
az appservice plan create \
  --name mindx-plan \
  --resource-group mindx-rg \
  --is-linux \
  --sku B1
```

### Step 4: Deploy Backend to Azure Web App

```bash
# Create Web App
az webapp create \
  --resource-group mindx-rg \
  --plan mindx-plan \
  --name mindxapi06 \
  --deployment-container-image-name mindxacr06.azurecr.io/mindx-backend:latest

# Configure ACR credentials
az webapp config container set \
  --name mindxapi06 \
  --resource-group mindx-rg \
  --docker-custom-image-name mindxacr06.azurecr.io/mindx-backend:latest \
  --docker-registry-server-url https://mindxacr06.azurecr.io \
  --docker-registry-server-user mindxacr06 \
  --docker-registry-server-password $(az acr credential show --name mindxacr06 --query passwords[0].value -o tsv)

# Configure environment variables
az webapp config appsettings set \
  --resource-group mindx-rg \
  --name mindxapi06 \
  --settings \
    FRONTEND_URL=https://mindxweb06.azurewebsites.net \
    JWT_SECRET=your-production-jwt-secret \
    SESSION_SECRET=your-production-session-secret \
    OPENID_CLIENT_ID=mindx-onboarding \
    OPENID_CLIENT_SECRET=your-openid-secret \
    OPENID_CALLBACK_URL=https://mindxapi06.azurewebsites.net/auth/callback

# Enable container logging
az webapp log config \
  --name mindxapi06 \
  --resource-group mindx-rg \
  --docker-container-logging filesystem
```

### Step 5: Build and Push Frontend Image

```bash
cd frontend

# Build với production API URL
docker build \
  --build-arg VITE_API_URL=https://mindxapi06.azurewebsites.net \
  -t mindxacr06.azurecr.io/mindx-frontend:latest .

# Push to ACR
docker push mindxacr06.azurecr.io/mindx-frontend:latest
```

### Step 6: Deploy Frontend to Azure Web App

```bash
# Create Web App
az webapp create \
  --resource-group mindx-rg \
  --plan mindx-plan \
  --name mindxweb06 \
  --deployment-container-image-name mindxacr06.azurecr.io/mindx-frontend:latest

# Configure ACR credentials
az webapp config container set \
  --name mindxweb06 \
  --resource-group mindx-rg \
  --docker-custom-image-name mindxacr06.azurecr.io/mindx-frontend:latest \
  --docker-registry-server-url https://mindxacr06.azurecr.io \
  --docker-registry-server-user mindxacr06 \
  --docker-registry-server-password $(az acr credential show --name mindxacr06 --query passwords[0].value -o tsv)

# Enable container logging
az webapp log config \
  --name mindxweb06 \
  --resource-group mindx-rg \
  --docker-container-logging filesystem
```

### Step 7: Verify Deployment

```bash
# Check backend
curl https://mindxapi06.azurewebsites.net/health

# Check frontend (open in browser)
open https://mindxweb06.azurewebsites.net
```

## Option 2: Azure Kubernetes Service (AKS) Deployment

### Step 1: Create AKS Cluster

```bash
# Create AKS cluster với ACR integration
az aks create \
  --resource-group mindx-rg \
  --name mindxaks06 \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --location japaneast \
  --attach-acr mindxacr06 \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group mindx-rg --name mindxaks06

# Verify
kubectl cluster-info
kubectl get nodes
```

### Step 2: Create Kubernetes Secrets

Edit `k8s/backend-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mindx-secrets
type: Opaque
stringData:
  jwt-secret: "your-production-jwt-secret"
  session-secret: "your-production-session-secret"
  openid-client-id: "mindx-onboarding"
  openid-client-secret: "your-openid-secret"
  openid-callback-url: "https://20.18.237.151.nip.io/auth/callback"
  frontend-url: "https://20.18.237.151.nip.io"
```

Apply secret:

```bash
kubectl apply -f k8s/backend-secrets.yaml
```

### Step 3: Deploy Backend

```bash
# Build and push (nếu chưa làm)
cd backend
docker build -t mindxacr06.azurecr.io/mindx-backend:latest .
docker push mindxacr06.azurecr.io/mindx-backend:latest

# Deploy to AKS
kubectl apply -f k8s/backend-deployment.yaml

# Verify
kubectl get pods
kubectl get svc
kubectl logs -f deployment/mindx-backend
```

### Step 4: Install Nginx Ingress Controller

```bash
# Add helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install ingress controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.externalTrafficPolicy=Local

# Wait for external IP
kubectl get svc -n ingress-nginx -w
```

### Step 5: Deploy Frontend

```bash
# Build với AKS API URL
cd frontend
docker build \
  --build-arg VITE_API_URL=https://20.18.237.151.nip.io \
  -t mindxacr06.azurecr.io/mindx-frontend:latest .

# Push to ACR
docker push mindxacr06.azurecr.io/mindx-frontend:latest

# Deploy to AKS
kubectl apply -f k8s/frontend-deployment.yaml

# Verify
kubectl get pods
kubectl get svc
```

### Step 6: Configure Ingress

Edit `k8s/ingress.yaml` với External IP của Ingress Controller:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mindx-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: 20.18.237.151.nip.io
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: mindx-backend
                port:
                  number: 3000
          - path: /auth
            pathType: Prefix
            backend:
              service:
                name: mindx-backend
                port:
                  number: 3000
          - path: /health
            pathType: Exact
            backend:
              service:
                name: mindx-backend
                port:
                  number: 3000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: mindx-frontend
                port:
                  number: 8080
```

Apply ingress:

```bash
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get ingress
kubectl describe ingress mindx-ingress
```

### Step 7: Setup HTTPS (Optional)

Install cert-manager:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager ready
kubectl get pods -n cert-manager -w

# Apply cert issuer (staging)
kubectl apply -f k8s/cert-issuer-staging.yaml

# Update ingress với TLS
kubectl apply -f k8s/ingress.yaml
```

## Update Deployed Application

### Update Azure Web App

```bash
# Build new image
docker build -t mindxacr06.azurecr.io/mindx-backend:v2 ./backend
docker push mindxacr06.azurecr.io/mindx-backend:v2

# Update Web App
az webapp config container set \
  --name mindxapi06 \
  --resource-group mindx-rg \
  --docker-custom-image-name mindxacr06.azurecr.io/mindx-backend:v2

# Restart
az webapp restart --name mindxapi06 --resource-group mindx-rg
```

### Update AKS Deployment

```bash
# Build and push new image
docker build -t mindxacr06.azurecr.io/mindx-backend:v2 ./backend
docker push mindxacr06.azurecr.io/mindx-backend:v2

# Update deployment
kubectl set image deployment/mindx-backend mindx-backend=mindxacr06.azurecr.io/mindx-backend:v2

# Or rollout restart
kubectl rollout restart deployment/mindx-backend

# Check status
kubectl rollout status deployment/mindx-backend
```

## View Logs

### Azure Web App Logs

```bash
# Stream logs
az webapp log tail --name mindxapi06 --resource-group mindx-rg

# Download logs
az webapp log download --name mindxapi06 --resource-group mindx-rg
```

### AKS Logs

```bash
# View pod logs
kubectl logs -f deployment/mindx-backend

# View all pods logs
kubectl logs -l app=mindx-backend

# View ingress logs
kubectl logs -n ingress-nginx deployment/nginx-ingress-ingress-nginx-controller
```

## Troubleshooting

### Web App Issues

```bash
# Check app status
az webapp show --name mindxapi06 --resource-group mindx-rg --query state

# View logs
az webapp log tail --name mindxapi06 --resource-group mindx-rg

# Restart app
az webapp restart --name mindxapi06 --resource-group mindx-rg
```

### AKS Issues

```bash
# Check pod status
kubectl get pods
kubectl describe pod <pod-name>

# Check pod logs
kubectl logs <pod-name>

# Check service
kubectl get svc
kubectl describe svc mindx-backend

# Check ingress
kubectl get ingress
kubectl describe ingress mindx-ingress

# Test internal connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- sh
# Inside pod: curl http://mindx-backend:3000/health
```

## Next Steps

- ✅ Application deployed
- 🔐 Xem [Authentication Flow](./AUTH_FLOW.md) để hiểu authentication
- 📊 Setup monitoring (Week 2)
