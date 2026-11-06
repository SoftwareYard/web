import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  adminId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      adminId?: string;
    };
    // Portal (employee) tokens share the secret but carry teamMemberId,
    // so a valid signature alone must not grant admin access
    if (typeof decoded.adminId !== "string") {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    req.adminId = decoded.adminId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}

// For endpoints that serve both the public site and the CMS: returns the
// admin id when the request carries a valid admin token, otherwise undefined.
export function getAdminId(req: Request): string | undefined {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!token) return undefined;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      adminId?: string;
    };
    return typeof decoded.adminId === "string" ? decoded.adminId : undefined;
  } catch {
    return undefined;
  }
}

// Employee portal session, for endpoints shared by the CMS and the portal
export function getTeamMemberId(req: Request): string | undefined {
  const token =
    req.cookies?.portal_token ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!token) return undefined;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      teamMemberId?: string;
    };
    return typeof decoded.teamMemberId === "string" ? decoded.teamMemberId : undefined;
  } catch {
    return undefined;
  }
}

export async function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.adminId },
    include: { role: true },
  });

  if (!admin || admin.role.name !== "SuperAdmin") {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }

  next();
}
