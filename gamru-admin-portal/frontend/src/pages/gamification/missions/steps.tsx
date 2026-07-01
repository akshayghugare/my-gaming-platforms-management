import type { WizardStep } from '@/components/gamification/fields';

export const missionsSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    fields: [
      { name: 'name', label: 'Internal name', type: 'text', required: true },
      {
        name: 'category',
        label: 'Mission type / category',
        type: 'select',
        half: true,
        required: true,
        options: [
          { label: 'Originals', value: 'Originals' },
          { label: 'Slots', value: 'Slots' },
          { label: 'Live Games', value: 'Live Games' },
          { label: 'Table Games', value: 'Table Games' },
          { label: 'Casino', value: 'Casino' },
          { label: 'Sport', value: 'Sport' },
        ],
        hint: 'Players can only run one Casino and one Sport mission at a time.',
      },
      {
        name: 'duration_days',
        label: 'Duration (days)',
        type: 'number',
        half: true,
      },
      { name: 'vip', label: 'VIP mission', type: 'switch', placeholder: 'VIP only' },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'mission' },
      { name: 'large_image', label: 'Card image URL (optional)', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'objectives',
    title: 'Objectives',
    subtitle:
      'Pick the player event this mission listens to. The rules engine advances progress as matching events arrive from the games platform.',
    fields: [
      {
        name: 'objective_type',
        label: 'Event',
        type: 'select',
        required: true,
        options: [
          { label: 'Wager (Casino)', value: 'wager' },
          { label: 'Bet Count', value: 'bet_count' },
          { label: 'Win', value: 'win' },
          { label: 'Completed Deposit', value: 'deposit' },
          { label: 'Completed Withdrawal', value: 'withdrawal' },
          { label: 'Login', value: 'login' },
          { label: 'Activate Account (KYC)', value: 'kyc' },
          { label: 'Account Verification', value: 'account_verification' },
          { label: 'Self Assessment Test', value: 'self_assessment' },
          { label: 'Marketing Opt-In', value: 'opt_in' },
          { label: 'Refer a Friend', value: 'refer_friend' },
        ],
      },
      {
        name: 'measure',
        label: 'Measure',
        type: 'select',
        half: true,
        options: [
          { label: 'Count (times)', value: 'count' },
          { label: 'Amount (sum)', value: 'amount' },
        ],
      },
      { name: 'objective_target', label: 'Target Value', type: 'number', half: true },
      {
        name: 'condition_label',
        label: 'Condition label (shown to player, e.g. "Wager $15 000")',
        type: 'text',
      },
      {
        name: 'objective_game_category',
        label: 'Game Category (optional sub-condition)',
        type: 'text',
        half: true,
      },
      {
        name: 'min_bet',
        label: 'Min Bet (optional sub-condition)',
        type: 'number',
        half: true,
      },
      {
        name: 'min_multiplier',
        label: 'Min Multiplier (optional sub-condition)',
        type: 'number',
        half: true,
      },
      {
        name: 'bet_currency',
        label: 'Bet currency',
        type: 'text',
        half: true,
        placeholder: 'All Currencies',
      },
      {
        // Games the player can launch for this mission. Values must match the
        // game route keys on the games platform. Shown as "Mission Games" on
        // the player side; leave empty to count any game in the category.
        name: 'games',
        label: 'Mission Games',
        type: 'multiselect',
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
    ],
  },
  {
    key: 'time',
    title: 'Time Settings',
    fields: [
      {
        name: 'time_frame_type',
        label: 'Time Frame',
        type: 'select',
        options: [
          { label: 'Lifetime', value: 'lifetime' },
          { label: 'Custom', value: 'custom' },
        ],
      },
      { name: 'start_date', label: 'Start Date', type: 'text', half: true },
      { name: 'end_date', label: 'End Date', type: 'text', half: true },
    ],
  },
  {
    key: 'rewards',
    title: 'Rewards',
    fields: [
      {
        name: 'reward_type',
        label: 'Reward Type',
        type: 'select',
        half: true,
        options: [
          { label: 'Bonus Cash', value: 'bonus_cash' },
          { label: 'Free Spins', value: 'free_spins' },
          { label: 'Bonus Bets', value: 'bonus_bets' },
          { label: 'XP Points', value: 'xp' },
          { label: 'Tokens', value: 'tokens' },
        ],
      },
      { name: 'reward_amount', label: 'Reward Amount', type: 'number', half: true },
      {
        name: 'reward_label',
        label: 'Reward label (shown to player, e.g. "50 Bonus Bets x $2")',
        type: 'text',
      },
      { name: 'max_bonus', label: 'Max bonus', type: 'number', half: true },
      {
        name: 'bonus_wagering',
        label: 'Bonus wagering',
        type: 'select',
        half: true,
        options: [
          { label: 'Excluded', value: 'Excluded' },
          { label: 'Included', value: 'Included' },
        ],
      },
      {
        name: 'deposit_required',
        label: 'Deposit required',
        type: 'switch',
        placeholder: 'Deposit required',
      },
      {
        name: 'wagering_required',
        label: 'Wagering required',
        type: 'switch',
        placeholder: 'Wagering required',
      },
      { name: 'more_details', label: 'More details', type: 'textarea' },
    ],
  },
];
