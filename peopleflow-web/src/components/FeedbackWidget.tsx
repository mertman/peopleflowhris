import React, { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import api from "../utils/api";

interface FeedbackWidgetProps {
  user: any;
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await api.post("/feedback", {
        comment: comment.trim(),
        pageUrl: window.location.hash || "/"
      });
      setSuccess(true);
      setComment("");
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Feedback submission error:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Sticky Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-200 border border-indigo-500/20 cursor-pointer active:scale-95 group animate-bounce"
        style={{ animationDuration: "3s" }}
        title="Share your feedback"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 ease-out whitespace-nowrap">
          Feedback
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Submit Feedback & Comments</span>
              </h3>
              <button 
                onClick={() => {
                  setComment("");
                  setIsOpen(false);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Thank you!</h4>
                <p className="text-xs text-slate-500">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-[11px] text-slate-400 font-semibold space-y-0.5">
                  <span className="block">Submitter: <strong className="text-slate-600">{user?.firstName} {user?.lastName} ({user?.email})</strong></span>
                  <span className="block">Page Location: <strong className="text-slate-600 truncate block max-w-xs">{window.location.hash || "/"}</strong></span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Comments / Bugs / Suggestions</label>
                  <textarea
                    required
                    placeholder="Provide details of any bugs, comments or suggestions..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl text-xs bg-white text-slate-700 outline-none h-28 resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setComment("");
                      setIsOpen(false);
                    }}
                    className="py-2 px-3.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send Feedback"}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
