/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// this part for up is saying that for migrating the new changes or latest changes
exports.up = async function(knex) {
   return knex.schema.alterTable('users', function(table) {
    table.dropColumn('password');  // Or 'username', etc.
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// down export is just rollbacks which is undo migration
exports.down = function(knex) {
   return knex.schema.alterTable('users', function(table) {
    table.dropColumn('password');  // Or 'username', etc.
  });
};
