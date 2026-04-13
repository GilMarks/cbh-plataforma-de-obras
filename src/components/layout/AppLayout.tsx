import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getCurrentUser } from '../../lib/storage';
import { getRefreshToken, ensureSession, hasAccessToken } from '../../lib/api';
import { SidebarProvider } from '../../contexts/SidebarContext';

export default function AppLayout() {
  const [ready, setReady] = useState(() => hasAccessToken() && !!getCurrentUser());

  useEffect(() => {
    if (!ready) {
      ensureSession().finally(() => setReady(true));
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  const user = getCurrentUser();
  if (!user && !getRefreshToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex overflow-hidden bg-surface-container-low">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
          <Topbar />
          <main
            className="flex-1 overflow-y-auto"
            style={{ padding: '40px 48px' }}
          >
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
