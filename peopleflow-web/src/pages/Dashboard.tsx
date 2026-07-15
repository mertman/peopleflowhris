import React, { useEffect, useState } from "react";
import { Users, ShieldAlert, CheckSquare, Clock, ArrowRight, UserPlus, Info } from "lucide-react";
import api from "../utils/api";

interface DashboardProps {
  learningMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ learningMode }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/employees/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error loading dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const kpis = [
    {
      title: "Active Headcount",
      value: stats?.activeCount || 0,
      description: "Full-time & regular contract staff",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-100",
    },
    {
      title: "On Leave of Absence",
      value: stats?.leaveCount || 0,
      description: "Medical, sabbatical, or parental leave",
      icon: Clock,
      color: "from-teal-400 to-emerald-600",
      shadow: "shadow-teal-100",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      description: "Workflow requests awaiting action",
      icon: CheckSquare,
      color: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-100",
    },
    {
      title: "Probation Reviews Soon",
      value: stats?.probationEnding || 0,
      description: "Ending in the next 90 days",
      icon: ShieldAlert,
      color: "from-red-400 to-rose-600",
      shadow: "shadow-red-100",
    },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4 transition-all duration-200">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Home Page & Dashboards</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, the home page serves as a landing hub powered by **People Analytics** and **To-Do items**. 
              The metrics displayed are determined dynamically based on the active system date. 
              Underneath, the **Role-Based Permission (RBP)** settings dictate which cards are visible to which employees. For example, managers see direct report stats, while HR Administrators see company-wide headcount indexes.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`bg-white border border-slate-200/80 rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all-custom ${kpi.shadow}`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <h3 className="text-3xl font-extrabold text-slate-800">{kpi.value}</h3>
                <p className="text-[11px] text-slate-500">{kpi.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities Timeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Recent Activities</h3>
            <span className="text-xs text-primary-600 font-semibold flex items-center gap-1 cursor-pointer hover:underline">
              View Audit Log
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act: any) => (
                <div key={act.id} className="flex gap-4 items-start text-sm group">
                  <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    {act.event === "Hire" ? (
                      <UserPlus className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 font-medium">{act.message}</p>
                    <span className="text-xs text-slate-400">
                      {new Date(act.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">No recent activities logged.</p>
            )}
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-4">Quick HR Links</h3>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.hash = "#/employees"} 
                className="w-full text-left py-2 px-3 bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Navigate Employee Directory</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </button>
              <button 
                disabled 
                className="w-full text-left py-2 px-3 bg-slate-50 opacity-60 text-slate-400 rounded-lg text-sm font-medium flex items-center justify-between cursor-not-allowed"
              >
                <span>Initiate Promotion Request</span>
                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Sprint 2</span>
              </button>
              <button 
                disabled 
                className="w-full text-left py-2 px-3 bg-slate-50 opacity-60 text-slate-400 rounded-lg text-sm font-medium flex items-center justify-between cursor-not-allowed"
              >
                <span>Submit Leave Application</span>
                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Sprint 2</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simulated Modules</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-full font-medium">Employee Central</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Workflows (Soon)</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Time Off (Soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
