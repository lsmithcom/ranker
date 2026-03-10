import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    'nuxt-auth-utils',
  ],

  alias: {
    '#server': './server',
  },

  nitro: {
    alias: {
      '#server': './server',
    },
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '*/30 * * * *': ['cron:pull-rankings'],
    },
  },

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI,
    encryptionKey: process.env.ENCRYPTION_KEY,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    cronSecret: process.env.CRON_SECRET,
    public: {},
  },

  pages: true,
});
