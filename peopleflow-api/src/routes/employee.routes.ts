import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";
import * as bcrypt from "bcryptjs";
import { logAutomationEvent } from "./automation.routes";

const router = Router();

// GET /api/dashboard/stats
router.get("/dashboard/stats", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    let pendingApprovals = 0;

    if (user.role === "Administrator" || user.role === "HR") {
      pendingApprovals = await prisma.workflowRequest.count({
        where: {
          status: { in: ["Pending Manager", "Pending HR"] }
        }
      });
    } else if (user.role === "Manager") {
      const reports = await prisma.jobInfo.findMany({
        where: { managerId: user.id },
        select: { employeeId: true }
      });
      const reportIds = reports.map(r => r.employeeId);

      pendingApprovals = await prisma.workflowRequest.count({
        where: {
          employeeId: { in: reportIds },
          status: "Pending Manager"
        }
      });
    } else {
      pendingApprovals = await prisma.workflowRequest.count({
        where: {
          OR: [
            { employeeId: user.id },
            { requesterId: user.id }
          ],
          status: { in: ["Pending Manager", "Pending HR"] }
        }
      });
    }

    const totalEmployees = await prisma.employee.count({
      where: { status: "Active" }
    });

    const leaveEmployees = await prisma.employee.count({
      where: { status: "Leave" }
    });

    // Probation ending in the next 90 days
    const now = new Date();
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(now.getDate() + 90);

    const probationEnding = await prisma.jobInfo.count({
      where: {
        probationEnd: {
          gte: now,
          lte: ninetyDaysLater
        },
        employee: { status: "Active" }
      }
    });

    // Recent activities from job history
    const recentHistories = await prisma.jobHistory.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          include: { personalInfo: true }
        }
      }
    });

    const recentActivities = recentHistories.map(h => {
      const name = h.employee.personalInfo 
        ? `${h.employee.personalInfo.firstName} ${h.employee.personalInfo.lastName}`
        : "Unknown Employee";
      
      let message = `${name} had a record change.`;
      if (h.event === "Hire") {
        message = `${name} was hired as ${h.jobTitle} in ${h.department}.`;
      } else if (h.event === "Promotion") {
        message = `${name} was promoted to ${h.jobTitle} (${h.eventReason}).`;
      } else if (h.event === "Transfer") {
        message = `${name} was transferred to ${h.department} as ${h.jobTitle}.`;
      } else if (h.event === "Termination") {
        message = `${name} was terminated (${h.eventReason}).`;
      } else if (h.event === "Data Change") {
        message = `${name}'s employment records were updated.`;
      }

      return {
        id: h.id,
        message,
        date: h.effectiveDate,
        event: h.event
      };
    });

    res.json({
      activeCount: totalEmployees,
      leaveCount: leaveEmployees,
      pendingApprovals,
      probationEnding,
      recentActivities
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Error fetching dashboard stats." });
  }
});

// GET /api/employees - List with search and filtering
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const { query, department, status } = req.query;

  try {
    let whereClause: any = {};

    if (status) {
      whereClause.status = status as string;
    }

    // Filter by department through jobInfo relationship
    if (department) {
      whereClause.jobInfo = {
        department: department as string
      };
    }

    // Search query on Name or Employee Number
    if (query) {
      const q = query as string;
      whereClause.OR = [
        { employeeNumber: { contains: q } },
        {
          personalInfo: {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { preferredName: { contains: q } }
            ]
          }
        }
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        personalInfo: true,
        jobInfo: true
      },
      orderBy: { employeeNumber: "asc" }
    });

    res.json(employees);
  } catch (error) {
    console.error("Fetch employees error:", error);
    res.status(500).json({ message: "Error fetching employees." });
  }
});

// GET /api/employees/:id - Detailed profile
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        personalInfo: true,
        jobInfo: true,
        jobHistory: {
          orderBy: { effectiveDate: "desc" }
        }
      }
    });

    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    // Get manager name if managerId is present
    let managerName = null;
    if (employee.jobInfo?.managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: employee.jobInfo.managerId },
        include: { personalInfo: true }
      });
      if (manager && manager.personalInfo) {
        managerName = `${manager.personalInfo.firstName} ${manager.personalInfo.lastName}`;
      }
    }

    res.json({
      ...employee,
      managerName
    });
  } catch (error) {
    console.error("Fetch employee detail error:", error);
    res.status(500).json({ message: "Error fetching employee profile." });
  }
});

