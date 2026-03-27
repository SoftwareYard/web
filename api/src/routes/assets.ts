import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const assetsRouter = Router();

assetsRouter.use(requireAuth);

assetsRouter.get("/", async (_req: AuthRequest, res: Response) => {
  const assets = await prisma.asset.findMany({
    include: {
      store: { select: { id: true, title: true } },
      assetType: { select: { id: true, type: true } },
      currentHolder: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(assets);
});

assetsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { storeId, assetTypeId, purchaseDate, amount, serialNumber, yearOfManufacture, currentHolderId } = req.body;

  if (!storeId || !assetTypeId || !purchaseDate || amount === undefined || !serialNumber || !yearOfManufacture) {
    res.status(400).json({ error: "storeId, assetTypeId, purchaseDate, amount, serialNumber and yearOfManufacture are required" });
    return;
  }

  const asset = await prisma.asset.create({
    data: {
      storeId,
      assetTypeId,
      purchaseDate: new Date(purchaseDate),
      amount: Number(amount),
      serialNumber,
      yearOfManufacture: Number(yearOfManufacture),
      currentHolderId: currentHolderId || null,
    },
    include: {
      store: { select: { id: true, title: true } },
      assetType: { select: { id: true, type: true } },
      currentHolder: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(asset);
});

assetsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { storeId, assetTypeId, purchaseDate, amount, serialNumber, yearOfManufacture, currentHolderId } = req.body;

  const data: {
    storeId?: string;
    assetTypeId?: string;
    purchaseDate?: Date;
    amount?: number;
    serialNumber?: string;
    yearOfManufacture?: number;
    currentHolderId?: string | null;
  } = {};

  if (storeId !== undefined) data.storeId = storeId;
  if (assetTypeId !== undefined) data.assetTypeId = assetTypeId;
  if (purchaseDate !== undefined) data.purchaseDate = new Date(purchaseDate);
  if (amount !== undefined) data.amount = Number(amount);
  if (serialNumber !== undefined) data.serialNumber = serialNumber;
  if (yearOfManufacture !== undefined) data.yearOfManufacture = Number(yearOfManufacture);
  if (currentHolderId !== undefined) data.currentHolderId = currentHolderId || null;

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const asset = await prisma.asset.update({
      where: { id },
      data,
      include: {
      store: { select: { id: true, title: true } },
      assetType: { select: { id: true, type: true } },
      currentHolder: { select: { id: true, name: true } },
    },
    });
    res.json(asset);
  } catch {
    res.status(404).json({ error: "Asset not found" });
  }
});

assetsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    await prisma.asset.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Asset not found" });
  }
});
