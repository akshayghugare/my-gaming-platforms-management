import ClientRepository from "../../client/model/client.repository";
import WidgetConfigurationRepository from "../model/widget-configuration.repository";
import { WidgetConfigStatus } from "../model/widget-configuration.model";
import { AppError } from "../../../utils/AppError";

/**
 * The widget types an external site may embed via an iframe. Each maps to a
 * `/widget/<type>` page on the gamru frontend. Kept here so the validate
 * endpoint, the CRUD validation and the frontend share one source of truth.
 */
export const WIDGET_TYPES = [
  "mission",
  "mission-bundle",
  "tournament",
  "reward-shop",
  "rewards",
  "campaign",
  "rankings",
  "profile",
  "status",
  "progress",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

/**
 * Smaller, inline "data" widgets embedded via the loader script
 * (`<div class="gamification_widget" data-type="...">`). They are renderable
 * but not separately managed in the admin CRUD (which uses WIDGET_TYPES).
 */
export const EMBED_WIDGET_TYPES = [
  "gamification-data",
  "tokens",
  "points",
  "avatar",
  "badge-level",
] as const;

/** Everything the `/widget/:type` page can render. */
export const RENDERABLE_WIDGET_TYPES: string[] = [
  ...WIDGET_TYPES,
  ...EMBED_WIDGET_TYPES,
];

/* -------------------------------------------------------------------------- */
/* Validation (public — called from inside the iframe before rendering)        */
/* -------------------------------------------------------------------------- */

export interface ValidateWidgetInput {
  authKey?: string;
  clientId?: string;
  widgetType?: string;
  /** Origin / Referer of the embedding page (for domain whitelisting). */
  origin?: string | null;
}

/** Extract a bare hostname from an Origin / Referer / plain-domain string. */
const hostOf = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    const stripped = value.replace(/^https?:\/\//, "").split("/")[0];
    return stripped ? stripped.toLowerCase() : null;
  }
};

const domainAllowed = (allowed: string[], origin?: string | null): boolean => {
  if (allowed.length === 0) return true;
  const host = hostOf(origin);
  return !!host && allowed.some((d) => (hostOf(d) ?? d.toLowerCase()) === host);
};

/**
 * Validates an iframe widget request before it is allowed to render.
 *
 *   1. widget type is known
 *   2. auth key present  → else Unauthorized
 *   3. client exists for that auth key → else Invalid Auth Key
 *   4. clientId (if supplied) matches that client → else Invalid Client
 *   5. client is active → else Widget inactive
 *   6. if the admin configured a widget row for this (client, type), enforce
 *      its status, expiry and domain whitelist; otherwise fall back to the
 *      client-level `meta.allowed_domains`.
 */
