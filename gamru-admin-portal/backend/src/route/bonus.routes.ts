import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { clientAuth } from "../middlewares/clientAuth.middleware";
import {
  listBonuses,
  listUserBonuses,
  recordClaim,
} from "../modules/bonus/controller/bonus.controller";

/** /api/bonuses — synced SDLCGames bonus definitions (operator, admin JWT). */
const bonusesRouter = Router();
bonusesRouter.get("/", auth, listBonuses);

/**
 * /api/user-bonuses — claimed-bonus ledger mirror. Operator list (admin JWT)
 * plus the S2S record endpoint the games platform calls on claim (clientAuth).
 */
const userBonusesRouter = Router();
userBonusesRouter.get("/", auth, listUserBonuses);
userBonusesRouter.post("/record", clientAuth, recordClaim);

export { bonusesRouter, userBonusesRouter };
