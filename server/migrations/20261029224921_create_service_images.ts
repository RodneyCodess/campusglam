import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("service_images", (table) => {
    table.increments("id").primary();
    table
      .integer("service_id")
      .notNullable()
      .references("id")
      .inTable("services")
      .onDelete("CASCADE");
    table.text("image_url").notNullable();
    table.integer("display_order").notNullable().defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("service_images");
}
