import React, { useState } from "react";
import { Lock, Mail, Users, ArrowRight } from "lucide-react";
import api from "../utils/api";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("sarah.connor@peopleflow.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: string) => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { demoRole: role });
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setError(`Demo login failed: ${err.response?.data?.message || "Server error"}`);
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-200 mb-3">
            P
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome to PeopleFlow</h2>
          <p className="text-sm text-slate-500 mt-1">HRIS Inspired by SAP SuccessFactors EC</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none bg-slate-50 focus:bg-white transition-all-custom"
                placeholder="john.doe@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none bg-slate-50 focus:bg-white transition-all-custom"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Switcher */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Portfolio Demo Quick Sign-in</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("Administrator")}
              disabled={loading}
              className="py-2 px-1 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Full HR permissions (Sarah Connor)"
            >
              HR Admin
            </button>
            <button
              onClick={() => handleQuickLogin("Manager")}
              disabled={loading}
              className="py-2 px-1 border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Manager permissions (John Smith)"
            >
              Manager
            </button>
            <button
              onClick={() => handleQuickLogin("Employee")}
              disabled={loading}
              className="py-2 px-1 border border-green-200 hover:bg-green-50 text-green-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Standard view-only profile (Emily Watson)"
            >
              Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
