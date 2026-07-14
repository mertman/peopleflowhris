import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Search, SlidersHorizontal, Info, Eye, X } from "lucide-react";
import api from "../utils/api";

interface EmployeeListProps {
  learningMode: boolean;
  user: any;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ learningMode, user }) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [probationPopup, setProbationPopup] = useState<{ show: boolean, empNum: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    preferredName: "",
    dateOfBirth: "",
    gender: "Male",
    nationality: "American",
    email: "",
    phone: "",
    company: "PeopleFlow Global Inc.",
    legalEntity: "PF USA LLC",
    businessUnit: "Technology",
    division: "Product & Engineering",
    department: "Engineering - Frontend",
    location: "New York HQ",
    jobTitle: "Software Engineer II",
    position: "Frontend Developer II",
    grade: "GR-05",
    payGrade: "PG-05",
    fte: "1.0",
    employeeClass: "Regular",
    managerId: "emp-mgr-01",
    hireDate: new Date().toISOString().split("T")[0],
    probationEnd: "",
    salary: "90000",
    role: "Employee"
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.query = searchTerm;
      if (selectedDept) params.department = selectedDept;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get("/employees", { params });
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, selectedDept, selectedStatus]);

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
      const res = await api.post("/employees", formData);
      setIsModalOpen(false);
      
      // Check if the Spain probation rule was triggered
      if (res.data && res.data.spainProbationTriggered) {
        setProbationPopup({ show: true, empNum: res.data.employeeNumber });
      }

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        preferredName: "",
        dateOfBirth: "",
        gender: "Male",
        nationality: "American",
        email: "",
        phone: "",
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Technology",
        division: "Product & Engineering",
        department: "Engineering - Frontend",
        location: "New York HQ",
        jobTitle: "Software Engineer II",
        position: "Frontend Developer II",
        grade: "GR-05",
        payGrade: "PG-05",
        fte: "1.0",
        employeeClass: "Regular",
        managerId: "emp-mgr-01",
        hireDate: new Date().toISOString().split("T")[0],
        probationEnd: "",
        salary: "90000",
        role: "Employee"
      });
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error submitting form. Ensure email is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = user?.role === "HR" || user?.role === "Administrator";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-50 text-green-700 border-green-200";
      case "Leave": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Terminated": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Learning Mode Callout */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Employee List & Hire Process</h3>
            <p className="text-purple-800 text-xs mt-1 leading-relaxed">
              In SuccessFactors Employee Central, hiring a new employee is treated as a transactional process.
              Rather than just writing to an Employee table, the system performs a multi-object creation, writing records in:
              1. **User / Employee Master**: Core credentials.
              2. **Personal Information (Personal Info)**: Biographical information.
              3. **Employment Info (Job Info)**: Work details, organization assignments.
              4. **Job History**: An entry of Event = "Hire" and Event Reason = "New Hire" is automatically generated. This ensures there is a historical audit trail from Day 1.
            </p>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage employee details, positions, and job information</p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span>Hire Employee</span>
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:border-primary-400 focus:outline-none text-sm text-slate-700 bg-slate-50/50 focus:bg-white rounded-lg transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 text-sm text-slate-700 rounded-lg outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <option value="">All Departments</option>
            <option value="Engineering - Frontend">Engineering - Frontend</option>
            <option value="Engineering - Quality">Engineering - Quality</option>
            <option value="HR Administration">HR Administration</option>
            <option value="Enterprise Sales">Enterprise Sales</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 text-sm text-slate-700 rounded-lg outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Leave">Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No employees found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Job Title</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-500">{emp.employeeNumber}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center uppercase border border-slate-200">
                          {emp.personalInfo?.firstName.charAt(0)}{emp.personalInfo?.lastName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">
                            {emp.personalInfo?.firstName} {emp.personalInfo?.lastName}
                          </span>
                          <span className="block text-[11px] text-slate-400">{emp.personalInfo?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-medium">{emp.jobInfo?.department || "Unassigned"}</td>
                    <td className="py-3.5 px-6 text-slate-600">{emp.jobInfo?.jobTitle || "Unassigned"}</td>
                    <td className="py-3.5 px-6 text-slate-500">{emp.jobInfo?.location || "Unassigned"}</td>
                    <td className="py-3.5 px-6">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hire Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">New Hire Wizard</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add a new employee and initialize their employment record</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                  {error}
                </div>
              )}

              {/* Personal Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                  1. Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Job Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                  2. Employment & Job Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
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
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
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
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Base Salary (USD/EUR) *</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Manager</label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="emp-admin-01">Sarah Connor (HR Director)</option>
                      <option value="emp-mgr-01">John Smith (Eng Manager)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">RBP System Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="Employee">Employee (Self Service)</option>
                      <option value="Manager">Manager (Approve & Edit)</option>
                      <option value="HR">HR Specialist (Full CRUD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Hire Date *</label>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Probation End Date</label>
                    <input
                      type="date"
                      name="probationEnd"
                      value={formData.probationEnd}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {isSubmitting ? "Hiring..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Spain Probation Rule Popup */}
      {probationPopup?.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-lg">Business Rule Triggered</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Hiring in Spain (or a Spanish national) triggers **Spain Statutory Probation Rules**. The system automatically calculated and set a **180-day probation end date** for employee {probationPopup.empNum}!
              </p>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 text-left">
              <span className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1">
                SFEC Engine Explanation
              </span>
              <p className="text-purple-900 text-xs leading-relaxed">
                In SuccessFactors Employee Central, **HR Business Rules (MDF Rules)** execute automatically during HR transactions. They evaluate field entries (like Legal Entity, Country, or Job Classification) and populate or validate other fields instantly to guarantee statutory compliance.
              </p>
            </div>

            <button
              onClick={() => setProbationPopup(null)}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
            >
              Acknowledge Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
