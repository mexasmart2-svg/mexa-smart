/* MEXA SMART — MODULE REGISTRY V1.1.0 */
(function (window) {
  "use strict";

  if (window.MEXA_MODULE_REGISTRY) return;

  const modules = new Map();

  function normalize(name) {
    if (typeof name !== "string" || !name.trim()) {
      throw new TypeError("Nama modul tidak valid.");
    }
    return name.trim().toLowerCase();
  }

  function register(name, options) {
    const key = normalize(name);
    const opts = options || {};
    const existing = modules.get(key);

    // Pendaftaran ulang memperbarui data, bukan menggandakan modul.
    if (existing) {
      if (opts.version) existing.version = opts.version;
      if (opts.dependencies) {
        existing.dependencies = opts.dependencies.slice();
      }
      return get(key);
    }

    modules.set(key, {
      name: key,
      version: opts.version || "1.0.0",
      dependencies: Array.isArray(opts.dependencies)
        ? opts.dependencies.slice()
        : [],
      status: "registered",
      registeredAt: new Date().toISOString(),
      error: null
    });

    return get(key);
  }

  function setStatus(name, status, error) {
    const key = normalize(name);
    const item = modules.get(key);

    if (!item) {
      throw new Error('Modul "' + key + '" belum terdaftar.');
    }

    const allowed = [
      "registered", "initializing", "ready", "disabled", "error"
    ];

    if (!allowed.includes(status)) {
      throw new Error("Status tidak valid: " + status);
    }

    item.status = status;
    item.error = status === "error"
      ? String(error && error.message || error || "Kesalahan modul.")
      : null;

    return get(key);
  }

  function get(name) {
    const item = modules.get(normalize(name));
    return item ? { ...item, dependencies: item.dependencies.slice() } : null;
  }

  function has(name) {
    return modules.has(normalize(name));
  }

  function list() {
    return Array.from(modules.keys()).map(get);
  }

  function remove(name) {
    return modules.delete(normalize(name));
  }

  function getStatus() {
    const counts = {
      registered: 0, initializing: 0, ready: 0,
      disabled: 0, error: 0
    };

    modules.forEach(function (item) {
      if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
        counts[item.status]++;
      }
    });

    return {
      version: "1.1.0",
      totalModules: modules.size,
      counts: counts
    };
  }

  window.MEXA_MODULE_REGISTRY = Object.freeze({
    version: "1.1.0",
    register: register,
    setStatus: setStatus,
    get: get,
    has: has,
    list: list,
    remove: remove,
    getStatus: getStatus
  });
})(window);
