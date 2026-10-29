import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.text("full_name").notNullable();
    table.text("email").notNullable().unique();
    table.text("password_hash").notNullable();
    table.text("campus").notNullable();
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.boolean("is_seller").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
