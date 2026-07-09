import { useQuery } from '@tanstack/react-query';
import { getMeApi } from '@/lib/authApi';
import type { Role } from '@/types';

/**
 * Auth hook that validates JWT token via /auth/me.
 * Returns isLoggedIn only if the token is valid (server-verified).
 * On failure (401, network error), clears tokens and returns logged out.
 */
export function useAuth() {
  const hasToken = !!(localStorage.getItem('clinicos_token') || sessionStorage.getItem('clinicos_token'));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-me'],
    queryFn: getMeApi,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If no token or API failed, user is not authenticated
  if (!hasToken || isError) {
    return {
      isLoggedIn: false,
      isLoading: false,
      userId: '',
      role: 'staff' as Role,
      email: '',
    };
  }

  // Still loading — show spinner
  if (isLoading) {
    return {
      isLoggedIn: false,
      isLoading: true,
      userId: '',
      role: 'staff' as Role,
      email: '',
    };
  }

  // Authenticated
  return {
    isLoggedIn: true,
    isLoading: false,
    userId: data?._id || '',
    role: (data?.role as Role) || ('staff' as Role),
    email: data?.email || '',
  };
}
