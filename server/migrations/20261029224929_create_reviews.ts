import type { Knex } from "knex";

// Only completed appointments can be reviewed. That is checked in the
// backend, not here.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reviews", (table) => {
    table.increments("id").primary();
    table
      .integer("appointment_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("appointments");
    table.smallint("rating").notNullable();
    table.text("comments");
    table.text("provider_reply");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.check("?? BETWEEN 1 AND 5", ["rating"], "reviews_rating_check");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("reviews");
}
