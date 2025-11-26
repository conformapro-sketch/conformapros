import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'staff' | 'client' | 'unknown' | 'loading';

export function useUserType(): UserType {
  const { user, loading: authLoading } = useAuth();
  const [userType, setUserType] = useState<UserType>('loading');

  useEffect(() => {
    async function checkUserType() {
      if (authLoading) {
        setUserType('loading');
        return;
      }

      if (!user) {
        setUserType('unknown');
        return;
      }

      try {
        // Priority 1: Check if user is staff
        const { data: isStaff, error: staffError } = await supabase
          .rpc('is_staff_user', { _user_id: user.id });

        if (staffError) {
          console.error('Error checking staff status:', staffError);
        }

        if (isStaff) {
          setUserType('staff');
          return;
        }

        // Priority 2: Check if user is client
        const { data: clientUser, error: clientError } = await supabase
          .from('client_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (clientError && clientError.code !== 'PGRST116') {
          console.error('Error checking client status:', clientError);
        }

        if (clientUser) {
          setUserType('client');
          return;
        }

        // Neither staff nor client
        setUserType('unknown');
      } catch (err) {
        console.error('Error determining user type:', err);
        setUserType('unknown');
      }
    }

    checkUserType();
  }, [user, authLoading]);

  return userType;
}
