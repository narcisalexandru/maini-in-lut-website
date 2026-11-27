import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtistBrandAndContactName1764010000000
  implements MigrationInterface
{
  name = 'ArtistBrandAndContactName1764010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "artist"
      ADD COLUMN IF NOT EXISTS "brand" character varying(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "artist"
      ADD COLUMN IF NOT EXISTS "contactFirstName" character varying(120)
    `);
    await queryRunner.query(`
      ALTER TABLE "artist"
      ADD COLUMN IF NOT EXISTS "contactLastName" character varying(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "contactLastName"`);
    await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "contactFirstName"`);
    await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "brand"`);
  }
}
