import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface TemplateConfig {
  companyName: string;
  departments: string[];
  locations: string[];
  costCenters: string[];
  titles: string[];
}

const templates: Record<string, TemplateConfig> = {
  retail: {
    companyName: "RetailMart Global",
    departments: ["Store Operations", "Inventory & Logistics", "Purchasing & Merchandising", "Retail HR", "Regional Finance"],
    locations: ["New York Flagship", "London Hub Store", "Chicago Outlet", "Madrid Boutique"],
    costCenters: ["CC-RET-OPS", "CC-RET-LOG", "CC-RET-BUY"],
    titles: ["Store Manager", "Assistant Store Manager", "Checkout Supervisor", "Sales Associate", "Inventory Clerk", "Visual Merchandiser", "Cashier"]
  },
  tech: {
    companyName: "TechLabs Inc",
    departments: ["Product & Engineering", "Infrastructure Operations", "UX Design & Content", "Growth Marketing", "Talent Operations"],
    locations: ["Silicon Valley HQ", "San Francisco Office", "Remote Hub", "Madrid Tech Hub"],
    costCenters: ["CC-ENG-01", "CC-PROD-02", "CC-OPS-03"],
    titles: ["VP of Engineering", "Engineering Director", "Software Manager", "Senior Frontend Architect", "Fullstack Developer III", "QA Engineer II", "UI/UX Designer", "Product Lead"]
  },
  healthcare: {
    companyName: "CarePlus Health System",
    departments: ["Clinical Medicine", "Emergency Services", "Pediatrics Division", "Hospitality & Nursing", "Medical Billing"],
    locations: ["City General Hospital", "Westside Clinic", "Downtown Medical Center", "North Health Clinic"],
    costCenters: ["CC-MED-CLIN", "CC-MED-ER", "CC-MED-NSG"],
    titles: ["Chief Medical Officer", "Clinical Director", "Attending Physician", "Emergency Specialist", "Nurse Practitioner", "Registered Nurse", "Medical Assistant", "Clinic Lead"]
  },
  manufacturing: {
    companyName: "Apex Manufacturing",
    departments: ["Plant Operations", "Quality Control", "Supply Chain & Logistics", "Assembly Line A", "Factory Safety"],
    locations: ["Detroit Factory", "Chicago Warehouse", "El Paso Plant", "Vigo Factory"],
    costCenters: ["CC-MFG-PLNT", "CC-MFG-QC", "CC-MFG-LOG"],
    titles: ["Plant General Manager", "Production Supervisor", "Assembly Supervisor", "CNC Operator", "Quality Control Inspector", "Logistics Coordinator", "Maintenance Technician", "Line Operator"]
  },
  hospitality: {
    companyName: "Luxury Stay Resorts",
    departments: ["Guest Relations", "Culinary Operations", "Rooms & Housekeeping", "Resort Maintenance", "Events & Banquets"],
    locations: ["Miami Beach Resort", "Vail Ski Lodge", "Madrid Luxury Suites", "Hawaiian Retreat"],
    costCenters: ["CC-HSP-GUEST", "CC-HSP-FOOD", "CC-HSP-MAINT"],
    titles: ["Resort General Manager", "Front Office Manager", "Executive Chef", "Sous Chef", "Guest Services Agent", "Housekeeping Supervisor", "Maintenance Specialist", "Concierge"]
  },
  smallbusiness: {
    companyName: "Innovate LLC",
    departments: ["Core Business Operations", "Client Support", "Administration & HR", "General Accounting"],
    locations: ["Austin Head Office", "Denver Shared Space"],
    costCenters: ["CC-SB-OPS", "CC-SB-ADMIN"],
    titles: ["Operations Director", "Client Manager", "Office Administrator", "Senior Support Specialist", "Support Associate", "Junior Accountant", "Administrative Assistant"]
  },
  global: {
    companyName: "Atlas Holding Corp",
    departments: ["Global Technology Services", "Corporate Administration", "International Operations", "Strategic Sales", "Corporate Treasury", "Legal & Compliance", "Global Talent Management"],
    locations: ["New York HQ", "London Financial Hub", "Madrid Regional HQ", "Tokyo Office", "Singapore Hub", "Sydney Hub"],
    costCenters: ["CC-CORP-TYS", "CC-CORP-GTS", "CC-CORP-LGL", "CC-CORP-HR"],
    titles: ["Executive VP", "Managing Director", "Global Operations Lead", "Country Director", "Senior Architect", "Treasury Specialist", "Senior Counsel", "HR Business Partner", "Lead Engineer"]
  }
};

