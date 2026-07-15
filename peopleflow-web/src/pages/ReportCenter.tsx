import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Download, Layers, Info, Play } from "lucide-react";
import api from "../utils/api";

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  lastRun: string;
}

const defaultReports: Report[] = [
  { id: "rep-1", name: "Corporate Headcount Census", description: "Comprehensive directory displaying active staff, classifications, and locations.", category: "Employee Central", createdBy: "System", lastRun: "2026-07-15" },
  { id: "rep-2", name: "Compensation Audit Sheet", description: "Audit checklist tracking base salaries, grades, and direct manager links.", category: "Compensation", createdBy: "Sarah Connor", lastRun: "2026-07-14" },
  { id: "rep-3", name: "Onboarding New Hire Log", description: "Traces recent employee hires, probation review milestones, and contracts.", category: "Onboarding", createdBy: "System", lastRun: "2026-07-15" },
  { id: "rep-4", name: "Positions Vacancy Roster", description: "List of corporate positions that are currently vacant or awaiting incumbents.", category: "Position Management", createdBy: "System", lastRun: "2026-07-11" }
];

const fallbackEmployees = [
  { employeeNumber: "PF-00001", personalInfo: { firstName: "Sarah", lastName: "Connor", email: "sarah.connor@peopleflow.com" }, jobInfo: { department: "HR Administration", jobTitle: "HR Director", location: "New York HQ", salary: 125000, hireDate: "2024-01-10" }, status: "Active" },
  { employeeNumber: "PF-00002", personalInfo: { firstName: "John", lastName: "Smith", email: "john.smith@peopleflow.com" }, jobInfo: { department: "Engineering - Frontend", jobTitle: "Software Manager", location: "San Francisco Office", salary: 140000, hireDate: "2024-05-15" }, status: "Active" },
  { employeeNumber: "PF-00003", personalInfo: { firstName: "David", lastName: "Miller", email: "david.miller@peopleflow.com" }, jobInfo: { department: "Engineering - Frontend", jobTitle: "Frontend Engineer II", location: "Madrid Office", salary: 85000, hireDate: "2025-02-01" }, status: "Active" },
  { employeeNumber: "PF-00004", personalInfo: { firstName: "Elena", lastName: "Russo", email: "elena.russo@peopleflow.com" }, jobInfo: { department: "Enterprise Sales", jobTitle: "Account Director", location: "Chicago Hub", salary: 95000, hireDate: "2024-11-20" }, status: "Active" },
  { employeeNumber: "PF-00005", personalInfo: { firstName: "Kenji", lastName: "Sato", email: "kenji.sato@peopleflow.com" }, jobInfo: { department: "Engineering - Quality", jobTitle: "QA Engineer III", location: "New York HQ", salary: 90000, hireDate: "2025-06-01" }, status: "Active" }
];

