import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Sparkles, Plus, Trash2, ArrowRight, X,
  ShieldCheck, Users, Lock, Activity, Clock
} from "lucide-react";
import api from "../utils/api";

// ==========================================
// TYPE DEFINITIONS & INITIAL VALUES
// ==========================================

interface BusinessRule {
  id: string;
  name: string;
  object: string;
  event: string;
  status: string;
  description: string;
  conditions: { field: string; operator: string; value: string };
  actions: { field: string; value: string };
}

interface MDFObject {
  name: string;
  label: string;
  status: string;
  fields: { name: string; type: string; required: boolean }[];
  isCustom?: boolean;
}

interface Picklist {
  id: string;
  name: string;
  values: string[];
}

interface AuditLog {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
  values?: string[];
}

interface PermissionRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  filters: { field: string; operator: string; value: string }[];
}

interface PermissionAssignment {
  id: string;
  roleId: string;
  assignedToType: "user" | "group";
  assignedToId: string;
  targetGroupId: string;
}

const fallbackEmployees = [
  { employeeNumber: "PF-00001", personalInfo: { firstName: "Sarah", lastName: "Connor", email: "sarah.connor@peopleflow.com" }, jobInfo: { department: "HR Administration", jobTitle: "HR Director", location: "New York HQ", salary: 125000, hireDate: "2024-01-10" }, status: "Active" },
  { employeeNumber: "PF-00002", personalInfo: { firstName: "John", lastName: "Smith", email: "john.smith@peopleflow.com" }, jobInfo: { department: "Engineering - Frontend", jobTitle: "Software Manager", location: "San Francisco Office", salary: 140000, hireDate: "2024-05-15" }, status: "Active" },
  { employeeNumber: "PF-00003", personalInfo: { firstName: "David", lastName: "Miller", email: "david.miller@peopleflow.com" }, jobInfo: { department: "Engineering - Frontend", jobTitle: "Frontend Engineer II", location: "Madrid Office", salary: 85000, hireDate: "2025-02-01" }, status: "Active" },
  { employeeNumber: "PF-00004", personalInfo: { firstName: "Elena", lastName: "Russo", email: "elena.russo@peopleflow.com" }, jobInfo: { department: "Enterprise Sales", jobTitle: "Account Director", location: "Chicago Hub", salary: 95000, hireDate: "2024-11-20" }, status: "Active" },
  { employeeNumber: "PF-00005", personalInfo: { firstName: "Kenji", lastName: "Sato", email: "kenji.sato@peopleflow.com" }, jobInfo: { department: "Engineering - Quality", jobTitle: "QA Engineer III", location: "New York HQ", salary: 90000, hireDate: "2025-06-01" }, status: "Active" }
];

const initialPermissionRoles: PermissionRole[] = [
  {
    id: "role-admin",
    name: "HR Administrator",
    description: "Full read, write, and administrative rights across Employee Central, Org structure, and settings.",
    permissions: [
      "view_employees", "edit_employees", "hire_employees", "terminate_employees", "view_salary", "edit_salary", "view_personal_info", "edit_personal_info",
      "manage_companies", "manage_legal_entities", "manage_business_units", "manage_departments", "manage_cost_centers", "manage_locations",
      "create_positions", "edit_positions", "delete_positions", "assign_incumbents",
      "view_workflows", "approve_workflows", "reject_workflows", "configure_workflows",
      "business_rules", "mdf_objects", "picklists", "report_center", "integration_center", "api_keys", "feature_flags", "system_settings",
      "view_reports", "create_reports", "export_reports", "schedule_reports"
    ]
  },
  {
    id: "role-manager",
    name: "Line Manager",
    description: "Standard operational permissions for direct reports and workflow approvals.",
    permissions: [
      "view_employees", "view_personal_info", "view_salary",
      "view_workflows", "approve_workflows", "reject_workflows",
      "view_reports", "export_reports"
    ]
  },
  {
    id: "role-spain-hr",
    name: "Country HR (Spain)",
    description: "Local HR permissions restricted to employee populations in Spain.",
    permissions: [
      "view_employees", "edit_employees", "hire_employees", "view_personal_info", "edit_personal_info", "view_salary",
      "view_workflows", "approve_workflows", "reject_workflows"
    ]
  },
  {
    id: "role-recruiter",
    name: "Talent Recruiter",
    description: "Access to candidate pipelines, onboarding steps, and position requirements.",
    permissions: [
      "view_employees", "hire_employees", "view_personal_info",
      "create_positions", "edit_positions"
    ]
  },
  {
    id: "role-employee",
    name: "Regular Employee",
    description: "Self-service viewing permissions on profiles and sub-org units.",
    permissions: [
      "view_employees", "view_personal_info"
    ]
  }
];

const initialPermissionGroups: PermissionGroup[] = [
  {
    id: "group-spain",
    name: "Spain Employees",
    description: "Employees whose location contains Madrid.",
    filters: [{ field: "location", operator: "contains", value: "Madrid" }]
  },
  {
    id: "group-eng",
    name: "Engineering Department",
    description: "All employees working in Engineering units.",
    filters: [{ field: "department", operator: "contains", value: "Engineering" }]
  },
  {
    id: "group-us",
    name: "USA HQ Employees",
    description: "Employees situated in New York HQ location.",
    filters: [{ field: "location", operator: "contains", value: "New York" }]
  },
  {
    id: "group-all",
    name: "All Employees",
    description: "Global corporate roster population.",
    filters: [{ field: "status", operator: "=", value: "Active" }]
  }
];

const initialPermissionAssignments: PermissionAssignment[] = [
  {
    id: "assign-1",
    roleId: "role-admin",
    assignedToType: "user",
    assignedToId: "Sarah Connor",
    targetGroupId: "group-all"
  },
  {
    id: "assign-2",
    roleId: "role-spain-hr",
    assignedToType: "user",
    assignedToId: "Elena Russo",
    targetGroupId: "group-spain"
  },
  {
    id: "assign-3",
    roleId: "role-manager",
    assignedToType: "group",
    assignedToId: "Engineering Managers",
    targetGroupId: "group-eng"
  }
];

const initialRules: BusinessRule[] = [
  { id: "rule-1", name: "Spain Probation Rule", object: "Employee", event: "On Hire", status: "Active", description: "Hires in Spain require a 180-day probation period.", conditions: { field: "Country", operator: "=", value: "Spain" }, actions: { field: "Probation End", value: "180 Days" } },
  { id: "rule-2", name: "Germany Vacation Days", object: "Employee", event: "On Hire / Transfer", status: "Active", description: "All employees located in Germany receive 30 base vacation days.", conditions: { field: "Country", operator: "=", value: "Germany" }, actions: { field: "Vacation Balance", value: "30 Days" } },
  { id: "rule-3", name: "USA Overtime Eligibility", object: "Employee", event: "On Hire", status: "Active", description: "Hourly grade GR-03 in the US is non-exempt and gets overtime.", conditions: { field: "Location", operator: "=", value: "USA" }, actions: { field: "Overtime Eligible", value: "Yes" } },
  { id: "rule-4", name: "UK Pension Auto-Enrollment", object: "Employee", event: "On Hire", status: "Active", description: "Enroll employees over 22 into auto-pension.", conditions: { field: "Age", operator: ">=", value: "22" }, actions: { field: "Pension Scheme", value: "Auto-Enrolled" } },
  { id: "rule-5", name: "Japan Senior Retainer Age Check", object: "Employee", event: "Profile Update", status: "Active", description: "Transition employee class for senior retainer status.", conditions: { field: "Age", operator: ">=", value: "60" }, actions: { field: "Employee Class", value: "Senior Advisor" } },
  { id: "rule-6", name: "Canada Supplemental Medical Plan", object: "Employee", event: "On Hire", status: "Active", description: "Add provincial plan supplements.", conditions: { field: "Province", operator: "=", value: "Ontario" }, actions: { field: "Health Plan", value: "OHIP Supplemental" } },
  { id: "rule-7", name: "France Workweek Cap Enforcement", object: "Employee", event: "Profile Update", status: "Active", description: "Set 35-hour max workweek rule.", conditions: { field: "Country", operator: "=", value: "France" }, actions: { field: "Max Weekly Hours", value: "35 Hours" } },
  { id: "rule-8", name: "Singapore CPF Contribution Flag", object: "Employee", event: "On Hire", status: "Active", description: "Flag CPF calculation for Singapore Citizens.", conditions: { field: "Nationality", operator: "=", value: "Singaporean" }, actions: { field: "Pension Fund", value: "CPF Eligible" } },
  { id: "rule-9", name: "Australia Superannuation Rate", object: "Employee", event: "Salary Change", status: "Active", description: "Set standard superannuation rate.", conditions: { field: "Country", operator: "=", value: "Australia" }, actions: { field: "Superannuation Contribution", value: "11.5%" } },
  { id: "rule-10", name: "Brazil Thirteenth Salary Trigger", object: "Employee", event: "Payroll Init", status: "Active", description: "Activate 13th month payment scheme.", conditions: { field: "Country", operator: "=", value: "Brazil" }, actions: { field: "Thirteenth Salary", value: "Active" } }
];

