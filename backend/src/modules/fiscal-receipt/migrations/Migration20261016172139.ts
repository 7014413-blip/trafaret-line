import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261016172139 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fiscal_receipt" drop constraint if exists "fiscal_receipt_order_number_unique";`);
    this.addSql(`create table if not exists "fiscal_receipt" ("id" text not null, "order_number" text not null, "order_id" text not null, "status" text check ("status" in ('pending', 'issued', 'failed', 'not_configured')) not null default 'pending', "attempts" integer not null default 1, "request" jsonb not null, "fiscal_number" text null, "receipt_url" text null, "message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fiscal_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fiscal_receipt_order_number_unique" ON "fiscal_receipt" ("order_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fiscal_receipt_deleted_at" ON "fiscal_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fiscal_receipt" cascade;`);
  }

}
