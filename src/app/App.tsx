import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </ThemeProvider>
  );
}
