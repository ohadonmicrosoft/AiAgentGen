import { AuthContext } from '@/context/auth-context';
import { useContext } from 'react';

/**
 * Hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
