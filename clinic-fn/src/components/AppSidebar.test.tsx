import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppSidebar from './AppSidebar';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

// In-memory localStorage stand-in — jsdom's built-in `localStorage` is
// flaky under vitest in some configurations, so stub it explicitly.
const store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};
Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true,
});

const renderSidebar = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>
          <AppSidebar
            mobile
            role="admin"
            email="admin@example.com"
            sidebarOpen={true}
            onSidebarOpenChange={() => {}}
          />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AppSidebar logout', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    mockStorage.clear();
    mockStorage.setItem('clinicos_token', 'tok');
    mockStorage.setItem('clinicos_refresh_token', 'rfr');
  });

  it('clears tokens and redirects to /login', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));

    expect(mockStorage.getItem('clinicos_token')).toBeNull();
    expect(mockStorage.getItem('clinicos_refresh_token')).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
