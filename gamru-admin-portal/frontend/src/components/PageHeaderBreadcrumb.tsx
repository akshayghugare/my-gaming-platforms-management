import type { FC } from 'react';

export interface BreadcrumbItem {
  label: string;
  clickable?: boolean;
}

interface PageHeaderBreadcrumbProps {
  title: string;
  items: BreadcrumbItem[];
}

const PageHeaderBreadcrumb: FC<PageHeaderBreadcrumbProps> = ({ title, items }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>

      <p className="text-slate-500 text-sm mt-0.5 flex items-center flex-wrap">
        {items.map((item, index) => (
          <span key={index} className="flex items-center">
            <span
              className={
                item.clickable
                  ? 'text-blue-400 cursor-pointer hover:underline'
                  : index === items.length - 1
                    ? 'text-white font-medium'
                    : ''
              }
            >
              {item.label}
            </span>

            {index !== items.length - 1 && <span className="mx-1">›</span>}
          </span>
        ))}
      </p>
    </div>
  );
};

export default PageHeaderBreadcrumb;
