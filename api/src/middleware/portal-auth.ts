import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface PortalAuthRequest extends Request {
  teamMemberId?: string;
}

export function requireTeamMemberAuth(
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      teamMemberId: string;
    };
    req.teamMemberId = decoded.teamMemberId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
