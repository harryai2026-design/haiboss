import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inquiries_notification_state" AS ENUM('pending', 'sent', 'failed');
  ALTER TABLE "inquiries" ADD COLUMN "notification_state" "enum_inquiries_notification_state" DEFAULT 'pending';
  ALTER TABLE "inquiries" ADD COLUMN "notification_attempts" numeric DEFAULT 0;
  ALTER TABLE "inquiries" ADD COLUMN "notification_sent_at" timestamp(3) with time zone;
  ALTER TABLE "inquiries" ADD COLUMN "notification_last_error" varchar;
  ALTER TABLE "inquiries" ADD COLUMN "notification_next_attempt_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inquiries" DROP COLUMN "notification_state";
  ALTER TABLE "inquiries" DROP COLUMN "notification_attempts";
  ALTER TABLE "inquiries" DROP COLUMN "notification_sent_at";
  ALTER TABLE "inquiries" DROP COLUMN "notification_last_error";
  ALTER TABLE "inquiries" DROP COLUMN "notification_next_attempt_at";
  DROP TYPE "public"."enum_inquiries_notification_state";`)
}
