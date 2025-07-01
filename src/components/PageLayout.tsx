'use client';

import { Suspense } from 'react';

import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import Sidebar from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

interface PageLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const PageLayout = ({ children, activePath = '/' }: PageLayoutProps) => {
  return (
    <>
      {/* 桌面端布局 */}
      <div className='hidden md:grid md:grid-cols-[auto_1fr] w-full'>
        <Suspense fallback={null}>
          <Sidebar activePath={activePath} />
        </Suspense>
        <div className='relative min-w-0 transition-all duration-300 col-start-2'>
          <div className='absolute top-2 right-4 z-20 hidden md:block'>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {/* 移动端布局 */}
      <div className='md:hidden flex flex-col min-h-screen w-full'>
        <MobileHeader />
        <main
          className='flex-1 mb-14'
          style={{
            paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </main>
        <MobileBottomNav activePath={activePath} />
      </div>
    </>
  );
};

export default PageLayout;
