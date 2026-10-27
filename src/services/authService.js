import { ref, computed } from 'vue';
import { supabase } from '@/services/supabase';

let authListenerInitialized = false;

const currentUser = ref(null);
const currentSession = ref(null);
const authLoading = ref(true);

export const authService = {
  user: computed(() => currentUser.value),
  session: computed(() => currentSession.value),
  loading: computed(() => authLoading.value),
  isAuthenticated: computed(() => Boolean(currentUser.value)),
  
  // Authoritative role inspection:
  // SECURITY CRITICAL: Role Admin HANYA dapat berasal dari app_metadata (ditetapkan oleh server/Supabase dashboard).
  // user_metadata TIDAK BOLEH dipercaya untuk hak Admin karena dapat diubah oleh client.
  // email format TIDAK BOLEH dijadikan penentu hak Admin.
  userRole: computed(() => {
    if (!currentUser.value) return null;
    const appMeta = currentUser.value.app_metadata || {};
    if (appMeta.role === 'admin' || appMeta.claims_admin === true) {
      return 'admin';
    }
    const userMeta = currentUser.value.user_metadata || {};
    // user_metadata hanya diizinkan untuk data profil non-otoritatif atau peran default 'citizen'
    return userMeta.role === 'citizen' ? 'citizen' : 'citizen';
  }),

  isAdmin: computed(() => {
    if (!currentUser.value) return false;
    const appMeta = currentUser.value.app_metadata || {};
    return appMeta.role === 'admin' || appMeta.claims_admin === true;
  }),

  /**
   * Initialize and restore session on application mount
   */
  async initialize() {
    authLoading.value = true

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) throw error

      currentSession.value = data?.session || null
      currentUser.value = data?.session?.user || null

      if (!authListenerInitialized) {
        supabase.auth.onAuthStateChange((_event, session) => {
          currentSession.value = session || null;
          currentUser.value = session?.user || null;
        });

        authListenerInitialized = true;
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      currentSession.value = null
      currentUser.value = null
    } finally {
      authLoading.value = false
    }
  },

  /**
   * Unified login for both User and Admin
   * Role is authoritative and returned from identity/server, not chosen by client.
   */
  async login(email, password) {
    authLoading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      currentUser.value = data.user;
      currentSession.value = data.session;

      // Determine authoritative role strictly from app_metadata
      const appMeta = data.user?.app_metadata || {};
      const isAdminUser = appMeta.role === 'admin' || appMeta.claims_admin === true;
      const isCitizenUser = appMeta.role === 'citizen' || (!isAdminUser && appMeta.role !== 'admin');
      
      const role = isAdminUser ? 'admin' : (isCitizenUser ? 'citizen' : null);
      if (!role) {
        throw new Error('Akses ditolak: Akun tidak memiliki peran yang valid.');
      }

      return {
        user: data.user,
        role,
        redirectPath: isAdminUser ? '/admin' : '/user'
      };
    } finally {
      authLoading.value = false;
    }
  },

  /**
   * Public registration - ALWAYS creates Citizen role only.
   * Admin roles can never be created via public signup.
   */
  async registerCitizen({ email, password, fullName, phone }) {
    authLoading.value = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            role: 'citizen'
          }
        }
      });

      if (error) throw error;

      // Jangan menetapkan sesi login dari hasil signup.
      // Pengguna harus login melalui halaman Login.
      return {
        user: data.user,
        requiresEmailConfirmation: !data.session,
        redirectPath: '/login'
      };
    } finally {
      authLoading.value = false;
    }
  },

  /**
   * Clear session and log out
   */
  async logout() {
    try {
      await supabase.auth.signOut();
    } finally {
      currentUser.value = null;
      currentSession.value = null;
    }
  }
};
