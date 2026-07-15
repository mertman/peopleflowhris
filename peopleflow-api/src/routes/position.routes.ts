import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/positions - List all positions with incumbent link
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        incumbent: {
          include: {
            personalInfo: true,
            jobInfo: true
          }
        }
      },
      orderBy: { code: "asc" }
    });
    res.json(positions);
  } catch (error) {
    console.error("Fetch positions error:", error);
    res.status(500).json({ message: "Error fetching positions." });
  }
});

// POST /api/positions - Create position
router.post("/", authenticateToken, requireRole(["HR", "Administrator"]), async (req: Request, res: Response) => {
  const { code, title, department, location } = req.body;

  try {
    if (!code || !title || !department || !location) {
      res.status(400).json({ message: "All position fields are required." });
      return;
    }

    const position = await prisma.position.create({
      data: {
        code,
        title,
        department,
        location
      }
    });

    res.status(201).json({ position, message: "Position created successfully." });
  } catch (error: any) {
    console.error("Create position error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ message: "A position with this code already exists." });
    } else {
      res.status(500).json({ message: "Error creating position." });
    }
  }
});

// PUT /api/positions/:id - Update position (e.g. assign incumbent)
router.put("/:id", authenticateToken, requireRole(["HR", "Administrator"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { code, title, department, location, incumbentId } = req.body;

  try {
    // Check if position exists
    const existing = await prisma.position.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ message: "Position not found." });
      return;
    }

    // Check if incumbent is already assigned to another position
    if (incumbentId && incumbentId !== existing.incumbentId) {
      const positionWithIncumbent = await prisma.position.findFirst({
        where: { incumbentId }
      });
      if (positionWithIncumbent) {
        res.status(400).json({ 
          message: `This employee is already assigned to position: ${positionWithIncumbent.title} (${positionWithIncumbent.code})` 
        });
        return;
      }
    }

    const updated = await prisma.position.update({
      where: { id },
      data: {
        code: code || existing.code,
        title: title || existing.title,
        department: department || existing.department,
        location: location || existing.location,
        incumbentId: incumbentId === "" ? null : incumbentId || existing.incumbentId
      }
    });

    res.json({ updated, message: "Position updated successfully." });
  } catch (error) {
    console.error("Update position error:", error);
    res.status(500).json({ message: "Error updating position." });
  }
});

export default router;
