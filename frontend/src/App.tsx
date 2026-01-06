import { useState, useEffect } from "react";
import {
  trackPageView,
  trackLogin,
  trackLogout,
  trackDashboardView,
  trackError,
} from "./analytics";

// API base URL - use localhost for local development
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://mindxapi06.azurewebsites.net");

function App() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar: string;
  } | null>(null);
  const [apiHealth, setApiHealth] = useState<string>("Checking...");
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Check API health on mount
  useEffect(() => {
    // Track page view
    trackPageView(window.location.pathname);

    fetch(`${API_BASE_URL}/api/info`)
      .then((res) => res.json())
      .then((data) => setApiHealth(`✅ Connected - ${data.app}`))
      .catch(() => {
        setApiHealth("❌ API Unavailable");
        trackError("API Connection", "Failed to connect to API");
      });

    // Check if returning from OpenID callback
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get("token");

    if (tokenFromURL) {
      // Store token in localStorage (as per task requirements: "persist across browser sessions")
      localStorage.setItem("token", tokenFromURL);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Track successful login
      trackLogin("OpenID");
      // Fetch user data with token from URL
      fetchDashboardData(tokenFromURL);
    } else {
      // Check if token exists in localStorage (persist across sessions)
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        // Validate token by fetching dashboard
        fetchDashboardData(storedToken);
      } else {
        // No token - show login screen
        setUser(null);
        setDashboardData(null);
      }
    }
  }, []);

  // OpenID Login - Redirect to backend auth endpoint
  const handleLogin = () => {
    // Clear any existing token and state before login
    localStorage.removeItem("token");
    setUser(null);
    setDashboardData(null);
    // Redirect to backend OpenID login endpoint
    const loginUrl = `${API_BASE_URL}/auth/login`;
    window.location.href = loginUrl;
  };

  const fetchDashboardData = (tokenToUse?: string | null) => {
    const tokenValue = tokenToUse || localStorage.getItem("token");
    if (!tokenValue) {
      setUser(null);
      setDashboardData(null);
      return;
    }

    fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${tokenValue}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Token invalid, clear from localStorage
          localStorage.removeItem("token");
          setUser(null);
          setDashboardData(null);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.user) {
          // Only set user if we have valid user data
          setUser({
            name: data.user.name || "User",
            email: data.user.email || "",
            role: data.user.role || "User",
            avatar: data.user.name?.charAt(0).toUpperCase() || "U",
          });
          setDashboardData(data.data);
          // Track dashboard view
          trackDashboardView();
        } else {
          // Invalid response, clear token
          localStorage.removeItem("token");
          setUser(null);
          setDashboardData(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard:", err);
        trackError("Dashboard Fetch", err.message || "Unknown error");
        // Clear invalid token
        localStorage.removeItem("token");
        setUser(null);
        setDashboardData(null);
      });
  };

  const handleLogout = () => {
    // Track logout
    trackLogout();
    // Clear token from localStorage
    localStorage.removeItem("token");
    // Clear state
    setUser(null);
    setDashboardData(null);
    // Redirect to backend logout (will clear session and redirect to OpenID logout)
    window.location.href = `${API_BASE_URL}/auth/logout`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob top-0 -left-4"></div>
        <div className="absolute w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 top-0 -right-4"></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 bottom-0 left-20"></div>
      </div>

      {/* Tailwind CDN */}
      <link
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        rel="stylesheet"
      />
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full max-w-lg glass-effect shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 relative z-10">
        {/* Header với Design Mới */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 px-8 py-12 text-white text-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse animation-delay-2000"></div>
            <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse animation-delay-4000"></div>
          </div>
          <div className="mb-3">
            <svg
              className="w-16 h-16 mx-auto text-white opacity-90"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">MindX Hub</h1>
          <p className="text-purple-100 text-sm font-medium">
            ☁️ Azure Cloud Platform · Week 1 Project
          </p>
        </div>

        {!user ? (
          /* Login Screen với Design Hiện Đại */
          <div className="p-8 space-y-6 bg-white">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
                <svg
                  className="w-12 h-12 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Secure Authentication
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                🔐 Đăng nhập bằng MindX ID của bạn
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-xs text-blue-700 font-medium">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                OpenID Connect Protected
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 flex justify-center items-center gap-3 group"
            >
              <svg
                className="w-6 h-6 group-hover:rotate-12 transition-transform"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-lg">Login with MindX OpenID</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Powered by{" "}
                <span className="font-bold text-purple-600">
                  id-dev.mindx.edu.vn
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                🌐 Bạn sẽ được chuyển hướng an toàn đến trang đăng nhập MindX
              </p>
            </div>
          </div>
        ) : (
          /* Dashboard với Card Design Hiện Đại */
          <div className="p-8 bg-white animate-fade-in">
            {/* User Profile Card */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-30 rounded-3xl"></div>
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-3xl border-2 border-purple-200">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg transform rotate-3">
                      {user.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-gray-800 mb-1">
                      {user.name}
                    </h2>
                    <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      AUTHENTICATED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                  Role
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {user.role}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                <div className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wider">
                  Platform
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {dashboardData ? dashboardData.environment : "Azure"}
                </div>
              </div>
              {dashboardData && (
                <>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                    <div className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wider">
                      Region
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {dashboardData.region}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-100">
                    <div className="text-xs font-semibold text-orange-600 mb-1 uppercase tracking-wider">
                      Uptime
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {dashboardData.stats.uptime}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() =>
                  window.open(
                    `${API_BASE_URL.replace("/api", "")}/health`,
                    "_blank"
                  )
                }
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center gap-2 shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Check API Health
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-sm font-bold hover:from-red-600 hover:to-pink-600 transition flex items-center justify-center gap-2 shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer với Design Mới */}
      <footer className="mt-8 text-center text-white text-sm relative z-10 glass-effect px-6 py-4 rounded-2xl">
        <div className="font-bold mb-2">
          🎓 MindX Engineer Onboarding · Lab Week 1
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-purple-200">
          <span className="flex items-center gap-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                apiHealth.includes("✅")
                  ? "bg-green-400 animate-pulse"
                  : "bg-red-400"
              }`}
            ></span>
            {apiHealth}
          </span>
          <span>•</span>
          <span>Env: {import.meta.env.MODE}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
