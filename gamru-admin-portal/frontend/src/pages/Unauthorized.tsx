import type { FC } from 'react';

const Unauthorized: FC = () => {
  return (
    <div className="min-h-screen bg-[#111d3e] flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-6xl font-bold text-red-500">401</h1>
      <h2 className="text-2xl font-semibold mt-4">Unauthorized</h2>
      <p className="text-slate-400 mt-2">You do not have permission to access this page.</p>
    </div>
  );
};

export default Unauthorized;
