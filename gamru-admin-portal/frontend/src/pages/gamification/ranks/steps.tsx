import type { WizardStep } from '@/components/gamification/fields';

export const ranksSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    subtitle: 'Please add the details with which you want to save this Rank.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'ranks' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'rank_image', label: 'Rank Image', type: 'text' },
    ],
  },
  {
    key: 'levels',
    title: 'Levels & XP Ranges',
    subtitle:
      'Define each level inside this rank with its XP start/end window and an optional per-level reward. A player’s level & rank are recomputed from these XP windows.',
    fields: [{ name: 'levels', label: 'Levels', type: 'levels' }],
  },
  {
    key: 'rewards',
    title: 'Rank Rewards (Optional)',
    fields: [
      {
        name: 'reward_type',
        label: 'Reward Type',
        type: 'select',
        options: [
          { label: 'Level Rewards', value: 'level_rewards' },
          { label: 'Rank Rewards', value: 'rank_rewards' },
        ],
        half: true,
      },
      {
        name: 'reward_category',
        label: 'Reward Category',
        type: 'select',
        options: [
          { label: 'XP Points', value: 'xp' },
          { label: 'Bonus Cash', value: 'bonus_cash' },
          { label: 'Free Spins', value: 'free_spins' },
        ],
        half: true,
      },
      { name: 'reward_value', label: 'Reward Value', type: 'number' },
      {
        name: 'bonus_ids',
        label: 'Bonus IDs (SDLCGames, comma-separated)',
        type: 'text',
      },
    ],
  },
];
