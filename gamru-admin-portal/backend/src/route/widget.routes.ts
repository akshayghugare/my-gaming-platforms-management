import { Router } from "express";
import {
  validateWidget,
  listClientWidgets,
  listWidgetConfigs,
  createWidgetConfig,
  updateWidgetConfig,
  toggleWidgetConfigStatus,
  deleteWidgetConfig,
} from "../modules/widget/controller/widget.controller";
import { auth } from "../middlewares/auth.middleware";
import { role } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createWidgetSchema,
  updateWidgetSchema,
  widgetIdParamSchema,
  listWidgetsQuerySchema,
} from "../validations/widget.validation";

const router = Router();

// Public — hit from inside the embedded iframe before the widget renders.
// Verifies clientId + authKey + domain + status. No admin login.
router.get("/validate", validateWidget);

// Public — the embedding site lists the active widgets to render.
router.get("/list", listClientWidgets);

// Admin CRUD — manage embeddable iframe widgets.
router.get(
  "/configurations",
  auth,
  role("ADMIN"),
  validate(listWidgetsQuerySchema, "query"),
  listWidgetConfigs
);

router.post(
  "/configurations",
  auth,
  role("ADMIN"),
  validate(createWidgetSchema),
  createWidgetConfig
);

router.post(
  "/configurations/:id",
  auth,
  role("ADMIN"),
  validate(widgetIdParamSchema, "params"),
  validate(updateWidgetSchema, "body"),
  updateWidgetConfig
);

router.post(
  "/configurations/:id/toggle-status",
  auth,
  role("ADMIN"),
  validate(widgetIdParamSchema, "params"),
  toggleWidgetConfigStatus
);

router.delete(
  "/configurations/:id",
  auth,
  role("ADMIN"),
  validate(widgetIdParamSchema, "params"),
  deleteWidgetConfig
);

export default router;
