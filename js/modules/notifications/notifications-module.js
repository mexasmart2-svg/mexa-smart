/* =====================================================
   MEXA SMART — NOTIFICATIONS MODULE
   Modul dasar sistem notifikasi
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";
  const MODULE_NAME = "notifications";

  if (window.MEXA_NOTIFICATIONS_MODULE) {
    console.warn(
      "[MEXA NOTIFICATIONS] Modul sudah dimuat."
    );
    return;
  }

  let initialized = false;
  let unsubscribeEvents = [];

  function reportError(error, operation) {
    const handler = window.MEXA_ERROR_HANDLER;

    if (handler && typeof handler.report === "function") {
      handler.report(error, {
        source: MODULE_NAME,
        operation: operation
      });
    } else {
      console.error("[MEXA NOTIFICATIONS]", error);
    }
  }

  async function init() {
    if (initialized) return;

    try {
      if (!window.MEXA_SMART) {
        throw new Error(
          "Pusat MEXA SMART belum tersedia."
        );
      }

      initialized = true;

      const eventBus = window.MEXA_EVENT_BUS;

      if (eventBus && typeof eventBus.emit === "function") {
        eventBus.emit("notifications:ready", {
          name: MODULE_NAME,
          version: VERSION,
          timestamp: new Date().toISOString()
        });
      }

      console.log(
        "[MEXA NOTIFICATIONS] Modul berhasil diinisialisasi."
      );
    } catch (error) {
      reportError(error, "init");
      throw error;
    }
  }

  async function destroy() {
    unsubscribeEvents.forEach(function (unsubscribe) {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });

    unsubscribeEvents = [];
    initialized = false;

    console.log(
      "[MEXA NOTIFICATIONS] Modul dihentikan."
    );
  }

  function getStatus() {
    return {
      name: MODULE_NAME,
      version: VERSION,
      initialized: initialized,
      activeSubscriptions: unsubscribeEvents.length
    };
  }

  const api = Object.freeze({
    version: VERSION,
    init: init,
    destroy: destroy,
    getStatus: getStatus
  });

  window.MEXA_NOTIFICATIONS_MODULE = api;

  const lifecycle = window.MEXA_LIFECYCLE;

  if (lifecycle && typeof lifecycle.register === "function") {
    lifecycle.register(MODULE_NAME, {
      version: VERSION,
      init: init,
      destroy: destroy
    });
  } else {
    console.warn(
      "[MEXA NOTIFICATIONS] Lifecycle belum tersedia."
    );
  }
})(window);
