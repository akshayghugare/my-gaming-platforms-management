import type { WizardStep } from '@/components/gamification/fields';

export const xpPointRulesCasinoSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    subtitle: 'Please add the details with which you want to save this Rule.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'xp-points' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'rank',
    title: 'Rank Selection',
    fields: [{ name: 'ranks', label: 'Ranks', type: 'ranks' }],
  },
  {
    key: 'contribution',
    title: 'Contribution',
    fields: [
      {
        name: 'contribution_type',
        label: 'Contribution Type',
        type: 'select',
        options: [
          { label: 'Game Provider', value: 'Game Provider' },
          { label: 'Game Category', value: 'Game Category' },
          { label: 'Game', value: 'Game' },
        ],
      },
      { name: 'contribution_percentage', label: 'Contribution %', type: 'number' },
    ],
  },
];
