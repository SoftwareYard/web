import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const clients = await prisma.client.findMany({ orderBy: { title: "asc" } });
  res.json(clients);
});

clientsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { title, contractDate, domain } = req.body;

  if (!title || !contractDate || !domain) {
    res.status(400).json({ error: "title, contractDate and domain are required" });
    return;
  }

  const client = await prisma.client.create({
    data: { title, contractDate: new Date(contractDate), domain },
  });
  res.status(201).json(client);
});

clientsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { title, contractDate, domain } = req.body;

  if (!title || !contractDate || !domain) {
    res.status(400).json({ error: "title, contractDate and domain are required" });
    return;
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: { title, contractDate: new Date(contractDate), domain },
    });
    res.json(client);
  } catch {
    res.status(404).json({ error: "Client not found" });
  }
});

clientsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Client not found" });
  }
});
