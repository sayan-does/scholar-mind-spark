
// Mock authentication functions for frontend-only development
export const supabase = {
  auth: {
    getSession: async () => ({ 
      data: { session: { user: { id: 'mock-user-id' } } }, 
      error: null 
    }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    })
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      remove: async () => ({ error: null })
    })
  },
  from: () => ({
    delete: async () => ({ error: null }),
    select: async () => ({ 
      data: [], 
      error: null 
    })
  }),
  functions: {
    invoke: async () => ({ error: null })
  }
};
