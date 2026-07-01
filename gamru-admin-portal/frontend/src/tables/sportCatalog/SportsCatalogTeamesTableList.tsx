import { useCallback, useEffect, useState, useRef, type FC } from 'react';
import { toast } from 'react-toastify';
import Pagination from '@/components/Pagination';
import { DeleteRecord } from '@/components/DeleteRecord';
import CreateSportCatalogTeam from '@/components/modals/sportsCatalog/CreateSportsCatalogTeam';
import {
  SportsCatalogTeam,
  SportsCatalogTeamFormData,
  SportsCatalogTeamFormErrors,
} from '@/types/sportsCatalog.types';
import type { ApiError } from '@/types';
import { sportTeamsApi, type SportTeamRecord } from '@/services/sportCatalog.api';
import AdminOnly from '@/components/AdminOnly';

const BLANK_TEAM_FORM: SportsCatalogTeamFormData = {
  id: '',
  name: '',
  sport: '',
  tournament: '',
};
const LIMIT = 10;

const toTeam = (r: SportTeamRecord): SportsCatalogTeam => ({
  id: r.id,
  name: r.name,
  sport: r.sport ?? '',
  tournament: r.tournament ?? '',
});

interface SportsCatalogTeamesTableListProps {
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
}

const SportsCatalogTeamesTableList: FC<SportsCatalogTeamesTableListProps> = ({
  isCreateModalOpen,
  onCreateModalClose,
}) => {
  const [teams, setTeams] = useState<SportsCatalogTeam[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterSport, setFilterSport] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SportsCatalogTeamFormData>(BLANK_TEAM_FORM);
  const [formErrors, setFormErrors] = useState<SportsCatalogTeamFormErrors>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableDataCellElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTeams = useCallback(async () => {
    try {
      setFetching(true);
      const res = await sportTeamsApi.paginate({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filterSport ? { sport: filterSport } : {}),
      });
      if (res?.success && res?.data) {
        setTeams(res.data.data.map(toTeam));
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load teams');
    } finally {
      setFetching(false);
    }
  }, [page, debouncedSearch, filterSport]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (isCreateModalOpen) {
      setEditId(null);
      setForm(BLANK_TEAM_FORM);
      setFormErrors({});
    }
  }, [isCreateModalOpen]);

  const isModalOpen = isCreateModalOpen || editId !== null;

  const handleCloseModal = () => {
    setEditId(null);
    setForm(BLANK_TEAM_FORM);
    setFormErrors({});
    onCreateModalClose();
  };

  const validate = (): boolean => {
    const errs: SportsCatalogTeamFormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sport.trim()) errs.sport = 'Sport is required';
    if (!form.tournament.trim()) errs.tournament = 'Tournament is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    const payload = {
      name: form.name.trim(),
      sport: form.sport.trim(),
      tournament: form.tournament.trim(),
    };
    try {
      if (editId) {
        await sportTeamsApi.update(editId, payload);
        toast.success('Team updated successfully');
      } else {
        await sportTeamsApi.create(payload);
        toast.success('Team created successfully');
      }
      handleCloseModal();
      if (!editId && page !== 1) setPage(1);
      else fetchTeams();
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save team');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (team: SportsCatalogTeam) => {
    setOpenMenuId(null);
    setEditId(team.id);
    setForm({
      id: team.id,
      name: team.name,
      sport: team.sport ?? '',
      tournament: team.tournament ?? '',
    });
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setOpenMenuId(null);
    DeleteRecord({
      endpoint: `/sport-catalog/teams/${id}`,
      successMessage: 'Team deleted',
      onSuccess: fetchTeams,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <input
            className="w-full px-3 py-2 pl-9 bg-slate-800 border border-slate-700 rounded text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-200"
            placeholder="Search by Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="relative">
          <input
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-200"
            placeholder="Filter by Sport"
            value={filterSport}
            onChange={(e) => {
              setFilterSport(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left text-slate-300 font-medium">Name</th>
              <th className="p-3 text-left text-slate-300 font-medium">Sport</th>
              <th className="p-3 text-left text-slate-300 font-medium">Tournament</th>
              <th className="p-3 text-left text-slate-300 font-medium w-10"></th>
            </tr>
          </thead>

          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  {fetching ? 'Loading…' : 'No teams found'}
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-medium text-blue-400">{team.name}</td>
                  <td className="p-3 text-slate-300">{team.sport}</td>
                  <td className="p-3 text-slate-300">{team.tournament}</td>
                  <td className="p-3 relative" ref={openMenuId === team.id ? menuRef : undefined}>
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400"
                        onClick={() => setOpenMenuId(openMenuId === team.id ? null : team.id)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>

                      {openMenuId === team.id && (
                        <div className="absolute right-8 top-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg min-w-[110px]">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                            onClick={() => handleEdit(team)}
                          >
                            Edit
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                            onClick={() => handleDeleteConfirm(team.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </AdminOnly>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <CreateSportCatalogTeam
        isOpen={isModalOpen}
        closeModal={handleCloseModal}
        form={form}
        setForm={setForm}
        errors={formErrors}
        onSave={handleSave}
        loading={saveLoading}
        editId={editId}
      />
    </>
  );
};

export default SportsCatalogTeamesTableList;
