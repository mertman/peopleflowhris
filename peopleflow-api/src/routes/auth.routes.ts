import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.middleware";

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "peopleflow-secret-key-123456";

// Login endpoint (supports normal email/password and quick-switch demo login)
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, demoRole } = req.body;

  try {
    let employee;

    // Handle Quick Demo Login
    if (demoRole) {
      employee = await prisma.employee.findFirst({
        where: { role: demoRole },
        include: { personalInfo: true }
      });

      if (!employee) {
        res.status(404).json({ message: `No employee found with role: ${demoRole}` });
        return;
      }
    } else {
      // Normal Login
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required." });
        return;
      }

      const personal = await prisma.personalInfo.findUnique({
        where: { email },
        include: { employee: true }
      });

      if (!personal || !personal.employee) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }

      employee = personal.employee;
      const isPasswordValid = bcrypt.compareSync(password, employee.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }
    }

    // Include personal info
    const personalInfo = await prisma.personalInfo.findUnique({
      where: { employeeId: employee.id }
    });

    const token = jwt.sign(
      { id: employee.id, role: employee.role, email: personalInfo?.email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        role: employee.role,
        status: employee.status,
        firstName: personalInfo?.firstName,
        lastName: personalInfo?.lastName,
        email: personalInfo?.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
});

// Get current authenticated user details
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      include: {
        personalInfo: true,
        jobInfo: true
      }
    });

    if (!employee) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.json({
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      role: employee.role,
      status: employee.status,
      firstName: employee.personalInfo?.firstName,
      lastName: employee.personalInfo?.lastName,
      email: employee.personalInfo?.email,
      department: employee.jobInfo?.department,
      jobTitle: employee.jobInfo?.jobTitle
    });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ message: "Internal server error fetching user session." });
  }
});

export default router;
