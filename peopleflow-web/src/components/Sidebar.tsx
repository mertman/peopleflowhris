import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Briefcase, 
  Settings, 
  LogOut,
  CheckSquare,
  Cpu
} from "lucide-react";

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: { name: string; path: string; icon: any; enabled: boolean; badge?: string }[] = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, enabled: true },
    { name: "Inbox / Approvals", path: "/inbox", icon: CheckSquare, enabled: true },
    { name: "People", path: "/employees", icon: Users, enabled: true },
    { name: "Org Chart", path: "/org-chart", icon: Network, enabled: true },
    { name: "Positions", path: "/positions", icon: Briefcase, enabled: true },
    { name: "n8n Automation", path: "/automation", icon: Cpu, enabled: true },
    { name: "Settings", path: "#", icon: Settings, enabled: false }
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand logo */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-200">
          P
        </div>
        <div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">People</span>
          <span className="font-semibold text-primary-600 text-lg tracking-tight">Flow</span>
        </div>
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

          if (!item.enabled) {
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 text-slate-400 rounded-lg cursor-not-allowed text-sm group"
                title={`${item.name} is coming in a future sprint!`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-slate-300" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

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
