
/* =====================================================
   MEXA SMART — CONFIGURATION
   Versi 1.0.0
   Konfigurasi pusat proyek
   ===================================================== */

(function (window) {
  "use strict";

  if (window.MEXA_CONFIG) {
    console.warn("MEXA SMART: konfigurasi sudah dimuat.");
    return;
  }

  const config = {
    APP_NAME: "MEXA SMART",
    APP_VERSION: "1.0.0",
    ENVIRONMENT: "development",

    BACKEND_PROVIDER: "supabase",

    SUPABASE_URL: "",
    SUPABASE_PUBLISHABLE_KEY: "",

    CORE: {
      DEBUG: true,
      MODULE_TIMEOUT: 10000
    },

    FEATURES: {
      HOME: true,
      POSTS: true,
      GAMES: true,
      FRIENDS: true,
      PROFILE: true,
      STORIES: true,
      MEDIA: true,
      REELS: true,
      MESSENGER: true,
      GROUPS: true,
      NOTIFICATIONS: true,
      MEXA_AI: false
    }
  };

  window.MEXA_CONFIG = Object.freeze(config);

  console.log(
    "MEXA SMART: konfigurasi dasar berhasil dimuat."
  );
})(window);
