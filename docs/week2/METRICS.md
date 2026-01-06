# Week 2: Metrics Documentation

## Overview

Tài liệu chi tiết về Production và Product metrics đã được implement trong Week 2.

## Table of Contents

- [Azure Application Insights](#azure-application-insights-production-metrics)
- [Google Analytics 4](#google-analytics-4-product-metrics)
- [Accessing Metrics](#accessing-metrics)
- [Alerts Configuration](#alerts-configuration)
- [Troubleshooting](#troubleshooting)

---

## Azure Application Insights (Production Metrics)

### What is Monitored

- **HTTP Requests**: All API calls với response times và status codes
- **Custom Events**: Login attempts, dashboard access, authentication flows
- **Exceptions**: Application errors với stack traces
- **Dependencies**: External API calls
- **Performance**: CPU, memory, response times
- **Live Metrics**: Real-time application telemetry

### Tracked Events

| Event Name        | Description               | Properties      |
| ----------------- | ------------------------- | --------------- |
| `HealthCheck`     | Health endpoint được gọi  | status          |
| `LoginAttempt`    | User khởi tạo login       | method (OpenID) |
| `LoginSuccess`    | Authentication thành công | userId, email   |
| `DashboardAccess` | Dashboard được access     | userId, email   |

### Viewing Data

#### Live Metrics

1. Azure Portal → App Insights → **"Live Metrics"**
2. Xem real-time:
   - Incoming requests
   - Request duration
   - Dependency calls
   - Failure rate
   - Server metrics (CPU, memory)

#### Custom Events

**Query tất cả events:**

```kql
customEvents
| where timestamp > ago(24h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

**Login events theo thời gian:**

```kql
customEvents
| where name == "LoginSuccess"
| where timestamp > ago(7d)
| summarize LoginCount = count() by bin(timestamp, 1h)
| render timechart
```

**Dashboard access by user:**

```kql
customEvents
| where name == "DashboardAccess"
| extend userId = tostring(customDimensions.userId)
| extend email = tostring(customDimensions.email)
| summarize AccessCount = count() by userId, email
| order by AccessCount desc
```

#### Performance Monitoring

**Average response time by endpoint:**

```kql
requests
| where timestamp > ago(24h)
| summarize AvgDuration = avg(duration), RequestCount = count() by name
| order by AvgDuration desc
```

**Slow requests:**

```kql
requests
| where duration > 2000  // 2 seconds
| where timestamp > ago(24h)
| project timestamp, name, duration, resultCode
| order by duration desc
```

#### Error Tracking

**All exceptions:**

```kql
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, details
| order by timestamp desc
```

**Failed requests:**

```kql
requests
| where success == false
| where timestamp > ago(24h)
| summarize FailureCount = count() by name, resultCode
| order by FailureCount desc
```

---

## Google Analytics 4 (Product Metrics)

### What is Monitored

- **Page Views**: Tracking page visits
- **User Sessions**: Active sessions và duration
- **Custom Events**: Login, logout, dashboard views, errors
- **User Interactions**: Button clicks, navigation patterns
- **User Demographics**: Location, device, browser

### Tracked Events

| Event Name              | Category       | Description            | Tracked When                 |
| ----------------------- | -------------- | ---------------------- | ---------------------------- |
| `page_view`             | Engagement     | Page visit             | Automatic on route change    |
| `login`                 | Authentication | User logged in         | After successful OpenID auth |
| `logout`                | Authentication | User logged out        | When user clicks logout      |
| `dashboard_view`        | Dashboard      | Dashboard accessed     | When user views dashboard    |
| `api_error`             | Error          | API connection error   | When API request fails       |
| `dashboard_fetch_error` | Error          | Dashboard fetch failed | When dashboard data fails    |

### Viewing Data

#### Real-time Reports

1. Google Analytics → Reports → **"Realtime"**
2. Xem:
   - Active users (right now)
   - Page views trong last 30 minutes
   - Events trong last 30 minutes
   - Traffic by source
   - Top pages

#### Engagement Reports

**Page views và screens:**

- Reports → Engagement → **"Pages and screens"**
- Xem most visited pages
- Average engagement time
- Bounce rate

**Event reports:**

- Reports → Engagement → **"Events"**
- Xem all tracked events
- Event count và parameters
- Conversion events

#### User Reports

**User acquisition:**

- Reports → Acquisition → **"User acquisition"**
- Xem how users found your app
- Traffic sources (Direct, Referral, etc.)

**User retention:**

- Reports → Retention → **"User retention"**
- Xem returning users
- User cohorts

#### Custom Explorations

1. Explore → **"Create new exploration"**
2. Example: **Login funnel**
   - Add steps: `page_view` → `login` → `dashboard_view`
   - Xem conversion rate
   - Identify drop-offs

---

## Alerts Configuration

### Azure App Insights Alerts

#### Alert 1: High Error Rate

**Configuration:**

- **Signal**: Failed requests
- **Threshold**: Greater than 10
- **Period**: 5 minutes
- **Frequency**: 5 minutes
- **Action**: Email notification

**Create via Azure Portal:**

```bash
# Or via Azure CLI
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group mindx-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/mindx-rg/providers/microsoft.insights/components/mindx-app-insights \
  --condition "count failedRequests > 10" \
  --window-size 5m \
  --evaluation-frequency 5m
```

#### Alert 2: Slow Response Time

**Configuration:**

- **Signal**: Server response time
- **Threshold**: Greater than 2000ms (2 seconds)
- **Period**: 5 minutes
- **Action**: Email notification

#### Alert 3: Authentication Failures

**Custom Log Search:**

```kql
customEvents
| where name == "LoginAttempt"
| where timestamp > ago(5m)
| where customDimensions.success != "true"
| count
```

**Threshold**: Greater than 20 failed attempts trong 5 minutes

### Google Analytics Alerts

Google Analytics không có built-in alerts như Azure, nhưng có thể:

1. **Custom Insights**:

   - Admin → Insights
   - Create custom insights cho unusual patterns

2. **Data API + External Monitoring**:
   - Use GA4 Data API
   - Set up external monitoring tool
   - Trigger alerts based on metrics

---

## Environment Variables

### Backend (Azure App Insights)

```bash
# Kubernetes Secret
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://...
```

### Frontend (Google Analytics)

```bash
# Docker build arg / .env file
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Useful Queries

### Azure App Insights (KQL)

**Daily active users:**

```kql
customEvents
| where name == "LoginSuccess"
| where timestamp > ago(30d)
| summarize Users = dcount(tostring(customDimensions.userId)) by bin(timestamp, 1d)
| render timechart
```

**Most active users:**

```kql
customEvents
| where name == "DashboardAccess"
| where timestamp > ago(7d)
| extend userId = tostring(customDimensions.userId)
| extend email = tostring(customDimensions.email)
| summarize AccessCount = count() by userId, email
| top 10 by AccessCount desc
```

**API endpoint performance:**

```kql
requests
| where timestamp > ago(24h)
| summarize
    Count = count(),
    AvgDuration = avg(duration),
    P50 = percentile(duration, 50),
    P95 = percentile(duration, 95),
    P99 = percentile(duration, 99)
    by name
| order by AvgDuration desc
```

**Error rate over time:**

```kql
requests
| where timestamp > ago(7d)
| summarize
    Total = count(),
    Failures = countif(success == false)
    by bin(timestamp, 1h)
| extend ErrorRate = (Failures * 100.0) / Total
| render timechart
```

---

## Troubleshooting

### Azure App Insights

#### No data appearing

**Checklist:**

- [ ] Connection string correct?
- [ ] Backend pod restarted sau khi update secret?
- [ ] Wait 2-3 minutes cho data propagation
- [ ] Check pod logs cho errors

**Debug:**

```bash
# Check environment variable
kubectl exec -it <pod-name> -- env | grep APPINSIGHTS

# Check pod logs
kubectl logs <pod-name> | grep "Application Insights"

# Should see: "Application Insights initialized"
```

#### Missing custom events

**Checklist:**

- [ ] `appInsights.defaultClient` not null?
- [ ] Events được track trong code?
- [ ] No errors trong application logs?

**Test locally:**

```typescript
// Add debug logging
console.log("Tracking event:", eventName);
appInsights.defaultClient?.trackEvent({
  name: eventName,
  properties: {
    /* ... */
  },
});
```

### Google Analytics

#### GA not initialized

**Checklist:**

- [ ] `VITE_GA_MEASUREMENT_ID` được set?
- [ ] Frontend rebuilt với GA ID?
- [ ] Browser console shows initialization?

**Debug:**

```bash
# Check browser console
# Should see: "✅ Google Analytics initialized"

# Check network tab
# Should see requests to google-analytics.com
```

#### Events not tracked

**Checklist:**

- [ ] GA initialized trước khi track events?
- [ ] Event names correct?
- [ ] Ad blocker disabled?

**Test:**

```typescript
// Add debug logging
console.log("Tracking GA event:", eventName);
window.gtag("event", eventName, {
  /* ... */
});
```

#### Real-time not showing data

**Checklist:**

- [ ] Wait a few seconds (not instant)
- [ ] Try incognito mode
- [ ] Check if cookies enabled
- [ ] Verify Measurement ID correct

---

## Best Practices

### Production Metrics (Azure)

✅ **Do:**

- Keep connection string trong secrets
- Monitor critical business events
- Set up alerts cho failures
- Review metrics weekly
- Use appropriate sampling rates
- Track performance baselines

❌ **Don't:**

- Commit connection strings to git
- Track PII (Personally Identifiable Information) unnecessarily
- Ignore alert notifications
- Track too many custom events (cost)

### Product Metrics (Google Analytics)

✅ **Do:**

- Track meaningful user actions
- Set up conversion goals
- Use UTM parameters cho campaigns
- Respect user privacy
- Anonymize IP addresses
- Review user behavior monthly

❌ **Don't:**

- Track sensitive user data
- Track every single click
- Ignore GDPR/privacy regulations
- Forget to test tracking

---

## Additional Resources

- [Azure Application Insights Docs](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [KQL Query Language Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

## Support

**Issues or Questions?**

1. Check [Quick Start Guide](./QUICK_START.md)
2. Review troubleshooting section above
3. Check application logs
4. Contact team lead hoặc mentor

---

**Last Updated**: January 6, 2026
