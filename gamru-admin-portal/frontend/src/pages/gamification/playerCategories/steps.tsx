import type { WizardStep } from '@/components/gamification/fields';

export const playerCategoriesSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    fields: [
      { name: 'name', label: 'Internal name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'requirements',
    title: 'Category Requirements',
    fields: [
      {
        name: 'category_type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Average Deposit Amount', value: 'Average Deposit Amount' },
          { label: 'Total Deposit Amount', value: 'Total Deposit Amount' },
          { label: 'Average Bet Amount', value: 'Average Bet Amount' },
          { label: 'Total Wager Amount', value: 'Total Wager Amount' },
        ],
      },
      { name: 'range_from', label: 'Range From', type: 'number', half: true },
      { name: 'range_to', label: 'Range To', type: 'number', half: true },
      {
        name: 'currency',
        label: 'Currency',
        type: 'select',
        half: true,
        options: [{ label: 'USD', value: 'USD' }],
      },
    ],
  },
];
