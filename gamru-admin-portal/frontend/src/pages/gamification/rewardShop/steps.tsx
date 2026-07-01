import type { WizardStep } from '@/components/gamification/fields';

export const rewardShopSteps: WizardStep[] = [
  {
    key: 'details',
    title: 'Details',
    subtitle: 'Please add the details with which you want to save this Rank.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { label: 'Product', value: 'Product' },
          { label: 'Booster', value: 'Booster' },
          { label: 'Voucher', value: 'Voucher' },
          { label: 'Merchandise', value: 'Merchandise' },
        ],
      },
      { name: 'tags', label: 'Tags (Optional)', type: 'tags', tagCategory: 'reward-shop' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'priority', label: 'Order (Optional)', type: 'number' },
      {
        name: 'external_localization',
        label: 'External name and description (Optional)',
        type: 'textarea',
      },
      { name: 'large_image', label: 'Large Image', type: 'text', half: true },
      { name: 'small_image', label: 'Small Image', type: 'text', half: true },
    ],
  },
  {
    key: 'price',
    title: 'Product Type and Price',
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { label: 'External', value: 'External' },
          { label: 'Internal', value: 'Internal' },
        ],
      },
      { name: 'token_price', label: 'Token Price', type: 'number', half: true },
      { name: 'real_price', label: 'Real Price', type: 'number', half: true },
      {
        name: 'currency',
        label: 'Currency',
        type: 'select',
        half: true,
        options: [{ label: 'USD', value: 'USD' }],
      },
    ],
  },
  {
    key: 'settings',
    title: 'Product Settings',
    fields: [
      { name: 'stock_total', label: 'Stock', type: 'number', half: true },
      { name: 'supplier', label: 'Supplier', type: 'text', half: true },
      {
        name: 'product_visibility',
        label: 'Product Visibility',
        type: 'select',
        options: [
          { label: 'Visible', value: 'Visible' },
          { label: 'Hidden', value: 'Hidden' },
        ],
      },
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
          { label: 'Ranks', value: 'Ranks' },
        ],
      },
      { name: 'ranks', label: 'Ranks', type: 'ranks' },
    ],
  },
];
