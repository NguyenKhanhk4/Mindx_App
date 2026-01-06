// Week 2: Google Analytics 4 Setup
import ReactGA from "react-ga4";

let isInitialized = false;

/**
 * Initialize Google Analytics
 * Call this once when your app starts
 */
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn("⚠️  Google Analytics Measurement ID not found");
    return;
  }

  if (isInitialized) {
    console.warn("⚠️  Google Analytics already initialized");
    return;
  }

  try {
    ReactGA.initialize(measurementId, {
      gaOptions: {
        anonymizeIp: true,
      },
    });
    isInitialized = true;
    console.log("✅ Google Analytics initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Google Analytics:", error);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
    title: title || document.title,
  });
};

/**
 * Track custom events
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!isInitialized) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string = "OpenID") => {
  trackEvent("Authentication", "Login", method);
};

/**
 * Track user logout
 */
export const trackLogout = () => {
  trackEvent("Authentication", "Logout");
};

/**
 * Track dashboard access
 */
export const trackDashboardView = () => {
  trackEvent("Dashboard", "View", "Protected Dashboard");
};

/**
 * Track API errors
 */
export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent("Error", errorType, errorMessage);
};
