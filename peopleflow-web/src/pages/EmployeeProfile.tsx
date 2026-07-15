import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, AlertCircle, Info, Calendar } from "lucide-react";
import api from "../utils/api";

interface EmployeeProfileProps {
  learningMode: boolean;
  user: any;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ learningMode, user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [workflowPopup, setWorkflowPopup] = useState<{ show: boolean, message: string } | null>(null);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [editData, setEditData] = useState<any>({});

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees/${id}`);
      setEmployee(res.data);
      setEditData({
        firstName: res.data.personalInfo?.firstName || "",
        lastName: res.data.personalInfo?.lastName || "",
        preferredName: res.data.personalInfo?.preferredName || "",
        email: res.data.personalInfo?.email || "",
        phone: res.data.personalInfo?.phone || "",
        nationality: res.data.personalInfo?.nationality || "",
        gender: res.data.personalInfo?.gender || "Male",
        dateOfBirth: res.data.personalInfo?.dateOfBirth ? res.data.personalInfo.dateOfBirth.split("T")[0] : "",
        company: res.data.jobInfo?.company || "",
        legalEntity: res.data.jobInfo?.legalEntity || "",
        businessUnit: res.data.jobInfo?.businessUnit || "",
        division: res.data.jobInfo?.division || "",
        department: res.data.jobInfo?.department || "",
        location: res.data.jobInfo?.location || "",
        jobTitle: res.data.jobInfo?.jobTitle || "",
        position: res.data.jobInfo?.position || "",
        grade: res.data.jobInfo?.grade || "",
        payGrade: res.data.jobInfo?.payGrade || "",
        fte: String(res.data.jobInfo?.fte || 1.0),
        employeeClass: res.data.jobInfo?.employeeClass || "Regular",
        managerId: res.data.jobInfo?.managerId || "",
        probationEnd: res.data.jobInfo?.probationEnd ? res.data.jobInfo.probationEnd.split("T")[0] : "",
        salary: String(res.data.jobInfo?.salary || 0),
        status: res.data.status || "Active",
        role: res.data.role || "Employee"
      });

      // Fetch automation logs
      try {
        const logsRes = await api.get("/automation/logs");
        setAutomationLogs(logsRes.data);
      } catch (err) {
        console.error("Error loading logs in profile:", err);
      }

    } catch (err) {
      console.error("Error fetching employee details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.put(`/employees/${id}`, editData);
      setIsEditOpen(false);
      
      if (res.data && res.data.workflowTriggered) {
        setWorkflowPopup({ show: true, message: res.data.message });
      } else {
        fetchEmployee();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTerminate = async () => {
    if (!window.confirm("Are you sure you want to terminate this employee record? This will change status to Terminated and log a history event.")) {
      return;
    }

    try {
      await api.put(`/employees/${id}`, {
        ...editData,
        status: "Terminated"
      });
      fetchEmployee();
    } catch (err) {
      console.error("Error terminating employee:", err);
    }
  };

  const handleHardDelete = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently purge this employee master record from the database. This action CANNOT be undone. Proceed?")) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);
      navigate("/employees");
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-500">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="font-bold text-lg">Employee profile not found</h3>
        <p className="text-sm mt-1">Please verify the URL or try searching again.</p>
        <Link to="/employees" className="mt-4 text-primary-600 font-semibold hover:underline">
          Go back to Directory
        </Link>
      </div>
    );
  }

  const canEdit = user?.role === "HR" || user?.role === "Administrator";
  const isSelf = user?.id === employee.id;
  const isManager = user?.role === "Manager";

  // Hide salary if user is Employee and NOT their own profile, or if guest
  const hideCompensation = !canEdit && !isSelf && !isManager;

  const hasDispatched = automationLogs.some(log => 
    log.workflowName === "Onboarding" && 
    log.event.includes("Dispatched") && 
    log.details.includes(employee.personalInfo?.firstName)
  );

  const hasSigned = automationLogs.some(log => 
    log.workflowName === "Onboarding" && 
    log.event.includes("Signed") && 
    log.details.includes(employee.personalInfo?.firstName)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-50 text-green-700 border-green-200";
      case "Leave": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Terminated": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Back button */}
      <div>
        <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Learning Mode Banner */}
      {learningMode && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 rounded-xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-purple-900 text-sm">SAP SuccessFactors Concept: Employee Profiles & Effective Dating</h3>
            <p className="text-purple-800 text-xs leading-relaxed">
              In SuccessFactors, profiles represent a structured datastore split between **Personal Information** and **Employment Information**. 
              Any adjustments to job or organizational assignments are **Effective Dated**. Instead of rewriting database lines directly, the system creates a historical delta linked to an **Event** (e.g. Transfer, Promotion, Salary Change) and an **Event Reason**.
            </p>
            <p className="text-purple-800 text-xs leading-relaxed font-medium">
              Try updating the employee's title or salary using the "Update Profile" button. You will see a new event entry automatically appended to the **History** tab!
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-4 border-slate-100 shadow-md uppercase">
            {employee.personalInfo?.firstName.charAt(0)}{employee.personalInfo?.lastName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
              {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(employee.status)}`}>
                {employee.status}
              </span>
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">{employee.jobInfo?.jobTitle} • {employee.jobInfo?.location}</p>
            <p className="text-xs text-slate-400 mt-1">Employee ID: <span className="font-semibold text-slate-500">{employee.employeeNumber}</span></p>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Update Profile</span>
            </button>
            {employee.status !== "Terminated" && (
              <button
                onClick={handleTerminate}
                className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Terminate Record
              </button>
            )}
            {user?.role === "Administrator" && (
              <button
                onClick={handleHardDelete}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Purge Record
              </button>
            )}
          </div>
        )}
      </div>

      {hasDispatched && !hasSigned && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-950 text-sm">Employment Offer Contract Pending Signature</h4>
              <p className="text-amber-800 text-xs mt-0.5">
                The onboarding workflow is staged. A DocuSign contract has been dispatched to {employee.personalInfo?.email}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSignModal(true)}
            className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer shadow-md hover:shadow-lg"
          >
            Sign Offer Letter
          </button>
        </div>
      )}

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex gap-6">
        {["overview", "job", "personal", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors uppercase ${
              activeTab === tab 
                ? "border-primary-600 text-primary-700" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[300px]">
        {/* OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6 md:col-span-2">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Organizational Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-xs text-slate-400 font-medium">Legal Entity</span>
                    <span className="font-semibold text-slate-700 text-sm mt-0.5 block">{employee.jobInfo?.legalEntity || "Not Assigned"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-xs text-slate-400 font-medium">Business Unit</span>
                    <span className="font-semibold text-slate-700 text-sm mt-0.5 block">{employee.jobInfo?.businessUnit || "Not Assigned"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-xs text-slate-400 font-medium">Department</span>
                    <span className="font-semibold text-slate-700 text-sm mt-0.5 block">{employee.jobInfo?.department || "Not Assigned"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-xs text-slate-400 font-medium">Location</span>
                    <span className="font-semibold text-slate-700 text-sm mt-0.5 block">{employee.jobInfo?.location || "Not Assigned"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-xs text-slate-400 font-medium">Hire Date</span>
                      <span className="font-semibold text-slate-700 text-sm">
                        {employee.jobInfo?.hireDate ? new Date(employee.jobInfo.hireDate).toLocaleDateString() : "Not Entered"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-xs text-slate-400 font-medium">Probation End</span>
                      <span className="font-semibold text-slate-700 text-sm">
                        {employee.jobInfo?.probationEnd ? new Date(employee.jobInfo.probationEnd).toLocaleDateString() : "No Probation"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reports To</h3>
              {employee.managerName ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center border border-primary-200">
                    {employee.managerName.split(" ").map((n: string) => n.charAt(0)).join("")}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{employee.managerName}</h4>
                    <span className="text-xs text-slate-500">Supervisor / Line Manager</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm font-medium">No manager assigned (Top of Hierarchy)</p>
              )}

              <div className="border-t border-slate-200 pt-4">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Employment Status</span>
                <span className="block text-sm font-semibold text-slate-700 mt-1">Full-Time Equivalent (FTE): {employee.jobInfo?.fte || "1.0"}</span>
                <span className="block text-xs text-slate-500 mt-0.5">Classification: {employee.jobInfo?.employeeClass || "Regular"}</span>
              </div>
            </div>
          </div>
        )}

        {/* JOB INFO PANEL */}
        {activeTab === "job" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Organizational Unit</h3>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm border border-slate-100 p-4 rounded-xl">
                  <dt className="text-slate-400 font-medium col-span-1">Company:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.company}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Legal Entity:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.legalEntity}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Business Unit:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.businessUnit}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Division:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.division}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Department:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.department}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Location:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.location}</dd>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Job Details & Compensation</h3>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm border border-slate-100 p-4 rounded-xl">
                  <dt className="text-slate-400 font-medium col-span-1">Job Title:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.jobTitle}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Position:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.position}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Job Grade:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.grade}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Pay Grade:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.payGrade}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">FTE Status:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.jobInfo?.fte}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Base Salary:</dt>
                  <dd className="text-slate-700 font-bold col-span-2">
                    {hideCompensation ? (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 py-0.5 px-2 rounded tracking-wide border">
                        HIDDEN (RBP Restricted)
                      </span>
                    ) : (
                      <span>${employee.jobInfo?.salary ? employee.jobInfo.salary.toLocaleString() : 0} / year</span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL INFO PANEL */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Details</h3>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm border border-slate-100 p-4 rounded-xl">
                  <dt className="text-slate-400 font-medium col-span-1">Email:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2 break-all">{employee.personalInfo?.email}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Phone:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.personalInfo?.phone}</dd>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Biographical Information</h3>
                <dl className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm border border-slate-100 p-4 rounded-xl">
                  <dt className="text-slate-400 font-medium col-span-1">Legal Name:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">
                    {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                  </dd>
                  <dt className="text-slate-400 font-medium col-span-1">Preferred Name:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.personalInfo?.preferredName || "None"}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Birth Date:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">
                    {employee.personalInfo?.dateOfBirth ? new Date(employee.personalInfo.dateOfBirth).toLocaleDateString() : ""}
                  </dd>
                  <dt className="text-slate-400 font-medium col-span-1">Gender:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.personalInfo?.gender}</dd>
                  <dt className="text-slate-400 font-medium col-span-1">Nationality:</dt>
                  <dd className="text-slate-700 font-semibold col-span-2">{employee.personalInfo?.nationality}</dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* JOB HISTORY TIMELINE PANEL */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Historical Audit Log (Effective-Dated records)</h3>
            
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 py-2">
              {employee.jobHistory && employee.jobHistory.length > 0 ? (
                employee.jobHistory.map((hist: any) => (
                  <div key={hist.id} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-primary-600 bg-white group-hover:bg-primary-600 transition-colors shadow-sm" />
                    
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            {hist.event}
                          </span>
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium">
                            {hist.eventReason}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                          Effective Date: {new Date(hist.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="block text-slate-400 font-medium">Job Title</span>
                          <span className="font-semibold text-slate-700">{hist.jobTitle}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-medium">Department</span>
                          <span className="font-semibold text-slate-700">{hist.department}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-medium">Location</span>
                          <span className="font-semibold text-slate-700">{hist.location}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-medium">Compensation</span>
                          <span className="font-bold text-slate-700">
                            {hideCompensation ? (
                              <span className="text-[10px] text-slate-400 italic">Restricted</span>
                            ) : (
                              `$${hist.salary.toLocaleString()} / yr`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No historical changes recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Update Profile Record</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modifying job or personal values creates an audit event history entry</p>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <XButton />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                  {error}
                </div>
              )}

              {/* Personal Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                  1. Personal & Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editData.firstName || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editData.lastName || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Name</label>
                    <input
                      type="text"
                      name="preferredName"
                      value={editData.preferredName || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editData.email || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nationality</label>
                    <input
                      type="text"
                      name="nationality"
                      value={editData.nationality || ""}
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
                  2. Employment Assignments & RBP
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Job Title</label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={editData.jobTitle || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                    <select
                      name="department"
                      value={editData.department || ""}
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                    <select
                      name="location"
                      value={editData.location || ""}
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">Base Salary (USD/EUR)</label>
                    <input
                      type="number"
                      name="salary"
                      value={editData.salary || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Manager</label>
                    <select
                      name="managerId"
                      value={editData.managerId || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="emp-admin-01">Sarah Connor (HR Director)</option>
                      <option value="emp-mgr-01">John Smith (Eng Manager)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Employment Status</label>
                    <select
                      name="status"
                      value={editData.status || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Leave">Leave of Absence</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">System Role (RBP Permission)</label>
                    <select
                      name="role"
                      value={editData.role || ""}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:border-primary-400 focus:outline-none"
                    >
                      <option value="Employee">Employee (Self Service)</option>
                      <option value="Manager">Manager (Approve & Edit)</option>
                      <option value="HR">HR Specialist (Full CRUD)</option>
                      <option value="Administrator">Administrator (Superuser)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Workflow Triggered Notification Modal */}
      {workflowPopup?.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-lg">Workflow Approval Routed</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {workflowPopup.message}
              </p>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 text-left">
              <span className="block text-[10px] font-bold text-purple-800 uppercase tracking-wider mb-1">
                SFEC Engine Explanation
              </span>
              <p className="text-purple-900 text-xs leading-relaxed">
                In SAP SuccessFactors, changes exceeding thresholds (e.g. salary limits or greater than 15% adjustments) automatically trigger **Workflow Approval Paths**. The profile changes will not show up here until they have been approved by the employee's Line Manager and HR in their active Inboxes.
              </p>
            </div>

            <button
              onClick={() => {
                setWorkflowPopup(null);
                fetchEmployee();
              }}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors cursor-pointer"
            >
              Understand & Acknowledge
            </button>
          </div>
        </div>
      )}
      {/* DocuSign E-Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header bar */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-yellow-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
                  DS
                </div>
                <div>
                  <h3 className="font-bold text-sm">DocuSign Secure Offer Review</h3>
                  <p className="text-[10px] text-slate-400">Envelope ID: {employee.employeeNumber}-DS-9901</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider"
              >
                Close
              </button>
            </div>

            {/* Document Body */}
            <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50 font-serif text-sm text-slate-800 leading-relaxed shadow-inner">
              <div className="bg-white p-12 border border-slate-200 shadow-md max-w-xl mx-auto space-y-8">
                <div className="text-center font-sans tracking-wide">
                  <h1 className="font-bold text-xl uppercase text-slate-700">Employment Agreement</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PeopleFlow Global Inc.</p>
                </div>

                <div className="space-y-4">
                  <p><strong>Date:</strong> {new Date(employee.jobInfo?.hireDate).toLocaleDateString()}</p>
                  <p><strong>To:</strong> {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}</p>
                  <p><strong>Email Address:</strong> {employee.personalInfo?.email}</p>
                </div>

                <div className="space-y-4">
                  <p>
                    Dear {employee.personalInfo?.firstName},
                  </p>
                  <p>
                    We are pleased to offer you employment with PeopleFlow Global Inc. in the position of <strong>{employee.jobInfo?.jobTitle}</strong>. 
                    You will report to your line manager (ID: {employee.jobInfo?.managerId || "N/A"}) at our <strong>{employee.jobInfo?.location}</strong> office.
                  </p>
                  <p>
                    Your initial base compensation is set at <strong>${employee.jobInfo?.salary.toLocaleString()}/year</strong>. 
                    Your employment is subject to our standard probationary period of 180 days (if applicable) and corporate policy compliance.
                  </p>
                  <p>
                    Please review the terms of this contract, and sign below electronically to execute your onboarding sequence.
                  </p>
                  <p className="pt-6">
                    Sincerely,
                    <br />
                    <span className="font-sans font-semibold text-slate-700 block mt-1 border-b border-slate-200 pb-1 w-40">Sarah Connor</span>
                    <span className="font-sans text-[10px] text-slate-400 uppercase">HR Operations Director</span>
                  </p>
                </div>

                {/* Signature line */}
                <div className="pt-12 border-t border-slate-100 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider">Candidate Signature</span>
                    <div className="h-10 flex items-center">
                      <span className="font-sans text-xs italic text-slate-400">Sign electronically on the right ➔</span>
                    </div>
                    <span className="block text-[10px] font-sans font-semibold text-slate-700 border-t border-slate-200 pt-1 w-48 font-bold">
                      {employee.personalInfo?.firstName} {employee.personalInfo?.lastName}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={async () => {
                        try {
                          await api.post("/automation/sign-contract", { employeeId: employee.id });
                          setShowSignModal(false);
                          fetchEmployee();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="py-2.5 px-6 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-slate-900 rounded-lg font-bold text-xs tracking-wider transition-colors cursor-pointer shadow border border-yellow-600 uppercase"
                    >
                      Sign Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Help Helper
const XButton = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default EmployeeProfile;
