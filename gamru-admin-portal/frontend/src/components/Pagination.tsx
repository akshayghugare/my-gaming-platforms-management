import type { FC } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const handlePrev = (): void => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = (): void => {
    if (page < totalPages) onPageChange(page + 1);
  };

  const getPages = (): number[] => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex justify-end items-center gap-2 mt-4">
      <button
        onClick={handlePrev}
        disabled={page === 1}
        className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
        type="button"
      >
        Prev
      </button>

      {getPages().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded ${
            page === p ? 'bg-blue-600 text-white' : 'bg-slate-700'
          }`}
          type="button"
        >
          {p}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50"
        type="button"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
