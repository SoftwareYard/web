import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSuperAdmin, AuthRequest } from "../middleware/auth";

export const adminsRouter = Router();

adminsRouter.use(requireAuth, requireSuperAdmin);

adminsRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const admins = await prisma.adminUser.findMany({
    where: { role: { name: "Admin" } },
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });

  res.json(
    admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role.name,
      createdAt: a.createdAt,
    }))
  );
});

adminsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  const adminRole = await prisma.adminRole.findUnique({
    where: { name: "Admin" },
  });

  if (!adminRole) {
    res.status(500).json({ error: "Admin role not found" });
    return;
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.create({
    data: { name, email, password: hashed, roleId: adminRole.id },
    include: { role: true },
  });

  res.status(201).json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role.name,
    createdAt: admin.createdAt,
  });
});

adminsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { name, email, password } = req.body;

  const data: { name?: string; email?: string; password?: string } = {};
  if (name) data.name = name as string;
  if (email) data.email = email as string;
  if (password) data.password = await bcrypt.hash(password as string, 10);

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const admin = await prisma.adminUser.update({
      where: { id },
      data,
      include: { role: true },
    });

    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role.name,
      createdAt: admin.createdAt,
    });
  } catch {
    res.status(404).json({ error: "Admin not found" });
  }
});

adminsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  if (id === req.adminId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  try {
    await prisma.adminUser.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Admin not found" });
  }
});
