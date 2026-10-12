/* =====================================================
   MEXA SMART — EVENT BUS
   Pusat komunikasi antar-modul
   Version: 1.0.0
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  // Cegah file yang sama diinisialisasi berulang kali.
  if (window.MEXA_EVENT_BUS) {
    console.warn("[MEXA SMART] Event Bus sudah tersedia.");
    return;
  }

  const listeners = new Map();
  let eventCount = 0;

  function log(...args) {
    const config = window.MEXA_CONFIG;
    if (config && config.CORE && config.CORE.DEBUG) {
      console.log("[MEXA EVENT BUS]", ...args);
    }
  }

  function validateEventName(eventName) {
    if (
      typeof eventName !== "string" ||
      !eventName.trim()
    ) {
      throw new TypeError(
        "Nama event MEXA harus berupa teks yang tidak kosong."
      );
    }
  }

  function on(eventName, callback) {
    validateEventName(eventName);

    if (typeof callback !== "function") {
      throw new TypeError(
        "Callback event MEXA harus berupa fungsi."
      );
    }

    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(callback);

    log("Listener ditambahkan:", eventName);

    // Mengembalikan fungsi untuk berhenti berlangganan.
    return function unsubscribe() {
      off(eventName, callback);
    };
  }

  function once(eventName, callback) {
    validateEventName(eventName);

    if (typeof callback !== "function") {
      throw new TypeError(
        "Callback event MEXA harus berupa fungsi."
      );
    }

    let unsubscribe;

    const wrapper = function (payload) {
      unsubscribe();
      callback(payload);
    };

    unsubscribe = on(eventName, wrapper);

    return unsubscribe;
  }

  function off(eventName, callback) {
    validateEventName(eventName);

    const eventListeners = listeners.get(eventName);

    if (!eventListeners) return false;

    if (typeof callback !== "function") {
      return false;
    }

    const removed = eventListeners.delete(callback);

    if (eventListeners.size === 0) {
      listeners.delete(eventName);
    }

    if (removed) {
      log("Listener dilepas:", eventName);
    }

    return removed;
  }

  function emit(eventName, payload) {
    validateEventName(eventName);

    const eventListeners = listeners.get(eventName);

    eventCount += 1;

    log("Event dikirim:", eventName);

    if (!eventListeners || eventListeners.size === 0) {
      return 0;
    }

    // Salinan daftar mencegah perubahan listener saat
    // event sedang diproses mengganggu iterasi.
    const callbacks = Array.from(eventListeners);
    let delivered = 0;

    callbacks.forEach(function (callback) {
      try {
        callback(payload);
        delivered += 1;
      } catch (error) {
        console.error(
          "[MEXA EVENT BUS] Listener gagal:",
          eventName,
          error
        );
      }
    });

    return delivered;
  }

  function clear(eventName) {
    if (typeof eventName === "undefined") {
      listeners.clear();
      log("Semua listener dibersihkan.");
      return true;
    }

    validateEventName(eventName);

    const existed = listeners.has(eventName);
    listeners.delete(eventName);

    log("Listener event dibersihkan:", eventName);

    return existed;
  }

  function getStatus() {
    return {
      version: VERSION,
      ready: true,
      eventTypes: listeners.size,
      totalEventsEmitted: eventCount
    };
  }

  window.MEXA_EVENT_BUS = Object.freeze({
    version: VERSION,
    on: on,
    once: once,
    off: off,
    emit: emit,
    clear: clear,
    getStatus: getStatus
  });

  log("Event Bus berhasil dimuat.");
})(window);
