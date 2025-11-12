export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  SQLITE_API_BASE_URL: import.meta.env.VITE_SQLITE_API_BASE_URL || 'http://localhost:3001',
  APP_NAME: 'QueryBot',
  VERSION: '1.0.0'
} as const;