import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireTeamMemberAuth, PortalAuthRequest } from "../middleware/portal-auth";

export const portalAuthRouter = Router();

const profileSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  address: true,
  dateOfBirth: true,
  secondContactName: true,
  secondContactPhone: true,
};

portalAuthRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const member = await prisma.teamMember.findUnique({ where: { email } });
  if (!member || !member.password || !(await bcrypt.compare(password, member.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ teamMemberId: member.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.cookie("portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    success: true,
    member: { id: member.id, email: member.email, name: member.name },
  });
});

portalAuthRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("portal_token", { path: "/" });
  res.json({ success: true });
});

portalAuthRouter.get(
  "/me",
  requireTeamMemberAuth,
  async (req: PortalAuthRequest, res: Response) => {
    const member = await prisma.teamMember.findUnique({
      where: { id: req.teamMemberId },
      select: profileSelect,
    });

    if (!member) {
      res.status(404).json({ error: "Team member not found" });
      return;
    }

    res.json({ member });
  }
);

portalAuthRouter.put(
  "/me",
  requireTeamMemberAuth,
  async (req: PortalAuthRequest, res: Response) => {
    const { phone, address, dateOfBirth, secondContactName, secondContactPhone } = req.body;

    const member = await prisma.teamMember.update({
      where: { id: req.teamMemberId },
      data: {
        phone: phone || null,
        address: address || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        secondContactName: secondContactName || null,
        secondContactPhone: secondContactPhone || null,
      },
      select: profileSelect,
    });

    res.json({ member });
  }
);
