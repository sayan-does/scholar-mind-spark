
// Mock service that matches future FastAPI endpoint structure
export const supabase = {
  auth: {
    getSession: async () => ({ 
      data: { session: null }, 
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
  // Mock paper management endpoints
  from: (table: string) => ({
    select: () => ({
      data: [],
      error: null
    }),
    delete: () => ({
      error: null
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => ({ error: null }),
      remove: async (path: string) => ({ error: null })
    })
  },
  functions: {
    invoke: async (name: string) => ({ error: null })
  }
};

