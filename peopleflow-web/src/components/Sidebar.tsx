import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminExpanded, setAdminExpanded] = useState(() => location.pathname === "/admin");

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
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-sm border border-primary-200 uppercase">
            {user?.firstName?.charAt(0) || "U"}{user?.lastName?.charAt(0) || ""}
          </div>
          <div className="overflow-hidden">
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
    </aside>
  );
};

export default Sidebar;