const ReportCenter: React.FC<{ learningMode: boolean }> = ({ learningMode }) => {
  const [activeTab, setActiveTab] = useState<"browse" | "builder" | "ai">("browse");
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Builder configuration
  const [selectedSource, setSelectedSource] = useState("Employees");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "employeeNumber", "firstName", "lastName", "department", "jobTitle"
  ]);
  const [filterField, setFilterField] = useState("department");
  const [filterOperator, setFilterOperator] = useState("=");
  const [filterValue, setFilterValue] = useState("");
  
  // Results view
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // AI Prompt Report state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiExplainText, setAiExplainText] = useState("");

  // Load employees from server
  const loadEmployeesData = async () => {
    try {
      const res = await api.get("/employees");
      if (res.data && res.data.length > 0) {
        setEmployees(res.data);
      } else {
        setEmployees(fallbackEmployees);
      }
    } catch (err) {
      console.error("Failed to load employees for report, falling back to mock data:", err);
      setEmployees(fallbackEmployees);
    }
  };

  useEffect(() => {
    loadEmployeesData();
  }, []);

  const columnOptions = [
    { key: "employeeNumber", label: "Employee ID" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email Address" },
    { key: "department", label: "Department" },
    { key: "jobTitle", label: "Job Title" },
    { key: "location", label: "Location" },
    { key: "salary", label: "Base Salary" },
    { key: "hireDate", label: "Hire Date" },
    { key: "status", label: "Status" }
  ];

  const handleToggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(prev => prev.filter(c => c !== col));
    } else {
      setSelectedColumns(prev => [...prev, col]);
    }
  };

  // Run the customized report
  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      // Filter logic locally
      let filtered = [...employees];
      if (filterValue.trim()) {
        const val = filterValue.toLowerCase();
        filtered = filtered.filter(emp => {
          let fieldVal = "";
          if (filterField === "department") fieldVal = emp.jobInfo?.department || "";
          else if (filterField === "location") fieldVal = emp.jobInfo?.location || "";
          else if (filterField === "jobTitle") fieldVal = emp.jobInfo?.jobTitle || "";
          else if (filterField === "status") fieldVal = emp.status || "";
          else if (filterField === "firstName") fieldVal = emp.personalInfo?.firstName || "";
          else if (filterField === "lastName") fieldVal = emp.personalInfo?.lastName || "";
          
          fieldVal = fieldVal.toLowerCase();
          if (filterOperator === "=") return fieldVal === val;
          if (filterOperator === "!=") return fieldVal !== val;
          if (filterOperator === "contains") return fieldVal.includes(val);
          return true;
        });
      }

      setReportResults(filtered);
      setShowResults(true);
      setLoading(false);
    }, 800);
  };

  // AI Prompt parsing logic
  const handleGenerateAIReport = () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const text = aiPrompt.toLowerCase();
      let filtered = [...employees];
      let details = "";

      // 1. Detect location filters
      if (text.includes("spain") || text.includes("madrid")) {
        filtered = filtered.filter(emp => (emp.jobInfo?.location || "").toLowerCase().includes("madrid") || (emp.jobInfo?.location || "").toLowerCase().includes("spain"));
        details += "Filtered by Location: Spain/Madrid. ";
      } else if (text.includes("new york") || text.includes("ny")) {
        filtered = filtered.filter(emp => (emp.jobInfo?.location || "").toLowerCase().includes("new york"));
        details += "Filtered by Location: New York. ";
      }

      // 2. Detect department filters
      if (text.includes("engineering") || text.includes("frontend") || text.includes("developer")) {
        filtered = filtered.filter(emp => (emp.jobInfo?.department || "").toLowerCase().includes("engineering") || (emp.jobInfo?.department || "").toLowerCase().includes("frontend"));
        details += "Filtered by Department: Engineering. ";
      } else if (text.includes("sales")) {
        filtered = filtered.filter(emp => (emp.jobInfo?.department || "").toLowerCase().includes("sales"));
        details += "Filtered by Department: Sales. ";
      } else if (text.includes("hr")) {
        filtered = filtered.filter(emp => (emp.jobInfo?.department || "").toLowerCase().includes("hr"));
        details += "Filtered by Department: HR. ";
      }

      // 3. Detect Salary filters
      if (text.includes("salary above") || text.includes("compensation above") || text.includes("salary >")) {
        const match = text.match(/above\s*(\d+)/) || text.match(/>\s*(\d+)/);
        if (match) {
          const limit = Number(match[1]);
          filtered = filtered.filter(emp => Number(emp.jobInfo?.salary || 0) > limit);
          details += `Filtered by Salary > $${limit.toLocaleString()}. `;
        }
      }

      // 4. Columns selection
      let cols = ["employeeNumber", "firstName", "lastName", "department", "jobTitle"];
      if (text.includes("salary") || text.includes("pay")) {
        cols.push("salary");
      }
      if (text.includes("hire date") || text.includes("hired")) {
        cols.push("hireDate");
      }
      setSelectedColumns([...new Set(cols)]);

      setReportResults(filtered);
      setAiExplainText(`AI interpreted request: "${aiPrompt}". ${details || "Created generalized headcount report."}`);
      setShowResults(true);
      setLoading(false);
    }, 1000);
  };

  // Mock export handler
  const handleExport = (format: string) => {
    alert(`SuccessFactors Report Export started!\n\nExporting ${reportResults.length} records in ${format} format.`);
    
    // Simple download anchor tag mockup
    const headers = selectedColumns.join(",");
    const rows = reportResults.map(emp => {
      return selectedColumns.map(col => {
        if (col === "firstName") return emp.personalInfo?.firstName || "";
        if (col === "lastName") return emp.personalInfo?.lastName || "";
        if (col === "email") return emp.personalInfo?.email || "";
        if (col === "department") return emp.jobInfo?.department || "";
        if (col === "jobTitle") return emp.jobInfo?.jobTitle || "";
        if (col === "location") return emp.jobInfo?.location || "";
        if (col === "salary") return emp.jobInfo?.salary || 0;
        if (col === "hireDate") return emp.jobInfo?.hireDate || "";
        return emp[col] || "";
      }).join(",");
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PF_Report_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCellValue = (emp: any, col: string) => {
    if (col === "firstName") return emp.personalInfo?.firstName || "";
    if (col === "lastName") return emp.personalInfo?.lastName || "";
    if (col === "email") return emp.personalInfo?.email || "";
    if (col === "department") return emp.jobInfo?.department || "";
    if (col === "jobTitle") return emp.jobInfo?.jobTitle || "";
    if (col === "location") return emp.jobInfo?.location || "";
    if (col === "status") return emp.status || "Active";
    if (col === "salary") {
      const sal = emp.jobInfo?.salary;
      return sal ? `$${Number(sal).toLocaleString()}` : "$0";
    }
    if (col === "hireDate") {
      const date = emp.jobInfo?.hireDate;
      return date ? new Date(date).toLocaleDateString() : "";
    }
    return emp[col] || "";
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
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Canvas & Story Reports</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors, the **Report Center** consolidates Canvas, Ad-hoc, and modern **People Analytics Story Reports** powered by SAP Analytics Cloud.
              的故事(Stories) allow admins to choose custom data models (schemas), configure multi-source filters, and generate cross-object visualizations.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Report Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Generate, schedule, and compile core organizational records</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {[
          { id: "browse", label: "Browse Reports", icon: Layers },
          { id: "builder", label: "Custom Report Builder", icon: FileText },
          { id: "ai", label: "AI Report Prompts", icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setShowResults(false);
              }}
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
      {/* TABS: BROWSE REPORTS */}
      {/* ---------------------------------------------------- */}
      {activeTab === "browse" && !showResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defaultReports.map(rep => (
            <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold bg-slate-100 text-slate-500 border px-2 py-0.5 rounded-full">{rep.category}</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1.5">{rep.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{rep.description}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>By: {rep.createdBy} • Last run: {rep.lastRun}</span>
                <button
                  onClick={() => {
                    // Seed standard results
                    setReportResults(employees);
                    setShowResults(true);
                  }}
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: CUSTOM REPORT BUILDER */}
      {/* ---------------------------------------------------- */}
      {activeTab === "builder" && !showResults && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 1 & 2: Source & Columns Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">1. Data Source Schema</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none"
                >
                  <option value="Employees">Employee Master Data Schema</option>
                  <option value="Positions">Position Management Schema</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">2. Choose Output Columns</label>
                <div className="grid grid-cols-2 gap-2 border border-slate-100 p-3 rounded-lg bg-slate-50/50 max-h-[220px] overflow-y-auto">
                  {columnOptions.map(col => {
                    const checked = selectedColumns.includes(col.key);
                    return (
                      <label key={col.key} className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleColumn(col.key)}
                          className="w-4 h-4 accent-primary-600 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Filtering Panel */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">3. Configure Query Filters (Optional)</label>
                <div className="grid grid-cols-3 gap-2 border border-slate-100 p-4 rounded-lg bg-slate-50/50 text-xs">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Field</label>
                    <select
                      value={filterField}
                      onChange={(e) => setFilterField(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none"
                    >
                      <option value="department">Department</option>
                      <option value="location">Location</option>
                      <option value="jobTitle">Job Title</option>
                      <option value="status">Status</option>
                      <option value="firstName">First Name</option>
                      <option value="lastName">Last Name</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Operator</label>
                    <select
                      value={filterOperator}
                      onChange={(e) => setFilterOperator(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value="contains">contains</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Filter Value</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={selectedColumns.length === 0 || loading}
                  className="w-full md:w-auto py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Generating Output..." : "Build & Run Report"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS: AI REPORT GENERATOR */}
      {/* ---------------------------------------------------- */}
      {activeTab === "ai" && !showResults && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <div className="bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 border border-purple-200/60 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">SuccessFactors AI Story Builder</h3>
                <p className="text-[11px] text-slate-500">Input prompts to instantly filter columns and build clean tabular reports.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder='e.g., "Show everyone in Spain with salary above 80000" or "Show employee hire dates in Engineering"'
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 p-2 border border-slate-200 focus:border-purple-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
              />
              <button
                onClick={handleGenerateAIReport}
                disabled={!aiPrompt.trim() || loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                {loading ? "Constructing..." : "Compile Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* REPORT RESULT PREVIEW PANELS */}
      {/* ---------------------------------------------------- */}
      {showResults && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col space-y-4 p-5 animate-in fade-in duration-300">
          
          {/* Output Control bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Compiled Report Output</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                {aiExplainText || `Built query using ${selectedSource} schema. Found ${reportResults.length} records.`}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("CSV")}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport("Excel")}
                className="flex items-center gap-1.5 py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setAiExplainText("");
                }}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Back to Center
              </button>
            </div>
          </div>

          {/* Results Table preview */}
          {reportResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span>No employee records matched report filter queries.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    {selectedColumns.map(col => {
                      const option = columnOptions.find(o => o.key === col);
                      return (
                        <th key={col} className="py-2.5 px-4">{option?.label || col}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                  {reportResults.map((emp, empIdx) => (
                    <tr key={empIdx} className="hover:bg-slate-50/50">
                      {selectedColumns.map(col => (
                        <td key={col} className="py-2 px-4">{getCellValue(emp, col)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ReportCenter;
