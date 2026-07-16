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
      jobTitle: employee.jobInfo?.jobTitle,
      originalUser: user.originalUser
    });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ message: "Internal server error fetching user session." });
  }
});

router.post("/register-google", async (req: Request, res: Response) => {
  const { credential, template } = req.body;

  if (!credential) {
    res.status(400).json({ message: "Credential token is required." });
    return;
  }

  let email = "";
  let firstName = "";
  let lastName = "";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  try {
    if (googleClientId && !credential.endsWith(".mock-signature")) {
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
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
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
    try {
      const parts = credential.split(".");
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
        console.log(`[OAuth Debug] Token Audience (from Frontend): ${payload.aud}`);
        console.log(`[OAuth Debug] Server Expected Audience (Render Dashboard): ${googleClientId}`);
      }
    } catch (e) {
      console.error("[OAuth Debug] Failed to decode mismatch details:", e);
    }
    res.status(400).json({ message: `Google account verification failed: ${err.message || "Invalid token."}` });
    return;
  }

  if (!email) {
    res.status(400).json({ message: "No email resolved from authentication." });
    return;
  }

  try {
    // Intercept System Creator user: meeranbreseeg@gmail.com
    const isSystemCreator = email.toLowerCase() === "meeranbreseeg@gmail.com";
    if (isSystemCreator) {
      const creatorTenantId = "system-creator";
      let creatorEmp = await prisma.employee.findFirst({
        where: { tenantId: creatorTenantId, role: "System Creator" },
        include: { personalInfo: true }
      });

      if (!creatorEmp) {
        console.log(`[SystemCreator] Seeding permanent workspace for ${email}...`);
        
        // Clean up any old personal info to prevent email conflicts
        const oldPersonal = await prisma.personalInfo.findUnique({
          where: { email },
          include: { employee: true }
        });
        if (oldPersonal && oldPersonal.employee) {
          const oldTenantId = oldPersonal.employee.tenantId;
          await prisma.workflowRequest.deleteMany({ where: { tenantId: oldTenantId } });
          await prisma.automationLog.deleteMany({ where: { tenantId: oldTenantId } });
          await prisma.position.deleteMany({ where: { tenantId: oldTenantId } });
          await prisma.personalInfo.deleteMany({ where: { employee: { tenantId: oldTenantId } } });
          await prisma.jobInfo.deleteMany({ where: { employee: { tenantId: oldTenantId } } });
          await prisma.jobHistory.deleteMany({ where: { employee: { tenantId: oldTenantId } } });
          await prisma.employee.deleteMany({ where: { tenantId: oldTenantId } });
        }

        // Seed fresh permanent workspace
        await seedSandboxTemplate(creatorTenantId, email, `${firstName} ${lastName}`, "global");

        // Locate and update their Superadmin role to System Creator
        const newlySeededAdmin = await prisma.employee.findFirst({
          where: { tenantId: creatorTenantId, role: "Superadmin" },
          include: { personalInfo: true }
        });
        if (newlySeededAdmin) {
          await prisma.employee.update({
            where: { id: newlySeededAdmin.id },
            data: { role: "System Creator" }
          });
          creatorEmp = await prisma.employee.findUnique({
            where: { id: newlySeededAdmin.id },
            include: { personalInfo: true }
          });
        }
      }

      if (creatorEmp && creatorEmp.personalInfo) {
        const token = jwt.sign(
          { id: creatorEmp.id, role: "System Creator", email: creatorEmp.personalInfo.email, tenantId: creatorTenantId },
          JWT_SECRET,
          { expiresIn: "8h" }
        );
        res.json({
          sandboxExists: true,
          token,
          user: {
            id: creatorEmp.id,
            employeeNumber: creatorEmp.employeeNumber,
            role: "System Creator",
            status: creatorEmp.status,
            firstName: creatorEmp.personalInfo.firstName,
            lastName: creatorEmp.personalInfo.lastName,
            email: creatorEmp.personalInfo.email
          }
        });
        return;
      }
    }

    // Check if user already exists
    const existingPersonal = await prisma.personalInfo.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (existingPersonal && existingPersonal.employee) {
      const emp = existingPersonal.employee;
      const ageInMs = Date.now() - new Date(emp.createdAt).getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      // Self-healing: if the sandbox is fresh but has <= 1 employee, it was a failed/incomplete seed.
      const empCount = await prisma.employee.count({ where: { tenantId: emp.tenantId || "default" } });

      if (ageInMs < oneDayInMs && empCount > 1) {
        // Sandbox is fresh and fully seeded (< 24 hours). Reuse it and log in directly!
        const token = jwt.sign(
          { id: emp.id, role: emp.role, email: existingPersonal.email, tenantId: emp.tenantId || "default" },
          JWT_SECRET,
          { expiresIn: "8h" }
        );

        res.json({
          sandboxExists: true,
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
      } else {
        // Expired or incomplete! We need to wipe and re-create.
        // If template was not provided, return sandboxExists: false so frontend opens modal
        if (!template) {
          res.json({ sandboxExists: false, email, firstName, lastName });
          return;
        }

        // Wipe old sandbox robustly (deleting child tables first to avoid SQLite constraints or orphan records)
        const tenantId = emp.tenantId;
        console.log(`[Wiper] Sandbox expired or incomplete for ${email} (Tenant: ${tenantId}). Wiping...`);
        await prisma.workflowRequest.deleteMany({ where: { tenantId } });
        await prisma.automationLog.deleteMany({ where: { tenantId } });
        await prisma.position.deleteMany({ where: { tenantId } });
        await prisma.personalInfo.deleteMany({ where: { employee: { tenantId } } });
        await prisma.jobInfo.deleteMany({ where: { employee: { tenantId } } });
        await prisma.jobHistory.deleteMany({ where: { employee: { tenantId } } });
        await prisma.employee.deleteMany({ where: { tenantId } });
      }
    } else {
      // Sandbox does not exist!
      if (!template) {
        res.json({ sandboxExists: false, email, firstName, lastName });
        return;
      }
    }

    // Generate unique tenant ID for this user sandbox
    const userClean = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const tenantId = `tenant-${userClean}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullName = `${firstName} ${lastName}`;
    
    // Seed the database sandbox
    await seedSandboxTemplate(tenantId, email, fullName, template);

    // Fetch the newly created admin employee (role is Superadmin!)
    const adminEmployee = await prisma.employee.findFirst({
      where: { tenantId, role: "Superadmin" },
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

// POST /api/auth/proxy - Start proxy session
router.post("/proxy", authenticateToken, async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { targetEmployeeId } = req.body;

  if (!targetEmployeeId) {
    res.status(400).json({ message: "targetEmployeeId is required." });
    return;
  }

  // Only Superadmin or Administrator can proxy
  if (currentUser.role !== "Superadmin" && currentUser.role !== "Administrator") {
    res.status(403).json({ message: "Permission denied. Only Superadmin or Administrator can proxy." });
    return;
  }

  try {
    const targetEmployee = await prisma.employee.findFirst({
      where: { id: targetEmployeeId },
      include: { personalInfo: true }
    });

    if (!targetEmployee) {
      res.status(404).json({ message: "Target employee not found." });
      return;
    }

    // Create a proxy token
    // Save original user context so we can revert
    const originalUser = {
      id: currentUser.originalUser?.id || currentUser.id,
      role: currentUser.originalUser?.role || currentUser.role,
      email: currentUser.originalUser?.email || currentUser.email,
      tenantId: currentUser.originalUser?.tenantId || currentUser.tenantId
    };

    const token = jwt.sign(
      {
        id: targetEmployee.id,
        role: targetEmployee.role,
        email: targetEmployee.personalInfo?.email,
        tenantId: currentUser.tenantId,
        originalUser
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: targetEmployee.id,
        employeeNumber: targetEmployee.employeeNumber,
        role: targetEmployee.role,
        status: targetEmployee.status,
        firstName: targetEmployee.personalInfo?.firstName,
        lastName: targetEmployee.personalInfo?.lastName,
        email: targetEmployee.personalInfo?.email,
        originalUser
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ message: "Error establishing proxy session." });
  }
});

// POST /api/auth/exit-proxy - Exit proxy session and restore original user
router.post("/exit-proxy", authenticateToken, async (req: Request, res: Response) => {
  const currentUser = (req as any).user;

  if (!currentUser.originalUser) {
    res.status(400).json({ message: "Not currently in a proxy session." });
    return;
  }

  try {
    const original = currentUser.originalUser;

    // Verify original employee exists
    const originalEmployee = await prisma.employee.findUnique({
      where: { id: original.id },
      include: { personalInfo: true }
    });

    if (!originalEmployee) {
      res.status(404).json({ message: "Original user not found." });
      return;
    }

    const token = jwt.sign(
      {
        id: originalEmployee.id,
        role: originalEmployee.role,
        email: originalEmployee.personalInfo?.email,
        tenantId: original.tenantId
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: originalEmployee.id,
        employeeNumber: originalEmployee.employeeNumber,
        role: originalEmployee.role,
        status: originalEmployee.status,
        firstName: originalEmployee.personalInfo?.firstName,
        lastName: originalEmployee.personalInfo?.lastName,
        email: originalEmployee.personalInfo?.email
      }
    });
  } catch (error) {
    console.error("Exit proxy error:", error);
    res.status(500).json({ message: "Error exiting proxy session." });
  }
});

// POST /api/auth/reset-sandbox - Reset user sandbox to initial seed state
router.post("/reset-sandbox", authenticateToken, async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const tenantId = currentUser.tenantId || "default";

  // Prevent resetting standard "default" tenant
  if (tenantId === "default") {
    res.status(400).json({ message: "Cannot reset default sandbox." });
    return;
  }

  try {
    // Find the root admin user's details for this tenant
    const adminEmp = await prisma.employee.findFirst({
      where: { tenantId, role: "System Creator" },
      include: { personalInfo: true }
    }) || await prisma.employee.findFirst({
      where: { tenantId, role: "Superadmin" },
      include: { personalInfo: true }
    }) || await prisma.employee.findFirst({
      where: { tenantId, role: "Administrator" },
      include: { personalInfo: true }
    });

    if (!adminEmp || !adminEmp.personalInfo) {
      res.status(404).json({ message: "Sandbox administrator details not found." });
      return;
    }

    const email = adminEmp.personalInfo.email;
    const fullName = `${adminEmp.personalInfo.firstName} ${adminEmp.personalInfo.lastName}`;

    // Determine current template by counting employees before wiping
    const empCount = await prisma.employee.count({ where: { tenantId } });
    const template = empCount > 50 ? "global" : "smallbusiness";

    console.log(`[Wiper] Sandbox reset requested by ${email} (Tenant: ${tenantId}, Template: ${template}). Wiping...`);

    // Delete in correct order to respect constraints
    await prisma.workflowRequest.deleteMany({ where: { tenantId } });
    await prisma.automationLog.deleteMany({ where: { tenantId } });
    await prisma.position.deleteMany({ where: { tenantId } });
    await prisma.personalInfo.deleteMany({ where: { employee: { tenantId } } });
    await prisma.jobInfo.deleteMany({ where: { employee: { tenantId } } });
    await prisma.jobHistory.deleteMany({ where: { employee: { tenantId } } });
    await prisma.employee.deleteMany({ where: { tenantId } });

    // Seed a fresh sandbox template
    await seedSandboxTemplate(tenantId, email, fullName, template);

    // Fetch the newly created admin employee (now Superadmin!)
    let freshAdmin = await prisma.employee.findFirst({
      where: { tenantId, role: "Superadmin" },
      include: { personalInfo: true }
    });

    if (freshAdmin && tenantId === "system-creator") {
      await prisma.employee.update({
        where: { id: freshAdmin.id },
        data: { role: "System Creator" }
      });
      freshAdmin = await prisma.employee.findUnique({
        where: { id: freshAdmin.id },
        include: { personalInfo: true }
      });
    }

    if (!freshAdmin) {
      res.status(500).json({ message: "Failed to locate fresh sandbox administrator." });
      return;
    }

    // Issue a fresh token for the newly created Superadmin
    const token = jwt.sign(
      { id: freshAdmin.id, role: freshAdmin.role, email: freshAdmin.personalInfo?.email, tenantId },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Sandbox successfully reset.",
      token,
      user: {
        id: freshAdmin.id,
        employeeNumber: freshAdmin.employeeNumber,
        role: freshAdmin.role,
        status: freshAdmin.status,
        firstName: freshAdmin.personalInfo?.firstName,
        lastName: freshAdmin.personalInfo?.lastName,
        email: freshAdmin.personalInfo?.email
      }
    });
  } catch (error: any) {
    console.error("Sandbox reset error:", error);
    res.status(500).json({ message: `Error resetting sandbox: ${error.message}` });
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