// POST /api/employees - Create new employee (with automatic JobHistory entry)
router.post("/", authenticateToken, requireRole(["HR", "Administrator"]), async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    preferredName,
    dateOfBirth,
    gender,
    nationality,
    email,
    phone,
    company,
    legalEntity,
    businessUnit,
    division,
    department,
    location,
    jobTitle,
    position,
    grade,
    payGrade,
    fte,
    employeeClass,
    managerId,
    hireDate,
    probationEnd,
    salary,
    role
  } = req.body;

  try {
    // Generate new employee number
    const count = await prisma.employee.count();
    const employeeNumber = "PF-" + String(count + 1).padStart(4, "0");

    // Standard default password: password123
    const passwordHash = bcrypt.hashSync("password123", 10);
    const isSpainProbation = (location === "Madrid Office" || nationality === "Spanish") && !probationEnd;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Employee master record
      const employee = await tx.employee.create({
        data: {
          employeeNumber,
          status: "Active",
          role: role || "Employee",
          passwordHash,
        }
      });

      // 2. Create PersonalInfo record
      await tx.personalInfo.create({
        data: {
          employeeId: employee.id,
          firstName,
          lastName,
          preferredName: preferredName || null,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          nationality,
          email,
          phone,
        }
      });

      // Check Spain Probation Rule
      let calculatedProbationEnd = probationEnd ? new Date(probationEnd) : null;
      if ((location === "Madrid Office" || nationality === "Spanish") && !probationEnd) {
        const computed = new Date(hireDate);
        computed.setDate(computed.getDate() + 180);
        calculatedProbationEnd = computed;
      }

      // 3. Create JobInfo record
      const jobInfo = await tx.jobInfo.create({
        data: {
          employeeId: employee.id,
          company,
          legalEntity,
          businessUnit,
          division,
          department,
          location,
          jobTitle,
          position,
          grade,
          payGrade,
          fte: fte ? parseFloat(fte) : 1.0,
          employeeClass: employeeClass || "Regular",
          managerId: managerId || null,
          hireDate: new Date(hireDate),
          probationEnd: calculatedProbationEnd,
          salary: salary ? parseFloat(salary) : 0.0,
        }
      });

      // 4. Create first JobHistory record (Hire event)
      await tx.jobHistory.create({
        data: {
          employeeId: employee.id,
          effectiveDate: new Date(hireDate),
          event: "Hire",
          eventReason: "New Hire",
          company,
          legalEntity,
          businessUnit,
          division,
          department,
          location,
          jobTitle,
          position,
          grade,
          payGrade,
          fte: fte ? parseFloat(fte) : 1.0,
          employeeClass: employeeClass || "Regular",
          managerId: managerId || null,
          salary: salary ? parseFloat(salary) : 0.0,
        }
      });

      return employee;
    });

    // --- Trigger n8n Onboarding Simulation ---
    const empName = `${firstName} ${lastName}`;
    await logAutomationEvent("Onboarding", "n8n Webhook Triggered", "Success", `onboarding.new_hire webhook dispatched for ${empName} (${employeeNumber}).`);
    await logAutomationEvent("Onboarding", "OpenAI Offer Letter Generated", "Success", `Drafted professional employment offer contract for ${empName}.`);
    await logAutomationEvent("Onboarding", "DocuSign Envelope Dispatched", "Success", `Offer envelope sent to ${email} (Waiting for signature).`);

    res.status(201).json({ 
      id: result.id, 
      employeeNumber, 
      spainProbationTriggered: isSpainProbation, 
      message: "Employee hired successfully." 
    });
  } catch (error: any) {
    console.error("Create employee error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ message: "An employee with this email already exists." });
    } else {
      res.status(500).json({ message: "Error creating employee record." });
    }
  }
});

