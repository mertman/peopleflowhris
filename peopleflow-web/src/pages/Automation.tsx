import React, { useEffect, useState } from "react";
import { Info, Play, RefreshCw, Terminal, Sliders, Layers } from "lucide-react";
import api from "../utils/api";

interface AutomationProps {
  learningMode: boolean;
}

const Automation: React.FC<AutomationProps> = ({ learningMode }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("flowcharts");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/automation/logs");
      setLogs(res.data);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const triggerMockWorkflow = async (name: string) => {
    try {
      await api.post("/automation/trigger-mock", { workflowName: name });
      fetchLogs();
    } catch (err) {
      console.error("Error triggering mock workflow:", err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "Success") return "bg-green-100 text-green-800 border-green-200";
    if (status === "Staged") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Workflow Integration (CPI & n8n)</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In modern enterprise architectures, HR changes (like Hires, Promotions, Sabbaticals) automatically dispatch events to middleware integration engines (like SAP Cloud Platform Integration - CPI, or n8n). 
              These engines orchestrate cross-platform automations: generating contract documents, dispatching e-signatures (DocuSign), updating active directories (Slack/Teams channels), provisioning emails (Resend), or creating cloud folder structures (Google Drive).
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">n8n Automation Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Orchestrate third-party Slack, DocuSign, Teams, and Drive integrations</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Terminal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab("flowcharts")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 ${
            activeTab === "flowcharts" 
              ? "border-primary-600 text-primary-700" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Workflow Flowcharts</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 ${
            activeTab === "logs" 
              ? "border-primary-600 text-primary-700" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live Logs Terminal</span>
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 ${
            activeTab === "webhooks" 
              ? "border-primary-600 text-primary-700" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Webhook Settings</span>
        </button>
      </div>

      {/* FLOWCHARTS TAB */}
      {activeTab === "flowcharts" && (
        <div className="space-y-8">
          {/* Onboarding Flowchart card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">1. Employee Onboarding Workflow (n8n node graph)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Triggered when a New Hire is submitted in the HRIS</p>
              </div>
              <button
                onClick={() => triggerMockWorkflow("Onboarding")}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Flow</span>
              </button>
            </div>

            {/* Visual SVG node graph mockup */}
            <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-700 overflow-x-auto">
              <div className="flex items-center gap-2 bg-purple-600 text-white p-3 rounded-lg shadow border border-purple-700">
                <span>Webhook Trigger</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">OpenAI Node</span>
                <span>Draft Offer Letter</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">DocuSign Node</span>
                <span>Dispatched envelope</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg shadow-sm w-40">
                <span className="text-[10px] text-amber-500">Wait Callback</span>
                <span>Contract e-Signature</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">Slack Node</span>
                <span>Alert #people-ops</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">Google Drive Node</span>
                <span>Created folder</span>
              </div>
            </div>
          </div>

          {/* Promotion Flowchart card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">2. Employee Promotion Workflow (n8n node graph)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Triggered when a staged promotion is approved by manager + HR</p>
              </div>
              <button
                onClick={() => triggerMockWorkflow("Promotion")}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Flow</span>
              </button>
            </div>

            <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-700 overflow-x-auto">
              <div className="flex items-center gap-2 bg-purple-600 text-white p-3 rounded-lg shadow border border-purple-700">
                <span>Approved Webhook</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">Slack Node</span>
                <span>Announce #general</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">MS Teams Node</span>
                <span>Alert dept channel</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex flex-col gap-1 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm w-36">
                <span className="text-[10px] text-slate-400">Google Calendar</span>
                <span>Add Title Sync event</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTION LOG TERMINAL TAB */}
      {activeTab === "logs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[400px]">
          {/* Header toolbar */}
          <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">logs_terminal.log</span>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
              Listening live
            </span>
          </div>

          {/* Logs rows */}
          <div className="flex-1 p-5 font-mono text-xs space-y-2 text-slate-300 overflow-y-auto max-h-[500px]">
            {loading ? (
              <p className="text-slate-500 animate-pulse">Querying database events...</p>
            ) : logs.length === 0 ? (
              <p className="text-slate-500 italic">No integration events logged. Try hiring an employee or completing a promotion to fire webhooks!</p>
            ) : (
              logs.map((log) => {
                return (
                  <div key={log.id} className="flex gap-4 items-start py-1 hover:bg-slate-800/20 px-2 rounded">
                    <span className="text-slate-500 shrink-0 select-none">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <div className="flex-1">
                      <span className="text-purple-400 font-bold bg-purple-950/40 border border-purple-800/30 px-1 rounded mr-2">
                        {log.workflowName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] mr-2 inline-block font-semibold leading-none ${getStatusBadgeColor(log.status)}`}>
                        {log.event}
                      </span>
                      <span className="text-slate-200">{log.details}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* WEBHOOK SETTINGS TAB */}
      {activeTab === "webhooks" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">CPI / n8n Webhook Dispatch Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Exposed endpoint configurations and sample request payloads</p>
          </div>

          <div className="space-y-4">
            {/* Onboarding Payload schema */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">onboarding.new_hire Endpoint</span>
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border">
                  POST /api/webhooks/onboarding
                </span>
              </div>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto font-mono">
{`{
  "event": "onboarding.new_hire",
  "employeeId": "emp-emp-03",
  "employeeNumber": "PF-0005",
  "firstName": "Maria",
  "lastName": "Garcia",
  "email": "maria.garcia@peopleflow.com",
  "jobTitle": "QA Engineer II",
  "department": "Engineering - Quality",
  "salary": 42000,
  "hireDate": "2024-02-01"
}`}
              </pre>
            </div>

            {/* Promotion Payload schema */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">promotion.approved Endpoint</span>
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border">
                  POST /api/webhooks/promotion
                </span>
              </div>
              <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto font-mono">
{`{
  "event": "promotion.approved",
  "employeeId": "emp-emp-01",
  "employeeName": "Emily Watson",
  "jobTitle": "Senior Software Engineer",
  "position": "Senior Frontend Developer",
  "salary": 110000,
  "approvedBy": "Sarah Connor",
  "approvedAt": "2026-07-14T19:30:59Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automation;
