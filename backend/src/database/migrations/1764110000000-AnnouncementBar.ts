import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_ANNOUNCEMENT_RO =
  'Livrare estimată în {min}–{max} zile lucrătoare. Easybox {easybox} RON · livrare la adresă {address} RON.';
const DEFAULT_ANNOUNCEMENT_EN =
  'Estimated delivery in {min}–{max} business days. Easybox {easybox} RON · address delivery {address} RON.';

export class AnnouncementBar1764110000000 implements MigrationInterface {
  name = 'AnnouncementBar1764110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "announcementTextRo" character varying(300) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "announcementTextEn" character varying(300) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(
      `
        UPDATE "site_settings"
        SET "announcementTextRo" = $1
        WHERE "announcementTextRo" = ''
      `,
      [DEFAULT_ANNOUNCEMENT_RO],
    );
    await queryRunner.query(
      `
        UPDATE "site_settings"
        SET "announcementTextEn" = $1
        WHERE "announcementTextEn" = ''
      `,
      [DEFAULT_ANNOUNCEMENT_EN],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "announcementTextEn"
    `);
    await queryRunner.query(`
      ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "announcementTextRo"
    `);
  }
}
