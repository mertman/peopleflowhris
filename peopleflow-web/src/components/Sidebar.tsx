import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Briefcase, 
  Settings, 
  LogOut,
  CheckSquare,
  Cpu,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  ShieldCheck,
  Activity,
  GitBranch,
  Globe,
  Database,
  ListChecks
} from "lucide-react";

interface SidebarProps {
  user: any;
  onLogout: () => void;
  onLoginSuccess: (token: string, user: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onLoginSuccess, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminExpanded, setAdminExpanded] = useState(() => location.pathname === "/admin");

  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [proxyLoading, setProxyLoading] = useState(false);

  const openProxyModal = async () => {
    setProxyModalOpen(true);
    try {
      const res = await api.get("/employees");
      setEmployeesList(res.data);
    } catch (err) {
      console.error("Failed to load employees for proxy", err);
    }
  };

  const handleStartProxy = async (targetId: string) => {
    setProxyLoading(true);
    try {
      const res = await api.post("/auth/proxy", { targetEmployeeId: targetId });
      setProxyModalOpen(false);
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      console.error("Failed to start proxy", err);
    } finally {
      setProxyLoading(false);
    }
  };

  const handleExitProxy = async () => {
    try {
      const res = await api.post("/auth/exit-proxy");
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      console.error("Failed to exit proxy", err);
    }
  };

  const menuItems: { name: string; path: string; icon: any; enabled: boolean; badge?: string }[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, enabled: true },
    { name: "Inbox / Approvals", path: "/inbox", icon: CheckSquare, enabled: true },
    { name: "Employee Central", path: "/employees", icon: Users, enabled: true },
    { name: "Organization", path: "/org-chart", icon: Network, enabled: true },
    { name: "Position Management", path: "/positions", icon: Briefcase, enabled: true },
    { name: "Report Center", path: "/reports", icon: FileText, enabled: true },
    { name: "Integration Center", path: "/integration-center", icon: Cpu, enabled: true }
  ];

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Superadmin": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Administrator": return "bg-red-50 text-red-700 border-red-200";
      case "Manager": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Employee": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      {/* Brand logo */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-200">
            P
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">People</span>
            <span className="font-semibold text-primary-600 text-lg tracking-tight">Flow</span>
          </div>
        </div>

        {/* Mobile close button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info Badge */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-sm border border-primary-200 uppercase">
            {user?.firstName?.charAt(0) || "U"}{user?.lastName?.charAt(0) || ""}
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="font-semibold text-slate-800 text-sm truncate">
              {user?.firstName} {user?.lastName}
            </h4>
            <div className="flex mt-0.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Proxy Actions */}
        {user?.originalUser ? (
          <button
            onClick={handleExitProxy}
            className="w-full text-center text-xs font-semibold py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Exit Proxy Session</span>
          </button>
        ) : (
          (user?.role === "Superadmin" || user?.role === "Administrator") && (
            <button
              onClick={openProxyModal}
              className="w-full text-center text-xs font-semibold py-1.5 px-3 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Proxy As...</span>
            </button>
          )
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? "bg-primary-50 text-primary-700 border-l-2 border-primary-600 pl-2.5" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-500"}`} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}

        {/* Collapsible Administration Header */}
        <div>
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150 cursor-pointer ${
              location.pathname === "/admin" ? "bg-slate-50/80 font-bold" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-5 h-5 ${location.pathname === "/admin" ? "text-primary-600" : "text-slate-400"}`} />
              <span>Administration</span>
            </div>
            {adminExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Sub menu list of administration tabs */}
          {adminExpanded && (
            <div className="mt-1 ml-4 border-l border-slate-100 pl-2.5 space-y-1">
              {[
                { name: "Business Rules", tab: "rules", icon: GitBranch },
                { name: "Objects (MDF)", tab: "mdf", icon: Database },
                { name: "Picklists", tab: "picklists", icon: ListChecks },
                { name: "Role-Based Permissions", tab: "rbp", icon: ShieldCheck },
                { name: "Workflow Config", tab: "workflows", icon: GitBranch },
                { name: "Feature Flags", tab: "flags", icon: Settings },
                { name: "Audit logs", tab: "audit", icon: Activity },
                { name: "System Settings", tab: "system", icon: Globe }
              ].map(sub => {
                const SubIcon = sub.icon;
                const searchParams = new URLSearchParams(location.search);
                const active = location.pathname === "/admin" && searchParams.get("tab") === sub.tab;
                
                return (
                  <Link
                    key={sub.tab}
                    to={`/admin?tab=${sub.tab}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-100 ${
                      active
                        ? "bg-primary-50/50 text-primary-700 font-semibold"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <SubIcon className={`w-3.5 h-3.5 ${active ? "text-primary-600" : "text-slate-400"}`} />
                    <span>{sub.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3 w-full px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Proxy Modal */}
      {proxyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Proxy As Another User</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Act on behalf of another employee in the tenant</p>
              </div>
              <button onClick={() => setProxyModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search employee name or role..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-3 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-primary-400 rounded-lg outline-none"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {employeesList
                .filter(emp => {
                  const fullName = `${emp.personalInfo?.firstName || ""} ${emp.personalInfo?.lastName || ""}`.toLowerCase();
                  const role = (emp.role || "").toLowerCase();
                  const title = (emp.jobInfo?.jobTitle || "").toLowerCase();
                  const term = searchEmployee.toLowerCase();
                  return fullName.includes(term) || role.includes(term) || title.includes(term);
                })
                .map(emp => (
                  <div key={emp.id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="overflow-hidden mr-2">
                      <span className="font-bold text-slate-800 block truncate">
                        {emp.personalInfo?.firstName} {emp.personalInfo?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {emp.jobInfo?.jobTitle || "No Title"} • {emp.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartProxy(emp.id)}
                      disabled={proxyLoading}
                      className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-bold shadow transition-colors cursor-pointer shrink-0"
                    >
                      Proxy
                    </button>
                  </div>
                ))}
              {employeesList.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-4">Loading employee list...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