const initialMDFObjects: MDFObject[] = [
  { name: "Employee", label: "Employee Master Data", status: "Standard", fields: [{ name: "employeeNumber", type: "String", required: true }, { name: "firstName", type: "String", required: true }, { name: "lastName", type: "String", required: true }, { name: "hireDate", type: "Date", required: true }, { name: "status", type: "Picklist", required: true }] },
  { name: "Department", label: "Department Structure", status: "Standard", fields: [{ name: "code", type: "String", required: true }, { name: "name", type: "String", required: true }, { name: "description", type: "String", required: false }, { name: "headOfDepartment", type: "String", required: false }] },
  { name: "Position", label: "Position Data", status: "Standard", fields: [{ name: "code", type: "String", required: true }, { name: "title", type: "String", required: true }, { name: "department", type: "Picklist", required: true }, { name: "location", type: "Picklist", required: true }, { name: "incumbentId", type: "String", required: false }] },
  { name: "Location", label: "Office Location", status: "Standard", fields: [{ name: "code", type: "String", required: true }, { name: "name", type: "String", required: true }, { name: "country", type: "Picklist", required: true }, { name: "timezone", type: "String", required: true }] },
  { name: "Company", label: "Holding Company", status: "Standard", fields: [{ name: "code", type: "String", required: true }, { name: "name", type: "String", required: true }, { name: "currency", type: "String", required: true }] }
];

const initialPicklists: Picklist[] = [
  { id: "pick-1", name: "Employment Status", values: ["Full Time", "Part Time", "Contractor", "Intern"] },
  { id: "pick-2", name: "Countries", values: ["USA", "Germany", "Spain", "UK", "Japan", "Canada", "France", "Singapore", "Australia", "Brazil"] },
  { id: "pick-3", name: "Currencies", values: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "BRL"] },
  { id: "pick-4", name: "Job Levels", values: ["Entry Level", "Mid Level", "Senior", "Manager", "Director", "Executive"] },
  { id: "pick-5", name: "Grades", values: ["GR-01", "GR-02", "GR-03", "GR-04", "GR-05", "GR-06", "GR-07"] }
];

const initialAuditLogs: AuditLog[] = [
  { id: "aud-1", date: "2026-07-15 09:25:00", user: "Sarah Connor (HR Admin)", action: "Created Business Rule", details: "Spain Probation rule initialized successfully." },
  { id: "aud-2", date: "2026-07-15 09:12:00", user: "Sarah Connor (HR Admin)", action: "Updated Feature Flags", details: "AI Enabled set to ON; WhatsApp integration set to OFF." },
  { id: "aud-3", date: "2026-07-15 08:45:00", user: "John Smith (Manager)", action: "Approved Workflow", details: "Promotion workflow approved for user ID emp-03." },
  { id: "aud-4", date: "2026-07-14 16:30:00", user: "Sarah Connor (HR Admin)", action: "Modified Picklist", values: ["Employment Status"], details: "Added 'Intern' option to Employment Status picklist." }
];

const initialWorkflows = [
  { id: "wf-1", name: "Promotion Process", steps: ["Manager", "HR Specialist", "CFO"] },
  { id: "wf-2", name: "New Hire Onboarding", steps: ["HR Specialist", "IT Ops", "Manager"] },
  { id: "wf-3", name: "Leave of Absence", steps: ["Manager", "HR Specialist"] },
  { id: "wf-4", name: "Salary Adjustment", steps: ["Manager", "HR Specialist", "Director", "CFO"] }
];

// ==========================================
// COMPONENT MAIN LOOP
// ==========================================

const AdminCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "rules";

  // Parse logged in user to partition localStorage sandboxes
  const userObj = (() => {
    const saved = localStorage.getItem("pf_user");
    return saved ? JSON.parse(saved) : null;
  })();
  const userEmail = userObj?.email || "default";

  const rulesKey = `pf_rules_${userEmail}`;
  const mdfKey = `pf_mdf_objects_${userEmail}`;
  const picklistsKey = `pf_picklists_${userEmail}`;
  const auditKey = `pf_audit_logs_${userEmail}`;
  const workflowsKey = `pf_workflows_config_${userEmail}`;
  const flagsKey = `pf_feature_flags_${userEmail}`;
  const settingsKey = `pf_system_settings_${userEmail}`;
  const rolesKey = `pf_permission_roles_${userEmail}`;
  const groupsKey = `pf_permission_groups_${userEmail}`;
  const assignmentsKey = `pf_permission_assignments_${userEmail}`;

  // State loaded from localStorage or defaults
  const [rules, setRules] = useState<BusinessRule[]>(() => {
    const saved = localStorage.getItem(rulesKey);
    return saved ? JSON.parse(saved) : initialRules;
  });
  const [mdfObjects, setMdfObjects] = useState<MDFObject[]>(() => {
    const saved = localStorage.getItem(mdfKey);
    return saved ? JSON.parse(saved) : initialMDFObjects;
  });
  const [picklists, setPicklists] = useState<Picklist[]>(() => {
    const saved = localStorage.getItem(picklistsKey);
    return saved ? JSON.parse(saved) : initialPicklists;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(auditKey);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });
  const [workflows, setWorkflows] = useState(() => {
    const saved = localStorage.getItem(workflowsKey);
    return saved ? JSON.parse(saved) : initialWorkflows;
  });

  // Feature Flags state
  const [featureFlags, setFeatureFlags] = useState(() => {
    const saved = localStorage.getItem(flagsKey);
    return saved ? JSON.parse(saved) : {
      aiEnabled: true,
      learningMode: true,
      workflowEngine: true,
      whatsApp: false,
      openAi: false,
      payroll: false,
    };
  });

  // System Settings state
  const [systemSettings, setSystemSettings] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved) : {
      defaultCountry: "USA",
      defaultCurrency: "USD",
      timezone: "EST (UTC-5)",
      dateFormat: "MM/DD/YYYY",
      approvalLevels: 3,
      idFormat: "PF-00001"
    };
  });

  // Helper States for modals & visual selections
  const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(rules[0] || null);
  const [aiRuleInput, setAiRuleInput] = useState("");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState({ name: "", object: "Employee", event: "On Hire", description: "", conditionField: "Country", conditionOperator: "=", conditionValue: "", actionField: "Probation End", actionValue: "" });
  
  const [selectedMDF, setSelectedMDF] = useState<MDFObject | null>(mdfObjects[0] || null);
  const [mdfModalOpen, setMdfModalOpen] = useState(false);
  const [newMdfData, setNewMdfData] = useState({ name: "", label: "", fields: [{ name: "code", type: "String", required: true }] });
  
  const [selectedPicklist, setSelectedPicklist] = useState<Picklist | null>(picklists[0] || null);
  const [newPicklistVal, setNewPicklistVal] = useState("");
  
  const [newWfName, setNewWfName] = useState("");
  const [newWfSteps, setNewWfSteps] = useState<string[]>(["Manager"]);

  // RBP Module States
  const [permissionRoles, setPermissionRoles] = useState<PermissionRole[]>(() => {
    const saved = localStorage.getItem(rolesKey);
    return saved ? JSON.parse(saved) : initialPermissionRoles;
  });
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(() => {
    const saved = localStorage.getItem(groupsKey);
    return saved ? JSON.parse(saved) : initialPermissionGroups;
  });
  const [permissionAssignments, setPermissionAssignments] = useState<PermissionAssignment[]>(() => {
    const saved = localStorage.getItem(assignmentsKey);
    return saved ? JSON.parse(saved) : initialPermissionAssignments;
  });
  
  const [rbpSubTab, setRbpSubTab] = useState<"dashboard" | "roles" | "groups" | "assignments" | "simulator" | "audit">("dashboard");
  const [employees, setEmployees] = useState<any[]>([]);

  // RBP Modals & Forms
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newAssignRole, setNewAssignRole] = useState(permissionRoles[0]?.id || "role-admin");
  const [newAssignType, setNewAssignType] = useState<"user" | "group">("user");
  const [newAssignId, setNewAssignId] = useState("");
  const [newAssignTargetGroup, setNewAssignTargetGroup] = useState(permissionGroups[0]?.id || "group-all");

  const [selectedRoleId, setSelectedRoleId] = useState(permissionRoles[0]?.id || "role-admin");
  const [selectedGroupId, setSelectedGroupId] = useState(permissionGroups[0]?.id || "group-spain");

  // Simulator
  const [simulatorUser, setSimulatorUser] = useState("PF-00004"); // Default Elena Russo
  const [simulatorTarget, setSimulatorTarget] = useState("PF-00003"); // Default David Miller
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Sync RBP States to Local Storage
  useEffect(() => {
    localStorage.setItem(rolesKey, JSON.stringify(permissionRoles));
  }, [permissionRoles, rolesKey]);
  useEffect(() => {
    localStorage.setItem(groupsKey, JSON.stringify(permissionGroups));
  }, [permissionGroups, groupsKey]);
  useEffect(() => {
    localStorage.setItem(assignmentsKey, JSON.stringify(permissionAssignments));
  }, [permissionAssignments, assignmentsKey]);

  // Load live employees on mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.get("/employees");
        if (res.data && res.data.length > 0) {
          setEmployees(res.data);
        } else {
          setEmployees(fallbackEmployees);
        }
      } catch (err) {
        setEmployees(fallbackEmployees);
      }
    };
    loadEmployees();
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(rulesKey, JSON.stringify(rules));
  }, [rules, rulesKey]);
  useEffect(() => {
    localStorage.setItem(mdfKey, JSON.stringify(mdfObjects));
  }, [mdfObjects, mdfKey]);
  useEffect(() => {
    localStorage.setItem(picklistsKey, JSON.stringify(picklists));
  }, [picklists, picklistsKey]);
  useEffect(() => {
    localStorage.setItem(auditKey, JSON.stringify(auditLogs));
  }, [auditLogs, auditKey]);
  useEffect(() => {
    localStorage.setItem(workflowsKey, JSON.stringify(workflows));
  }, [workflows, workflowsKey]);
  useEffect(() => {
    localStorage.setItem(flagsKey, JSON.stringify(featureFlags));
  }, [featureFlags, flagsKey]);
  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(systemSettings));
  }, [systemSettings, settingsKey]);

  // Log an event to Audit Center helper
  const logAuditEvent = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: "Sarah Connor (HR Admin)",
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };


  // 1. Rule Handler - Create manually
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleData.name) return;
    const rule: BusinessRule = {
      id: `rule-${Date.now()}`,
      name: newRuleData.name,
      object: newRuleData.object,
      event: newRuleData.event,
      status: "Active",
      description: newRuleData.description || `Rule trigger for ${newRuleData.name}`,
      conditions: { field: newRuleData.conditionField, operator: newRuleData.conditionOperator, value: newRuleData.conditionValue },
      actions: { field: newRuleData.actionField, value: newRuleData.actionValue }
    };
    setRules(prev => [...prev, rule]);
    setSelectedRule(rule);
    logAuditEvent("Created Business Rule", `Manually configured rule ${newRuleData.name}.`);
    setRuleModalOpen(false);
    setNewRuleData({ name: "", object: "Employee", event: "On Hire", description: "", conditionField: "Country", conditionOperator: "=", conditionValue: "", actionField: "Probation End", actionValue: "" });
  };

  // 1. Rule Handler - AI Generation Parser
  const handleAiRuleGeneration = () => {
    if (!aiRuleInput.trim()) return;

    // Simple mockup NLP matching key patterns
    // e.g. "Employees in Germany receive 30 vacation days"
    const text = aiRuleInput.toLowerCase();
    let country = "Germany";
    let field = "Vacation Balance";
    let value = "30 Days";
    let parsedSuccessfully = false;

    // Detect Country
    const countries = ["spain", "germany", "usa", "canada", "japan", "uk", "france", "singapore", "australia", "brazil"];
    const foundCountry = countries.find(c => text.includes(c));
    if (foundCountry) {
      country = foundCountry.charAt(0).toUpperCase() + foundCountry.slice(1);
    }

    // Detect target parameter & values
    if (text.includes("vacation") || text.includes("holiday") || text.includes("leave")) {
      field = "Vacation Balance";
      const match = text.match(/(\d+)\s*days/);
      value = match ? `${match[1]} Days` : "25 Days";
      parsedSuccessfully = true;
    } else if (text.includes("probation")) {
      field = "Probation End";
      const match = text.match(/(\d+)\s*(days|months)/);
      value = match ? match[0] : "90 Days";
      parsedSuccessfully = true;
    } else if (text.includes("pension") || text.includes("retirement")) {
      field = "Pension Scheme";
      value = "Eligible / Enrolled";
      parsedSuccessfully = true;
    } else if (text.includes("salary") || text.includes("pay")) {
      field = "Compensation Grade";
      value = "Level Sync Triggered";
      parsedSuccessfully = true;
    }

    const ruleName = `AI_${country}_${field.replace(" ", "")}`;
    const desc = `AI Generated: Automatically parsed rule for ${country}. Prompt: "${aiRuleInput}"`;

    const generatedRule: BusinessRule = {
      id: `rule-${Date.now()}`,
      name: ruleName,
      object: "Employee",
      event: "On Hire / Change",
      status: "Active",
      description: desc,
      conditions: { field: "Country", operator: "=", value: country },
      actions: { field: field, value: value }
    };

    setRules(prev => [...prev, generatedRule]);
    setSelectedRule(generatedRule);
    logAuditEvent("AI Business Rule Generated", `Auto-configured rule ${ruleName} via NLP generator.`);
    setAiRuleInput("");
    if (parsedSuccessfully) {
      console.log("SuccessFactors AI Engine parsed input successfully.");
    }
    alert(`SuccessFactors AI Parser triggered!\n\nCreated rule: ${ruleName}\nIF Country = ${country}\nTHEN SET ${field} = ${value}`);
  };

  // 2. MDF Handler - Custom Object creation
  const handleCreateMDF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMdfData.name) return;
    const newObj: MDFObject = {
      name: newMdfData.name.replace(/\s+/g, ""),
      label: newMdfData.label || `${newMdfData.name} (Custom Object)`,
      status: "Custom",
      fields: [
        { name: "externalCode", type: "String", required: true },
        { name: "externalName", type: "String", required: true },
        ...newMdfData.fields
      ],
      isCustom: true
    };
    setMdfObjects(prev => [...prev, newObj]);
    setSelectedMDF(newObj);
    logAuditEvent("Created Custom MDF Object", `Registered new schema object: ${newMdfData.name}`);
    setMdfModalOpen(false);
    setNewMdfData({ name: "", label: "", fields: [{ name: "code", type: "String", required: true }] });
  };

  // 3. Picklist Handler - Append Option Value
  const handleAddPicklistVal = () => {
    if (!selectedPicklist || !newPicklistVal.trim()) return;
    const updated = picklists.map(p => {
      if (p.id === selectedPicklist.id) {
        return { ...p, values: [...p.values, newPicklistVal.trim()] };
      }
      return p;
    });
    setPicklists(updated);
    const updatedPicklist = updated.find(p => p.id === selectedPicklist.id);
    if (updatedPicklist) setSelectedPicklist(updatedPicklist);
    logAuditEvent("Modified Picklist", `Added option '${newPicklistVal.trim()}' to ${selectedPicklist.name}.`);
    setNewPicklistVal("");
  };

  const handleDeletePicklistVal = (valToRemove: string) => {
    if (!selectedPicklist) return;
    const updated = picklists.map(p => {
      if (p.id === selectedPicklist.id) {
        return { ...p, values: p.values.filter(v => v !== valToRemove) };
      }
      return p;
    });
    setPicklists(updated);
    const updatedPicklist = updated.find(p => p.id === selectedPicklist.id);
    if (updatedPicklist) setSelectedPicklist(updatedPicklist);
    logAuditEvent("Modified Picklist", `Removed option '${valToRemove}' from ${selectedPicklist.name}.`);
  };

  // 4. Feature Flag trigger handler
  const handleFlagToggle = (key: string) => {
    const updated = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(updated);
    
    // Trigger side effect for learningMode / header state in localStorage
    if (key === "learningMode") {
      localStorage.setItem("pf_learning_mode", String(updated.learningMode));
    }
    
    logAuditEvent("Updated Feature Flags", `Set flag ${key} to ${updated[key] ? "ON" : "OFF"}.`);
  };

  // 5. System settings submit handler
  const handleSystemSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logAuditEvent("Modified System Settings", "Saved general system currency, formatting, and timezone variables.");
    alert("System Settings saved successfully!");
  };

  // 6. Workflow configurations additions
  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;
    const newWf = {
      id: `wf-${Date.now()}`,
      name: newWfName.trim(),
      steps: newWfSteps
    };
    setWorkflows((prev: any[]) => [...prev, newWf]);
    logAuditEvent("Created Workflow Configuration", `Set up steps approval logic for: ${newWfName}`);
    setNewWfName("");
    setNewWfSteps(["Manager"]);
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
      
      {/* Main Tab Panel Container */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/30">

        {/* ---------------------------------------------------- */}
        {/* TABS 1: BUSINESS RULES */}
        {/* ---------------------------------------------------- */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            
            {/* AI Rule Generator Card */}
            <div className="bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-primary-500/10 border border-purple-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">SuccessFactors AI Copilot Rule Drafter</h3>
                  <p className="text-[11px] text-slate-500">Draft rules using natural language phrases.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='e.g., "Employees in Germany receive 30 vacation days" or "Probation is 90 days in Spain"'
                  value={aiRuleInput}
                  onChange={(e) => setAiRuleInput(e.target.value)}
                  className="flex-1 p-2 border border-slate-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
                <button
                  onClick={handleAiRuleGeneration}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Generate Rule
                </button>
              </div>
            </div>

            {/* Main Header & Rule View */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Rules List Panel */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800">Business Rules Library</h4>
                  <button
                    onClick={() => setRuleModalOpen(true)}
                    className="flex items-center gap-1 py-1.5 px-2.5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Rule</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {rules.map(rule => (
                    <button
                      key={rule.id}
                      onClick={() => setSelectedRule(rule)}
                      className={`w-full p-3.5 text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                        selectedRule?.id === rule.id ? "bg-slate-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="font-semibold text-slate-800 block truncate">{rule.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">Base Object: {rule.object} • Trigger: {rule.event}</span>
                      </div>
                      <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                        {rule.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules Logic Flowchart Preview */}
              <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between max-h-[500px] overflow-y-auto">
                {selectedRule ? (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="pb-3 border-b border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-primary-600 block">Rule Configurator</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedRule.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{selectedRule.description}</p>
                      </div>
                      
                      {/* Flow diagram layout */}
                      <div className="py-4 space-y-4 relative">
                        {/* IF block */}
                        <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-3 text-xs">
                          <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px] block mb-1">IF condition</span>
                          <p className="font-semibold text-slate-700">
                            {selectedRule.conditions.field} {selectedRule.conditions.operator} <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 border border-indigo-100 rounded">{selectedRule.conditions.value}</span>
                          </p>
                        </div>

                        {/* Arrow connector */}
                        <div className="flex justify-center">
                          <span className="text-slate-300 font-bold">➔</span>
                        </div>

                        {/* THEN block */}
                        <div className="border border-green-200 bg-green-50/40 rounded-lg p-3 text-xs">
                          <span className="font-bold text-green-700 uppercase tracking-wider text-[10px] block mb-1">THEN action</span>
                          <p className="font-semibold text-slate-700">
                            SET {selectedRule.actions.field} = <span className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 border border-green-100 rounded">{selectedRule.actions.value}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          setRules(prev => prev.filter(r => r.id !== selectedRule.id));
                          logAuditEvent("Deleted Business Rule", `Removed rule: ${selectedRule.name}`);
                          setSelectedRule(null);
                        }}
                        className="flex items-center gap-1 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Rule</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <span>Select a rule to view detail workflow branches.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 2: MDF CUSTOM OBJECTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "mdf" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* MDF Object Schema List */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Metadata Framework (MDF) Schema</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Manage data schemas and custom data definitions</p>
                  </div>
                  <button
                    onClick={() => setMdfModalOpen(true)}
                    className="flex items-center gap-1 py-1.5 px-2.5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Object</span>
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {mdfObjects.map(obj => (
                    <button
                      key={obj.name}
                      onClick={() => setSelectedMDF(obj)}
                      className={`w-full p-4 text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                        selectedMDF?.name === obj.name ? "bg-slate-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 text-sm block">{obj.label}</span>
                        <span className="text-[10px] text-slate-400 block">Object Name: {obj.name}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        obj.isCustom 
                          ? "bg-purple-50 text-purple-700 border-purple-200" 
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {obj.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MDF Schema Preview */}
              <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-h-[500px] overflow-y-auto">
                {selectedMDF ? (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-100 flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">MDF Fields Config</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedMDF.label}</h4>
                      </div>
                      {selectedMDF.isCustom && (
                        <button
                          onClick={() => {
                            setMdfObjects(prev => prev.filter(m => m.name !== selectedMDF.name));
                            logAuditEvent("Deleted Custom MDF Schema", `Purged schema of custom object ${selectedMDF.name}`);
                            setSelectedMDF(null);
                          }}
                          className="text-rose-600 hover:text-rose-800"
                          title="Delete Custom MDF Object"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-400">These attributes represent the metadata structure of the object.</p>
                      
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                              <th className="py-2 px-3">Field Name</th>
                              <th className="py-2 px-3">Data Type</th>
                              <th className="py-2 px-3 text-right">Req?</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {selectedMDF.fields.map(f => (
                              <tr key={f.name}>
                                <td className="py-2 px-3 font-semibold text-slate-600">{f.name}</td>
                                <td className="py-2 px-3 font-medium text-slate-400">{f.type}</td>
                                <td className="py-2 px-3 text-right font-medium">{f.required ? "✓ Yes" : "No"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    <span>Select an MDF object to check field configuration.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 3: PICKLISTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "picklists" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Picklists selector */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-800">SuccessFactors Picklist Center</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Control drop-down variables company-wide</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {picklists.map(pick => (
                    <button
                      key={pick.id}
                      onClick={() => setSelectedPicklist(pick)}
                      className={`w-full p-4 text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                        selectedPicklist?.id === pick.id ? "bg-slate-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-800 text-sm block">{pick.name}</span>
                        <span className="text-[10px] text-slate-400 block">System ID: {pick.id}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        {pick.values.length} Options
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Picklists Value Config */}
              <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-h-[500px] flex flex-col justify-between">
                {selectedPicklist ? (
                  <div className="space-y-4 flex flex-col h-full justify-between">
                    <div>
                      <div className="pb-3 border-b border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Picklist Option Setup</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{selectedPicklist.name}</h4>
                      </div>
                      
                      {/* Option items list */}
                      <div className="py-3 max-h-[280px] overflow-y-auto space-y-2">
                        {selectedPicklist.values.map(val => (
                          <div key={val} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 p-2 rounded-lg border border-slate-100 transition-colors">
                            <span className="text-xs font-semibold text-slate-700">{val}</span>
                            <button
                              onClick={() => handleDeletePicklistVal(val)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add new option input */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="New option label..."
                          value={newPicklistVal}
                          onChange={(e) => setNewPicklistVal(e.target.value)}
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                        />
                        <button
                          onClick={handleAddPicklistVal}
                          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    <span>Select a picklist to manage option details.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 4: ROLE-BASED PERMISSIONS (RBP) */}
        {/* ---------------------------------------------------- */}
        {activeTab === "rbp" && (
          <div className="space-y-6">
            
            {/* RBP Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  <span>Role-Based Permissions (RBP) Console</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Define functional capability roles, employee target scopes, and audit assignments</p>
              </div>

              {/* RBP Sub-navigation */}
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100 text-[11px] font-bold">
                {[
                  { id: "dashboard", label: "Overview", icon: Activity },
                  { id: "roles", label: "Permission Roles", icon: Lock },
                  { id: "groups", label: "Permission Groups", icon: Users },
                  { id: "assignments", label: "Assignments Map", icon: ArrowRight },
                  { id: "simulator", label: "Simulator Debug", icon: Sparkles }
                ].map(sub => {
                  const SubIcon = sub.icon;
                  const active = rbpSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setRbpSubTab(sub.id as any);
                        setSimulationResults(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                        active 
                          ? "bg-white text-primary-700 shadow-sm border border-slate-200/50" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* VIEW 1: OVERVIEW DASHBOARD */}
            {/* ---------------------------------------------------- */}
            {rbpSubTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* RBP Summary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Permission Roles", count: permissionRoles.length, color: "text-blue-600 bg-blue-50 border-blue-100", icon: Lock },
                    { label: "Target Groups", count: permissionGroups.length, color: "text-purple-600 bg-purple-50 border-purple-100", icon: Users },
                    { label: "Active Assignments", count: permissionAssignments.length, color: "text-amber-600 bg-amber-50 border-amber-100", icon: ArrowRight },
                    { label: "Tracked RBP Audits", count: auditLogs.filter(l => l.action.includes("Permission") || l.action.includes("Role") || l.action.includes("Group")).length, color: "text-rose-600 bg-rose-50 border-rose-100", icon: Clock }
                  ].map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
                          <h4 className="text-xl font-bold text-slate-800">{card.count}</h4>
                        </div>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${card.color}`}>
                          <CardIcon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashboard grid panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: Quick Actions */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Quick Actions Console</h4>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setRoleModalOpen(true)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                      >
                        <span>Create Permission Role</span>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setGroupModalOpen(true)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                      >
                        <span>Create Target Group</span>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setAssignModalOpen(true)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                      >
                        <span>New Role Assignment</span>
                        <Plus className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setRbpSubTab("simulator")}
                        className="w-full flex items-center justify-between p-2.5 bg-primary-50 hover:bg-primary-100 border border-primary-100 rounded-lg text-xs font-semibold text-primary-700 cursor-pointer transition-colors"
                      >
                        <span>Open Simulator Debugger</span>
                        <Sparkles className="w-4 h-4 text-primary-500" />
                      </button>
                    </div>
                  </div>

                  {/* Center: Recently Modified Roles */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Configured Access Roles</h4>
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {permissionRoles.map(role => (
                        <div key={role.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-bold text-slate-800 block">{role.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate max-w-[180px]">{role.description}</span>
                          </div>
                          <span className="text-[9px] bg-slate-100 text-slate-600 border px-2 py-0.5 rounded-full font-bold">
                            {role.permissions.length} Perms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: RBP Logs feed snippet */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">RBP Audit Activity Stream</h4>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {auditLogs.filter(l => l.action.includes("Permission") || l.action.includes("Role") || l.action.includes("Group")).map(log => (
                        <div key={log.id} className="text-[10px] space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-600">
                            <span>{log.action}</span>
                            <span className="text-slate-400 font-medium">{log.date.substring(11, 16)}</span>
                          </div>
                          <p className="text-slate-400 italic leading-tight">{log.details}</p>
                        </div>
                      ))}
                      {auditLogs.filter(l => l.action.includes("Permission") || l.action.includes("Role") || l.action.includes("Group")).length === 0 && (
                        <p className="text-slate-400 text-xs text-center pt-8">No RBP audit logs tracked yet.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 2: MANAGE PERMISSION ROLES */}
            {/* ---------------------------------------------------- */}
            {rbpSubTab === "roles" && (
              <div className="flex border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden min-h-[480px]">
                
                {/* Left Role List Sidebar */}
                <aside className="w-56 bg-slate-50/50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto shrink-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">Access Roles</span>
                    {permissionRoles.map(role => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex justify-between items-center ${
                          selectedRoleId === role.id 
                            ? "bg-primary-50 text-primary-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-800"
                        }`}
                      >
                        <span className="truncate max-w-[150px]">{role.name}</span>
                        {selectedRoleId === role.id && <Lock className="w-3.5 h-3.5 shrink-0 text-primary-600" />}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setRoleModalOpen(true)}
                    className="w-full mt-4 flex items-center justify-center gap-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Role</span>
                  </button>
                </aside>

                {/* Right Role Edit Panel */}
                {(() => {
                  const role = permissionRoles.find(r => r.id === selectedRoleId);
                  if (!role) return <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Role not found</div>;

                  // Define permission categories
                  const permissionOptions = [
                    {
                      category: "Employee Central (EC)",
                      perms: [
                        { key: "view_employees", label: "View Employees Core Details", desc: "Allows searching and viewing directory profiles." },
                        { key: "edit_employees", label: "Edit Employees Master Fields", desc: "Permits updating Job Information and profile tags." },
                        { key: "hire_employees", label: "Hire / Add New Hires", desc: "Authorizes the Add New Employee wizard." },
                        { key: "terminate_employees", label: "Terminate / Offboard Employees", desc: "Access to offboard staff and release status." },
                        { key: "view_salary", label: "View Compensation Data", desc: "Restricted capability to view base salary metrics." },
                        { key: "edit_salary", label: "Edit Salary Details", desc: "Authorize changes to salary values and adjustments." },
                        { key: "view_personal_info", label: "View Personal Contact Details", desc: "Allows viewing email, phone, and home address fields." },
                        { key: "edit_personal_info", label: "Edit Personal Details", desc: "Allows profile modifications on personal contact sheets." }
                      ]
                    },
                    {
                      category: "Organization & Position Management",
                      perms: [
                        { key: "manage_companies", label: "Manage Holding Companies Structures", desc: "Access to CRUD holdings schemas." },
                        { key: "manage_departments", label: "Manage Department Nodes", desc: "Enables structural updates to functional units." },
                        { key: "create_positions", label: "Create Positions", desc: "Create new vacant roles in position hierarchy." },
                        { key: "edit_positions", label: "Edit Positions", desc: "Modify codes, requirements, and job lines." },
                        { key: "delete_positions", label: "Delete / Retract Positions", desc: "Archive position entries." },
                        { key: "assign_incumbents", label: "Assign Incumbents", desc: "Authorize filling vacancies with active employees." }
                      ]
                    },
                    {
                      category: "System Administration & Settings",
                      perms: [
                        { key: "business_rules", label: "Manage Business Rules Engines", desc: "Full permissions to edit, add, or delete country rules." },
                        { key: "mdf_objects", label: "Manage MDF Objects Definitions", desc: "Allows defining custom objects schemas." },
                        { key: "picklists", label: "Edit Picklist Dropdowns", desc: "Allow changes to values lists." },
                        { key: "workflows", label: "Workflow Configuration", desc: "Allows editing authorization steps sequences." },
                        { key: "feature_flags", label: "Manage Feature Toggles", desc: "Access to toggle system modules like AI Assistant." },
                        { key: "system_settings", label: "Change Default System Settings", desc: "Edit locale formats, timezones, and number patterns." }
                      ]
                    },
                    {
                      category: "Analytics & Report Center",
                      perms: [
                        { key: "view_reports", label: "View Compiled Report Center Canvas", desc: "Gives access to run and browse corporate reports." },
                        { key: "create_reports", label: "Build Custom Reports", desc: "Permits custom columns selection and filters." },
                        { key: "export_reports", label: "Export Raw Data to CSV / Excel", desc: "Authorize download capabilities." }
                      ]
                    }
                  ];

                  const handleTogglePermission = (permKey: string) => {
                    const updatedPerms = role.permissions.includes(permKey)
                      ? role.permissions.filter(p => p !== permKey)
                      : [...role.permissions, permKey];

                    setPermissionRoles(prev => prev.map(r => r.id === role.id ? { ...r, permissions: updatedPerms } : r));
                  };

                  const handleSaveRole = () => {
                    logAuditEvent("Modified Role-Based Permissions", `Updated capability checklist parameters for role: ${role.name}.`);
                    alert(`Access permissions for role "${role.name}" updated successfully!`);
                  };

                  const handleDeleteRole = () => {
                    if (role.id === "role-admin") {
                      alert("Error: The standard HR Administrator role cannot be deleted.");
                      return;
                    }
                    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                      setPermissionRoles(prev => prev.filter(r => r.id !== role.id));
                      setSelectedRoleId("role-admin");
                      logAuditEvent("Deleted RBP Role", `Archived permission role object: ${role.name}`);
                    }
                  };

                  return (
                    <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-6">
                        
                        {/* Role Header */}
                        <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <span>Role Profile: {role.name}</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{role.description}</p>
                          </div>
                          
                          <button
                            onClick={handleDeleteRole}
                            disabled={role.id === "role-admin"}
                            className="py-1 px-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Delete Role
                          </button>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-6">
                          {permissionOptions.map(cat => (
                            <div key={cat.category} className="space-y-3">
                              <h5 className="text-[10px] font-bold text-primary-700 uppercase tracking-wider bg-primary-50/50 px-2.5 py-1 rounded border border-primary-100/30">{cat.category}</h5>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {cat.perms.map(p => {
                                  const checked = role.permissions.includes(p.key);
                                  return (
                                    <label key={p.key} className="flex gap-2.5 p-2 border border-slate-100 rounded-lg bg-slate-50/20 hover:bg-slate-50/50 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleTogglePermission(p.key)}
                                        className="w-4 h-4 accent-primary-600 cursor-pointer mt-0.5"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-700 block">{p.label}</span>
                                        <span className="text-[9px] text-slate-400 font-medium leading-relaxed block mt-0.5">{p.desc}</span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Save panel footer */}
                      <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
                        <button
                          onClick={handleSaveRole}
                          className="py-1.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
                        >
                          Save Role Configuration
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 3: MANAGE PERMISSION GROUPS */}
            {/* ---------------------------------------------------- */}
            {rbpSubTab === "groups" && (
              <div className="flex border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden min-h-[480px]">
                
                {/* Left Groups List Sidebar */}
                <aside className="w-56 bg-slate-50/50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto shrink-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">Permission Groups</span>
                    {permissionGroups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex justify-between items-center ${
                          selectedGroupId === group.id 
                            ? "bg-primary-50 text-primary-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-800"
                        }`}
                      >
                        <span className="truncate max-w-[150px]">{group.name}</span>
                        {selectedGroupId === group.id && <Users className="w-3.5 h-3.5 shrink-0 text-primary-600" />}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setGroupModalOpen(true)}
                    className="w-full mt-4 flex items-center justify-center gap-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Group</span>
                  </button>
                </aside>

                {/* Right Group Edit Panel */}
                {(() => {
                  const group = permissionGroups.find(g => g.id === selectedGroupId);
                  if (!group) return <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Group not found</div>;

                  // Evaluate matched employees based on filters
                  const matchesFilters = (emp: any) => {
                    if (group.filters.length === 0) return true;
                    return group.filters.every(filter => {
                      let fieldVal = "";
                      if (filter.field === "location") fieldVal = emp.jobInfo?.location || "";
                      else if (filter.field === "department") fieldVal = emp.jobInfo?.department || "";
                      else if (filter.field === "status") fieldVal = emp.status || "";
                      else if (filter.field === "jobTitle") fieldVal = emp.jobInfo?.jobTitle || "";
                      else if (filter.field === "salary") fieldVal = String(emp.jobInfo?.salary || 0);

                      const val = filter.value.toLowerCase();
                      fieldVal = fieldVal.toLowerCase();

                      if (filter.operator === "=") return fieldVal === val;
                      if (filter.operator === "!=") return fieldVal !== val;
                      if (filter.operator === "contains") return fieldVal.includes(val);
                      return true;
                    });
                  };

                  const matchedMembers = employees.filter(matchesFilters);

                  const handleAddGroupFilter = () => {
                    const updated = [...group.filters, { field: "location", operator: "contains", value: "" }];
                    setPermissionGroups(prev => prev.map(g => g.id === group.id ? { ...g, filters: updated } : g));
                  };

                  const handleUpdateGroupFilter = (fIdx: number, key: string, val: string) => {
                    const updated = group.filters.map((f, i) => i === fIdx ? { ...f, [key]: val } : f);
                    setPermissionGroups(prev => prev.map(g => g.id === group.id ? { ...g, filters: updated } : g));
                  };

                  const handleRemoveGroupFilter = (fIdx: number) => {
                    const updated = group.filters.filter((_, i) => i !== fIdx);
                    setPermissionGroups(prev => prev.map(g => g.id === group.id ? { ...g, filters: updated } : g));
                  };

                  const handleDeleteGroup = () => {
                    if (group.id === "group-all") {
                      alert("Error: The standard All Employees group cannot be deleted.");
                      return;
                    }
                    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                      setPermissionGroups(prev => prev.filter(g => g.id !== group.id));
                      setSelectedGroupId("group-all");
                      logAuditEvent("Deleted RBP Group", `Archived permission group object: ${group.name}`);
                    }
                  };

                  return (
                    <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-6">
                        
                        {/* Group Header */}
                        <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <span>Permission Group: {group.name}</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                          </div>
                          
                          <button
                            onClick={handleDeleteGroup}
                            disabled={group.id === "group-all"}
                            className="py-1 px-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Delete Group
                          </button>
                        </div>

                        {/* Filter criteria list */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Filter Rules</h5>
                            <button
                              onClick={handleAddGroupFilter}
                              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Rule Row</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {group.filters.map((filter, idx) => (
                              <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-xs font-semibold">
                                <div className="flex-1 min-w-[120px]">
                                  <select
                                    value={filter.field}
                                    onChange={(e) => handleUpdateGroupFilter(idx, "field", e.target.value)}
                                    className="w-full p-1 border border-slate-200 rounded bg-white text-slate-800 outline-none"
                                  >
                                    <option value="location">Location</option>
                                    <option value="department">Department</option>
                                    <option value="status">Status</option>
                                    <option value="jobTitle">Job Title</option>
                                    <option value="salary">Salary</option>
                                  </select>
                                </div>
                                <div className="w-24">
                                  <select
                                    value={filter.operator}
                                    onChange={(e) => handleUpdateGroupFilter(idx, "operator", e.target.value)}
                                    className="w-full p-1 border border-slate-200 rounded bg-white text-slate-800 outline-none"
                                  >
                                    <option value="=">=</option>
                                    <option value="!=">!=</option>
                                    <option value="contains">contains</option>
                                  </select>
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                  <input
                                    type="text"
                                    placeholder="e.g. Madrid"
                                    value={filter.value}
                                    onChange={(e) => handleUpdateGroupFilter(idx, "value", e.target.value)}
                                    className="w-full p-1 border border-slate-200 rounded bg-white text-slate-800 outline-none"
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveGroupFilter(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {group.filters.length === 0 && (
                              <div className="py-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                                <span>No active rules. This group currently matches all employees.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dynamic member count preview */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-500 uppercase tracking-wide">Live Roster Members Previews</span>
                            <span className="text-primary-700 font-mono bg-primary-50 px-2 py-0.5 rounded border border-primary-100">{matchedMembers.length} Members</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] max-h-[120px] overflow-y-auto pr-1">
                            {matchedMembers.map(m => (
                              <div key={m.employeeNumber} className="bg-white border border-slate-100 p-2 rounded-lg text-slate-600">
                                <span className="font-bold text-slate-800 block truncate">{m.personalInfo?.firstName} {m.personalInfo?.lastName}</span>
                                <span className="text-slate-400 block truncate mt-0.5">{m.jobInfo?.jobTitle} • {m.jobInfo?.location}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Footer actions */}
                      <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end">
                        <button
                          onClick={() => {
                            logAuditEvent("Modified RBP Group", `Updated filters conditions rules for group: ${group.name}.`);
                            alert(`Filter parameters for group "${group.name}" updated successfully!`);
                          }}
                          className="py-1.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors cursor-pointer"
                        >
                          Save Group Filters
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 4: ROLE ASSIGNMENTS MAP */}
            {/* ---------------------------------------------------- */}
            {rbpSubTab === "assignments" && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col space-y-4 p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">RBP Assignments & Populations</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Link roles to employees and restrict their access scope to target employee populations</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewAssignRole(permissionRoles[0]?.id || "role-admin");
                      setNewAssignTargetGroup(permissionGroups[0]?.id || "group-all");
                      setAssignModalOpen(true);
                    }}
                    className="flex items-center gap-1 py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Assignment</span>
                  </button>
                </div>

                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-4">Permission Role</th>
                        <th className="py-2.5 px-4">Assigned To</th>
                        <th className="py-2.5 px-4">Target Population Population Group</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                      {permissionAssignments.map(assign => {
                        const r = permissionRoles.find(role => role.id === assign.roleId);
                        const g = permissionGroups.find(group => group.id === assign.targetGroupId);
                        return (
                          <tr key={assign.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {r?.name || assign.roleId}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                                assign.assignedToType === "user" 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                  : "bg-blue-50 border-blue-200 text-blue-700"
                              }`}>
                                {assign.assignedToType === "user" ? "User: " : "Group: "}{assign.assignedToId}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-primary-700 font-bold">
                              {g?.name || assign.targetGroupId}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Remove this permission assignment rule?`)) {
                                    setPermissionAssignments(prev => prev.filter(a => a.id !== assign.id));
                                    logAuditEvent("Removed RBP Assignment", `Deleted link mapping for role ${r?.name || assign.roleId} assigned to ${assign.assignedToId}`);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 font-bold text-xs"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 5: PERMISSION SIMULATOR DEBUG */}
            {/* ---------------------------------------------------- */}
            {rbpSubTab === "simulator" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Simulator Inputs Side Panel */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 h-fit">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                    <span>Run Authorization Audit</span>
                  </h4>

                  <div className="space-y-4 text-xs font-semibold text-slate-600">
                    <div>
                      <label className="block mb-1.5 font-bold text-slate-400 uppercase">1. Evaluate Assigned User</label>
                      <select
                        value={simulatorUser}
                        onChange={(e) => {
                          setSimulatorUser(e.target.value);
                          setSimulationResults(null);
                        }}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none font-bold"
                      >
                        {employees.map(emp => (
                          <option key={emp.employeeNumber} value={emp.employeeNumber}>
                            {emp.personalInfo?.firstName} {emp.personalInfo?.lastName} ({emp.jobInfo?.jobTitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5 font-bold text-slate-400 uppercase">2. Viewing Target Employee</label>
                      <select
                        value={simulatorTarget}
                        onChange={(e) => {
                          setSimulatorTarget(e.target.value);
                          setSimulationResults(null);
                        }}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none font-bold"
                      >
                        {employees.map(emp => (
                          <option key={emp.employeeNumber} value={emp.employeeNumber}>
                            {emp.personalInfo?.firstName} {emp.personalInfo?.lastName} (Location: {emp.jobInfo?.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        // Calculate simulation
                        // We will define this inline helper here
                        const runSimulator = (simUserNo: string, simTargetNo: string) => {
                          const userEmp = employees.find(e => e.employeeNumber === simUserNo);
                          const targetEmp = employees.find(e => e.employeeNumber === simTargetNo);

                          if (!userEmp || !targetEmp) return { trace: ["User or target employee not found."], permissions: {} };

                          const userName = `${userEmp.personalInfo?.firstName} ${userEmp.personalInfo?.lastName}`;
                          const targetName = `${targetEmp.personalInfo?.firstName} ${targetEmp.personalInfo?.lastName}`;

                          const trace: string[] = [];
                          trace.push(`Initializing Permission Simulator: Assignee [${userName}] viewing Target Employee [${targetName}].`);

                          // Find all assignments linked to the user
                          const matchedAssignments = permissionAssignments.filter(assign => {
                            if (assign.assignedToType === "user") {
                              return assign.assignedToId.toLowerCase() === userName.toLowerCase();
                            } else {
                              if (assign.assignedToId === "Engineering Managers") {
                                return userEmp.jobInfo?.jobTitle?.toLowerCase().includes("manager") && userEmp.jobInfo?.department?.toLowerCase().includes("engineering");
                              }
                              return false;
                            }
                          });

                          trace.push(`Found ${matchedAssignments.length} matching role assignment rule(s) for ${userName}.`);

                          const activePermissions = new Set<string>();

                          matchedAssignments.forEach(assign => {
                            const role = permissionRoles.find(r => r.id === assign.roleId);
                            const targetGroup = permissionGroups.find(g => g.id === assign.targetGroupId);

                            if (!role || !targetGroup) return;

                            trace.push(`Evaluating Assignment Rule: Role [${role.name}] linked to Target Population Group [${targetGroup.name}].`);

                            let matchesTarget = true;
                            targetGroup.filters.forEach((filter, fIdx) => {
                              let fieldVal = "";
                              if (filter.field === "location") fieldVal = targetEmp.jobInfo?.location || "";
                              else if (filter.field === "department") fieldVal = targetEmp.jobInfo?.department || "";
                              else if (filter.field === "status") fieldVal = targetEmp.status || "";
                              else if (filter.field === "jobTitle") fieldVal = targetEmp.jobInfo?.jobTitle || "";
                              else if (filter.field === "salary") fieldVal = String(targetEmp.jobInfo?.salary || 0);

                              const val = filter.value.toLowerCase();
                              fieldVal = fieldVal.toLowerCase();

                              let matchesFilter = false;
                              if (filter.operator === "=") matchesFilter = fieldVal === val;
                              else if (filter.operator === "!=") matchesFilter = fieldVal !== val;
                              else if (filter.operator === "contains") matchesFilter = fieldVal.includes(val);

                              trace.push(`  - Checking target filter ${fIdx + 1}: Employee ${filter.field} [${fieldVal}] ${filter.operator} [${val}]? ${matchesFilter ? "MATCH" : "MISMATCH"}`);
                              if (!matchesFilter) matchesTarget = false;
                            });

                            if (matchesTarget) {
                              trace.push(`  ➔ Access target population MATCHED. Granting ${role.permissions.length} capability tokens.`);
                              role.permissions.forEach(p => activePermissions.add(p));
                            } else {
                              trace.push(`  ➔ Target population MISMATCH. Role scope rules blocked.`);
                            }
                          });

                          trace.push(`Calculation completed. User has ${activePermissions.size} total active tokens on target employee.`);

                          return {
                            trace,
                            permissions: {
                              view_employees: activePermissions.has("view_employees"),
                              edit_employees: activePermissions.has("edit_employees"),
                              view_salary: activePermissions.has("view_salary"),
                              edit_salary: activePermissions.has("edit_salary"),
                              hire_employees: activePermissions.has("hire_employees"),
                              terminate_employees: activePermissions.has("terminate_employees"),
                              manage_systems: activePermissions.has("business_rules") || activePermissions.has("mdf_objects")
                            }
                          };
                        };

                        const res = runSimulator(simulatorUser, simulatorTarget);
                        setSimulationResults(res);
                      }}
                      className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                    >
                      Evaluate Security Context
                    </button>
                  </div>
                </div>

                {/* Simulator Results & Trace Panel */}
                <div className="lg:col-span-2 space-y-6">
                  {simulationResults ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      
                      {/* Access matrix grid */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Resulting Access Permissions</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { key: "view_employees", label: "View Profile Details", val: simulationResults.permissions.view_employees },
                            { key: "edit_employees", label: "Edit Job / Profile Data", val: simulationResults.permissions.edit_employees },
                            { key: "view_salary", label: "View Compensation Data", val: simulationResults.permissions.view_salary },
                            { key: "edit_salary", label: "Edit Salaries Levels", val: simulationResults.permissions.edit_salary },
                            { key: "hire_employees", label: "Hire New Employees", val: simulationResults.permissions.hire_employees },
                            { key: "terminate_employees", label: "Terminate Employee", val: simulationResults.permissions.terminate_employees },
                            { key: "manage_systems", label: "Manage System Rules & MDF", val: simulationResults.permissions.manage_systems }
                          ].map(perm => (
                            <div key={perm.key} className="flex items-center gap-2 p-2.5 border border-slate-100 rounded-lg bg-slate-50/20 text-xs font-semibold">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                perm.val ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                              }`}>
                                {perm.val ? "✓" : "✗"}
                              </span>
                              <span className={perm.val ? "text-slate-800" : "text-slate-400 line-through"}>{perm.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Trace Log panel console */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner space-y-3 font-mono text-[11px] text-green-400 max-h-[300px] overflow-y-auto">
                        <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            <span>PERMISSION EVALUATOR LOGS TRACE</span>
                          </span>
                          <span>Complete</span>
                        </div>
                        <div className="space-y-1">
                          {simulationResults.trace.map((tLine: string, tIdx: number) => (
                            <p key={tIdx} className={tLine.includes("MISMATCH") || tLine.includes("blocked") ? "text-rose-400" : tLine.includes("GRANTED") || tLine.includes("MATCHED") ? "text-green-300 font-bold" : "text-slate-300"}>
                              {tLine}
                            </p>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex items-center justify-center text-slate-400 text-xs h-64">
                      <span>Select users and target employees to run authorization logs audit trace.</span>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      {/* RBP MODAL: Create Role */}
      {roleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Create Permission Role</h3>
              <button onClick={() => setRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. Payroll Specialist"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Role Description</label>
                <textarea
                  placeholder="Describe access privileges..."
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setRoleModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newRoleName.trim()) return;
                    const r: PermissionRole = {
                      id: `role-${Date.now()}`,
                      name: newRoleName.trim(),
                      description: newRoleDesc.trim() || "Custom permission role.",
                      permissions: ["view_employees"] // Seed initial view employees permission
                    };
                    setPermissionRoles(prev => [...prev, r]);
                    logAuditEvent("Created Permission Role", `Initialized new role object: ${newRoleName}`);
                    setRoleModalOpen(false);
                    setNewRoleName("");
                    setNewRoleDesc("");
                  }}
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RBP MODAL: Create Group */}
      {groupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Create Target Group</h3>
              <button onClick={() => setGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nordic Employees"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">Group Description</label>
                <textarea
                  placeholder="Describe group population scope..."
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setGroupModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newGroupName.trim()) return;
                    const g: PermissionGroup = {
                      id: `group-${Date.now()}`,
                      name: newGroupName.trim(),
                      description: newGroupDesc.trim() || "Dynamic matching group.",
                      filters: [{ field: "location", operator: "contains", value: "" }]
                    };
                    setPermissionGroups(prev => [...prev, g]);
                    logAuditEvent("Created Permission Group", `Initialized new target group object: ${newGroupName}`);
                    setGroupModalOpen(false);
                    setNewGroupName("");
                    setNewGroupDesc("");
                  }}
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RBP MODAL: Assign Role */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">New Role Assignment Rule</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              
              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">1. Select Role to Grant</label>
                <select
                  value={newAssignRole}
                  onChange={(e) => setNewAssignRole(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  {permissionRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">2. Assignee Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignType"
                      checked={newAssignType === "user"}
                      onChange={() => setNewAssignType("user")}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span>Individual User</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignType"
                      checked={newAssignType === "group"}
                      onChange={() => setNewAssignType("group")}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <span>Permission Group</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">
                  {newAssignType === "user" ? "3. Assignee User Name" : "3. Assignee Group Name"}
                </label>
                {newAssignType === "user" ? (
                  <select
                    value={newAssignId}
                    onChange={(e) => setNewAssignId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="">-- Choose User --</option>
                    {employees.map(emp => {
                      const name = `${emp.personalInfo?.firstName} ${emp.personalInfo?.lastName}`;
                      return <option key={emp.employeeNumber} value={name}>{name}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering Managers"
                    value={newAssignId}
                    onChange={(e) => setNewAssignId(e.target.value)}
                    className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-400 uppercase">4. Target Population Scope Group</label>
                <select
                  value={newAssignTargetGroup}
                  onChange={(e) => setNewAssignTargetGroup(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  {permissionGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newAssignId) {
                      alert("Please select or input the assignee.");
                      return;
                    }
                    const a: PermissionAssignment = {
                      id: `assign-${Date.now()}`,
                      roleId: newAssignRole,
                      assignedToType: newAssignType,
                      assignedToId: newAssignId,
                      targetGroupId: newAssignTargetGroup
                    };
                    setPermissionAssignments(prev => [...prev, a]);
                    
                    const role = permissionRoles.find(r => r.id === newAssignRole);
                    logAuditEvent("Created RBP Assignment", `Assigned role ${role?.name || newAssignRole} to ${newAssignId}.`);
                    
                    setAssignModalOpen(false);
                    setNewAssignId("");
                  }}
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ---------------------------------------------------- */}
        {/* TABS 5: WORKFLOWS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "workflows" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Workflows Config list */}
              <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4 max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800">Workflow Approval Chains</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold border px-2 py-0.5 rounded-full">{workflows.length} Active</span>
                </div>
                
                <div className="space-y-3">
                  {workflows.map((wf: any) => (
                    <div key={wf.id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{wf.name}</span>
                        <button
                          onClick={() => {
                            setWorkflows((prev: any[]) => prev.filter((w: any) => w.id !== wf.id));
                            logAuditEvent("Deleted Workflow Configuration", `Removed approval sequence: ${wf.name}`);
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {/* Workflow nodes flowchart */}
                      <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded shadow-sm">Trigger Event</span>
                        {wf.steps.map((step: string, sIdx: number) => (
                          <React.Fragment key={sIdx}>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm flex items-center gap-1">
                              <span className="w-4 h-4 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[8px]">{sIdx + 1}</span>
                              {step}
                            </span>
                          </React.Fragment>
                        ))}
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded shadow-sm">Commit Transaction</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add workflow builder */}
              <div className="w-full lg:w-96 bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-h-[500px]">
                <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Configure New Workflow</h4>
                
                <form onSubmit={handleCreateWorkflow} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Workflow Process Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Compensation Revision"
                      value={newWfName}
                      onChange={(e) => setNewWfName(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Configured Approver Steps</label>
                    <div className="space-y-2">
                      {newWfSteps.map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-slate-400">Step {idx + 1}:</span>
                          <select
                            value={step}
                            onChange={(e) => {
                              const updated = [...newWfSteps];
                              updated[idx] = e.target.value;
                              setNewWfSteps(updated);
                            }}
                            className="flex-1 p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                          >
                            <option value="Manager">Line Manager</option>
                            <option value="HR Specialist">HR Specialist</option>
                            <option value="Director">Department Director</option>
                            <option value="CFO">CFO / Finance Director</option>
                          </select>
                          {newWfSteps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setNewWfSteps(prev => prev.filter((_, sIdx) => sIdx !== idx))}
                              className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setNewWfSteps(prev => [...prev, "HR Specialist"])}
                      className="mt-3 text-[11px] text-primary-600 hover:underline font-bold block"
                    >
                      + Add Step Approver
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Save Workflow
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 6: FEATURE FLAGS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "flags" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-6">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Feature Flags Configurations</h4>
              <p className="text-xs text-slate-400 mt-0.5">Toggle simulated application engines and integration endpoints for dashboard testing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "aiEnabled", label: "AI Enabled", desc: "Toggles the visibility of the bottom-right AI Copilot Chat panel." },
                { key: "learningMode", label: "Learning Sandbox Mode", desc: "Toggles SuccessFactors informational banners and tooltips." },
                { key: "workflowEngine", label: "Workflow Approval Gating", desc: "Enables workflow inbox steps for profile modifications." },
                { key: "whatsApp", label: "WhatsApp notifications", desc: "Simulate WhatsApp Business integrations on HR events." },
                { key: "openAi", label: "OpenAI GPT integration", desc: "Leverage AI modules for contract drafts and summarization." },
                { key: "payroll", label: "Simulated Payroll Core", desc: "Prepares pay stub calculations and local bank transmissions." }
              ].map(flag => (
                <div key={flag.key} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs block">{flag.label}</span>
                    <span className="text-[10px] text-slate-400 font-medium block leading-relaxed">{flag.desc}</span>
                  </div>
                  <button
                    onClick={() => handleFlagToggle(flag.key)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                      featureFlags[flag.key] ? "bg-primary-600" : "bg-slate-200"
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      featureFlags[flag.key] ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 7: AUDIT LOG FEED */}
        {/* ---------------------------------------------------- */}
        {activeTab === "audit" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-6 max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Admin Audit Feed</h4>
                <p className="text-xs text-slate-400 mt-0.5">Real-time log of administrative updates, picklist configurations, and RBP modifications</p>
              </div>
              <button
                onClick={() => {
                  setAuditLogs([]);
                  localStorage.removeItem("pf_audit_logs");
                }}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Audit History
              </button>
            </div>

            <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
              {auditLogs.map(log => (
                <div key={log.id} className="relative group text-xs">
                  {/* Left dot timeline */}
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors border-2 border-white" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                    <span className="block text-[10px] text-slate-400 font-medium">Triggered by: {log.user}</span>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <span>No audit logs recorded. Perform actions to seed logs!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TABS 8: SYSTEM SETTINGS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "system" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-6">
            <div>
              <h4 className="font-bold text-sm text-slate-800">General System Settings</h4>
              <p className="text-xs text-slate-400 mt-0.5">Control regional parameters, formatting properties, and employee generation constants</p>
            </div>

            <form onSubmit={handleSystemSettingsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Default Company Country</label>
                <select
                  value={systemSettings.defaultCountry}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, defaultCountry: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="USA">United States (USA)</option>
                  <option value="Germany">Germany (DEU)</option>
                  <option value="Spain">Spain (ESP)</option>
                  <option value="UK">United Kingdom (GBR)</option>
                  <option value="Singapore">Singapore (SGP)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Default Corporate Currency</label>
                <select
                  value={systemSettings.defaultCurrency}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, defaultCurrency: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="USD">US Dollar ($ - USD)</option>
                  <option value="EUR">Euro (€ - EUR)</option>
                  <option value="GBP">British Pound (£ - GBP)</option>
                  <option value="JPY">Japanese Yen (¥ - JPY)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Primary Server Timezone</label>
                <input
                  type="text"
                  value={systemSettings.timezone}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date Display Format</label>
                <select
                  value={systemSettings.dateFormat}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, dateFormat: e.target.value }))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (USA Standard)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Europe/APAC Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Required Workflow Steps Approval Levels</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={systemSettings.approvalLevels}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, approvalLevels: Number(e.target.value) }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Employee Number Format ID Pattern</label>
                <input
                  type="text"
                  value={systemSettings.idFormat}
                  onChange={(e) => setSystemSettings((prev: any) => ({ ...prev, idFormat: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Settings configurations
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* ==========================================
          MODAL DIALOGS CONFIG
         ========================================== */}

      {/* Create Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Configure Business Rule</h3>
              <button onClick={() => setRuleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1 font-bold text-slate-500 uppercase">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UK Auto-Enroll Pension"
                  value={newRuleData.name}
                  onChange={(e) => setNewRuleData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500 uppercase">Rule Description</label>
                <textarea
                  placeholder="Describe the logic application..."
                  value={newRuleData.description}
                  onChange={(e) => setNewRuleData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none h-16"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 font-bold text-slate-500 uppercase">IF field</label>
                  <select
                    value={newRuleData.conditionField}
                    onChange={(e) => setNewRuleData(prev => ({ ...prev, conditionField: e.target.value }))}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="Country">Country</option>
                    <option value="Location">Location</option>
                    <option value="Department">Department</option>
                    <option value="Age">Age</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-500 uppercase">Operator</label>
                  <select
                    value={newRuleData.conditionOperator}
                    onChange={(e) => setNewRuleData(prev => ({ ...prev, conditionOperator: e.target.value }))}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="=">=</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="!=">!=</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-500 uppercase">Value</label>
                  <input
                    type="text"
                    required
                    placeholder="Spain / 22"
                    value={newRuleData.conditionValue}
                    onChange={(e) => setNewRuleData(prev => ({ ...prev, conditionValue: e.target.value }))}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-500 uppercase">THEN SET field</label>
                  <select
                    value={newRuleData.actionField}
                    onChange={(e) => setNewRuleData(prev => ({ ...prev, actionField: e.target.value }))}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="Probation End">Probation End</option>
                    <option value="Vacation Balance">Vacation Balance</option>
                    <option value="Overtime Eligible">Overtime Eligible</option>
                    <option value="Pension Scheme">Pension Scheme</option>
                    <option value="Employee Class">Employee Class</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-500 uppercase">Action Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 180 Days / Yes"
                    value={newRuleData.actionValue}
                    onChange={(e) => setNewRuleData(prev => ({ ...prev, actionValue: e.target.value }))}
                    className="w-full p-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Apply Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create MDF Object Schema Modal */}
      {mdfModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Create MDF Custom Object Schema</h3>
              <button onClick={() => setMdfModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMDF} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1 font-bold text-slate-500 uppercase">Object System Name (Alphanumeric)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CompanyVehicle"
                  value={newMdfData.name}
                  onChange={(e) => setNewMdfData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-500 uppercase">Object Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate Uniform Tracker"
                  value={newMdfData.label}
                  onChange={(e) => setNewMdfData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full p-2 border border-slate-200 focus:border-primary-400 rounded-lg text-xs bg-white text-slate-700 outline-none"
                />
              </div>

              <div>
                <span className="block mb-2 font-bold text-slate-500 uppercase">Custom Fields Schemas</span>
                
                <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2 max-h-[160px] overflow-y-auto">
                  <div className="flex gap-2 items-center text-[10px] text-slate-400 font-bold">
                    <span>* Default base code field automatically appended.</span>
                  </div>
                  {newMdfData.fields.map((f, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Field system name..."
                        required
                        value={f.name}
                        onChange={(e) => {
                          const updatedFields = [...newMdfData.fields];
                          updatedFields[idx].name = e.target.value.replace(/\s+/g, "");
                          setNewMdfData(prev => ({ ...prev, fields: updatedFields }));
                        }}
                        className="flex-1 p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none"
                      />
                      <select
                        value={f.type}
                        onChange={(e) => {
                          const updatedFields = [...newMdfData.fields];
                          updatedFields[idx].type = e.target.value;
                          setNewMdfData(prev => ({ ...prev, fields: updatedFields }));
                        }}
                        className="p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 outline-none"
                      >
                        <option value="String">String</option>
                        <option value="Number">Number</option>
                        <option value="Date">Date</option>
                        <option value="Picklist">Picklist</option>
                      </select>
                      {newMdfData.fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewMdfData(prev => ({ ...prev, fields: prev.fields.filter((_, fIdx) => fIdx !== idx) }))}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setNewMdfData(prev => ({ ...prev, fields: [...prev.fields, { name: "", type: "String", required: false }] }))}
                    className="text-[11px] text-primary-600 hover:underline font-bold block pt-1"
                  >
                    + Add Object Field
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMdfModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Create Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCenter;
