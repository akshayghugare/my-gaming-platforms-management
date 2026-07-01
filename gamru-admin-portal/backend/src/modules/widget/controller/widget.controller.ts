import { Request, Response } from "express";
import { AuthRequest } from "../../../types/request.type";
import { errorResponse, successResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";
import {
  validateWidgetService,
  listClientWidgetsService,
  listWidgetConfigsService,
  createWidgetConfigService,
  updateWidgetConfigService,
  toggleWidgetConfigStatusService,
  deleteWidgetConfigService,
} from "../service/widget.service";
import { WidgetConfigStatus } from "../model/widget-configuration.model";

const handle = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof AppError) {
    errorResponse(res, err.statusCode, err.message);
    return;
  }
  errorResponse(res, 500, fallback);
};

/**
 * GET /api/widget/validate?clientId=&authKey=&type=
 * Public — called from inside the embedded iframe (no admin login).
 */
export const validateWidget = async (req: Request, res: Response) => {
  try {
    // The widget makes this request from inside its iframe, so the Origin /
    // Referer headers are the widget host (the gamru frontend), NOT the page
    // the widget is embedded on. The SDK therefore passes the real embedding
    // hostname as ?domain= — prefer it so allowed_domains is matched against
    // the actual parent site. Fall back to Origin/Referer for direct hits.
    const origin =
      (req.query.domain as string | undefined) ||
      req.header("origin") ||
      req.header("referer") ||
      null;

    const data = await validateWidgetService({
      authKey:
        (req.query.authKey as string | undefined) ||
        req.header("x-client-auth-key") ||
        undefined,
      clientId: (req.query.clientId as string | undefined) || undefined,
      widgetType: (req.query.type as string | undefined) || undefined,
      origin,
    });

    successResponse(res, 200, "Widget validated", data);
  } catch (err) {
    handle(res, err, "Widget validation failed");
  }
};

/**
 * GET /api/widget/list?clientId=&authKey=
 * Public — the embedding site lists the active widgets it should render.
 */
export const listClientWidgets = async (req: Request, res: Response) => {
  try {
    const data = await listClientWidgetsService({
      authKey:
        (req.query.authKey as string | undefined) ||
        req.header("x-client-auth-key") ||
        undefined,
      clientId: (req.query.clientId as string | undefined) || undefined,
    });
    successResponse(res, 200, "Widgets fetched successfully", data);
  } catch (err) {
    handle(res, err, "Failed to fetch widgets");
  }
};

/* ---------- admin CRUD ------------------------------------------------ */

export const listWidgetConfigs = async (req: AuthRequest, res: Response) => {
  try {
    const data = await listWidgetConfigsService({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 10),
      search: req.query.search as string | undefined,
      status: req.query.status as WidgetConfigStatus | undefined,
      type: req.query.type as string | undefined,
      client_id: req.query.client_id as string | undefined,
    });
    successResponse(res, 200, "Widgets fetched successfully", data);
  } catch (err) {
    handle(res, err, "Failed to fetch widgets");
  }
};

export const createWidgetConfig = async (req: AuthRequest, res: Response) => {
  try {
    const data = await createWidgetConfigService(req.body);
    successResponse(res, 201, "Widget created successfully", data);
  } catch (err) {
    handle(res, err, "Failed to create widget");
  }
};

export const updateWidgetConfig = async (req: AuthRequest, res: Response) => {
  try {
    const data = await updateWidgetConfigService(req.params.id, req.body);
    successResponse(res, 200, "Widget updated successfully", data);
  } catch (err) {
    handle(res, err, "Failed to update widget");
  }
};

export const toggleWidgetConfigStatus = async (req: AuthRequest, res: Response) => {
  try {
    const data = await toggleWidgetConfigStatusService(req.params.id);
    successResponse(res, 200, "Widget status updated", data);
  } catch (err) {
    handle(res, err, "Failed to update widget status");
  }
};

export const deleteWidgetConfig = async (req: AuthRequest, res: Response) => {
  try {
    await deleteWidgetConfigService(req.params.id);
    successResponse(res, 200, "Widget deleted successfully", null);
  } catch (err) {
    handle(res, err, "Failed to delete widget");
  }
};
