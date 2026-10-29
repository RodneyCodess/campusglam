import type { Knex } from "knex";

// Overlapping windows for the same provider are checked in the backend,
// not here.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("availability", (table) => {
    table.increments("id").primary();
    table
      .integer("provider_id")
      .notNullable()
      .references("id")
      .inTable("provider_profiles");
    table.smallint("day_of_week").notNullable();
    table.time("start_time").notNullable();
    table.time("end_time").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.check(
      "?? BETWEEN 0 AND 6",
      ["day_of_week"],
      "availability_day_of_week_check",
    );
    table.check(
      "?? > ??",
      ["end_time", "start_time"],
      "availability_end_after_start_check",
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("availability");
}
