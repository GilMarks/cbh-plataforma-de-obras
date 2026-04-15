import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificacoesProvider } from './contexts/NotificacoesContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificacoesProvider>
        <RouterProvider router={router} />
      </NotificacoesProvider>
    </ThemeProvider>
  </StrictMode>,
);
