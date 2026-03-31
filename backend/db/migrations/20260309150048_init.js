/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// this part for up is saying that for migrating the new changes or latest changes
exports.up = async function(knex) {

    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    await knex.raw(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
        END;
        $$ language 'plpgsql';
    `);

    await knex.schema.createTable('users', function(table) {
        table.uuid('user_id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('email').notNullable().unique()
        table.string('firebase_uid').notNullable().unique()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
    })

    await knex.raw(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// down export is just rollbacks which is undo migration

exports.down = async function(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column');

    await knex.schema.dropTable('users')

};
