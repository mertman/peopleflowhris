import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, ArrowRight, Network, Layers, Plus, Trash2, Search, X } from "lucide-react";
import api from "../utils/api";

interface OrgChartProps {
  learningMode: boolean;
}

interface OrgUnit {
  id: string;
  type: string; // Company, Legal Entity, Business Unit, Division, Department, Cost Center, Location
  code: string;
  name: string;
  parent?: string;
}

const initialOrgUnits: OrgUnit[] = [
  { id: "unit-1", type: "Company", code: "COMP-01", name: "PeopleFlow Global Inc." },
  { id: "unit-2", type: "Legal Entity", code: "LE-01", name: "PF USA LLC", parent: "COMP-01" },
  { id: "unit-3", type: "Legal Entity", code: "LE-02", name: "PF Europe Ltd", parent: "COMP-01" },
  { id: "unit-4", type: "Business Unit", code: "BU-01", name: "Technology", parent: "LE-01" },
  { id: "unit-5", type: "Business Unit", code: "BU-02", name: "Sales & Marketing", parent: "LE-01" },
  { id: "unit-6", type: "Division", code: "DIV-01", name: "Product & Engineering", parent: "BU-01" },
  { id: "unit-7", type: "Division", code: "DIV-02", name: "Enterprise Sales", parent: "BU-02" },
  { id: "unit-8", type: "Department", code: "DEPT-01", name: "Engineering - Frontend", parent: "DIV-01" },
  { id: "unit-9", type: "Department", code: "DEPT-02", name: "Engineering - Quality", parent: "DIV-01" },
  { id: "unit-10", type: "Department", code: "DEPT-03", name: "HR Administration", parent: "LE-01" },
  { id: "unit-11", type: "Cost Center", code: "CC-01", name: "CC-ENG-01" },
  { id: "unit-12", type: "Cost Center", code: "CC-02", name: "CC-SALES-02" },
  { id: "unit-13", type: "Location", code: "LOC-01", name: "New York HQ" },
  { id: "unit-14", type: "Location", code: "LOC-02", name: "San Francisco Office" },
  { id: "unit-15", type: "Location", code: "LOC-03", name: "Madrid Office" }
];