// PUT /api/employees/:id - Update employee (supports updating Personal and Job data)
router.put("/:id", authenticateToken, requireRole(["HR", "Administrator"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    preferredName,
    dateOfBirth,
    gender,
    nationality,
    email,
    phone,
    company,
    legalEntity,
    businessUnit,
    division,
    department,
    location,
    jobTitle,
    position,
    grade,
    payGrade,
    fte,
    employeeClass,
    managerId,
    probationEnd,
    salary,
    status,
    role
  } = req.body;

  try {
    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { jobInfo: true, personalInfo: true }
    });

    if (!existing) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    // --- Business Rules checks for Workflows ---
    const reqUser = (req as any).user;
    const parsedSalary = salary ? parseFloat(salary) : (existing.jobInfo?.salary || 0);
    const currentSalary = existing.jobInfo?.salary || 0;
    const pctIncrease = currentSalary > 0 ? ((parsedSalary - currentSalary) / currentSalary) * 100 : 0;

    const triggersWorkflow = 
      (parsedSalary > 70000 || pctIncrease > 15) &&
      (existing.jobInfo?.salary !== parsedSalary);

    if (triggersWorkflow) {
      // Hijack! Create a WorkflowRequest instead of committing directly
      const details = {
        firstName,
        lastName,
        preferredName,
        dateOfBirth: dateOfBirth || existing.personalInfo?.dateOfBirth,
        gender,
        nationality,
        email,
        phone,
        company: company || existing.jobInfo?.company,
        legalEntity: legalEntity || existing.jobInfo?.legalEntity,
        businessUnit: businessUnit || existing.jobInfo?.businessUnit,
        division: division || existing.jobInfo?.division,
        department: department || existing.jobInfo?.department,
        location: location || existing.jobInfo?.location,
        jobTitle: jobTitle || existing.jobInfo?.jobTitle,
        position: position || existing.jobInfo?.position,
        grade: grade || existing.jobInfo?.grade,
        payGrade: payGrade || existing.jobInfo?.payGrade,
        fte: fte || existing.jobInfo?.fte,
        employeeClass: employeeClass || existing.jobInfo?.employeeClass,
        managerId: managerId || existing.jobInfo?.managerId,
        probationEnd: probationEnd || existing.jobInfo?.probationEnd,
        salary: parsedSalary,
        status: status || existing.status,
        role: role || existing.role,
        eventReason: pctIncrease > 15 ? `Salary Increase of ${pctIncrease.toFixed(1)}% (>15% limit)` : "Compensation Exceeds Grade Limit (>70k)"
      };

      const initialStatus = reqUser.role === "Manager" ? "Pending HR" : "Pending Manager";

      await prisma.workflowRequest.create({
        data: {
          employeeId: id,
          requesterId: reqUser.id,
          type: "Salary Change",
          details: JSON.stringify(details),
          status: initialStatus
        }
      });

      res.json({
        workflowTriggered: true,
        message: "This compensation change exceeds threshold limits. A workflow request has been triggered and sent for approval."
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Check if critical job attributes changed to log in history (simulating SuccessFactors Event Reason processing)
      const jobChanged = 
        existing.jobInfo?.jobTitle !== jobTitle ||
        existing.jobInfo?.department !== department ||
        existing.jobInfo?.salary !== parseFloat(salary) ||
        existing.jobInfo?.position !== position ||
        existing.status !== status;

      // Update Employee role and status
      await tx.employee.update({
        where: { id },
        data: {
          status: status || existing.status,
          role: role || existing.role
        }
      });

      // Update Personal Info
      await tx.personalInfo.update({
        where: { employeeId: id },
        data: {
          firstName,
          lastName,
          preferredName: preferredName || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.personalInfo?.dateOfBirth,
          gender,
          nationality,
          email,
          phone
        }
      });

      // Update Job Info
      await tx.jobInfo.update({
        where: { employeeId: id },
        data: {
          company,
          legalEntity,
          businessUnit,
          division,
          department,
          location,
          jobTitle,
          position,
          grade,
          payGrade,
          fte: fte ? parseFloat(fte) : existing.jobInfo?.fte,
          employeeClass,
          managerId: managerId || null,
          probationEnd: probationEnd ? new Date(probationEnd) : null,
          salary: salary ? parseFloat(salary) : existing.jobInfo?.salary,
        }
      });

      // If key Job fields changed, create a JobHistory event
      if (jobChanged) {
        let event = "Data Change";
        let eventReason = "Profile Update";

        if (existing.status !== status) {
          if (status === "Terminated") {
            event = "Termination";
            eventReason = "Voluntary Resignation";
          } else if (status === "Active" && existing.status === "Terminated") {
            event = "Rehire";
            eventReason = "Rehire employee";
          } else if (status === "Leave") {
            event = "Leave of Absence";
            eventReason = "Personal Leave";
          } else if (status === "Active" && existing.status === "Leave") {
            event = "Return from Leave";
            eventReason = "Return to work";
          }
        } else if (existing.jobInfo?.jobTitle !== jobTitle) {
          event = "Promotion";
          eventReason = "Job Title Change";
        } else if (existing.jobInfo?.department !== department) {
          event = "Transfer";
          eventReason = "Department Transfer";
        } else if (existing.jobInfo?.salary !== parseFloat(salary)) {
          event = "Salary Change";
          eventReason = "Compensation adjustment";
        }

        await tx.jobHistory.create({
          data: {
            employeeId: id,
            effectiveDate: new Date(),
            event,
            eventReason,
            company,
            legalEntity,
            businessUnit,
            division,
            department,
            location,
            jobTitle,
            position,
            grade,
            payGrade,
            fte: fte ? parseFloat(fte) : 1.0,
            employeeClass,
            managerId: managerId || null,
            salary: salary ? parseFloat(salary) : 0.0,
          }
        });
      }
    });

    res.json({ message: "Employee profile updated successfully." });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Error updating employee record." });
  }
});

// DELETE /api/employees/:id - Hard Delete
router.delete("/:id", authenticateToken, requireRole(["HR", "Administrator"]), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existing = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    await prisma.employee.delete({
      where: { id }
    });

    res.json({ message: "Employee deleted successfully from database." });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Error deleting employee record." });
  }
});

export default router;
