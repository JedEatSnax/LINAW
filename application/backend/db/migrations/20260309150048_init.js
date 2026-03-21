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
    
    await knex.schema.createTable('network', function(table) {
        table.uuid('network_id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name').notNullable().unique()
        table.uuid('created_by').notNullable()
            .references('user_id')
            .inTable('users')
            .onDelete('CASCADE')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
    })

    await knex.schema.createTable('organization', function(table){
        table.uuid('organization_id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid('network_id').notNullable()
            .references('network_id')
            .inTable('network')
            .onDelete('CASCADE')
        table.string('name').notNullable()
        table.uuid('msp_id').nullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())

        table.unique(['network_id', 'name'])
    })

    await knex.raw(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await knex.raw(`
        CREATE TRIGGER update_network_updated_at
        BEFORE UPDATE ON network
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();   
    `)

    await knex.raw(`
        CREATE TRIGGER update_organization_updated_at
        BEFORE UPDATE ON organization
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// down export is just rollbacks which is undo migration
exports.down = async function(knex) {
    await knex.raw('DROP TRIGGER IF EXISTS update_organization_updated_at ON organization');
    await knex.raw('DROP TRIGGER IF EXISTS update_network_updated_at ON network');
    await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column');

    await knex.schema.dropTable('organization')
    await knex.schema.dropTable('network')
    await knex.schema.dropTable('users')
};
