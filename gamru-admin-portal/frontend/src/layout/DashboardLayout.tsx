import type { FC, ReactNode } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#111d3e] text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto thin-scrollbar">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
