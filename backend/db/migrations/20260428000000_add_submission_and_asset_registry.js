/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Submissions table
  const hasSubmission = await knex.schema.hasTable('submission');
  if (!hasSubmission) {
    await knex.schema.createTable('submission', function(table) {
      table.string('submission_id').primary();
      table.string('tenant_id').notNullable();
      table.string('owner_id').notNullable();
      table.text('object_key');
      table.text('doc_hash');
      table.string('original_file_name');
      table.string('mime_type');
      table.bigInteger('size');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // Submission history table for simple audit entries
  const hasSubmissionHistory = await knex.schema.hasTable('submission_history');
  if (!hasSubmissionHistory) {
    await knex.schema.createTable('submission_history', function(table) {
      table.increments('id').primary();
      table.string('submission_id').notNullable().index();
      table.string('status');
      table.string('actor_id');
      table.text('remarks');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Asset registry table
  const hasAssetRegistry = await knex.schema.hasTable('asset_registry');
  if (!hasAssetRegistry) {
    await knex.schema.createTable('asset_registry', function(table) {
      table.string('id').primary();
      table.string('color');
      table.integer('size');
      table.string('owner');
      table.decimal('appraised_value', 20, 2);
      table.string('created_by');
      table.string('updated_by');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('submission_history');
  await knex.schema.dropTableIfExists('submission');
  await knex.schema.dropTableIfExists('asset_registry');
};