export const validateWidgetService = async (input: ValidateWidgetInput) => {
  const { authKey, clientId, widgetType, origin } = input;

  if (widgetType && !RENDERABLE_WIDGET_TYPES.includes(widgetType)) {
    throw new AppError(`Unknown widget type: ${widgetType}`, 400);
  }

  if (!authKey) {
    throw new AppError("Unauthorized", 401);
  }

  const client = await ClientRepository.findByAuthKey(authKey);
  if (!client) {
    throw new AppError("Invalid Auth Key", 401);
  }

  if (
    clientId &&
    clientId !== client.slug &&
    clientId !== client.skin_id &&
    clientId !== client.id
  ) {
    throw new AppError("Invalid Client", 401);
  }

  if (client.status === "DISABLED") {
    throw new AppError("Widget inactive", 403);
  }

  let widgetConfigId: string | null = null;

  // Per-widget configuration (created by an admin) takes precedence.
  if (widgetType) {
    const configs = await WidgetConfigurationRepository.findByClientAndType(
      client.id,
      widgetType
    );

    if (configs.length > 0) {
      const now = new Date();
      const usable = configs.find(
        (c) =>
          c.status === "ACTIVE" &&
          (!c.expiry_date || new Date(c.expiry_date) > now)
      );

      if (!usable) {
        const anyActive = configs.some((c) => c.status === "ACTIVE");
        throw new AppError(anyActive ? "Widget expired" : "Widget inactive", 403);
      }

      const allowed = Array.isArray(usable.allowed_domains)
        ? usable.allowed_domains
        : [];
      if (!domainAllowed(allowed, origin)) {
        throw new AppError("Domain Not Allowed", 403);
      }

      widgetConfigId = usable.id;
      return {
        validated: true,
        widget_type: widgetType,
        widget_config_id: widgetConfigId,
        appearance: usable.appearance ?? null,
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug,
          skin_id: client.skin_id,
        },
      };
    }
  }

  // Fallback: client-level domain whitelist (opt-in via meta.allowed_domains).
  const meta = (client.meta as Record<string, unknown> | null) ?? null;
  const clientAllowed = Array.isArray(meta?.allowed_domains)
    ? (meta!.allowed_domains as string[])
    : [];
  if (!domainAllowed(clientAllowed, origin)) {
    throw new AppError("Domain Not Allowed", 403);
  }

  return {
    validated: true,
    widget_type: widgetType ?? null,
    widget_config_id: widgetConfigId,
    appearance: null,
    client: {
      id: client.id,
      name: client.name,
      slug: client.slug,
      skin_id: client.skin_id,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* CRUD (admin — manage embeddable iframe widgets)                            */
/* -------------------------------------------------------------------------- */

export interface WidgetConfigInput {
  client_id: string;
  name: string;
  type: string;
  allowed_domains?: string[] | null;
  status?: WidgetConfigStatus;
  expiry_date?: string | Date | null;
  appearance?: Record<string, unknown> | null;
}

const assertClient = async (client_id: string) => {
  const client = await ClientRepository.findByPk(client_id);
  if (!client) throw new AppError("Client not found", 404);
  return client;
};

export const listWidgetConfigsService = (params: {
  page: number;
  limit: number;
  search?: string;
  status?: WidgetConfigStatus;
  type?: string;
  client_id?: string;
}) => WidgetConfigurationRepository.paginateWidgets(params);

/**
 * Active, non-expired widgets configured for a client — consumed by the
 * embedding site so it only renders widgets an admin actually created.
 * Public (authKey-gated), no admin login.
 */
export const listClientWidgetsService = async (input: {
  authKey?: string;
  clientId?: string;
}) => {
  const { authKey, clientId } = input;
  if (!authKey) throw new AppError("Unauthorized", 401);

  const client = await ClientRepository.findByAuthKey(authKey);
  if (!client) throw new AppError("Invalid Auth Key", 401);
  if (
    clientId &&
    clientId !== client.slug &&
    clientId !== client.skin_id &&
    clientId !== client.id
  ) {
    throw new AppError("Invalid Client", 401);
  }
  if (client.status === "DISABLED") return [];

  const rows = await WidgetConfigurationRepository.findWhere(
    { client_id: client.id, status: "ACTIVE" },
    { order: [["created_at", "ASC"]] }
  );
  const now = new Date();
  return rows
    .filter((r) => !r.expiry_date || new Date(r.expiry_date) > now)
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      appearance: r.appearance ?? null,
    }));
};

export const createWidgetConfigService = async (input: WidgetConfigInput) => {
  if (!RENDERABLE_WIDGET_TYPES.includes(input.type)) {
    throw new AppError(`Unknown widget type: ${input.type}`, 400);
  }
  await assertClient(input.client_id);

  return WidgetConfigurationRepository.create({
    client_id: input.client_id,
    name: input.name,
    type: input.type,
    allowed_domains: input.allowed_domains ?? null,
    status: input.status ?? "ACTIVE",
    expiry_date: input.expiry_date ? new Date(input.expiry_date) : null,
    appearance: input.appearance ?? null,
  });
};

export const updateWidgetConfigService = async (
  id: string,
  input: Partial<WidgetConfigInput>
) => {
  if (input.type && !RENDERABLE_WIDGET_TYPES.includes(input.type)) {
    throw new AppError(`Unknown widget type: ${input.type}`, 400);
  }
  if (input.client_id) await assertClient(input.client_id);

  const patch: Record<string, unknown> = {};
  if (input.client_id !== undefined) patch.client_id = input.client_id;
  if (input.name !== undefined) patch.name = input.name;
  if (input.type !== undefined) patch.type = input.type;
  if (input.allowed_domains !== undefined)
    patch.allowed_domains = input.allowed_domains;
  if (input.status !== undefined) patch.status = input.status;
  if (input.expiry_date !== undefined)
    patch.expiry_date = input.expiry_date ? new Date(input.expiry_date) : null;
  if (input.appearance !== undefined) patch.appearance = input.appearance;

  const updated = await WidgetConfigurationRepository.updateByPk(id, patch);
  if (!updated) throw new AppError("Widget not found", 404);
  return updated;
};

export const toggleWidgetConfigStatusService = async (id: string) => {
  const widget = await WidgetConfigurationRepository.findByPk(id);
  if (!widget) throw new AppError("Widget not found", 404);
  return widget.update({
    status: widget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
  });
};

export const deleteWidgetConfigService = async (id: string) => {
  const ok = await WidgetConfigurationRepository.deleteByPk(id);
  if (!ok) throw new AppError("Widget not found", 404);
  return true;
};
