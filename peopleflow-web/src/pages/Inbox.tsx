import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle, Info, ChevronRight } from "lucide-react";
import api from "../utils/api";

interface InboxProps {
  learningMode: boolean;
}

const Inbox: React.FC<InboxProps> = ({ learningMode }) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workflows/pending");
      setWorkflows(res.data);
    } catch (err) {
      console.error("Error loading workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await api.post(`/workflows/${id}/approve`);
      fetchWorkflows();
    } catch (err) {
      console.error("Approval error:", err);
      alert("Error processing approval step.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!feedback.trim()) {
      alert("Please provide rejection reason/feedback.");
      return;
    }
    setActioningId(id);
    try {
      await api.post(`/workflows/${id}/reject`, { feedback });
      setRejectingId(null);
      setFeedback("");
      fetchWorkflows();
    } catch (err) {
      console.error("Rejection error:", err);
      alert("Error processing rejection step.");
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Manager": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Pending HR": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-green-50 text-green-700 border-green-200";
    }
  };

  // Compare and render field changes (Proposed vs Current)
  const renderDiff = (currentJob: any, proposed: any) => {
    const fieldsToCompare = [
      { key: "jobTitle", label: "Job Title" },
      { key: "department", label: "Department" },
      { key: "location", label: "Location" },
      { key: "salary", label: "Salary", isCurrency: true }
    ];

    const changes = fieldsToCompare.filter(f => {
      const cur = currentJob ? currentJob[f.key] : null;
      const prop = proposed[f.key];
      return cur !== prop && prop !== undefined;
    });

    if (changes.length === 0) {
      return <p className="text-xs text-slate-500 italic">No job information changes detected.</p>;
    }

    return (
      <div className="space-y-2 border border-slate-100 p-3 rounded-lg bg-slate-50/50">
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Staged Changes Comparison</h5>
        <div className="grid grid-cols-1 gap-2">
          {changes.map(c => {
            const curVal = currentJob ? currentJob[c.key] : "Unassigned";
            const propVal = proposed[c.key];

            const formatVal = (val: any) => {
              if (c.isCurrency && typeof val === "number") {
                return `$${val.toLocaleString()}`;
              }
              return val;
            };

            return (
              <div key={c.key} className="flex flex-wrap items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0 gap-2">
                <span className="font-semibold text-slate-500">{c.label}</span>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-slate-400 line-through">{formatVal(curVal)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                    {formatVal(propVal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Workflow Approvals</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, workflows gate critical updates to ensure organizational data integrity. 
              When a salary or position change is submitted, instead of modifying the employee profile immediately, a **Workflow Request** is instantiated.
              The request routes sequentially to target approvers (e.g. Employee's Manager ➔ HR Admin ➔ Compensation Director).
              Only when the **final approval** is completed, a transaction commits the changes to the active database tables and triggers history logging.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pending Approvals Inbox</h2>
        <p className="text-xs text-slate-500 mt-0.5">Review and sign off on active workflow change requests</p>
      </div>

      {/* Workflow list */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm shadow-sm">
          <Check className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Your inbox is clear!</p>
          <p className="text-xs text-slate-400 mt-0.5">There are no pending approvals requiring your sign-off.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <div 
              key={wf.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Request Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {wf.type} Request: {wf.employeeName}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(wf.status)}`}>
                      {wf.status}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Requested by: <span className="font-semibold text-slate-500">{wf.requesterName}</span> • 
                    Date: <span className="font-medium text-slate-500">{new Date(wf.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                
                {/* Event Reason trigger comment */}
                {wf.proposedDetails.eventReason && (
                  <div className="text-[10px] bg-purple-50 text-purple-700 border border-purple-100 rounded px-2 py-1 font-semibold flex items-center gap-1.5 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Rule Triggered: {wf.proposedDetails.eventReason}</span>
                  </div>
                )}
              </div>

              {/* Side-by-side diff */}
              {renderDiff(wf.currentJob, wf.proposedDetails)}

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3">
                {rejectingId === wf.id ? (
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="flex-1 p-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleReject(wf.id)}
                      disabled={actioningId !== null}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setFeedback(""); }}
                      className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setRejectingId(wf.id)}
                      disabled={actioningId !== null}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Send Back</span>
                    </button>
                    <button
                      onClick={() => handleApprove(wf.id)}
                      disabled={actioningId !== null}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;
