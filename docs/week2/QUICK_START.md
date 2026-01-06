# Week 2: Quick Start Guide (30 phút)

## 📋 Prerequisites

- [x] Week 1 application deployed và đang chạy
- [x] Azure subscription với quyền tạo resources
- [x] Google account
- [x] kubectl configured với AKS cluster (nếu dùng AKS)

## ⚡ Part 1: Azure Application Insights (15 phút)

### Step 1: Create App Insights Resource (5 phút)

1. **Login vào Azure Portal**: https://portal.azure.com

2. **Tạo Application Insights**:

   - Click "Create a resource"
   - Search "Application Insights"
   - Click "Create"

   **Configuration**:

   - **Subscription**: Your subscription
   - **Resource Group**: `mindx-rg` (existing)
   - **Name**: `mindx-app-insights`
   - **Region**: `Japan East` (same as AKS)
   - **Workspace**: Create new Log Analytics workspace

   Click **"Review + Create"** → **"Create"**

3. **Copy Connection String**:
   - Sau khi tạo xong, vào resource
   - Sidebar → "Overview"
   - Copy **"Connection String"**
   - Format: `InstrumentationKey=xxx;IngestionEndpoint=xxx;...`

### Step 2: Configure Backend (5 phút)

#### Option A: Kubernetes (AKS)

1. **Update secrets**:

Edit `k8s/backend-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mindx-secrets
type: Opaque
stringData:
  # ... existing secrets ...
  appinsights-connection-string: "InstrumentationKey=YOUR_KEY_HERE;IngestionEndpoint=https://japaneast-1.in.applicationinsights.azure.com/;LiveEndpoint=https://japaneast.livediagnostics.monitor.azure.com/"
```

2. **Apply changes**:

```bash
# Apply secret
kubectl apply -f k8s/backend-secrets.yaml

# Restart backend pods để load secret mới
kubectl rollout restart deployment/mindx-backend

# Check pods
kubectl get pods -w
```

#### Option B: Azure Web App

```bash
az webapp config appsettings set \
  --resource-group mindx-rg \
  --name mindxapi06 \
  --settings APPINSIGHTS_CONNECTION_STRING="YOUR_CONNECTION_STRING"

# Restart app
az webapp restart --name mindxapi06 --resource-group mindx-rg
```

### Step 3: Verify (5 phút)

1. **Trigger some traffic**:

   - Visit your app
   - Login với OpenID
   - Access dashboard
   - Logout và login lại

2. **Check Azure Portal** (wait 2-3 phút):
   - Azure Portal → Application Insights → `mindx-app-insights`
   - Click **"Live Metrics"** → Should see active requests
   - Click **"Logs"** → Run query:

```kql
customEvents
| where timestamp > ago(10m)
| order by timestamp desc
| project timestamp, name, customDimensions
```

Expected events: `LoginAttempt`, `LoginSuccess`, `DashboardAccess`

---

## ⚡ Part 2: Google Analytics 4 (10 phút)

### Step 1: Create GA4 Property (5 phút)

1. **Login vào Google Analytics**: https://analytics.google.com

2. **Create Property**:

   - Click **"Admin"** (gear icon bottom left)
   - Click **"Create Property"**

   **Configuration**:

   - **Property name**: `MindX App`
   - **Timezone**: `(UTC+07:00) Bangkok, Hanoi, Jakarta`
   - **Currency**: `Vietnamese Dong (VND)`
   - Click **"Next"**

3. **Business Details**:

   - Select industry và size
   - Select objectives
   - Click **"Create"**

4. **Create Data Stream**:

   - Click **"Add stream"** → **"Web"**
   - **Website URL**: Your frontend URL
     - Azure Web App: `https://mindxweb06.azurewebsites.net`
     - AKS: `https://20.18.237.151.nip.io`
   - **Stream name**: `MindX App - Production`
   - Click **"Create stream"**

5. **Copy Measurement ID**:
   - Format: `G-XXXXXXXXXX`
   - Save it!

### Step 2: Configure Frontend (5 phút)

#### Option A: Kubernetes (AKS)

1. **Rebuild frontend với GA ID**:

```bash
cd frontend

# Build với GA measurement ID
docker build \
  --build-arg VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  --build-arg VITE_API_URL=https://20.18.237.151.nip.io \
  -t mindxacr06.azurecr.io/mindx-frontend:latest .

# Push to ACR
docker push mindxacr06.azurecr.io/mindx-frontend:latest
```

2. **Restart frontend pods**:

```bash
kubectl rollout restart deployment/mindx-frontend

# Check pods
kubectl get pods -w
```

#### Option B: Azure Web App

1. **Rebuild và push**:

```bash
cd frontend

# Build with GA
docker build \
  --build-arg VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX \
  --build-arg VITE_API_URL=https://mindxapi06.azurewebsites.net \
  -t mindxacr06.azurecr.io/mindx-frontend:latest .

# Push
docker push mindxacr06.azurecr.io/mindx-frontend:latest
```

