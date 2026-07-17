import { getToken } from '../lib/api';

export function useAdminAuth() {
  const token = getToken();
  return {
    isAuthenticated: !!token,
    token,
  };
}
