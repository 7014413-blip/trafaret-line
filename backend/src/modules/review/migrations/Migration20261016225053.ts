import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261016225053 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "tl_review" drop constraint if exists "tl_review_source_external_id_unique";`);
    this.addSql(`alter table if exists "tl_review" drop constraint if exists "tl_review_order_id_subject_key_unique";`);
    this.addSql(`create table if not exists "tl_review" ("id" text not null, "order_id" text null, "order_number" text null, "subject_key" text not null, "product_handle" text null, "product_title" text null, "author_name" text not null, "city" text null, "rating" integer not null, "text" text not null, "photos" jsonb not null, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "source" text check ("source" in ('site', 'topperok', 'eventdecor')) not null default 'site', "external_id" text null, "shop_reply" text null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tl_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tl_review_deleted_at" ON "tl_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tl_review_order_id_subject_key_unique" ON "tl_review" ("order_id", "subject_key") WHERE order_id IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tl_review_source_external_id_unique" ON "tl_review" ("source", "external_id") WHERE external_id IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tl_review_status_product_handle" ON "tl_review" ("status", "product_handle") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tl_review" cascade;`);
  }

}
