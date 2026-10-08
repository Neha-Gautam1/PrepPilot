import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import type { User } from '../../types';

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<User>('/auth/me'),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiRequest<User>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (user) => qc.setQueryData(['auth', 'me'], user),
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiRequest<User>('/auth/signup', { method: 'POST', body: input }),
    onSuccess: (user) => qc.setQueryData(['auth', 'me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => qc.setQueryData(['auth', 'me'], null),
  });
}