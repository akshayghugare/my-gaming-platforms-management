import { useEffect, useState, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layout/DashboardLayout';
import CreateWizard, {
  buildInitialForm,
  type WizardFormState,
} from '@/components/gamification/CreateWizard';
import { gamificationApi } from '@/services/gamification.api';
import type { ApiError } from '@/types';
import { purchaseFeedSteps } from './steps';

const api = gamificationApi('purchase-feed');
const LIST_PATH = '/gamification/purchase-feed';
const BREADCRUMB = ['Home', 'Gamification', 'Purchase Feed'];

const CreatePurchaseFeedEntry: FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');

  const [form, setForm] = useState<WizardFormState>(buildInitialForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await api.get(editId);
        if (res?.success && res?.data) {
          const row = res.data;
          setForm({
            name: row.name,
            description: row.description ?? '',
            priority: row.priority ?? 0,
            status: row.status,
            tags: row.tags ?? [],
            data: row.data ?? {},
          });
        }
      } catch (e) {
        toast.error((e as ApiError).message || 'Failed to load Purchase Feed Entry');
      }
    })();
  }, [editId]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      status: form.status,
      priority: Number(form.priority) || 0,
      tags: form.tags,
      data: form.data,
    };
    try {
      if (editId) {
        await api.update(editId, payload);
        toast.success('Purchase Feed Entry updated');
      } else {
        await api.create(payload);
        toast.success('Purchase Feed Entry created');
      }
      navigate(LIST_PATH);
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save Purchase Feed Entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 w-full">
        <CreateWizard
          title="Purchase Feed Entry"
          breadcrumb={BREADCRUMB}
          steps={purchaseFeedSteps}
          form={form}
          setForm={setForm}
          onCancel={() => navigate(LIST_PATH)}
          onSubmit={submit}
          saving={saving}
          editing={Boolean(editId)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreatePurchaseFeedEntry;
