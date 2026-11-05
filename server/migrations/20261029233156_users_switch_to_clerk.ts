import type { Knex } from "knex";

// Login moves to Clerk, which also handles passwords and email verification.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.text("clerk_user_id").notNullable().unique();
    table.dropColumn("password_hash");
    table.dropColumn("email_verified");
    table.renameColumn("is_seller", "is_provider");
    table
      .text("campus")
      .notNullable()
      .defaultTo("University at Buffalo")
      .alter();
  });
}

// password_hash is re-added as required with no default, so this rollback
// only works while users is empty.
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("clerk_user_id");
    table.text("password_hash").notNullable();
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.renameColumn("is_provider", "is_seller");
    table.text("campus").notNullable().alter();
  });
}
