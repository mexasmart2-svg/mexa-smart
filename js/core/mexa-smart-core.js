/* MEXA SMART — CENTRAL CORE V1.1.0 */
(function (window) {
  "use strict";

  if (window.MEXA_SMART) return;

  let started = false;
  let starting = null;
  let lastError = null;

  function getStatus() {
    const lifecycle = window.MEXA_LIFECYCLE;
    const registry = window.MEXA_MODULE_REGISTRY;
    const clientService = window.MEXA_SUPABASE_CLIENT;

    return {
      name: "MEXA SMART",
      version: "1.1.0",
      started: started,
      starting: Boolean(starting),
      supabaseReady: Boolean(
        clientService &&
        typeof clientService.getClient === "function" &&
        clientService.getClient()
      ),
      lifecycle: lifecycle ? lifecycle.getStatus() : null,
      registry: registry ? registry.getStatus() : null,
      lastError: lastError
    };
  }

  async function start(moduleNames) {
    if (started) return getStatus();
    if (starting) return starting;

    starting = (async function () {
      try {
        const config = window.MEXA_CONFIG;
        const service = window.MEXA_SUPABASE_CLIENT;
        const lifecycle = window.MEXA_LIFECYCLE;

        if (!config) throw new Error("Konfigurasi MEXA belum dimuat.");
        if (!window.supabase) throw new Error("Supabase SDK belum dimuat.");
        if (!service || typeof service.getClient !== "function") {
          throw new Error("Supabase client service belum tersedia.");
        }
        if (!lifecycle) throw new Error("Lifecycle belum dimuat.");

        let client = service.getClient();
        if (!client && typeof service.init === "function") {
          await service.init();
          client = service.getClient();
        }
        if (!client) throw new Error("Supabase belum siap.");

        const names = Array.isArray(moduleNames) ? moduleNames : [];
        const results = await Promise.allSettled(
          names.map(function (name) {
            return lifecycle.start(name, { core: "MEXA SMART" });
          })
        );

        const failures = results
          .map(function (result, index) {
            return result.status === "rejected"
              ? { module: names[index], error: result.reason }
              : null;
          })
          .filter(Boolean);

        if (failures.length) {
          lastError = failures.map(function (item) {
            return item.module + ": " +
              (item.error && item.error.message || item.error);
          }).join(" | ");
        } else {
          lastError = null;
        }

        started = true;

        const bus = window.MEXA_EVENT_BUS;
        if (bus && typeof bus.emit === "function") {
          bus.emit("core:ready", {
            version: "1.1.0",
            failures: failures
          });
        }

        return getStatus();
      } catch (error) {
        lastError = error.message || String(error);
        throw error;
      } finally {
        starting = null;
      }
    })();

    return starting;
  }

  window.MEXA_SMART = Object.freeze({
    version: "1.1.0",
    start: start,
    getStatus: getStatus
  });
})(window);
