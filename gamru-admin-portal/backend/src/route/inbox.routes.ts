/**
 * Player on-site INBOX — the read side of the campaign channel, and the
 * campaign half of the integration bridge (parallel to the mission / tournament
 * progression routes). Mounted at `/api/inbox` and gated by `x-client-auth-key`
 * (clientAuth), because the games platform calls these on behalf of its
 * logged-in player, resolved by email. Handlers live in the integration module
 * (`integration-campaign.controller`), beside `integration-progress.controller`.
 */
import { Router } from "express";
import {
  listInbox,
  readInbox,
  clickInbox,
  unsubscribeInbox,
} from "../modules/integration/controller/integration-campaign.controller";
import { clientAuth } from "../middlewares/clientAuth.middleware";

const router = Router();

// POST so the player's email travels in the body (same as /players/by-email).
router.post("/list", clientAuth, listInbox);
router.post("/unsubscribe", clientAuth, unsubscribeInbox);
router.post("/:id/read", clientAuth, readInbox);
router.post("/:id/click", clientAuth, clickInbox);

export default router;
