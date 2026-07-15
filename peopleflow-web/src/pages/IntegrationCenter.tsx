import React, { useEffect, useState } from "react";
import { 
  Layers, Terminal, Sliders, Cpu, Play, RefreshCw, Globe, Key, 
  MessageSquare, Info 
} from "lucide-react";
import api from "../utils/api";

interface IntegrationCenterProps {
  learningMode: boolean;
}

const IntegrationCenter: React.FC<IntegrationCenterProps> = ({ learningMode }) => {
  const [activeTab, setActiveTab] = useState("n8n");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // OpenAI configs
  const [openAiKey, setOpenAiKey] = useState("sk-proj-••••••••••••••••••••");
  const [openAiModel, setOpenAiModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);

  // Slack configs
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T00/B00/X00");
  const [slackChannel, setSlackChannel] = useState("#people-ops");

  // Webhooks
  const [webhooks, setWebhooks] = useState([
    { event: "Employee Onboarding (Hire)", url: "https://n8n.peopleflow.internal/webhook/hire", status: "Active" },
    { event: "Compensation Revision (Promotion)", url: "https://n8n.peopleflow.internal/webhook/promotion", status: "Active" },
    { event: "Employment Termination", url: "https://n8n.peopleflow.internal/webhook/termination", status: "Inactive" }
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("Employee Onboarding (Hire)");

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

  const handleSaveSettings = () => {
    alert("Integration Settings saved successfully!");
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    setWebhooks(prev => [...prev, { event: newWebhookEvent, url: newWebhookUrl.trim(), status: "Active" }]);
    setNewWebhookUrl("");
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      
      {/* Learning Sandbox Callout */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Integration Center</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, the **Integration Center** manages scheduled and event-triggered outbound integrations.
              It permits data exports (via SFTP, REST APIs, or SOAP) using custom file payloads (CSV, XML, JSON) and configures inbound webhooks.
              This acts as the middleware router linking HR data to third-party endpoints.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Integration Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage event webhooks, REST API endpoints, and third-party integrations</p>
        </div>
        {activeTab === "n8n" && (
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Terminal"}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4">
        {[
          { id: "n8n", label: "n8n Workflow graphs", icon: Layers },
          { id: "api", label: "REST API Config", icon: Globe },
          { id: "webhooks", label: "Event Webhooks", icon: Sliders },
          { id: "openai", label: "OpenAI Config", icon: Cpu },
          { id: "slack", label: "Slack & Teams Webhooks", icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs md:text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? "border-primary-600 text-primary-700" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TABS: n8n Graph view */}
      {/* ---------------------------------------------------- */}
      {activeTab === "n8n" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">1. Employee Onboarding Automation (n8n node graph)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Fires automatically when a new hire transaction completes</p>
              </div>
              <button
                onClick={() => triggerMockWorkflow("Onboarding")}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Flow</span>
              </button>
            </div>

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
            </div>
          </div>

          {/* Logs terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner space-y-3 font-mono text-xs text-green-400 max-h-[300px] overflow-y-auto">
            <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>LOGS LIVE CONSOLE TERMINAL</span>
              </span>
              <span className="text-[10px]">Connected</span>
            </div>
            <div className="space-y-1.5">
              {logs.map((log: any) => (
                <div key={log.id} className="leading-relaxed">
                  <span className="text-slate-500">[{new Date(log.date).toLocaleTimeString()}]</span>{" "}
                  <span className="text-indigo-400 font-semibold">{log.workflowName}</span>{" "}
                  <span className="text-slate-300 font-medium">{log.event}</span>{" "}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${getStatusBadgeColor(log.status)}`}>
                    {log.status}
                  </span>{" "}
                  <span className="text-slate-400 italic block pl-16 mt-0.5">&gt; {log.details}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-600 text-center">No terminal logs recorded.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: REST API config */}
      {/* ---------------------------------------------------- */}
      {activeTab === "api" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Corporate REST API Settings</h4>
            <p className="text-xs text-slate-400 mt-0.5">Integrate third-party client apps to execute CRUD transactions on PeopleFlow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-600">
            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">OAUTH Token Endpoint URL</label>
              <input
                type="text"
                readOnly
                value="https://peopleflow-api-4vsk.onrender.com/api/auth/token"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">Base API URL Path</label>
              <input
                type="text"
                readOnly
                value="https://peopleflow-api-4vsk.onrender.com/api"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">OAuth Client ID</label>
              <input
                type="text"
                readOnly
                value="pf_client_prod_89432"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">OAuth Client Secret</label>
              <div className="relative">
                <input
                  type="password"
                  readOnly
                  value="••••••••••••••••••••••••••••••••"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold">
              Warning: Credentials are in read-only sandbox mode.
            </span>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: Webhooks */}
      {/* ---------------------------------------------------- */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          
          {/* Add Webhook form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Register Custom Webhook Link</h4>
            
            <form onSubmit={handleAddWebhook} className="flex flex-col sm:flex-row gap-2 text-xs font-semibold text-slate-600">
              <div className="w-full sm:w-64 shrink-0">
                <select
                  value={newWebhookEvent}
                  onChange={(e) => setNewWebhookEvent(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="Employee Onboarding (Hire)">Employee Onboarding (Hire)</option>
                  <option value="Compensation Revision (Promotion)">Compensation Revision (Promotion)</option>
                  <option value="Employment Termination">Employment Termination</option>
                </select>
              </div>
              <input
                type="url"
                required
                placeholder="https://yourserver.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Add Endpoint
              </button>
            </form>
          </div>

          {/* Webhook registry table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">Event Subscriptions Table</h4>
            </div>
            
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-4">Event Category</th>
                  <th className="py-2.5 px-4">Webhook target URL</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                {webhooks.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{w.event}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono select-all">{w.url}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        w.status === "Active" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setWebhooks(prev => prev.filter((_, wIdx) => wIdx !== idx))}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: OpenAI Settings */}
      {/* ---------------------------------------------------- */}
      {activeTab === "openai" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">OpenAI Integration settings</h4>
            <p className="text-xs text-slate-400 mt-0.5">Control generative templates used by rule assistants and offer drafts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-600">
            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">OpenAI Secret API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  className="w-full p-2 border border-slate-200 focus:border-purple-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">GPT Chat Engine Model</label>
              <select
                value={openAiModel}
                onChange={(e) => setOpenAiModel(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none"
              >
                <option value="gpt-4o">gpt-4o (Premium Multi-modal)</option>
                <option value="gpt-4-turbo">gpt-4-turbo (Production standard)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy fast)</option>
                <option value="o1-mini">o1-mini (Reasoning model)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">Temperature Parameter: {temperature}</label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save OpenAI Config
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: Slack / MS Teams */}
      {/* ---------------------------------------------------- */}
      {activeTab === "slack" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Enterprise Webhook Dispatchers</h4>
            <p className="text-xs text-slate-400 mt-0.5">Transmit transaction announcements directly to corporate Slack/Teams channels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-600">
            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">Slack Incoming Webhook URL</label>
              <input
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">Target Slack Channel</label>
              <input
                type="text"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
              />
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <label className="block mb-1.5 font-bold text-slate-500 uppercase">MS Teams Incoming Webhook URL</label>
              <input
                type="url"
                placeholder="https://outlook.office.com/webhook/..."
                className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Save Webhook Configuration
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default IntegrationCenter;
