import type { FC } from 'react';
import { Link } from 'react-router-dom';

const NotFound: FC = () => {
  return (
    <div className="min-h-screen bg-[#111d3e] flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-7xl font-bold text-blue-500">404</h1>

      <h2 className="text-2xl font-semibold mt-4">Page Not Available</h2>

      <p className="text-slate-400 mt-2 text-center">
        The page you are looking for does not exist.
      </p>

      <Link
        to="/dashboard"
        className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
      >
        Go To Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
