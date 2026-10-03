import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};
