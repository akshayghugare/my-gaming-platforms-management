import { useCallback, useEffect, useState, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layout/DashboardLayout';
import CreateWizard, {
  buildInitialForm,
  type WizardFormState,
} from '@/components/gamification/CreateWizard';
import { gamificationApi } from '@/services/gamification.api';
import type { ApiError } from '@/types';
import type { GamificationEntity } from '@/types/gamification.types';
import type { LevelContinuation, RankLevel } from '@/components/gamification/fields';
import { ranksSteps } from './steps';

const api = gamificationApi('ranks');
const LIST_PATH = '/gamification/ranks';
const BREADCRUMB = ['Home', 'Gamification', 'Ranks'];

const CreateRank: FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');

  const [form, setForm] = useState<WizardFormState>(buildInitialForm());
  const [saving, setSaving] = useState(false);
  const [levelContinuation, setLevelContinuation] = useState<LevelContinuation | undefined>(
    undefined
  );

  /**
   * Ranks share one continuous ladder. Work out where this rank's levels
   * must begin: continuing an existing rank keeps its own starting point,
   * a brand-new rank picks up from the current top of the ladder, and the
   * very first rank starts at level 1 / 0 XP.
   */
  const computeRankContinuation = useCallback(async (editing?: GamificationEntity) => {
    const levelsOf = (r: GamificationEntity): RankLevel[] => {
      const l = (r.data as { levels?: unknown })?.levels;
      return Array.isArray(l) ? (l as RankLevel[]) : [];
    };
    try {
      const res = await api.paginate({ page: 1, limit: 100, archived: false });
      const ranks = res?.data?.data ?? [];
      const others = ranks.filter((r) => !editing || r.id !== editing.id);

      // Editing a rank that already has levels → keep its position.
      const own = editing ? levelsOf(editing) : [];
      if (own.length) {
        const first = [...own].sort((a, b) => a.level - b.level)[0];
        const from = others.find((r) =>
          levelsOf(r).some((l) => Number(l.xp_end) === Number(first.xp_start))
        );
        setLevelContinuation({
          startLevel: Number(first.level) || 1,
          startXp: Number(first.xp_start) || 0,
          fromRank: from?.name ?? null,
        });
        return;
      }

      const flat = others.flatMap(levelsOf);
      if (!flat.length) {
        setLevelContinuation({ startLevel: 1, startXp: 0, fromRank: null });
        return;
      }
      const maxLevel = Math.max(...flat.map((l) => Number(l.level) || 0));
      const maxXp = Math.max(...flat.map((l) => Number(l.xp_end) || 0));
      const from = others.find((r) => levelsOf(r).some((l) => Number(l.xp_end) === maxXp));
      setLevelContinuation({
        startLevel: maxLevel + 1,
        startXp: maxXp,
        fromRank: from?.name ?? null,
      });
    } catch {
      setLevelContinuation({ startLevel: 1, startXp: 0, fromRank: null });
    }
  }, []);

  useEffect(() => {
    if (!editId) {
      // Create: compute continuation from the current top of the ladder.
      setLevelContinuation(undefined);
      computeRankContinuation();
      return;
    }
    // Edit: load the row, then compute continuation keyed off the loaded entity.
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
          setLevelContinuation(undefined);
          computeRankContinuation(row);
        }
      } catch (e) {
        toast.error((e as ApiError).message || 'Failed to load Rank');
      }
    })();
  }, [editId, computeRankContinuation]);

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
        toast.success('Rank updated');
      } else {
        await api.create(payload);
        toast.success('Rank created');
      }
      navigate(LIST_PATH);
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save Rank');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 w-full">
        <CreateWizard
          title="Rank"
          breadcrumb={BREADCRUMB}
          steps={ranksSteps}
          form={form}
          setForm={setForm}
          onCancel={() => navigate(LIST_PATH)}
          onSubmit={submit}
          saving={saving}
          editing={Boolean(editId)}
          levelContinuation={levelContinuation}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateRank;
