import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    success: true,
    admin: { id: admin.id, username: admin.username, name: admin.name },
  });
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true });
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.adminId },
    select: { id: true, username: true, name: true },
  });

  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  res.json({ admin });
});
