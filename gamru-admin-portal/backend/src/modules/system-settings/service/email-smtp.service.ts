import EmailSmtpRepository from "../model/email-smtp.repository";

export interface EmailSmtpInput {
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  from_email?: string | null;
  is_enabled?: boolean;
}

export const listEmailSmtpService = async () => {
  return EmailSmtpRepository.findAllOrdered();
};

export const getEmailSmtpService = async (type: string) => {
  return EmailSmtpRepository.findByType(type);
};

/**
 * Create or update the SMTP config for a given flow type (e.g. "register").
 * A blank password on update keeps the existing one so it is never wiped.
 */
export const upsertEmailSmtpService = async (
  type: string,
  data: EmailSmtpInput
) => {
  const existing = await EmailSmtpRepository.findByType(type);

  const payload: EmailSmtpInput = { ...data };
  if (existing && (data.password === undefined || data.password === "")) {
    delete payload.password;
  }

  if (existing) {
    return EmailSmtpRepository.updateByPk(existing.id, payload);
  }
  return EmailSmtpRepository.create({ type, ...payload });
};

/**
 * Returns the SMTP config for a flow only when it is enabled and usable,
 * otherwise null. Used by the mail layer to decide whether to send.
 */
export const getActiveSmtpByType = async (type: string) => {
  const row = await EmailSmtpRepository.findByType(type);
  if (!row || !row.is_enabled || !row.host || !row.username || !row.password) {
    return null;
  }
  return row;
};
