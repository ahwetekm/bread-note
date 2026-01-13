'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserProfileResponse,
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
  PasswordChangeResponse,
  DeleteAccountResponse,
  ApiErrorResponse,
} from '@/lib/validations/user';
import { signOut } from 'next-auth/react';

// Query keys
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

// API functions
async function fetchUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch('/api/user');
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.error?.message || 'Profil bilgileri alınamadı');
  }
  return res.json();
}

async function updateProfile(data: UpdateProfileInput): Promise<UserProfileResponse> {
  const res = await fetch('/api/user', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.error?.message || 'Profil güncellenemedi');
  }
  return res.json();
}

async function changePassword(data: ChangePasswordInput): Promise<PasswordChangeResponse> {
  const res = await fetch('/api/user/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.error?.message || 'Şifre değiştirilemedi');
  }
  return res.json();
}

async function deleteAccount(data: DeleteAccountInput): Promise<DeleteAccountResponse> {
  const res = await fetch('/api/user/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error: ApiErrorResponse = await res.json();
    throw new Error(error.error?.message || 'Hesap silinemedi');
  }
  return res.json();
}

// Hooks
export function useUser() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfileResponse>(userKeys.profile());

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<UserProfileResponse>(userKeys.profile(), {
          ...previousProfile,
          name: newData.name,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      // Sign out and redirect to login
      await signOut({ callbackUrl: '/login' });
    },
  });
}
