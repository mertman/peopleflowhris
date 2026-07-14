import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// GET /api/automation/logs - Fetch execution logs
router.get("/logs", authenticateToken, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.automationLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 30
    });
    res.json(logs);
  } catch (error) {
    console.error("Fetch automation logs error:", error);
    res.status(500).json({ message: "Error fetching automation logs." });
  }
});

// Helper function to log events in the database
export const logAutomationEvent = async (workflow: string, event: string, status: string, details: string) => {
  try {
    await prisma.automationLog.create({
      data: {
        workflowName: workflow,
        event,
        status,
        details
      }
    });
  } catch (e) {
    console.error("Log automation event error:", e);
  }
};

// POST /api/automation/sign-contract - Complete DocuSign and run follow-up steps
router.post("/sign-contract", authenticateToken, async (req: Request, res: Response) => {
  const { employeeId } = req.body;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { personalInfo: true, jobInfo: true }
    });

    if (!employee || !employee.personalInfo) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const name = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`;

    // Simulate n8n e-signature callback actions
    await logAutomationEvent(
      "Onboarding",
      "DocuSign Signed",
      "Success",
      `${name} completed e-signature on Employment Offer Letter.`
    );

    // Create Google Drive folder
    await logAutomationEvent(
      "Onboarding",
      "Google Drive Folder Created",
      "Success",
      `Folder "Employees / ${name} (${employee.employeeNumber})" provisioned.`
    );

    // Create Google Calendar event
    const startDate = employee.jobInfo?.hireDate ? new Date(employee.jobInfo.hireDate).toLocaleDateString() : new Date().toLocaleDateString();
    await logAutomationEvent(
      "Onboarding",
      "Google Calendar Provisioned",
      "Success",
      `Created event "First Day: ${name}" on ${startDate}.`
    );

    // Slack Notification
    await logAutomationEvent(
      "Onboarding",
      "Slack Alert Sent",
      "Success",
      `Posted to channel #people-ops: "Contract signed! Welcome aboard, ${name} (${employee.jobInfo?.jobTitle})!"`
    );

    res.json({ message: "DocuSign signed. n8n workflow finished successfully." });
  } catch (error) {
    console.error("Sign contract error:", error);
    res.status(500).json({ message: "Error executing signature workflow." });
  }
});

// POST /api/automation/trigger-mock - Manual trigger for simulation logs
router.post("/trigger-mock", authenticateToken, async (req: Request, res: Response) => {
  const { workflowName } = req.body;

  try {
    if (workflowName === "Onboarding") {
      await logAutomationEvent("Onboarding", "n8n Webhook Triggered", "Success", "onboarding.new_hire webhook received.");
      await logAutomationEvent("Onboarding", "OpenAI Offer Letter Generated", "Success", "Standard offer letter compiled using OpenAI GPT-4o template.");
      await logAutomationEvent("Onboarding", "DocuSign Envelope Sent", "Success", "Contract dispatched to employee for signing.");
    } else if (workflowName === "Promotion") {
      await logAutomationEvent("Promotion", "n8n Webhook Triggered", "Success", "promotion.approved webhook received.");
      await logAutomationEvent("Promotion", "Slack Alert Sent", "Success", "Alerted #hr-operations: Promotion approved for John Smith.");
      await logAutomationEvent("Promotion", "MS Teams Alert Sent", "Success", "Notified John's team via MS Teams channels.");
    } else {
      res.status(400).json({ message: "Invalid workflow name." });
      return;
    }

    res.json({ message: "Mock workflow logs generated." });
  } catch (e) {
    res.status(500).json({ message: "Error generating mock logs." });
  }
});

export default router;
