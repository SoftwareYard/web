import { Router, Response } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { uploadToBunny, deleteFromBunny } from "../lib/bunny";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const assetImagesRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

assetImagesRouter.use(requireAuth);

assetImagesRouter.get("/", async (req: AuthRequest, res: Response) => {
  const assetId = String(req.params.assetId);
  const images = await prisma.assetImage.findMany({
    where: { assetId },
    orderBy: { createdAt: "asc" },
  });
  res.json(images);
});

assetImagesRouter.post(
  "/",
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    const assetId = String(req.params.assetId);

    if (!req.file) {
      res.status(400).json({ error: "Image file is required" });
      return;
    }

    try {
      const url = await uploadToBunny(req.file.buffer, req.file.originalname, "Assets");
      const image = await prisma.assetImage.create({
        data: { assetId, url, fileName: req.file.originalname },
      });
      res.status(201).json(image);
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

assetImagesRouter.delete("/:imageId", async (req: AuthRequest, res: Response) => {
  const imageId = String(req.params.imageId);

  try {
    const image = await prisma.assetImage.delete({ where: { id: imageId } });
    await deleteFromBunny(image.url).catch(() => {});
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: "Image not found" });
  }
});
