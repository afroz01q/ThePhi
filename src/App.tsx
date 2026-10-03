import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import routes from './routes';

const App: React.FC = () => {
  useEffect(() => {
    const purgeMask = () => {
      const masks = document.querySelectorAll('#privilege-mask, .privilege-mask');
      masks.forEach((el) => el.remove());
    };
    purgeMask();
    const observer = new MutationObserver(purgeMask);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <IntersectObserver />
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </Router>
  );
};

export default App;

