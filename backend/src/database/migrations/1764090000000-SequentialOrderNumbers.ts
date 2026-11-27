import { MigrationInterface, QueryRunner } from 'typeorm';

export class SequentialOrderNumbers1764090000000 implements MigrationInterface {
  name = 'SequentialOrderNumbers1764090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_public_number" (
        "id" integer PRIMARY KEY,
        "value" integer NOT NULL
      )
    `);
    await queryRunner.query(`
      INSERT INTO "order_public_number" ("id", "value")
      SELECT 1, COALESCE((
        SELECT MAX(CAST(SUBSTRING("publicOrderNumber" FROM 5) AS integer))
        FROM "order"
        WHERE "publicOrderNumber" ~ '^MIL-[0-9]+$'
      ), 0)
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_public_number"`);
  }
}
