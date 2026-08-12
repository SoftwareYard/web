import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

export const assetHistoryRouter = Router({ mergeParams: true });

assetHistoryRouter.use(requireAuth);

assetHistoryRouter.get("/", async (req: AuthRequest, res: Response) => {
  const assetId = String(req.params.assetId);
  const history = await prisma.assetHistory.findMany({
    where: { assetId },
    include: {
      teamMember: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: "desc" },
  });
  res.json(history);
});
