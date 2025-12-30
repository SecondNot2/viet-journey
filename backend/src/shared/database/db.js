/**
 * Database Service (Supabase)
 * Query wrapper for Supabase PostgreSQL
 */
const supabase = require("./supabase");

/**
 * Get Supabase client for direct table operations
 * This is the preferred way to interact with Supabase
 */
const getClient = () => supabase;

/**
 * Helper: Select from table
 */
const select = async (table, columns = "*", filters = {}) => {
  let queryBuilder = supabase.from(table).select(columns);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryBuilder = queryBuilder.eq(key, value);
    }
  });

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data;
};

/**
 * Helper: Insert into table
 */
const insert = async (table, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  if (error) throw error;
  return result;
};

/**
 * Helper: Update table
 */
const update = async (table, data, filters = {}) => {
  let queryBuilder = supabase.from(table).update(data);

  Object.entries(filters).forEach(([key, value]) => {
    queryBuilder = queryBuilder.eq(key, value);
  });

  const { data: result, error } = await queryBuilder.select();

  if (error) throw error;
  return result;
};

/**
 * Helper: Delete from table
 */
const remove = async (table, filters = {}) => {
  let queryBuilder = supabase.from(table).delete();

  Object.entries(filters).forEach(([key, value]) => {
    queryBuilder = queryBuilder.eq(key, value);
  });

  const { data: result, error } = await queryBuilder;

  if (error) throw error;
  return result;
};

/**
 * Legacy query function - DEPRECATED
 * Use getClient() and Supabase query builder instead
 * This function returns empty array to avoid errors from old code
 */
const query = async (sql, params = []) => {
  console.warn(
    "⚠️ db.query() is deprecated with Supabase. Use getClient().from(table).select() instead."
  );
  console.warn("SQL attempted:", sql);
  // Return empty result to prevent crashes
  return [[], null];
};

/**
 * Transaction simulation (Supabase doesn't support true transactions via JS SDK)
 * Use PostgreSQL functions for complex transactions
 */
const beginTransaction = async () => {
  console.warn(
    "⚠️ Supabase JS SDK does not support transactions. Use RPC functions for transactions."
  );
  return { query: async () => [[], null] };
};

const commit = async () => {
  // No-op for Supabase
};

const rollback = async () => {
  // No-op for Supabase
};

module.exports = {
  query,
  getClient,
  select,
  insert,
  update,
  remove,
  beginTransaction,
  commit,
  rollback,
  supabase,
};
