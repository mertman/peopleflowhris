import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../middleware/auth.middleware";
import { logAutomationEvent } from "./automation.routes";

const router = Router();

// GET /api/workflows/pending - Fetch pending approval items
router.get("/pending", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    let pendingWorkflows = [];

    if (user.role === "Administrator" || user.role === "HR" || user.role === "Superadmin") {
      // HR/Admin sees Pending HR requests AND Pending Manager requests if they are the direct manager of that employee
      const reports = await prisma.jobInfo.findMany({
        where: { managerId: user.id },
        select: { employeeId: true }
      });
      const reportIds = reports.map(r => r.employeeId);

      pendingWorkflows = await prisma.workflowRequest.findMany({
        where: {
          OR: [
            { status: "Pending HR" },
            { status: "Pending Manager", employeeId: { in: reportIds } }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
    } else if (user.role === "Manager") {
      // Managers see workflows where they are the employee's manager
      // First, get manager's direct reports
      const reports = await prisma.jobInfo.findMany({
        where: { managerId: user.id },
        select: { employeeId: true }
      });
      const reportIds = reports.map(r => r.employeeId);

      pendingWorkflows = await prisma.workflowRequest.findMany({
        where: {
          employeeId: { in: reportIds },
          status: "Pending Manager"
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Employees see workflows they requested or are about them (read-only)
      pendingWorkflows = await prisma.workflowRequest.findMany({
        where: {
          OR: [
            { employeeId: user.id },
            { requesterId: user.id }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // Attach requester and employee names to the list response
    const richWorkflows = [];
    for (const wf of pendingWorkflows) {
      const empPersonal = await prisma.personalInfo.findUnique({
        where: { employeeId: wf.employeeId }
      });
      const reqPersonal = await prisma.personalInfo.findUnique({
        where: { employeeId: wf.requesterId }
      });

      // Get current active JobInfo to display "current" vs "proposed" diff
      const currentJob = await prisma.jobInfo.findUnique({
        where: { employeeId: wf.employeeId }
      });

      richWorkflows.push({
        ...wf,
        employeeName: empPersonal ? `${empPersonal.firstName} ${empPersonal.lastName}` : "Unknown Employee",
        requesterName: reqPersonal ? `${reqPersonal.firstName} ${reqPersonal.lastName}` : "System Requested",
        currentJob: currentJob,
        proposedDetails: JSON.parse(wf.details)
      });
    }

    res.json(richWorkflows);
  } catch (error) {
    console.error("Fetch pending workflows error:", error);
    res.status(500).json({ message: "Error fetching pending workflows." });
  }
});

// POST /api/workflows - Submit workflow request (usually triggered from employee edit if rules hit)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { employeeId, type, details } = req.body;
  const user = (req as any).user;

  try {
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details;

    // Determine initial status based on requester role
    // E.g. If Manager initiates, it goes to Pending HR. If HR initiates, it might still require Manager signoff or Admin depending on rule.
    // For this simulation:
    // If Admin requests -> Auto-approves or goes to Pending HR.
    // Let's standardise: Initial status is "Pending Manager" unless submitted by Manager, then "Pending HR".
    const initialStatus = user.role === "Manager" ? "Pending HR" : "Pending Manager";

    const wf = await prisma.workflowRequest.create({
      data: {
        employeeId,
        requesterId: user.id,
        type,
        details: JSON.stringify(parsedDetails),
        status: initialStatus
      }
    });

    res.status(201).json({ wf, message: "Workflow request submitted for approvals." });
  } catch (error) {
    console.error("Submit workflow error:", error);
    res.status(500).json({ message: "Error submitting workflow request." });
  }
});

// POST /api/workflows/:id/approve - Approve workflow step
router.post("/:id/approve", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const wf = await prisma.workflowRequest.findUnique({ where: { id } });
    if (!wf) {
      res.status(404).json({ message: "Workflow request not found." });
      return;
    }

    let nextStatus = "Approved";

    if (wf.status === "Pending Manager") {
      // Manager approved -> now goes to HR
      nextStatus = "Pending HR";
    }

    // Fetch employee's JobInfo to find their manager
    const jobInfo = await prisma.jobInfo.findUnique({
      where: { employeeId: wf.employeeId }
    });
    const managerId = jobInfo?.managerId;

    // Check permissions
    if (wf.status === "Pending Manager") {
      // Only the direct line manager can approve this step
      if (user.id !== managerId) {
        res.status(403).json({ message: "Only the direct line manager of this employee can approve this step." });
        return;
      }
    }
    if (wf.status === "Pending HR") {
      // Only HR Specialists or Administrators can approve this step
      if (user.role !== "HR" && user.role !== "Administrator" && user.role !== "Superadmin") {
        res.status(403).json({ message: "Only HR Specialists or Administrators can approve this final step." });
        return;
      }
    }

    if (nextStatus === "Approved") {
      // COMMIT THE CHANGES!
      const proposed = JSON.parse(wf.details);

      await prisma.$transaction(async (tx) => {
        // Fetch current active records
        const currentJob = await tx.jobInfo.findUnique({
          where: { employeeId: wf.employeeId }
        });
        const currentPersonal = await tx.personalInfo.findUnique({
          where: { employeeId: wf.employeeId }
        });

        // 1. Update Employee state if needed (e.g. status, role)
        await tx.employee.update({
          where: { id: wf.employeeId },
          data: {
            status: proposed.status || undefined,
            role: proposed.role || undefined
          }
        });

        // 2. Update Personal info
        await tx.personalInfo.update({
          where: { employeeId: wf.employeeId },
          data: {
            firstName: proposed.firstName || undefined,
            lastName: proposed.lastName || undefined,
            preferredName: proposed.preferredName || undefined,
            email: proposed.email || undefined,
            phone: proposed.phone || undefined
          }
        });

        // 3. Update active Job info
        await tx.jobInfo.update({
          where: { employeeId: wf.employeeId },
          data: {
            jobTitle: proposed.jobTitle || undefined,
            position: proposed.position || undefined,
            department: proposed.department || undefined,
            location: proposed.location || undefined,
            grade: proposed.grade || undefined,
            payGrade: proposed.payGrade || undefined,
            fte: proposed.fte ? parseFloat(proposed.fte) : undefined,
            employeeClass: proposed.employeeClass || undefined,
            managerId: proposed.managerId || undefined,
            salary: proposed.salary ? parseFloat(proposed.salary) : undefined,
            probationEnd: proposed.probationEnd ? new Date(proposed.probationEnd) : undefined
          }
        });

        // 4. Create JobHistory entry representing the approved change
        await tx.jobHistory.create({
          data: {
            employeeId: wf.employeeId,
            effectiveDate: new Date(), // Takes effect today (when fully approved)
            event: wf.type,
            eventReason: proposed.eventReason || "Approved Change Request",
            company: currentJob?.company || "PeopleFlow Global Inc.",
            legalEntity: currentJob?.legalEntity || "PF USA LLC",
            businessUnit: currentJob?.businessUnit || "Technology",
            division: currentJob?.division || "Product & Engineering",
            department: proposed.department || currentJob?.department || "Unassigned",
            location: proposed.location || currentJob?.location || "Unassigned",
            jobTitle: proposed.jobTitle || currentJob?.jobTitle || "Unassigned",
            position: proposed.position || currentJob?.position || "Unassigned",
            grade: proposed.grade || currentJob?.grade || "Unassigned",
            payGrade: proposed.payGrade || currentJob?.payGrade || "Unassigned",
            fte: proposed.fte ? parseFloat(proposed.fte) : (currentJob?.fte || 1.0),
            employeeClass: proposed.employeeClass || currentJob?.employeeClass || "Regular",
            managerId: proposed.managerId || currentJob?.managerId || null,
            salary: proposed.salary ? parseFloat(proposed.salary) : (currentJob?.salary || 0.0)
          }
        });
      });
    }

    // Update workflow status
    await prisma.workflowRequest.update({
      where: { id },
      data: { status: nextStatus }
    });

    if (nextStatus === "Approved") {
      const empPersonal = await prisma.personalInfo.findUnique({
        where: { employeeId: wf.employeeId }
      });
      const name = empPersonal ? `${empPersonal.firstName} ${empPersonal.lastName}` : "Employee";
      const proposed = JSON.parse(wf.details);

      await logAutomationEvent("Promotion", "n8n Webhook Triggered", "Success", `promotion.approved webhook received for ${name}.`);
      await logAutomationEvent("Promotion", "Slack Alert Sent", "Success", `Posted to #announcements: "Congratulations to ${name} on their promotion to ${proposed.jobTitle || "new role"}!"`);
      await logAutomationEvent("Promotion", "MS Teams Alert Sent", "Success", `Notified department channels about ${name}'s title and compensation adjustment.`);
      await logAutomationEvent("Promotion", "Google Calendar Provisioned", "Success", `Created "1-on-1 Title Sync: ${name}" on calendar.`);
    }

    res.json({ status: nextStatus, message: `Workflow step approved. Status: ${nextStatus}` });
  } catch (error) {
    console.error("Approve workflow error:", error);
    res.status(500).json({ message: "Error approving workflow." });
  }
});

// POST /api/workflows/:id/reject - Reject workflow
router.post("/:id/reject", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;
  const user = (req as any).user;

  try {
    const wf = await prisma.workflowRequest.findUnique({ where: { id } });
    if (!wf) {
      res.status(404).json({ message: "Workflow request not found." });
      return;
    }

    // Check permissions
    if (wf.status === "Pending Manager" && user.role !== "Manager" && user.role !== "Administrator" && user.role !== "HR" && user.role !== "Superadmin") {
      res.status(403).json({ message: "Only managers or HR can reject this step." });
      return;
    }
    if (wf.status === "Pending HR" && user.role !== "HR" && user.role !== "Administrator" && user.role !== "Superadmin") {
      res.status(403).json({ message: "Only HR administrators can reject this step." });
      return;
    }

    await prisma.workflowRequest.update({
      where: { id },
      data: {
        status: "Rejected",
        feedback: feedback || "Rejected by supervisor/HR."
      }
    });

    res.json({ status: "Rejected", message: "Workflow request has been rejected." });
  } catch (error) {
    console.error("Reject workflow error:", error);
    res.status(500).json({ message: "Error rejecting workflow." });
  }
});

export default router;
