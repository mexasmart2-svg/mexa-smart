/* =====================================================
   MEXA SMART — DATABASE SERVICE
   Versi 1.0.0
   Layanan akses database terpusat
   ===================================================== */

(function (window) {
  "use strict";

  const VERSION = "1.0.0";

  if (window.MEXA_DATABASE_SERVICE_VERSION === VERSION) {
    console.warn("MEXA SMART: Database Service sudah aktif.");
    return;
  }

  function getClient() {
    if (
      window.MEXA_SUPABASE_CLIENT &&
      typeof window.MEXA_SUPABASE_CLIENT.getClient === "function"
    ) {
      return window.MEXA_SUPABASE_CLIENT.getClient();
    }

    return window.mexaSupabase || null;
  }

  function requireClient() {
    const client = getClient();

    if (!client) {
      throw new Error(
        "Supabase belum siap. Periksa konfigurasi dan urutan script."
      );
    }

    return client;
  }

  function from(tableName) {
    if (
      typeof tableName !== "string" ||
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)
    ) {
      throw new TypeError("Nama tabel tidak valid.");
    }

    return requireClient().from(tableName);
  }

  async function select(tableName, options = {}) {
    const {
      columns = "*",
      filters = [],
      order,
      limit
    } = options;

    let query = from(tableName).select(columns);

    if (Array.isArray(filters)) {
      for (const filter of filters) {
        if (
          !filter ||
          typeof filter.column !== "string" ||
          typeof filter.operator !== "string"
        ) {
          throw new TypeError("Format filter database tidak valid.");
        }

        const allowedOperators = [
          "eq", "neq", "gt", "gte", "lt", "lte",
          "like", "ilike", "is", "in"
        ];

        if (!allowedOperators.includes(filter.operator)) {
          throw new Error("Operator filter tidak diizinkan.");
        }

        if (filter.operator === "in") {
          query = query.in(filter.column, filter.value);
        } else {
          query = query[filter.operator](
            filter.column,
            filter.value
          );
        }
      }
    }

    if (order && typeof order.column === "string") {
      query = query.order(order.column, {
        ascending: order.ascending !== false
      });
    }

    if (Number.isInteger(limit) && limit > 0) {
      query = query.limit(Math.min(limit, 500));
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  async function insert(tableName, values, options = {}) {
    if (!values || typeof values !== "object") {
      throw new TypeError("Data yang akan disimpan tidak valid.");
    }

    let query = from(tableName).insert(values);

    if (options.returning === true) {
      query = query.select(options.columns || "*");
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  async function update(tableName, values, filters = [], options = {}) {
    if (!values || typeof values !== "object") {
      throw new TypeError("Data perubahan tidak valid.");
    }

    if (!Array.isArray(filters) || filters.length === 0) {
      throw new Error(
        "Update ditolak: filter wajib diisi agar seluruh tabel tidak berubah."
      );
    }

    let query = from(tableName).update(values);

    for (const filter of filters) {
      if (
        !filter ||
        typeof filter.column !== "string" ||
        !["eq", "neq", "is"].includes(filter.operator)
      ) {
        throw new TypeError("Filter update tidak valid.");
      }

      query = query[filter.operator](
        filter.column,
        filter.value
      );
    }

    if (options.returning === true) {
      query = query.select(options.columns || "*");
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  async function remove(tableName, filters = [], options = {}) {
    if (!Array.isArray(filters) || filters.length === 0) {
      throw new Error(
        "Hapus data ditolak: filter wajib diisi."
      );
    }

    let query = from(tableName).delete();

    for (const filter of filters) {
      if (
        !filter ||
        typeof filter.column !== "string" ||
        !["eq", "neq", "is"].includes(filter.operator)
      ) {
        throw new TypeError("Filter hapus tidak valid.");
      }

      query = query[filter.operator](
        filter.column,
        filter.value
      );
    }

    if (options.returning === true) {
      query = query.select(options.columns || "*");
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  const api = Object.freeze({
    version: VERSION,
    select,
    insert,
    update,
    remove
  });

  window.MEXA_DATABASE = api;
  window.MEXA_DATABASE_SERVICE_VERSION = VERSION;

  console.log("MEXA SMART: Database Service berhasil dimuat.");
})(window);
