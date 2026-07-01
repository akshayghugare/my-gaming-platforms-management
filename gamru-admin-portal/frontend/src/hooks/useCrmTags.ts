import { useEffect, useState } from 'react';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import type { CrmTag, CrmTagCategory } from '@/types/crmTags.types';

/**
 * Fetches the names of CRM tags for a given category (managed in
 * Settings → CRM Tags) so create/edit forms can offer them in a dropdown.
 */
export function useCrmTags(category: CrmTagCategory): string[] {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await apiService.get<PaginatedData<CrmTag>>('/tags-crm/paginate', {
          page: 1,
          limit: 100,
          category,
        });
        if (active && response?.success && response?.data) {
          setTags(response.data.data.map((t) => t.name));
        }
      } catch (err) {
        console.error('Get CRM tags error:', err as ApiError);
      }
    })();
    return () => {
      active = false;
    };
  }, [category]);

  return tags;
}
