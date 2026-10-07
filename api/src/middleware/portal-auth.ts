import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface PortalAuthRequest extends Request {
  teamMemberId?: string;
}

export async function requireTeamMemberAuth(
  req: PortalAuthRequest,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.portal_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  let teamMemberId: string;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      teamMemberId: string;
    };
    teamMemberId = decoded.teamMemberId;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Ends existing sessions as soon as a member is deactivated
  const member = await prisma.teamMember.findUnique({
    where: { id: teamMemberId },
    select: { isActive: true },
  });
  if (!member?.isActive) {
    res.status(401).json({ error: "Account is inactive" });
    return;
  }

  req.teamMemberId = teamMemberId;
  next();
}
