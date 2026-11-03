import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_published_locale" AS ENUM('zh');
  CREATE TYPE "public"."enum_cases_kind" AS ENUM('proposal', 'verified-case');
  CREATE TYPE "public"."enum_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_version_kind" AS ENUM('proposal', 'verified-case');
  CREATE TYPE "public"."enum__cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_published_locale" AS ENUM('zh');
  CREATE TYPE "public"."enum_content_candidates_state" AS ENUM('pending', 'reviewing', 'used', 'dismissed');
  CREATE TYPE "public"."enum_articles_section" AS ENUM('insights', 'ai', 'guides');
  CREATE TYPE "public"."enum_articles_content_type" AS ENUM('analysis', 'tool', 'guide', 'news', 'tested');
  CREATE TYPE "public"."enum__articles_v_version_section" AS ENUM('insights', 'ai', 'guides');
  CREATE TYPE "public"."enum__articles_v_version_content_type" AS ENUM('analysis', 'tool', 'guide', 'news', 'tested');
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"title" varchar,
  	"description" varchar,
  	"deliverables" varchar,
  	"scope" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_deliverables" varchar,
  	"version_scope" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__services_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"title" varchar,
  	"kind" "enum_cases_kind" DEFAULT 'proposal',
  	"description" varchar,
  	"evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cases_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_cases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_kind" "enum__cases_v_version_kind" DEFAULT 'proposal',
  	"version_description" varchar,
  	"version_evidence" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__cases_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "content_candidates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_url" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"source_published_at" timestamp(3) with time zone,
  	"collected_at" timestamp(3) with time zone NOT NULL,
  	"state" "enum_content_candidates_state" DEFAULT 'pending',
  	"review_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"checked_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "_articles_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"checked_at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  ALTER TABLE "articles_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_articles_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_version_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('zh');
  ALTER TABLE "articles_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_articles_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_version_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_articles_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__articles_v_published_locale";
  CREATE TYPE "public"."enum__articles_v_published_locale" AS ENUM('zh');
  ALTER TABLE "_articles_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__articles_v_published_locale" USING "published_locale"::"public"."enum__articles_v_published_locale";
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_published_locale";
  CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('zh');
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__products_v_published_locale" USING "published_locale"::"public"."enum__products_v_published_locale";
  ALTER TABLE "articles" ADD COLUMN "section" "enum_articles_section" DEFAULT 'guides';
  ALTER TABLE "articles" ADD COLUMN "content_type" "enum_articles_content_type" DEFAULT 'guide';
  ALTER TABLE "articles" ADD COLUMN "author_name" varchar DEFAULT '海老板编辑部';
  ALTER TABLE "articles" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "event_date" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "scheduled_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "review_approved" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN "review_notes" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_section" "enum__articles_v_version_section" DEFAULT 'guides';
  ALTER TABLE "_articles_v" ADD COLUMN "version_content_type" "enum__articles_v_version_content_type" DEFAULT 'guide';
  ALTER TABLE "_articles_v" ADD COLUMN "version_author_name" varchar DEFAULT '海老板编辑部';
  ALTER TABLE "_articles_v" ADD COLUMN "version_featured" boolean DEFAULT false;
  ALTER TABLE "_articles_v" ADD COLUMN "version_event_date" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_scheduled_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_review_approved" boolean DEFAULT false;
  ALTER TABLE "_articles_v" ADD COLUMN "version_review_notes" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topics_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cases_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "content_candidates_id" integer;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_parent_id_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_sources" ADD CONSTRAINT "articles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sources" ADD CONSTRAINT "_articles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_snapshot_idx" ON "_services_v" USING btree ("snapshot");
  CREATE INDEX "_services_v_published_locale_idx" ON "_services_v" USING btree ("published_locale");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE UNIQUE INDEX "cases_slug_idx" ON "cases" USING btree ("slug");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  CREATE INDEX "cases__status_idx" ON "cases" USING btree ("_status");
  CREATE INDEX "_cases_v_parent_idx" ON "_cases_v" USING btree ("parent_id");
  CREATE INDEX "_cases_v_version_version_slug_idx" ON "_cases_v" USING btree ("version_slug");
  CREATE INDEX "_cases_v_version_version_updated_at_idx" ON "_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_cases_v_version_version_created_at_idx" ON "_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_cases_v_version_version__status_idx" ON "_cases_v" USING btree ("version__status");
  CREATE INDEX "_cases_v_created_at_idx" ON "_cases_v" USING btree ("created_at");
  CREATE INDEX "_cases_v_updated_at_idx" ON "_cases_v" USING btree ("updated_at");
  CREATE INDEX "_cases_v_snapshot_idx" ON "_cases_v" USING btree ("snapshot");
  CREATE INDEX "_cases_v_published_locale_idx" ON "_cases_v" USING btree ("published_locale");
  CREATE INDEX "_cases_v_latest_idx" ON "_cases_v" USING btree ("latest");
  CREATE UNIQUE INDEX "content_candidates_source_url_idx" ON "content_candidates" USING btree ("source_url");
  CREATE INDEX "content_candidates_updated_at_idx" ON "content_candidates" USING btree ("updated_at");
  CREATE INDEX "content_candidates_created_at_idx" ON "content_candidates" USING btree ("created_at");
  CREATE INDEX "articles_sources_order_idx" ON "articles_sources" USING btree ("_order");
  CREATE INDEX "articles_sources_parent_id_idx" ON "articles_sources" USING btree ("_parent_id");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_topics_id_idx" ON "articles_rels" USING btree ("topics_id");
  CREATE INDEX "_articles_v_version_sources_order_idx" ON "_articles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sources_parent_id_idx" ON "_articles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_topics_id_idx" ON "_articles_v_rels" USING btree ("topics_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_content_candidates_fk" FOREIGN KEY ("content_candidates_id") REFERENCES "public"."content_candidates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");
  CREATE INDEX "payload_locked_documents_rels_content_candidates_id_idx" ON "payload_locked_documents_rels" USING btree ("content_candidates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "content_candidates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "cases" CASCADE;
  DROP TABLE "_cases_v" CASCADE;
  DROP TABLE "content_candidates" CASCADE;
  DROP TABLE "articles_sources" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_sources" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_topics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cases_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_content_candidates_fk";
  
  ALTER TABLE "articles_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_articles_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_version_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('en');
  ALTER TABLE "articles_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_articles_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "products_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_version_attributes_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_products_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_articles_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__articles_v_published_locale";
  CREATE TYPE "public"."enum__articles_v_published_locale" AS ENUM('en');
  ALTER TABLE "_articles_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__articles_v_published_locale" USING "published_locale"::"public"."enum__articles_v_published_locale";
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_published_locale";
  CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('en');
  ALTER TABLE "_products_v" ALTER COLUMN "published_locale" SET DATA TYPE "public"."enum__products_v_published_locale" USING "published_locale"::"public"."enum__products_v_published_locale";
  DROP INDEX "payload_locked_documents_rels_topics_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_cases_id_idx";
  DROP INDEX "payload_locked_documents_rels_content_candidates_id_idx";
  ALTER TABLE "articles" DROP COLUMN "section";
  ALTER TABLE "articles" DROP COLUMN "content_type";
  ALTER TABLE "articles" DROP COLUMN "author_name";
  ALTER TABLE "articles" DROP COLUMN "featured";
  ALTER TABLE "articles" DROP COLUMN "event_date";
  ALTER TABLE "articles" DROP COLUMN "scheduled_at";
  ALTER TABLE "articles" DROP COLUMN "review_approved";
  ALTER TABLE "articles" DROP COLUMN "review_notes";
  ALTER TABLE "_articles_v" DROP COLUMN "version_section";
  ALTER TABLE "_articles_v" DROP COLUMN "version_content_type";
  ALTER TABLE "_articles_v" DROP COLUMN "version_author_name";
  ALTER TABLE "_articles_v" DROP COLUMN "version_featured";
  ALTER TABLE "_articles_v" DROP COLUMN "version_event_date";
  ALTER TABLE "_articles_v" DROP COLUMN "version_scheduled_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_review_approved";
  ALTER TABLE "_articles_v" DROP COLUMN "version_review_notes";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "topics_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cases_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "content_candidates_id";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum__services_v_published_locale";
  DROP TYPE "public"."enum_cases_kind";
  DROP TYPE "public"."enum_cases_status";
  DROP TYPE "public"."enum__cases_v_version_kind";
  DROP TYPE "public"."enum__cases_v_version_status";
  DROP TYPE "public"."enum__cases_v_published_locale";
  DROP TYPE "public"."enum_content_candidates_state";
  DROP TYPE "public"."enum_articles_section";
  DROP TYPE "public"."enum_articles_content_type";
  DROP TYPE "public"."enum__articles_v_version_section";
  DROP TYPE "public"."enum__articles_v_version_content_type";`)
}
