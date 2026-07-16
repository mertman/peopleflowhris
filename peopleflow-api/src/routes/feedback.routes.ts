import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// POST /api/feedback - Anyone logged in can submit feedback
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  const { comment, pageUrl } = req.body;
  const currentUser = (req as any).user;

  if (!comment) {
    res.status(400).json({ message: "Feedback comment text is required." });
    return;
  }

  try {
    // Find the user's name to store with feedback
    const emp = await prisma.employee.findUnique({
      where: { id: currentUser.id },
      include: { personalInfo: true }
    });

    const userName = emp?.personalInfo
      ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`
      : "Unknown User";

    const feedback = await prisma.feedback.create({
      data: {
        userName,
        userEmail: currentUser.email || "unknown@email.com",
        pageUrl: pageUrl || "/",
        comment
      }
    });

    res.status(201).json({ message: "Feedback submitted successfully.", feedback });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ message: `Error submitting feedback: ${error.message}` });
  }
});

// GET /api/feedback - Only System Creator can see all feedbacks
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const currentUser = (req as any).user;

  if (currentUser.role !== "System Creator") {
    res.status(403).json({ message: "Access denied. Only the System Creator can view feedbacks." });
    return;
  }

  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(feedbacks);
  } catch (error: any) {
    console.error("Fetch feedback error:", error);
    res.status(500).json({ message: `Error fetching feedbacks: ${error.message}` });
  }
});

export default router;
