import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, ArrowRight } from "lucide-react";
import api from "../utils/api";

interface OrgChartProps {
  learningMode: boolean;
}

const OrgChart: React.FC<OrgChartProps> = ({ learningMode }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
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
      <div>
        <h2 className="text-xl font-bold text-slate-800">Organizational Chart</h2>
        <p className="text-xs text-slate-500 mt-0.5">Visualize corporate reporting lines and command structures</p>
      </div>

      {/* Interactive Chart Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex justify-center overflow-x-auto min-w-[768px] min-h-[450px]">
        <div className="py-4">
          {treeRoots.map((root) => (
            <TreeNodeComponent key={root.id} node={root} depth={0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
