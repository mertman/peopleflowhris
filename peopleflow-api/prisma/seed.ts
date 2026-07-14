import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for Sprint 2...");

  // Clean existing data
  await prisma.workflowRequest.deleteMany();
  await prisma.position.deleteMany();
  await prisma.jobHistory.deleteMany();
  await prisma.jobInfo.deleteMany();
  await prisma.personalInfo.deleteMany();
  await prisma.employee.deleteMany();

  const passwordHash = bcrypt.hashSync("password123", 10);

  // Define key employees
  const employeesData = [
    {
      id: "emp-admin-01",
      employeeNumber: "PF-0001",
      status: "Active",
      role: "Administrator",
      personal: {
        firstName: "Sarah",
        lastName: "Connor",
        preferredName: "Sarah",
        dateOfBirth: new Date("1982-05-12"),
        gender: "Female",
        nationality: "American",
        email: "sarah.connor@peopleflow.com",
        phone: "+1-555-0101",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Corporate Functions",
        division: "Human Resources",
        department: "HR Administration",
        location: "New York HQ",
        jobTitle: "HR Director",
        position: "Director of HR",
        grade: "GR-09",
        payGrade: "PG-09",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: null,
        hireDate: new Date("2020-01-15"),
        probationEnd: new Date("2020-07-15"),
        salary: 145000,
      },
      history: [
        {
          effectiveDate: new Date("2020-01-15"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 130000,
          jobTitle: "HR Manager",
          position: "HR Manager",
          grade: "GR-08",
          payGrade: "PG-08",
        },
        {
          effectiveDate: new Date("2022-06-01"),
          event: "Promotion",
          eventReason: "Annual Performance Promotion",
          salary: 145000,
          jobTitle: "HR Director",
          position: "Director of HR",
          grade: "GR-09",
          payGrade: "PG-09",
        }
      ]
    },
    {
      id: "emp-mgr-01",
      employeeNumber: "PF-0002",
      status: "Active",
      role: "Manager",
      personal: {
        firstName: "John",
        lastName: "Smith",
        preferredName: "John",
        dateOfBirth: new Date("1985-09-23"),
        gender: "Male",
        nationality: "British",
        email: "john.smith@peopleflow.com",
        phone: "+1-555-0102",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Technology",
        division: "Product & Engineering",
        department: "Engineering - Frontend",
        location: "New York HQ",
        jobTitle: "Engineering Manager",
        position: "Frontend Lead Manager",
        grade: "GR-08",
        payGrade: "PG-08",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: "emp-admin-01", // Report to Sarah
        hireDate: new Date("2021-03-10"),
        probationEnd: new Date("2021-09-10"),
        salary: 125000,
      },
      history: [
        {
          effectiveDate: new Date("2021-03-10"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 110000,
          jobTitle: "Senior Software Engineer",
          position: "Senior Frontend Engineer",
          grade: "GR-07",
          payGrade: "PG-07",
        },
        {
          effectiveDate: new Date("2023-01-01"),
          event: "Promotion",
          eventReason: "Promotion to Manager Role",
          salary: 125000,
          jobTitle: "Engineering Manager",
          position: "Frontend Lead Manager",
          grade: "GR-08",
          payGrade: "PG-08",
        }
      ]
    },
    {
      id: "emp-emp-01",
      employeeNumber: "PF-0003",
      status: "Active",
      role: "Employee",
      personal: {
        firstName: "Emily",
        lastName: "Watson",
        preferredName: "Emily",
        dateOfBirth: new Date("1993-11-04"),
        gender: "Female",
        nationality: "Canadian",
        email: "emily.watson@peopleflow.com",
        phone: "+1-555-0103",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Technology",
        division: "Product & Engineering",
        department: "Engineering - Frontend",
        location: "San Francisco Office",
        jobTitle: "Software Engineer II",
        position: "Frontend Developer II",
        grade: "GR-05",
        payGrade: "PG-05",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: "emp-mgr-01", // Report to John
        hireDate: new Date("2023-08-15"),
        probationEnd: new Date("2024-02-15"),
        salary: 95000,
      },
      history: [
        {
          effectiveDate: new Date("2023-08-15"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 95000,
          jobTitle: "Software Engineer II",
          position: "Frontend Developer II",
          grade: "GR-05",
          payGrade: "PG-05",
        }
      ]
    },
    {
      id: "emp-emp-02",
      employeeNumber: "PF-0004",
      status: "Active",
      role: "Employee",
      personal: {
        firstName: "Ahmed",
        lastName: "Ali",
        preferredName: "Ahmed",
        dateOfBirth: new Date("1990-07-19"),
        gender: "Male",
        nationality: "Egyptian",
        email: "ahmed.ali@peopleflow.com",
        phone: "+1-555-0104",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Technology",
        division: "Product & Engineering",
        department: "Engineering - Frontend",
        location: "New York HQ",
        jobTitle: "Senior Software Engineer",
        position: "Senior Frontend Developer",
        grade: "GR-07",
        payGrade: "PG-07",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: "emp-mgr-01", // Report to John
        hireDate: new Date("2022-04-10"),
        probationEnd: new Date("2022-10-10"),
        salary: 115000,
      },
      history: [
        {
          effectiveDate: new Date("2022-04-10"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 105000,
          jobTitle: "Software Engineer II",
          position: "Frontend Developer II",
          grade: "GR-05",
          payGrade: "PG-05",
        },
        {
          effectiveDate: new Date("2024-01-01"),
          event: "Promotion",
          eventReason: "Career Path Promotion",
          salary: 115000,
          jobTitle: "Senior Software Engineer",
          position: "Senior Frontend Developer",
          grade: "GR-07",
          payGrade: "PG-07",
        }
      ]
    },
    {
      id: "emp-emp-03",
      employeeNumber: "PF-0005",
      status: "Active",
      role: "Employee",
      personal: {
        firstName: "Maria",
        lastName: "Garcia",
        preferredName: "Maria",
        dateOfBirth: new Date("1995-02-28"),
        gender: "Female",
        nationality: "Spanish",
        email: "maria.garcia@peopleflow.com",
        phone: "+34-600-123456",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF Europe Ltd",
        businessUnit: "Technology",
        division: "Product & Engineering",
        department: "Engineering - Quality",
        location: "Madrid Office",
        jobTitle: "QA Engineer II",
        position: "Quality Assurance Analyst II",
        grade: "GR-04",
        payGrade: "PG-04",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: "emp-mgr-01", // Report to John
        hireDate: new Date("2024-02-01"),
        probationEnd: new Date("2024-08-01"),
        salary: 42000,
      },
      history: [
        {
          effectiveDate: new Date("2024-02-01"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 42000,
          jobTitle: "QA Engineer II",
          position: "Quality Assurance Analyst II",
          grade: "GR-04",
          payGrade: "PG-04",
        }
      ]
    },
    {
      id: "emp-emp-04",
      employeeNumber: "PF-0006",
      status: "Leave",
      role: "Employee",
      personal: {
        firstName: "Michael",
        lastName: "Jordan",
        preferredName: "MJ",
        dateOfBirth: new Date("1988-02-17"),
        gender: "Male",
        nationality: "American",
        email: "michael.jordan@peopleflow.com",
        phone: "+1-555-0105",
      },
      job: {
        company: "PeopleFlow Global Inc.",
        legalEntity: "PF USA LLC",
        businessUnit: "Revenue Operations",
        division: "Global Sales",
        department: "Enterprise Sales",
        location: "Chicago Hub",
        jobTitle: "Sales Director",
        position: "Sales Director Central Region",
        grade: "GR-08",
        payGrade: "PG-08",
        fte: 1.0,
        employeeClass: "Regular",
        managerId: "emp-admin-01", // Report to Sarah
        hireDate: new Date("2018-09-01"),
        probationEnd: new Date("2019-03-01"),
        salary: 135000,
      },
      history: [
        {
          effectiveDate: new Date("2018-09-01"),
          event: "Hire",
          eventReason: "New Hire",
          salary: 110000,
          jobTitle: "Account Executive",
          position: "Account Executive",
          grade: "GR-06",
          payGrade: "PG-06",
        },
        {
          effectiveDate: new Date("2021-01-01"),
          event: "Promotion",
          eventReason: "Promotion to Sales Manager",
          salary: 120000,
          jobTitle: "Sales Manager",
          position: "Sales Manager Central Region",
          grade: "GR-07",
          payGrade: "PG-07",
        },
        {
          effectiveDate: new Date("2024-03-15"),
          event: "Transfer",
          eventReason: "Lateral Transfer / Title Change",
          salary: 135000,
          jobTitle: "Sales Director",
          position: "Sales Director Central Region",
          grade: "GR-08",
          payGrade: "PG-08",
        }
      ]
    }
  ];

  // Insert employees and related structures
  for (const emp of employeesData) {
    const createdEmp = await prisma.employee.create({
      data: {
        id: emp.id,
        employeeNumber: emp.employeeNumber,
        status: emp.status,
        role: emp.role,
        passwordHash: passwordHash,
        personalInfo: {
          create: emp.personal,
        },
        jobInfo: {
          create: {
            ...emp.job,
            managerId: emp.job.managerId,
          }
        }
      }
    });

    // Create Job History records
    for (const hist of emp.history) {
      await prisma.jobHistory.create({
        data: {
          employeeId: createdEmp.id,
          effectiveDate: hist.effectiveDate,
          event: hist.event,
          eventReason: hist.eventReason,
          company: emp.job.company,
          legalEntity: emp.job.legalEntity,
          businessUnit: emp.job.businessUnit,
          division: emp.job.division,
          department: emp.job.department,
          location: emp.job.location,
          jobTitle: hist.jobTitle,
          position: hist.position,
          grade: hist.grade,
          payGrade: hist.payGrade,
          fte: emp.job.fte,
          employeeClass: emp.job.employeeClass,
          managerId: emp.job.managerId,
          salary: hist.salary,
        }
      });
    }

    const latestHistory = emp.history[emp.history.length - 1];
    if (latestHistory.jobTitle !== emp.job.jobTitle || latestHistory.salary !== emp.job.salary) {
      await prisma.jobHistory.create({
        data: {
          employeeId: createdEmp.id,
          effectiveDate: new Date(),
          event: "Data Change",
          eventReason: "System Sync",
          company: emp.job.company,
          legalEntity: emp.job.legalEntity,
          businessUnit: emp.job.businessUnit,
          division: emp.job.division,
          department: emp.job.department,
          location: emp.job.location,
          jobTitle: emp.job.jobTitle,
          position: emp.job.position,
          grade: emp.job.grade,
          payGrade: emp.job.payGrade,
          fte: emp.job.fte,
          employeeClass: emp.job.employeeClass,
          managerId: emp.job.managerId,
          salary: emp.job.salary,
        }
      });
    }
  }

  // Seed positions linked to employees or vacant
  const positions = [
    { code: "POS-1001", title: "HR Director", department: "HR Administration", location: "New York HQ", incumbentId: "emp-admin-01" },
    { code: "POS-1002", title: "Engineering Manager", department: "Engineering - Frontend", location: "New York HQ", incumbentId: "emp-mgr-01" },
    { code: "POS-1003", title: "Software Engineer II", department: "Engineering - Frontend", location: "San Francisco Office", incumbentId: "emp-emp-01" },
    { code: "POS-1004", title: "Senior Software Engineer", department: "Engineering - Frontend", location: "New York HQ", incumbentId: "emp-emp-02" },
    { code: "POS-1005", title: "QA Engineer II", department: "Engineering - Quality", location: "Madrid Office", incumbentId: "emp-emp-03" },
    { code: "POS-1006", title: "Sales Director Central Region", department: "Enterprise Sales", location: "Chicago Hub", incumbentId: "emp-emp-04" },
    // Vacant Positions
    { code: "POS-1007", title: "Junior Frontend Developer", department: "Engineering - Frontend", location: "New York HQ", incumbentId: null },
    { code: "POS-1008", title: "HR Specialist", department: "HR Administration", location: "New York HQ", incumbentId: null },
    { code: "POS-1009", title: "Product Manager", department: "Product Management", location: "San Francisco Office", incumbentId: null }
  ];

  for (const pos of positions) {
    await prisma.position.create({
      data: {
        code: pos.code,
        title: pos.title,
        department: pos.department,
        location: pos.location,
        incumbentId: pos.incumbentId
      }
    });
  }

  // Seed standard workflow approvals demo
  const sampleWorkflow = {
    employeeId: "emp-emp-01", // Emily Watson
    requesterId: "emp-mgr-01", // John Smith (her manager)
    type: "Promotion",
    status: "Pending Manager",
    details: JSON.stringify({
      jobTitle: "Senior Software Engineer",
      position: "Senior Frontend Developer",
      grade: "GR-07",
      payGrade: "PG-07",
      salary: 110000,
      eventReason: "Career Advancement Promotion"
    })
  };

  await prisma.workflowRequest.create({
    data: sampleWorkflow
  });

  console.log("Database seeded successfully with Sprint 2 models!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
