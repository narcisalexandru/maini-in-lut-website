import { MigrationInterface, QueryRunner } from 'typeorm';

export class SiteSettings1764020000000 implements MigrationInterface {
  name = 'SiteSettings1764020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "id" integer PRIMARY KEY,
        "easyboxFeeRon" numeric(10,2) NOT NULL DEFAULT 15,
        "addressFeeRon" numeric(10,2) NOT NULL DEFAULT 15,
        "deliveryDaysMin" integer NOT NULL DEFAULT 3,
        "deliveryDaysMax" integer NOT NULL DEFAULT 7
      )
    `);
    await queryRunner.query(`
      INSERT INTO "site_settings" ("id", "easyboxFeeRon", "addressFeeRon", "deliveryDaysMin", "deliveryDaysMax")
      VALUES (1, 15, 15, 3, 7)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_settings"`);
  }
}
