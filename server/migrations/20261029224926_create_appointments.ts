import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // btree_gist lets a GiST index compare plain integers with "=", which the
  // exclusion constraints below need alongside the time-range "&&" check.
  await knex.raw("CREATE EXTENSION IF NOT EXISTS btree_gist");

  await knex.schema.createTable("appointments", (table) => {
    table.increments("id").primary();
    table.integer("client_id").notNullable().references("id").inTable("users");
    table
      .integer("provider_id")
      .notNullable()
      .references("id")
      .inTable("provider_profiles");
    table
      .integer("service_id")
      .notNullable()
      .references("id")
      .inTable("services");
    table.timestamp("start_at").notNullable();
    table.timestamp("end_at").notNullable();
    table
      .text("status")
      .notNullable()
      .defaultTo("requested")
      .checkIn(
        [
          "requested",
          "confirmed",
          "declined",
          "cancelled",
          "completed",
          "no_show",
        ],
        "appointments_status_check",
      );
    table.decimal("price", 10, 2).notNullable();
    table
      .text("location_type")
      .notNullable()
      .checkIn(
        ["provider_place", "client_place", "campus_spot"],
        "appointments_location_type_check",
      );
    table.text("location_details");
    table.text("client_notes");
    table.boolean("is_paid").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.check(
      "?? > ??",
      ["end_at", "start_at"],
      "appointments_end_after_start_check",
    );
    table.check("?? >= 0", ["price"], "appointments_price_check");
  });

  // tstzrange(start_at, end_at) is half-open "[)", so back-to-back bookings
  // (one ends at 2:00, the next starts at 2:00) are allowed.
  await knex.raw(`
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_no_provider_overlap
      EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(start_at, end_at) WITH &&
      )
      WHERE (status IN ('requested', 'confirmed'))
  `);
  await knex.raw(`
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_no_client_overlap
      EXCLUDE USING gist (
        client_id WITH =,
        tstzrange(start_at, end_at) WITH &&
      )
      WHERE (status IN ('requested', 'confirmed'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("appointments");
  await knex.raw("DROP EXTENSION IF EXISTS btree_gist");
}
