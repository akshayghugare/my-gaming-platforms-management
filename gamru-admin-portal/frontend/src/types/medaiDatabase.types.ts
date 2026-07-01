import React from 'react';

export const categoryOptions = [
  { label: 'All', value: 'all' },
  { label: 'Banners', value: 'banners' },
  { label: 'Booster Images', value: 'booster-images' },
  { label: 'Email Templates Assets', value: 'email-templates-assets' },
  { label: 'Joy Saha', value: 'joy-saha' },
  { label: 'Mission Bundles', value: 'mission-bundles' },
  { label: 'Mission Banner', value: 'mission-banner' },
  { label: 'Template', value: 'template' },
];

export type MediaDatabaseNavItemId =
  | 'all-media-database'
  | 'media-database-banners'
  | 'media-database-booster-images'
  | 'media-database-email-templates-assets'
  | 'media-database-joy-saha'
  | 'media-database-mission-bundles'
  | 'media-database-mission-banner'
  | 'media-database-template';

export interface MediaDatabaseNavItem {
  id: MediaDatabaseNavItemId;
  label: string;
  icon: React.ReactNode;
}

export interface MediaDatabase {
  id: string;
  name: string;
  description?: string;
  category?: string;

  imageUrl?: string;
  thumbnailUrl?: string;

  createdAt: string;
  updatedAt: string;

  createdBy: string;

  fileSize?: string;
}

export interface MediaDatabaseForm {
  id?: string;

  name: string;

  description?: string;

  imageUrl?: string;

  file?: File;

  category?: string;

  createdAt?: string;

  createdBy: string;
}

export interface MediaDatabaseErrors {
  name?: string;

  category?: string;

  description?: string;

  imageUrl?: string;
}