const OrgChart: React.FC<OrgChartProps> = ({ learningMode }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrgTab, setActiveOrgTab] = useState<"chart" | "manage">("chart");
  
  // Manage Org state
  const userObj = (() => {
    const saved = localStorage.getItem("pf_user");
    return saved ? JSON.parse(saved) : null;
  })();
  const userEmail = userObj?.email || "default";
  const orgUnitsKey = `pf_org_units_${userEmail}`;

  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>(() => {
    const saved = localStorage.getItem(orgUnitsKey);
    return saved ? JSON.parse(saved) : initialOrgUnits;
  });
  const [selectedType, setSelectedType] = useState("Department");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newUnit, setNewUnit] = useState({ code: "", name: "", parent: "" });

  useEffect(() => {
    localStorage.setItem(orgUnitsKey, JSON.stringify(orgUnits));
  }, [orgUnits, orgUnitsKey]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await api.get("/org/chart");
        setEmployees(res.data);
      } catch (err) {
        console.error("Error loading chart data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Build tree from flat list of employee nodes
  const buildTree = (list: any[]) => {
    const map: { [key: string]: any } = {};
    const roots: any[] = [];

    // Initialize map
    list.forEach(node => {
      map[node.id] = { ...node, children: [] };
    });

    // Populate children
    list.forEach(node => {
      if (node.managerId && map[node.managerId]) {
        map[node.managerId].children.push(map[node.id]);
      } else {
        roots.push(map[node.id]);
      }
    });

    return roots;
  };

  const treeRoots = buildTree(employees);

  // Recursive tree component
  const TreeNodeComponent: React.FC<{ node: any; depth: number }> = ({ node, depth }) => {
    return (
      <div className="flex flex-col items-center">
        {/* Card representation of the employee node */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary-300 transition-all-custom w-64 relative z-10 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold border border-primary-200 flex items-center justify-center text-xs uppercase shrink-0">
              {node.avatar}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-800 text-xs truncate">{node.name}</h4>
              <p className="text-[10px] text-slate-500 font-semibold truncate">{node.title}</p>
              <p className="text-[9px] text-slate-400 font-medium truncate">{node.department}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-3 pt-2.5 flex justify-between items-center">
            <span className="text-[8px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
              {node.role}
            </span>
            <Link 
              to={`/employees/${node.id}`}
              className="text-[10px] text-primary-600 hover:text-primary-700 font-bold flex items-center gap-0.5 hover:underline"
            >
              <span>Profile</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Children Render */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full mt-8 relative">
            {/* Top vertical connector from parent card to the horizontal bridge line */}
            <div className="absolute top-[-32px] w-0.5 h-8 bg-slate-300" />
            
            {/* Horizontal bridge line spanning children */}
            {node.children.length > 1 && (
              <div className="absolute top-0 h-0.5 bg-slate-300 w-[calc(100%-256px)]" />
            )}

            {/* List of child nodes */}
            <div className="flex justify-center gap-8 w-full">
              {node.children.map((child: any) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical connector down from the bridge line to each child card */}
                  <div className="absolute top-0 w-0.5 h-8 bg-slate-300" />
                  <div className="mt-8">
                    <TreeNodeComponent node={child} depth={depth + 1} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // CRUD operations
  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.code || !newUnit.name) return;
    
    const added: OrgUnit = {
      id: `unit-${Date.now()}`,
      type: selectedType,
      code: newUnit.code,
      name: newUnit.name,
      parent: newUnit.parent || undefined
    };
    
    setOrgUnits((prev: OrgUnit[]) => [...prev, added]);
    setModalOpen(false);
    setNewUnit({ code: "", name: "", parent: "" });
  };

  const handleDeleteUnit = (id: string) => {
    setOrgUnits((prev: OrgUnit[]) => prev.filter((u: OrgUnit) => u.id !== id));
  };

  const filteredUnits = orgUnits
    .filter((u: OrgUnit) => u.type === selectedType)
    .filter((u: OrgUnit) => 
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const orgTypes = ["Company", "Legal Entity", "Business Unit", "Division", "Department", "Cost Center", "Location"];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] flex flex-col">
      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Organizational Hierarchy & Org Chart</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, the organizational structure is defined using two main frameworks:
              1. **Manager Hierarchy (Supervisor Tree)**: Traced dynamically through the `managerId` field in the employee's active **Job Information** record. This determines approval routing in workflows.
              2. **Matrix / Custom Hierarchy**: For dotted-line managers or project supervisors.
              The chart below recursively parses the current active supervisor links, rendering a complete live corporate hierarchy tree.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Organization & Hierarchy</h2>
          <p className="text-xs text-slate-500 mt-0.5">Visualize corporate reporting lines and configure institutional structures</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 shrink-0">
        <button
          onClick={() => setActiveOrgTab("chart")}
          className={`pb-3 text-xs md:text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 cursor-pointer ${
            activeOrgTab === "chart" 
              ? "border-primary-600 text-primary-700" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Visual Org Chart</span>
        </button>
        <button
          onClick={() => setActiveOrgTab("manage")}
          className={`pb-3 text-xs md:text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase flex items-center gap-2 cursor-pointer ${
            activeOrgTab === "manage" 
              ? "border-primary-600 text-primary-700" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manage Structures</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TABS 1: VISUAL ORG CHART */}
      {/* ---------------------------------------------------- */}
      {activeOrgTab === "chart" && (
        <div className="w-full overflow-x-auto flex-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex justify-center min-w-[768px] min-h-[450px]">
            <div className="py-4">
              {treeRoots.map((root) => (
                <TreeNodeComponent key={root.id} node={root} depth={0} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TABS 2: MANAGE STRUCTURES */}
      {/* ---------------------------------------------------- */}
      {activeOrgTab === "manage" && (
        <div className="flex-1 flex overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm min-h-[400px]">
          
          {/* Left Sub-sidebar list of types */}
          <aside className="w-48 bg-slate-50/50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">Org Object Types</span>
            {orgTypes.map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === t 
                    ? "bg-primary-50 text-primary-700 font-bold" 
                    : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-800"
                }`}
              >
                {t}
              </button>
            ))}
          </aside>

          {/* Right main table view */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-4">
            
            {/* Action controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {selectedType}</span>
              </button>
            </div>

            {/* List Table */}
            <div className="border border-slate-100 rounded-lg overflow-hidden flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Name</th>
                    {selectedType !== "Company" && <th className="py-2.5 px-4">Parent Code</th>}
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                  {filteredUnits.map((unit: OrgUnit) => (
                    <tr key={unit.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-primary-700 font-bold select-all">{unit.code}</td>
                      <td className="py-2.5 px-4 text-slate-800">{unit.name}</td>
                      {selectedType !== "Company" && <td className="py-2.5 px-4 text-slate-400 font-mono">{unit.parent || "-"}</td>}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No org structures found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* CRUD Modal for Org Unit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Add New {selectedType}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Unit Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEPT-SALES-02"
                  onChange={(e) => setNewUnit((prev: any) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Sales Department"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              {selectedType !== "Company" && (
                <div>
                  <label className="block mb-1 font-bold text-slate-400 uppercase">Parent Unit Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. LE-01"
                    value={newUnit.parent}
                    onChange={(e) => setNewUnit((prev: any) => ({ ...prev, parent: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                    className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrgChart;
