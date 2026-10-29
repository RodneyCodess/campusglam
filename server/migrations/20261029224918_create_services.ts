import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("services", (table) => {
    table.increments("id").primary();
    table
      .integer("provider_id")
      .notNullable()
      .references("id")
      .inTable("provider_profiles");
    table
      .text("category")
      .notNullable()
      .checkIn(
        [
          "braids",
          "makeup",
          "nails",
          "lashes",
          "haircut",
          "skincare",
          "hair",
          "locs",
          "other",
        ],
        "services_category_check",
      );
    table.text("title").notNullable();
    table.text("description");
    table.decimal("price", 10, 2).notNullable();
    table.integer("duration_min").notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.check("?? >= 0", ["price"], "services_price_check");
    table.check("?? > 0", ["duration_min"], "services_duration_min_check");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("services");
}
