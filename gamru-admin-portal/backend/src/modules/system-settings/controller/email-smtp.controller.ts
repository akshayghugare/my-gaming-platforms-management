import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../types/request.type";
import {
  listEmailSmtpService,
  getEmailSmtpService,
  upsertEmailSmtpService,
} from "../service/email-smtp.service";
import { errorResponse, successResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";

export const listEmailSmtp = async (
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await listEmailSmtpService();
    successResponse(res, 200, "Email SMTP configs fetched successfully", data);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(res, error.statusCode, error.message);
    return errorResponse(res, 500, "Failed to fetch email SMTP configs");
  }
};

export const getEmailSmtp = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await getEmailSmtpService(req.params.type);
    successResponse(res, 200, "Email SMTP config fetched successfully", data);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(res, error.statusCode, error.message);
    return errorResponse(res, 500, "Failed to fetch email SMTP config");
  }
};

export const upsertEmailSmtp = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await upsertEmailSmtpService(req.params.type, req.body);
    successResponse(res, 200, "Email SMTP config saved successfully", data);
  } catch (error) {
    if (error instanceof AppError) return errorResponse(res, error.statusCode, error.message);
    return errorResponse(res, 500, "Failed to save email SMTP config");
  }
};
