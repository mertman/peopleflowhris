import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// GET /api/org/structure
router.get("/structure", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Return unique lists of corporate elements from current database state to prevent hardcoding
    const jobInfos = await prisma.jobInfo.findMany({
      select: {
        legalEntity: true,
        businessUnit: true,
        division: true,
        department: true,
        location: true,
      }
    });

    const legalEntities = Array.from(new Set(jobInfos.map(j => j.legalEntity)));
    const businessUnits = Array.from(new Set(jobInfos.map(j => j.businessUnit)));
    const divisions = Array.from(new Set(jobInfos.map(j => j.division)));
    const departments = Array.from(new Set(jobInfos.map(j => j.department)));
    const locations = Array.from(new Set(jobInfos.map(j => j.location)));

    res.json({
      legalEntities,
      businessUnits,
      divisions,
      departments,
      locations
    });
  } catch (error) {
    console.error("Org structure fetch error:", error);
    res.status(500).json({ message: "Error fetching organization lists." });
  }
});

// GET /api/org/chart - Returns the supervisor reporting tree structure
router.get("/chart", authenticateToken, async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { status: "Active" },
      include: {
        personalInfo: true,
        jobInfo: true
      }
    });

    // Helper to format flat list into hierarchical nodes
    const formatEmployeeNode = (emp: any) => ({
      id: emp.id,
      name: emp.personalInfo ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : "Unknown",
      title: emp.jobInfo?.jobTitle || "No Title",
      department: emp.jobInfo?.department || "No Dept",
      managerId: emp.jobInfo?.managerId || null,
      role: emp.role,
      email: emp.personalInfo?.email || "",
      avatar: emp.personalInfo ? `${emp.personalInfo.firstName.charAt(0)}${emp.personalInfo.lastName.charAt(0)}` : "U"
    });

    const nodes = employees.map(formatEmployeeNode);

    res.json(nodes);
  } catch (error) {
    console.error("Org chart data fetch error:", error);
    res.status(500).json({ message: "Error generating organizational reporting tree." });
  }
});

export default router;
