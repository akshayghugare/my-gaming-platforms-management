import { useEffect, useState, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type { ApiError } from '@/types';

interface UserLog {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN';
  product?: string;
  sub_product?: string;
  subject?: string;
  details?: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

const UserLogTableList: FC = () => {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [product, setProduct] = useState('');
  const [userId, setUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  const getLogs = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/user-log/paginate', {
        page,
        limit,
        search,
        action,
        product,
        user_id: userId,
        fromDate,
        toDate,
      });

      if (response?.success) {
        const result = response.data as { data: UserLog[]; pagination: { totalPages: number } };
        setLogs(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.error('Get logs error:', apiErr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLogs();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    getLogs();
  };

  const resetFilters = () => {
    setSearch('');
    setAction('');
    setProduct('');
    setUserId('');
    setFromDate('');
    setToDate('');
    setPage(1);
    setTimeout(() => getLogs(), 0);
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="w-full flex items-center justify-between ">
          <PageHeaderBreadcrumb
            title="User Logs"
            items={[
              { label: 'Home', clickable: true },
              { label: 'Settings' },
              { label: 'User Logs' },
            ]}
          />
          <div className="flex gap-3 mb-4">
            <button onClick={applyFilters} className="bg-blue-600 px-4 py-2 rounded text-white">
              Apply Filters
            </button>

            <button onClick={resetFilters} className="bg-gray-600 px-4 py-2 rounded text-white">
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 my-4">
          <input
            className="px-3 py-2 bg-slate-800 border rounded"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 bg-slate-800 border rounded"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
          <input
            className="px-3 py-2 bg-slate-800 border rounded"
            placeholder="Product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-slate-800 border rounded"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-2 bg-slate-800 border rounded"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-2 bg-slate-800 border rounded"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Sub Product</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Details</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-700">
                    <td className="p-3 text-xs">
                      {log?.user?.first_name} {log.user?.last_name}
                    </td>
                    <td className="p-3"> {new Date(log.created_at).toLocaleString()} </td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.product}</td>
                    <td className="p-3">{log.sub_product}</td>
                    <td className="p-3">{log.subject}</td>
                    <td className="p-3">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

export default UserLogTableList;
