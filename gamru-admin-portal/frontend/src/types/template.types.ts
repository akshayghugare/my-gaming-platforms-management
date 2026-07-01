export type TemplateChannel = 'EMAIL' | 'SMS' | 'ONSITE' | 'WEBPUSH' | 'INAPP';

export interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  description?: string | null;
  language?: string | null;
  tags?: string[] | null;
  subject?: string | null;
  content?: string | null;
  test_recipients?: string[] | null;
  created_by?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateForm {
  name: string;
  description: string;
  language: string;
  tags: string[];
  subject: string;
  content: string;
  test_recipients: string;
}

export interface TemplateErrors {
  name?: string;
}

export interface TemplateFilters {
  search: string;
  language: string;
  tag: string;
}

export const TEMPLATE_CHANNELS: { label: string; value: TemplateChannel }[] = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'On-site Notification', value: 'ONSITE' },
  { label: 'Web Push Notification', value: 'WEBPUSH' },
  { label: 'In App Push Notification', value: 'INAPP' },
];

export const TEMPLATE_CHANNEL_LABELS: Record<TemplateChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  ONSITE: 'On-site Notification',
  WEBPUSH: 'Web Push Notification',
  INAPP: 'In App Push Notification',
};

/**
 * Starter (dummy) message bodies keyed by the campaign trigger event they pair
 * with. Picking one in the template wizard pre-fills the subject + body so an
 * operator has a ready message to edit instead of a blank box. Tokens
 * ({{first_name}}, {{level}}, …) are rendered per-player at delivery time.
 */
export const TEMPLATE_STARTER_OPTIONS: {
  label: string;
  value: string;
  subject: string;
  body: string;
}[] = [
  {
    label: 'Registration — Welcome',
    value: 'REGISTRATION',
    subject: 'Welcome to the club, {{first_name}}! 🎉',
    body: 'Hi {{first_name}}, welcome aboard! Your account is ready — explore missions, climb the ranks and claim your first reward. 🎁',
  },
  {
    label: 'First Deposit — Thank you',
    value: 'DEPOSIT',
    subject: 'Thanks for your deposit, {{first_name}}!',
    body: 'Hi {{first_name}}, your deposit is in! Enjoy your bonus and jump into your favourite games. Good luck! 🍀',
  },
  {
    label: 'Login — Welcome back',
    value: 'LOGIN',
    subject: 'Welcome back, {{first_name}}!',
    body: 'Hi {{first_name}}, great to see you again! You are Level {{level}} ({{rank}}) with {{tokens}} tokens. New missions are waiting for you. 🚀',
  },
  {
    label: 'Generic message',
    value: 'GENERIC',
    subject: 'A message for you, {{first_name}}',
    body: 'Hi {{first_name}}, we have something for you — check it out and keep the fun going! 🎮',
  },
];

export const TEMPLATE_LANGUAGE_OPTIONS: string[] = [
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'German',
  'Italian',
];

export const TEMPLATE_TAG_OPTIONS: string[] = [
  'Welcome',
  'Retention',
  'Promotion',
  'Transactional',
  'No Deposit',
];

/**
 * Wizard steps per channel. The first step ("Details") and "Message language"
 * are common; Email adds an "Email Details" step; everything except In-App
 * exposes the optional "Send Test" step.
 */
export const TEMPLATE_STEPS: Record<TemplateChannel, string[]> = {
  EMAIL: ['Details', 'Email Details', 'Message language', 'Send Test (Optional)'],
  SMS: ['Details', 'Message language', 'Send Test (Optional)'],
  ONSITE: ['Details', 'Message language', 'Send Test (Optional)'],
  WEBPUSH: ['Details', 'Message language', 'Send Test (Optional)'],
  INAPP: ['Details', 'Message language'],
};
