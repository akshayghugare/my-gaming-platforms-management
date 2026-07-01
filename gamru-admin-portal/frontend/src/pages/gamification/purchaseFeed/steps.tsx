import type { WizardStep } from '@/components/gamification/fields';

export const purchaseFeedSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
];
