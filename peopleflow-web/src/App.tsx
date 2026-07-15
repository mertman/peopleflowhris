import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import EmployeeProfile from "./pages/EmployeeProfile";
import Inbox from "./pages/Inbox";
import Positions from "./pages/Positions";
import OrgChart from "./pages/OrgChart";
import IntegrationCenter from "./pages/IntegrationCenter";
import ReportCenter from "./pages/ReportCenter";
import AdminCenter from "./pages/AdminCenter";
import api from "./utils/api";
import PeopleFlowAI from "./components/PeopleFlowAI";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("pf_token"));
  const [user, setUser] = useState<any>(null);
  const [learningMode, setLearningMode] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const getFeatureFlagsKey = () => {
    const userObj = localStorage.getItem("pf_user");
    const email = userObj ? JSON.parse(userObj)?.email : "default";
    return `pf_feature_flags_${email}`;
  };

  const [featureFlags, setFeatureFlags] = useState(() => {
    const saved = localStorage.getItem(getFeatureFlagsKey());
    return saved ? JSON.parse(saved) : { aiEnabled: true };
  });

  useEffect(() => {
    setSidebarOpen(false);
    // Refresh flags state when moving between pages
    const saved = localStorage.getItem(getFeatureFlagsKey());
    if (saved) {
      setFeatureFlags(JSON.parse(saved));
    }
  }, [location.pathname]);

  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (err) {
        console.error("Session verification failed:", err);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [token]);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    localStorage.setItem("pf_token", newToken);
    localStorage.setItem("pf_user", JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("pf_token");
    localStorage.removeItem("pf_user");
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Auth Guard
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Get dynamic page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "HR Administrator Dashboard";
    if (path === "/inbox") return "Workflow Approval Inbox";
    if (path === "/employees") return "Employee Directory";
    if (path === "/positions") return "Position Management";
    if (path === "/org-chart") return "Organization & Hierarchy";
    if (path === "/reports") return "Report Center Analytics";
    if (path === "/admin") return "Administration Center";
    if (path === "/integration-center" || path === "/automation") return "Integration Center Dashboard";
    if (path.startsWith("/employees/")) return "Employee Profile Details";
    return "PeopleFlow HRIS";
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Navigation Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getPageTitle()} 
          learningMode={learningMode} 
          setLearningMode={setLearningMode} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-hidden flex flex-col">
           <Routes>
            <Route path="/" element={<Dashboard learningMode={learningMode} />} />
            <Route path="/inbox" element={<Inbox learningMode={learningMode} />} />
            <Route path="/employees" element={<EmployeeList learningMode={learningMode} user={user} />} />
            <Route path="/positions" element={<Positions learningMode={learningMode} user={user} />} />
            <Route path="/org-chart" element={<OrgChart learningMode={learningMode} />} />
            <Route path="/reports" element={<ReportCenter learningMode={learningMode} />} />
            <Route path="/admin" element={<AdminCenter />} />
            <Route path="/integration-center" element={<IntegrationCenter learningMode={learningMode} />} />
            <Route path="/automation" element={<Navigate to="/integration-center" replace />} />
            <Route path="/employees/:id" element={<EmployeeProfile learningMode={learningMode} user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {featureFlags.aiEnabled !== false && <PeopleFlowAI />}
      </div>
    </div>
  );
};

export default App;
