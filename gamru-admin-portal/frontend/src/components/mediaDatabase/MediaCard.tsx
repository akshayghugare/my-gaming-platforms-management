import { MediaDatabase } from '@/types/medaiDatabase.types';
import { FC } from 'react';

interface MediaCardProps {
  item: MediaDatabase;
  onDelete: (id: string) => void;
}

const MediaCard: FC<MediaCardProps> = ({ item, onDelete }) => {
  return (
    <div className="group relative bg-slate-800 border border-slate-700 rounded-md overflow-hidden hover:border-slate-500 transition-colors cursor-pointer">
      <div className="aspect-video bg-slate-700 flex items-center justify-center overflow-hidden">
        {item?.thumbnailUrl ? (
          <img src={item?.thumbnailUrl} alt={item?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-slate-200 font-medium truncate" title={item?.name}>
          {item?.name}
        </p>
        {item?.fileSize && (
          <p className="text-xs text-slate-400 mt-0.5">
            {item?.fileSize} · {item?.createdAt}
          </p>
        )}
      </div>

      {/* Delete on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item?.id);
        }}
        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Delete
      </button>
    </div>
  );
};

export default MediaCard;
