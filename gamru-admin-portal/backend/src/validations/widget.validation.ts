import Joi from "joi";
import { RENDERABLE_WIDGET_TYPES } from "../modules/widget/service/widget.service";

const types = RENDERABLE_WIDGET_TYPES;

const appearanceSchema = Joi.object({
  theme: Joi.string().valid("dark", "light").optional(),
  accent_color: Joi.string().max(20).allow("", null).optional(),
})
  .unknown(true)
  .allow(null)
  .optional();

export const createWidgetSchema = Joi.object({
  client_id: Joi.string().uuid().required().messages({
    "string.guid": "client_id must be a valid UUID",
    "any.required": "Client is required",
  }),
  name: Joi.string().min(2).max(120).required().messages({
    "string.empty": "Widget name is required",
    "any.required": "Widget name is required",
  }),
  type: Joi.string()
    .valid(...types)
    .required()
    .messages({ "any.only": "Invalid widget type" }),
  allowed_domains: Joi.array().items(Joi.string().max(255)).allow(null).optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
  expiry_date: Joi.date().iso().allow(null).optional(),
  appearance: appearanceSchema,
});

export const updateWidgetSchema = Joi.object({
  client_id: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(120).optional(),
  type: Joi.string()
    .valid(...types)
    .optional(),
  allowed_domains: Joi.array().items(Joi.string().max(255)).allow(null).optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
  expiry_date: Joi.date().iso().allow(null).optional(),
  appearance: appearanceSchema,
}).min(1);

export const widgetIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});

export const listWidgetsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("").max(120).optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
  type: Joi.string()
    .valid(...types)
    .optional(),
  client_id: Joi.string().uuid().optional(),
});
