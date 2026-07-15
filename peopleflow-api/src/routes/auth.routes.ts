import { Router, Request, Response } from "express";
import { prisma } from "../prismaClient";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.middleware";
import { seedSandboxTemplate } from "../utils/starterTemplates";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "peopleflow-secret-key-123456";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      { id: employee.id, role: employee.role, email: personalInfo?.email, tenantId: employee.tenantId || "default" },
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

router.post("/register-google", async (req: Request, res: Response) => {
  const { credential, template } = req.body;

  if (!credential || !template) {
    res.status(400).json({ message: "Credential token and template are required." });
    return;
  }

  let email = "";
  let firstName = "";
  let lastName = "";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  try {
    if (googleClientId) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId
      });
      const payload = ticket.getPayload();
      if (!payload) {
        res.status(400).json({ message: "Invalid ID token payload." });
        return;
      }
      email = payload.email || "";
      firstName = payload.given_name || "Admin";
      lastName = payload.family_name || "User";
    } else {
      // Unverified fallback decoding
      const parts = credential.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        email = payload.email || "";
        firstName = payload.given_name || "Admin";
        lastName = payload.family_name || "User";
      } else {
        email = req.body.email || "test@gmail.com";
        firstName = req.body.firstName || "Test";
        lastName = req.body.lastName || "User";
      }
    }
  } catch (err: any) {
    console.error("[OAuth] Verification failed:", err);
    res.status(400).json({ message: `Google account verification failed: ${err.message || "Invalid token."}` });
    return;
  }

  if (!email) {
    res.status(400).json({ message: "No email resolved from authentication." });
    return;
  }

  try {
    // Check if user already exists
    const existingPersonal = await prisma.personalInfo.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (existingPersonal && existingPersonal.employee) {
      // User has already registered a sandbox. Log them in directly.
      const emp = existingPersonal.employee;
      const token = jwt.sign(
        { id: emp.id, role: emp.role, email: existingPersonal.email, tenantId: emp.tenantId || "default" },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        token,
        user: {
          id: emp.id,
          employeeNumber: emp.employeeNumber,
          role: emp.role,
          status: emp.status,
          firstName: existingPersonal.firstName,
          lastName: existingPersonal.lastName,
          email: existingPersonal.email
        }
      });
      return;
    }

    // Generate unique tenant ID for this user sandbox
    const userClean = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const tenantId = `tenant-${userClean}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullName = `${firstName} ${lastName}`;
    
    // Seed the database sandbox
    await seedSandboxTemplate(tenantId, email, fullName, template);

    // Fetch the newly created admin employee
    const adminEmployee = await prisma.employee.findFirst({
      where: { tenantId, role: "Administrator" },
      include: { personalInfo: true }
    });

    if (!adminEmployee || !adminEmployee.personalInfo) {
      res.status(500).json({ message: "Error initializing sandbox environment." });
      return;
    }

    const token = jwt.sign(
      { id: adminEmployee.id, role: adminEmployee.role, email: adminEmployee.personalInfo.email, tenantId },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: adminEmployee.id,
        employeeNumber: adminEmployee.employeeNumber,
        role: adminEmployee.role,
        status: adminEmployee.status,
        firstName: adminEmployee.personalInfo.firstName,
        lastName: adminEmployee.personalInfo.lastName,
        email: adminEmployee.personalInfo.email
      }
    });
  } catch (error) {
    console.error("Google registration error:", error);
    res.status(500).json({ message: "Error creating sandbox environment." });
  }
});

// Diagnostics route to test database connection
router.get("/test-db", async (req: Request, res: Response) => {
  try {
    const count = await prisma.employee.count();
    res.json({ status: "success", count });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack
    });
  }
});

export default router;
