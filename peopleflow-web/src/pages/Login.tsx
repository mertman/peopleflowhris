import React, { useState, useEffect } from "react";
import { 
  Globe, Building, HeartPulse, Hammer, Cpu, Hotel, ShoppingBag, X
} from "lucide-react";
import api from "../utils/api";
import logoWide from "../assets/logo-wide.png";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Sandbox Modals
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  
  // Custom account creation
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  // Load Google Identity Services (GSI)
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        // Fallback to mock Client ID if environment variable is not defined
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "102930843232-mockclientid.apps.googleusercontent.com";
        
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse
          });
          
          (window as any).google.accounts.id.renderButton(
            document.getElementById("google-signin-container"),
            { theme: "outline", size: "large", width: 382 }
          );
        } catch (err) {
          console.warn("[OAuth] Google Sign-In button render skipped:", err);
        }
      }
    };

    // Try rendering immediately if script is loaded
    initGoogleSignIn();
    
    // Fallback timer if script takes a moment to load asynchronously
    const timer = setTimeout(initGoogleSignIn, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      const idToken = response.credential;
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        setError("");
        setLoading(true);
        setGoogleEmail(payload.email || "");
        setGoogleName(payload.name || "Google User");
        setGoogleCredential(idToken);
        setGoogleModalOpen(false);

        // Call backend first to check if sandbox exists & is fresh
        const res = await api.post("/auth/register-google", {
          credential: idToken
        });

        if (res.data.sandboxExists) {
          onLoginSuccess(res.data.token, res.data.user);
        } else {
          setTemplateModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error("Google credential handle failed:", err);
      if (err.response?.data?.sandboxExists === false || err.response?.data?.message?.includes("template")) {
        setTemplateModalOpen(true);
      } else {
        setError(err.response?.data?.message || "Google sandbox login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockGoogleToken = (selectedEmail: string, selectedName: string) => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      email: selectedEmail,
      name: selectedName,
      given_name: selectedName.split(" ")[0] || "Admin",
      family_name: selectedName.split(" ").slice(1).join(" ") || "User",
      sub: `mock-google-id-${Date.now()}`
    }));
    return `${header}.${payload}.mock-signature`;
  };

  const handleGoogleAccountSelect = async (selectedEmail: string, selectedName: string) => {
    const mockToken = generateMockGoogleToken(selectedEmail, selectedName);
    setError("");
    setLoading(true);
    setGoogleEmail(selectedEmail);
    setGoogleName(selectedName);
    setGoogleCredential(mockToken);
    setGoogleModalOpen(false);

    try {
      const res = await api.post("/auth/register-google", {
        credential: mockToken,
        email: selectedEmail,
        firstName: selectedName.split(" ")[0],
        lastName: selectedName.split(" ").slice(1).join(" ")
      });

      if (res.data.sandboxExists) {
        onLoginSuccess(res.data.token, res.data.user);
      } else {
        setTemplateModalOpen(true);
      }
    } catch (err: any) {
      setTemplateModalOpen(true);
    } finally {
      setLoading(false);
    }
  };



  const handleRegisterGoogleSandbox = async (templateName: string) => {
    setError("");
    setLoading(true);
    setTemplateModalOpen(false);

    try {
      const res = await api.post("/auth/register-google", {
        credential: googleCredential,
        template: templateName
      });

      onLoginSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to register Google sandbox. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Dynamic Background Circles */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-primary-100/40 -top-40 -left-40 blur-3xl" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-100/30 -bottom-40 -right-40 blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={logoWide} alt="PeopleFlow Logo" className="h-10 w-auto mb-5 object-contain" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug max-w-sm">
            A Hands-On Learning Sandbox Inspired by SAP SuccessFactors Employee Central
          </h2>
          <p className="text-xs text-slate-500 mt-3 font-medium max-w-xs leading-relaxed">
            Practice Employee Central, Role-Based Permissions, Business Rules, MDF Objects, Workflows, and more.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* Real Google Sign-in Script Container */}
        <div className="mt-6 flex flex-col items-center justify-center space-y-3">
          {loading && <span className="text-xs text-slate-400 font-semibold animate-pulse">Initializing sandbox environment...</span>}
          <div id="google-signin-container" className="w-full flex justify-center min-h-[44px]"></div>
        </div>
      </div>

      {/* MODAL 1: GOOGLE ACCOUNT CHOOSER */}
      {googleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Choose a Google Account</h3>
              <button onClick={() => setGoogleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { name: "John Doe", email: "john.doe@gmail.com" },
                { name: "Jane Smith", email: "jane.smith@gmail.com" }
              ].map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleAccountSelect(acc.email, acc.name)}
                  className="w-full text-left p-3 hover:bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {acc.name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{acc.email}</span>
                  </div>
                </button>
              ))}

              {showCustomGoogle ? (
                <div className="border border-slate-100 bg-slate-50/50 rounded-lg p-3 space-y-2.5 text-xs text-slate-600 font-semibold">
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 uppercase">Google Account Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mike Ross"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-400 uppercase">Google Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. mike.ross@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded bg-white text-slate-700 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!googleEmail || !googleName) return;
                      handleGoogleAccountSelect(googleEmail, googleName);
                    }}
                    className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Select Custom Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomGoogle(true)}
                  className="w-full py-2 border border-dashed border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  + Use another account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STARTER DATASET TEMPLATE SELECTOR */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Choose your starter dataset sandbox</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Initializing database for: {googleName} ({googleEmail})</p>
              </div>
              <button onClick={() => setTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {[
                { id: "global", label: "Global Enterprise", size: "125 employees", icon: Globe, color: "text-blue-600 bg-blue-50 border-blue-100", desc: "Corporate structure across USA, UK, Tokyo, Madrid." },
                { id: "tech", label: "Technology Company", size: "25 employees", icon: Cpu, color: "text-purple-600 bg-purple-50 border-purple-100", desc: "Product engineering, UI/UX designers, and QA roles." },
                { id: "healthcare", label: "Healthcare Clinic", size: "25 employees", icon: HeartPulse, color: "text-rose-600 bg-rose-50 border-rose-100", desc: "Physicians, registered nurses, and clinic administrators." },
                { id: "manufacturing", label: "Manufacturing Plant", size: "25 employees", icon: Hammer, color: "text-amber-600 bg-amber-50 border-amber-100", desc: "Plant operators, supervisors, and QC inspectors." },
                { id: "hospitality", label: "Hospitality Resort", size: "25 employees", icon: Hotel, color: "text-indigo-600 bg-indigo-50 border-indigo-100", desc: "Chefs, guest relations agent, and housekeepers." },
                { id: "retail", label: "Retail Stores", size: "25 employees", icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50 border-emerald-100", desc: "Merchandisers, visual leads, sales, and checkout staff." },
                { id: "smallbusiness", label: "Small Business", size: "25 employees", icon: Building, color: "text-slate-600 bg-slate-50 border-slate-100", desc: "Office administrators, client managers, accounting staff." }
              ].map(t => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleRegisterGoogleSandbox(t.id)}
                    className="text-left p-3 hover:bg-slate-50 border border-slate-150 rounded-xl transition-colors cursor-pointer flex gap-3 items-start"
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${t.color}`}>
                      <TIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-xs block">{t.label}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{t.size}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
