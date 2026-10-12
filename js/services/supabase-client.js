/* =====================================================
   MEXA SMART — SUPABASE CLIENT
   Versi 1.0.0
   Satu koneksi Supabase untuk seluruh modul
   ===================================================== */

(function (window, document) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_SUPABASE_CLIENT_VERSION === VERSION) {
    console.warn("MEXA SMART: Supabase Client sudah aktif.");
    return;
  }

  function log(message, data) {
    if (window.MEXA_CONFIG?.CORE?.DEBUG) {
      console.log("[MEXA SUPABASE]", message, data ?? "");
    }
  }

  function reportError(message, error) {
    console.error("[MEXA SUPABASE]", message, error ?? "");
  }

  function initialize() {
    const config = window.MEXA_CONFIG;

    if (!config) {
      reportError(
        "Konfigurasi belum dimuat. Periksa urutan script."
      );
      return false;
    }

    if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
      reportError(
        "URL atau Publishable key Supabase belum diisi."
      );
      return false;
    }

    if (!window.supabase?.createClient) {
      reportError(
        "Supabase SDK belum dimuat."
      );
      return false;
    }

    if (window.mexaSupabase) {
      log("Koneksi Supabase sudah tersedia.");
      return true;
    }

    try {
      window.mexaSupabase = window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      window.MEXA_SUPABASE_CLIENT_VERSION = VERSION;

      log("Client berhasil dibuat.");
      return true;
    } catch (error) {
      reportError("Gagal membuat client.", error);
      return false;
    }
  }

  const api = Object.freeze({
    version: VERSION,

    init: initialize,

    getClient: function () {
      return window.mexaSupabase || null;
    },

    isReady: function () {
      return Boolean(
        window.mexaSupabase &&
        window.MEXA_SUPABASE_CLIENT_VERSION === VERSION
      );
    }
  });

  window.MEXA_SUPABASE_CLIENT = api;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})(window, document);
