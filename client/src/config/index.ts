const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  APP_NAME: 'QueryBot',
  TOKEN_STORAGE_KEY: 'querybot_token',
  REFRESH_TOKEN_STORAGE_KEY: 'querybot_refresh_token'
};

export default config;