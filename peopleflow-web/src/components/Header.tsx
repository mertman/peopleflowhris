import React from "react";
import { Search, Bell, Info } from "lucide-react";

interface HeaderProps {
  title: string;
  learningMode: boolean;
  setLearningMode: (mode: boolean) => void;
  searchTerm?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  learningMode, 
  setLearningMode,
  searchTerm,
  onSearchChange
}) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        
        {/* Learning Mode Callout */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
          learningMode 
            ? "bg-purple-50 text-purple-700 border-purple-200 shadow-sm" 
            : "bg-slate-50 text-slate-500 border-slate-200"
        }`}>
          <Info className="w-3.5 h-3.5" />
          <span>{learningMode ? "SuccessFactors Sandbox Mode Active" : "Learning Mode Idle"}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Dynamic Search Bar (Only visible if onSearchChange is provided, e.g. on People List) */}
        {onSearchChange !== undefined && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee / ID..."
              value={searchTerm || ""}
              onChange={onSearchChange}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-primary-400 rounded-lg outline-none transition-all-custom"
            />
          </div>
        )}

        {/* SuccessFactors Sandbox Switch */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
          <span className="text-xs font-medium text-slate-500">Learning Mode</span>
          <button
            onClick={() => setLearningMode(!learningMode)}
            className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
              learningMode ? "bg-purple-600" : "bg-slate-300"
            }`}
            aria-label="Toggle SuccessFactors Learning Simulator"
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
              learningMode ? "translate-x-4" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Notifications and Profile */}
        <div className="relative">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-600 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
