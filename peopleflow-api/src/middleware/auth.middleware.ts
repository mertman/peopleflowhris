import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

import { prismaStorage } from "../prismaClient";

const JWT_SECRET = process.env.JWT_SECRET || "peopleflow-secret-key-123456";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    
    // Wrap subsequent execution paths under this request's tenant sandbox ID
    prismaStorage.run({ tenantId: decoded.tenantId || "default" }, () => {
      next();
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: "Permission denied. Insufficient privileges." });
      return;
    }
    next();
  };
};
