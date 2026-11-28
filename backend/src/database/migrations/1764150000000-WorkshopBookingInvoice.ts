import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkshopBookingInvoice1764150000000 implements MigrationInterface {
  name = 'WorkshopBookingInvoice1764150000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workshop_booking"
      ADD COLUMN IF NOT EXISTS "invoiceSeries" character varying(40)
    `);
    await queryRunner.query(`
      ALTER TABLE "workshop_booking"
      ADD COLUMN IF NOT EXISTS "invoiceNumber" character varying(40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workshop_booking" DROP COLUMN IF EXISTS "invoiceNumber"
    `);
    await queryRunner.query(`
      ALTER TABLE "workshop_booking" DROP COLUMN IF EXISTS "invoiceSeries"
    `);
  }
}
