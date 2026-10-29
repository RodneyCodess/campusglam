import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("provider_profiles", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("users");
    table.text("business_name");
    table.text("bio");
    table.text("photo_url");
    table.text("instagram_handle");
    table
      .text("verification_status")
      .notNullable()
      .defaultTo("pending")
      .checkIn(
        ["pending", "verified", "rejected"],
        "provider_profiles_verification_status_check",
      );
    table.boolean("is_accepting_bookings").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("provider_profiles");
}
