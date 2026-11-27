import { MigrationInterface, QueryRunner } from 'typeorm';

export class Workshops1764100000000 implements MigrationInterface {
  name = 'Workshops1764100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "workshop_payment_method_enum" AS ENUM ('CARD', 'CASH');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "workshop_payment_status_enum" AS ENUM ('PENDING', 'AWAITING_CASH', 'PAID', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workshop" (
        "id" SERIAL PRIMARY KEY,
        "artistId" integer NOT NULL,
        "slug" character varying NOT NULL,
        "title" character varying(160) NOT NULL,
        "description" text NOT NULL,
        "fee" numeric(10,2) NOT NULL,
        "allowCard" boolean NOT NULL DEFAULT false,
        "allowCash" boolean NOT NULL DEFAULT false,
        "startsAt" TIMESTAMPTZ NOT NULL,
        "endsAt" TIMESTAMPTZ,
        "location" character varying(200) NOT NULL,
        "capacity" integer NOT NULL,
        "published" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_workshop_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_workshop_artist" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workshop_booking" (
        "id" SERIAL PRIMARY KEY,
        "publicCode" character varying NOT NULL,
        "workshopId" integer NOT NULL,
        "userId" integer,
        "spots" integer NOT NULL,
        "customerFirstName" character varying NOT NULL,
        "customerLastName" character varying NOT NULL,
        "customerEmail" character varying NOT NULL,
        "customerPhone" character varying NOT NULL,
        "paymentMethod" "workshop_payment_method_enum" NOT NULL,
        "paymentStatus" "workshop_payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "amount" numeric(10,2) NOT NULL,
        "netopiaNtpId" text,
        "confirmationSent" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_workshop_booking_code" UNIQUE ("publicCode"),
        CONSTRAINT "FK_workshop_booking_workshop" FOREIGN KEY ("workshopId") REFERENCES "workshop"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_workshop_booking_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "workshop_booking"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workshop"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workshop_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "workshop_payment_method_enum"`);
  }
}
