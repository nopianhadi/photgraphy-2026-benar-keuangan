import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './src/shared/ui/ErrorBoundary';
import { DataProvider } from './src/contexts/DataContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './src/index.css';
import './app/index.css';
import './src/styles/print.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      gcTime: 30 * 60 * 1000, // 30 minutes in memory
      refetchOnWindowFocus: false, // Prevents laggy refetches on tab or iframe focus
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Disable console.log only in production (keep for debugging in dev)
if (typeof window !== 'undefined' && typeof console !== 'undefined' && import.meta.env.PROD) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text-secondary">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Memuat Vena Pictures...</span>
                </div>
              </div>
            }
          >
            <App />
          </Suspense>
        </ErrorBoundary>
      </DataProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
