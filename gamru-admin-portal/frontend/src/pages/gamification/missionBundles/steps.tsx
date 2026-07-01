import type { WizardStep } from '@/components/gamification/fields';

export const missionBundlesSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    subtitle: 'Please add the details with which you want to save this bundle.',
    fields: [
      { name: 'name', label: 'Internal name', type: 'text', required: true },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'mission' },
      { name: 'description', label: 'Internal Description', type: 'textarea' },
      { name: 'large_image', label: 'Large Image', type: 'text', half: true },
      { name: 'small_image', label: 'Small Image', type: 'text', half: true },
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    subtitle:
      'Periodicity controls how the bundle resets — Daily/Weekly/Monthly missions inside it restart each period; Lifetime never resets.',
    fields: [
      {
        name: 'periodicity',
        label: 'Periodicity',
        type: 'select',
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Lifetime', value: 'lifetime' },
        ],
      },
      {
        name: 'bundle_type',
        label: 'Type',
        type: 'select',
        half: true,
        options: [
          { label: 'Lifetime', value: 'Lifetime' },
          { label: 'Custom', value: 'Custom' },
        ],
      },
      { name: 'priority', label: 'Priority', type: 'number', half: true },
      { name: 'start_date', label: 'Start Date', type: 'text', half: true },
      { name: 'end_date', label: 'End Date', type: 'text', half: true },
    ],
  },
  {
    key: 'missions',
    title: 'Missions',
    subtitle: 'Select the missions to group inside this bundle.',
    fields: [
      {
        name: 'missions',
        label: 'Missions',
        type: 'missions',
        hint: 'Pick one or more existing missions. Players see them grouped under this bundle on the games platform.',
      },
    ],
  },
  {
    key: 'easter',
    title: 'Easter Eggs (Optional)',
    fields: [{ name: 'easter_eggs', label: 'Easter Eggs', type: 'text' }],
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
      {
        name: 'segment',
        label: 'Segments',
        type: 'segments',
        hint: 'Only used when Eligibility is “Segment”. Players in any selected segment see this bundle.',
      },
    ],
  },
];
