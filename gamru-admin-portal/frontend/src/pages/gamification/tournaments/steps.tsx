import type { WizardStep } from '@/components/gamification/fields';

export const tournamentsSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    subtitle:
      "Add the Tournament name, tags, images, and optional descriptions to set up how it's managed and displayed.",
    fields: [
      { name: 'name', label: 'Internal Name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'tournaments' },
      { name: 'description', label: 'Internal Description', type: 'textarea' },
      { name: 'large_image', label: 'Large Image', type: 'text', half: true },
      { name: 'small_image', label: 'Small Image', type: 'text', half: true },
      {
        name: 'external_localization',
        label: 'External name and description (Optional)',
        type: 'textarea',
      },
    ],
  },
  {
    key: 'type',
    title: 'industry And Tournament Type',
    fields: [
      {
        name: 'industry',
        label: 'Industry',
        type: 'select',
        required: true,
        options: [
          { label: 'Casino', value: 'Casino' },
          { label: 'Sports', value: 'Sports' },
        ],
      },
      {
        name: 'tournament_type',
        label: 'Tournament Type',
        type: 'select',
        options: [
          { label: 'Most Points', value: 'Most Points' },
          { label: 'Most Wins', value: 'Most Wins' },
          { label: 'Highest Multiplier', value: 'Highest Multiplier' },
        ],
      },
      {
        // The games players can launch and play for this tournament. Values
        // must match the game route keys on the games platform.
        name: 'games',
        label: 'Games',
        type: 'multiselect',
        required: true,
        options: [
          { label: 'Slider', value: 'slider' },
          { label: 'Lucky Spinner', value: 'lucky-spinner' },
          { label: 'Dragon Run', value: 'dragon-run' },
          { label: 'Memory Match', value: 'memory-match' },
          { label: 'Click Storm', value: 'click-storm' },
          { label: 'Snake', value: 'snake' },
          { label: 'Teen Patti', value: 'teen-patti' },
          { label: 'Aviator', value: 'aviator' },
        ],
      },
      {
        name: 'period',
        label: 'Period',
        type: 'select',
        options: [
          { label: 'Custom', value: 'Custom' },
          { label: 'Daily', value: 'Daily' },
          { label: 'Weekly', value: 'Weekly' },
        ],
      },
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    fields: [
      { name: 'min_bet', label: 'Min Bet Amount', type: 'number', half: true },
      { name: 'max_bets', label: 'Max Number of Bets', type: 'number', half: true },
      { name: 'buy_in', label: 'Buy-in', type: 'number', half: true },
      {
        name: 'opt_in',
        label: 'Opt-in',
        type: 'switch',
        placeholder: 'Players must opt in',
        half: true,
      },
      { name: 'start_date', label: 'Start Date', type: 'datetime', half: true },
      { name: 'end_date', label: 'End Date', type: 'datetime', half: true },
    ],
  },
  {
    key: 'leaderboard',
    title: 'Leaderboard',
    fields: [
      { name: 'leaderboard_size', label: 'Leaderboard Size', type: 'number', half: true },
      { name: 'prize_pool', label: 'Prize Pool', type: 'number', half: true },
    ],
  },
  {
    key: 'eligibility',
    title: 'Eligibility',
    fields: [
      {
        name: 'eligibility_type',
        label: 'Eligibility',
        type: 'select',
        options: [
          { label: 'All Players', value: 'All Players' },
          { label: 'Segment', value: 'Segment' },
        ],
      },
      { name: 'segment', label: 'Segment', type: 'segments' },
    ],
  },
];
