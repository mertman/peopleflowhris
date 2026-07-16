import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Info, X, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../utils/api";

interface PositionsProps {
  learningMode: boolean;
  user: any;
}

const Positions: React.FC<PositionsProps> = ({ learningMode, user }) => {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    department: "Engineering - Frontend",
    location: "New York HQ"
  });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/positions");
      setPositions(res.data);
    } catch (err) {
      console.error("Error loading positions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/positions", formData);
      setIsModalOpen(false);
      setFormData({
        code: "",
        title: "",
        department: "Engineering - Frontend",
        location: "New York HQ"
      });
      fetchPositions();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating position. Code must be unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPositions = positions.filter(pos => {
    const term = searchTerm.toLowerCase();
    return (
      pos.code.toLowerCase().includes(term) ||
      pos.title.toLowerCase().includes(term) ||
      pos.department.toLowerCase().includes(term) ||
      pos.location.toLowerCase().includes(term) ||
      (pos.incumbent && `${pos.incumbent.personalInfo?.firstName} ${pos.incumbent.personalInfo?.lastName}`.toLowerCase().includes(term))
    );
  });

  const canEdit = user?.role === "HR" || user?.role === "Administrator" || user?.role === "Superadmin";

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Position Management</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, **Position Management** decouples the job role from the individual employee. 
              Instead of assigning job properties directly to the employee record, they are defined on the **Position object**.
              Hiring or transferring involves assigning the employee as an **Incumbent** of a position. 
              Properties like Department, Division, and Location then **propagate** from the position to the employee's Job Info, reducing manual input errors. 
              If an employee leaves, the position status automatically reverts to **Vacant**, preserving structural planning.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Position Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define corporate positions, trace incumbents, and plan succession</p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Position</span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search positions, codes, or incumbents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-primary-400 focus:outline-none text-sm text-slate-700 bg-slate-50/50 focus:bg-white rounded-lg transition-colors"
          />
        </div>
      </div>

      {/* Positions Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No positions found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">Position Code</th>
                  <th className="py-3.5 px-6">Position Title</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Incumbent / Staff</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPositions.map((pos) => {
                  const isVacant = !pos.incumbent;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-500">{pos.code}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800">{pos.title}</td>
                      <td className="py-3.5 px-6 text-slate-600 font-medium">{pos.department}</td>
                      <td className="py-3.5 px-6 text-slate-500">{pos.location}</td>
                      <td className="py-3.5 px-6">
                        {!isVacant ? (
                          <Link 
                            to={`/employees/${pos.incumbent.id}`}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold hover:underline"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary-50 border border-primary-200 text-[10px] flex items-center justify-center font-bold uppercase shrink-0">
                              {pos.incumbent.personalInfo?.firstName.charAt(0)}{pos.incumbent.personalInfo?.lastName.charAt(0)}
                            </div>
                            <span>
                              {pos.incumbent.personalInfo?.firstName} {pos.incumbent.personalInfo?.lastName}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic font-medium">None (Position Vacant)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isVacant 
                            ? "bg-rose-50 text-rose-700 border-rose-200" 
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                          {isVacant ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Vacant</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Filled</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Create Position Object</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add a vacant position node to the database</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Position Code (Unique ID) *</label>
                <input
                  type="text"
                  name="code"
                  placeholder="POS-1010"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Position Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Lead Product Owner"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                >
                  <option value="Engineering - Frontend">Engineering - Frontend</option>
                  <option value="Engineering - Quality">Engineering - Quality</option>
                  <option value="HR Administration">HR Administration</option>
                  <option value="Enterprise Sales">Enterprise Sales</option>
                  <option value="Product Management">Product Management</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Location *</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                >
                  <option value="New York HQ">New York HQ</option>
                  <option value="San Francisco Office">San Francisco Office</option>
                  <option value="Madrid Office">Madrid Office</option>
                  <option value="Chicago Hub">Chicago Hub</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Positions;
