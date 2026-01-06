# MindX Engineer Onboarding

Full-stack application deployed on Azure Cloud với OpenID authentication và monitoring.

## 🚀 Live Demo

| Environment            | URL                                  |
| ---------------------- | ------------------------------------ |
| **Frontend (Web App)** | https://mindxweb06.azurewebsites.net |
| **Backend (Web App)**  | https://mindxapi06.azurewebsites.net |
| **Kubernetes (AKS)**   | https://20.18.237.151.nip.io         |

## 📖 About This Project

Full-stack TypeScript application được build và deploy trong 2 tuần:

**Week 1**: Setup ứng dụng lên Azure Cloud  
**Week 2**: Implement production metrics và analytics

### Tech Stack

**Backend**: Node.js + Express + TypeScript + OpenID Connect  
**Frontend**: React + TypeScript + Vite  
**Cloud**: Azure (Web Apps + AKS + ACR)  
**Auth**: OpenID Connect via id-dev.mindx.edu.vn  
**Monitoring**: Azure Application Insights + Google Analytics 4

## 📁 Project Structure

```
mindx-app/
├── backend/              # Node.js/Express API
├── frontend/             # React Application
├── k8s/                  # Kubernetes manifests
├── docs/
│   ├── week1/           # Week 1: Azure deployment docs
│   └── week2/           # Week 2: Metrics docs
└── scripts/
```

## 📚 Documentation

### Week 1: Azure Cloud Deployment

| Tài liệu                                   | Mô tả                            |
| ------------------------------------------ | -------------------------------- |
| [Overview](docs/week1/OVERVIEW.md)         | Objectives & acceptance criteria |
| [Architecture](docs/week1/ARCHITECTURE.md) | Kiến trúc hệ thống               |
| [Setup](docs/week1/SETUP.md)               | Hướng dẫn setup local            |
| [Deployment](docs/week1/DEPLOYMENT.md)     | Deploy lên Azure                 |
| [Auth Flow](docs/week1/AUTH_FLOW.md)       | OpenID authentication flow       |

### Week 2: Metrics & Monitoring

| Tài liệu                                 | Mô tả                            |
| ---------------------------------------- | -------------------------------- |
| [Overview](docs/week2/OVERVIEW.md)       | Objectives & acceptance criteria |
| [Quick Start](docs/week2/QUICK_START.md) | Setup trong 30 phút ⚡           |
| [Metrics](docs/week2/METRICS.md)         | Chi tiết metrics & queries       |

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd mindx-app

# Backend
cd backend
npm install
npm run dev      # → http://localhost:3000

# Frontend (terminal mới)
cd frontend
npm install
npm run dev      # → http://localhost:5173
```

Chi tiết: [Setup Guide](docs/week1/SETUP.md) | [Deployment Guide](docs/week1/DEPLOYMENT.md)

## ✅ What's Completed

**Week 1**: Azure Cloud Deployment ✅

- Backend API + Frontend deployed on Azure Web Apps
- Full Kubernetes (AKS) deployment với Ingress
- OpenID Connect authentication + JWT authorization
- HTTPS với SSL certificates

**Week 2**: Metrics & Monitoring ✅

- Azure Application Insights (production metrics)
- Google Analytics 4 (product metrics)
- Custom events tracking
- Performance monitoring & alerts

## 🔐 Authentication

- **Provider**: OpenID Connect (id-dev.mindx.edu.vn)
- **Flow**: Authorization Code Flow → JWT tokens
- **Protected Routes**: Dashboard requires valid JWT token

[Chi tiết Authentication Flow →](docs/week1/AUTH_FLOW.md)

## 📊 Monitoring

**Production Metrics (Azure App Insights)**

- HTTP requests, response times, errors
- Custom events: login, dashboard access
- Real-time live metrics

**Product Metrics (Google Analytics)**

- Page views, user sessions
- Custom events: login, logout, navigation
- User demographics & behavior

[Chi tiết Metrics →](docs/week2/METRICS.md)

## 🔗 Links

- [Azure Portal](https://portal.azure.com)
- [OpenID Provider](https://id-dev.mindx.edu.vn)
- [Google Analytics](https://analytics.google.com)

## 👤 Author

**Nguyễn Văn Khánh**  
MindX Engineer Onboarding Program  

---

📖 **Xem tài liệu chi tiết trong [docs/](docs/) để biết thêm về setup, deployment và monitoring.**