const firstNames = [
  "John", "Sarah", "Elena", "Kenji", "David", "Emma", "Michael", "Sophia", "Daniel", "Olivia",
  "James", "Isabella", "Robert", "Mia", "William", "Charlotte", "Joseph", "Amelia", "Charles", "Evelyn",
  "Richard", "Harper", "Thomas", "Abigail", "Matthew", "Emily", "George", "Elizabeth", "Edward", "Sofia"
];

const lastNames = [
  "Smith", "Connor", "Russo", "Sato", "Miller", "Jones", "Davis", "Garcia", "Rodriguez", "Wilson",
  "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
  "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall"
];

export const seedSandboxTemplate = async (
  tenantId: string,
  adminEmail: string,
  adminName: string,
  templateName: string
) => {
  const normTemplate = templateName.toLowerCase().replace(/\s+/g, "");
  const config = templates[normTemplate] || templates.smallbusiness;

  const passwordHash = bcrypt.hashSync("password123", 10);
  const employeeCount = normTemplate === "global" ? 150 : 25;

  const names = adminName.split(" ");
  const adminFirstName = names[0] || "Admin";
  const adminLastName = names.slice(1).join(" ") || "User";

  console.log(`[Seeder] Seeding tenant: ${tenantId} (${config.companyName}) with template: ${templateName}`);

  // 1. Create Root Admin Employee
  const adminEmpNum = `PF-${Math.floor(10000 + Math.random() * 90000)}`;
  const adminEmployee = await prisma.employee.create({
    data: {
      employeeNumber: adminEmpNum,
      role: "Administrator",
      status: "Active",
      passwordHash,
      tenantId,
      personalInfo: {
        create: {
          firstName: adminFirstName,
          lastName: adminLastName,
          preferredName: adminFirstName,
          dateOfBirth: new Date("1990-01-01"),
          gender: "Male",
          nationality: "USA",
          email: adminEmail,
          phone: "+1-555-0100"
        }
      },
      jobInfo: {
        create: {
          company: config.companyName,
          legalEntity: `${config.companyName} Inc.`,
          businessUnit: config.departments[0],
          division: "Executive Office",
          department: config.departments[0],
          location: config.locations[0],
          jobTitle: "HR Administrator",
          position: "POS-ADMIN-01",
          grade: "GR-07",
          payGrade: "GR-07",
          fte: 1.0,
          employeeClass: "Regular",
          hireDate: new Date(),
          salary: 135000
        }
      }
    }
  });

  const createdIds = [adminEmployee.id];
  const createdNumbers = [adminEmpNum];

  // 2. Generate and seed remaining staff programmatically
  // Establish a hierarchical list of roles
  const seededEmployeesData: any[] = [];
  
  // Create dynamic employee database
  for (let i = 0; i < employeeCount - 1; i++) {
    const fName = firstNames[(i + 3) % firstNames.length];
    const lName = lastNames[(i + 7) % lastNames.length];
    const empEmail = `${fName.toLowerCase()}.${lName.toLowerCase()}@${config.companyName.toLowerCase().replace(/\s+/g, "")}.com`;
    const empNum = `PF-${Math.floor(20000 + Math.random() * 80000)}`;

    const isDirector = i < Math.ceil(employeeCount * 0.15);
    const isManager = !isDirector && i < Math.ceil(employeeCount * 0.35);

    let jobTitle = config.titles[i % config.titles.length];
    let employeeRole = "Employee";
    let grade = "GR-03";
    let salary = 60000 + (i % 5) * 10000;

    if (isDirector) {
      jobTitle = `Director of ${config.departments[i % config.departments.length]}`;
      employeeRole = "Manager";
      grade = "GR-06";
      salary = 110000 + (i % 3) * 10000;
    } else if (isManager) {
      jobTitle = `${config.departments[i % config.departments.length]} Lead`;
      employeeRole = "Manager";
      grade = "GR-04";
      salary = 85000 + (i % 4) * 5000;
    }

    seededEmployeesData.push({
      empNum,
      firstName: fName,
      lastName: lName,
      email: empEmail,
      role: employeeRole,
      jobTitle,
      department: config.departments[i % config.departments.length],
      location: config.locations[i % config.locations.length],
      costCenter: config.costCenters[i % config.costCenters.length],
      grade,
      salary
    });
  }

  // Write employees sequentially so we can map manager relationships properly
  for (let idx = 0; idx < seededEmployeesData.length; idx++) {
    const item = seededEmployeesData[idx];

    // Managers routing:
    // Directors report to the Root Admin (Sarah/John).
    // Managers report to Directors.
    // Employees report to Managers.
    let managerId = adminEmployee.id;

    if (idx >= Math.ceil(employeeCount * 0.15)) {
      // Pick a manager from the previously created directors/managers
      const mIdx = Math.floor(Math.random() * createdIds.length);
      managerId = createdIds[mIdx];
    }

    const created = await prisma.employee.create({
      data: {
        employeeNumber: item.empNum,
        role: item.role,
        status: "Active",
        passwordHash,
        tenantId,
        personalInfo: {
          create: {
            firstName: item.firstName,
            lastName: item.lastName,
            preferredName: item.firstName,
            dateOfBirth: new Date(`1980-${((idx % 11) + 1).toString().padStart(2, "0")}-15`),
            gender: idx % 2 === 0 ? "Female" : "Male",
            nationality: "USA",
            email: item.email,
            phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`
          }
        },
        jobInfo: {
          create: {
            company: config.companyName,
            legalEntity: `${config.companyName} Inc.`,
            businessUnit: "Operations Division",
            division: "Enterprise Units",
            department: item.department,
            location: item.location,
            jobTitle: item.jobTitle,
            position: `POS-${item.jobTitle.toUpperCase().replace(/\s+/g, "-")}-${idx}`,
            grade: item.grade,
            payGrade: item.grade,
            fte: 1.0,
            employeeClass: "Regular",
            managerId,
            hireDate: new Date(`2024-${((idx % 11) + 1).toString().padStart(2, "0")}-01`),
            salary: item.salary
          }
        }
      }
    });

    createdIds.push(created.id);
    createdNumbers.push(item.empNum);
  }

  // 3. Seed Positions
  for (let idx = 0; idx < createdIds.length; idx++) {
    const incumbentId = idx % 3 === 0 ? undefined : createdIds[idx];
    const code = `POS-${100000 + idx}`;
    const empJob = seededEmployeesData[idx - 1] || seededEmployeesData[0];
    
    await prisma.position.create({
      data: {
        code,
        title: empJob.jobTitle,
        department: empJob.department,
        location: empJob.location,
        tenantId,
        incumbentId
      }
    });
  }

  // 4. Seed Workflow Requests
  await prisma.workflowRequest.create({
    data: {
      employeeId: createdIds[Math.floor(Math.random() * createdIds.length)],
      requesterId: adminEmployee.id,
      type: "Promotion",
      details: JSON.stringify({ proposedTitle: "VP Architect", proposedSalary: 145000 }),
      status: "Pending Manager",
      tenantId
    }
  });

  // 5. Seed Automation Logs
  await prisma.automationLog.create({
    data: {
      workflowName: "Sandbox Initialization",
      event: "Sandbox Generated",
      status: "Success",
      details: `Dynamically seeded tenant "${config.companyName}" with ${employeeCount} records.`,
      tenantId
    }
  });

  console.log(`[Seeder] Seed complete for tenant: ${tenantId}`);
};