2. **Restart Web App**:

```bash
az webapp restart --name mindxweb06 --resource-group mindx-rg
```

#### Local Testing (Optional)

```bash
cd frontend

# Create .env file
echo "VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX" > .env

# Run dev server
npm run dev

# Check browser console → Should see "✅ Google Analytics initialized"
```

---

## ⚡ Part 3: Setup Alerts (5 phút)

### Azure App Insights Alerts

1. **Go to App Insights** → **"Alerts"** → **"Create"** → **"Alert rule"**

**Alert 1: High Error Rate**

- **Signal**: `Failed requests`
- **Threshold**: Greater than `10`
- **Evaluation period**: `5 minutes`
- **Action**: Email notification
- Click **"Create"**

**Alert 2: Slow Response**

- **Signal**: `Server response time`
- **Threshold**: Greater than `2 seconds`
- **Evaluation period**: `5 minutes`
- **Action**: Email notification
- Click **"Create"**

---

## ✅ Verification Checklist

### Azure Application Insights

- [ ] Live Metrics showing active requests
- [ ] Custom events visible trong Logs (`LoginAttempt`, `LoginSuccess`, `DashboardAccess`)
- [ ] Performance metrics showing API response times
- [ ] No errors trong exception tracking (or expected errors only)
- [ ] Alerts configured và active

### Google Analytics

- [ ] Real-time showing active users (you)
- [ ] Page views tracked
- [ ] Custom events tracked (`login`, `logout`, `dashboard_view`)
- [ ] No errors trong DebugView

---

## 🧪 Testing

### Test Azure App Insights

1. Visit your app và perform actions:

   - Login
   - Access dashboard
   - Logout
   - Login again

2. **Check Live Metrics**:

   - Azure Portal → App Insights → Live Metrics
   - Should see requests trong real-time

3. **Run KQL Query**:

```kql
requests
| where timestamp > ago(10m)
| summarize count() by name, resultCode
| order by count_ desc
```

### Test Google Analytics

1. **Open app trong browser**

2. **Check Real-time**:

   - Google Analytics → Reports → Realtime
   - Should see 1 active user (you)

3. **Trigger events**:

   - Login → Should track `login` event
   - Go to dashboard → Should track `dashboard_view` event
   - Logout → Should track `logout` event

4. **Check DebugView** (if enabled):
   - Admin → DebugView
   - See events trong real-time

---

## 🐛 Common Issues

### Issue: Azure shows no data

**Possible Causes**:

- Connection string incorrect
- Backend not restarted after config change
- Need to wait 2-3 minutes for data

**Fix**:

```bash
# Check backend logs
kubectl logs -f deployment/mindx-backend

# Or for Web App
az webapp log tail --name mindxapi06 --resource-group mindx-rg

# Look for "Application Insights initialized"
```

### Issue: GA not tracking

**Possible Causes**:

- Measurement ID incorrect
- Frontend not rebuilt with GA ID
- Browser ad blocker blocking GA

**Fix**:

```bash
# Verify GA ID in build
docker inspect mindxacr06.azurecr.io/mindx-frontend:latest

# Check browser console for errors
# Disable ad blocker and try again
```

### Issue: K8s pod not starting

**Fix**:

```bash
# Check secret exists
kubectl get secrets mindx-secrets

# Check pod logs
kubectl logs <pod-name>

# Describe pod for events
kubectl describe pod <pod-name>
```

---

## 📊 Demo for Mentor

Để show work đã complete:

1. **Azure App Insights**:

   - Open Live Metrics → Show active requests
   - Run KQL query → Show custom events
   - Show Alerts → Display configured alerts

2. **Google Analytics**:

   - Open Realtime → Show your active session
   - Show Events → Display tracked events
   - Navigate app → Show real-time tracking

3. **Code**:
   - Show backend instrumentation code
   - Show frontend GA integration
   - Point to documentation

---

## 🎯 Success Criteria

- [x] Azure App Insights showing live data
- [x] Custom events tracked (login, dashboard)
- [x] Alerts configured và active
- [x] Google Analytics tracking users và events
- [x] Real-time data visible trong dashboards
- [x] Documentation complete

---

## 📝 Next Steps

1. **Monitor daily**: Check metrics mỗi ngày
2. **Setup dashboards**: Create custom dashboards trong Azure/GA
3. **Configure additional alerts**: Add more alerts as needed
4. **Review data**: Analyze user behavior và performance
5. **Share with team**: Share access và documentation

---

## 🔗 Full Documentation

- **[Metrics Guide](./METRICS.md)** - Chi tiết về tất cả metrics và cách sử dụng
- **[Week 2 Overview](./OVERVIEW.md)** - Objectives và acceptance criteria
