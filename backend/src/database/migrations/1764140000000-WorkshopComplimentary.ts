import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkshopComplimentary1764140000000 implements MigrationInterface {
  name = 'WorkshopComplimentary1764140000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = $1`,
      ['workshop_payment_method_enum'],
    )) as unknown[];
    if (!existing.length) {
      return;
    }
    await queryRunner.query(
      `ALTER TYPE "workshop_payment_method_enum" ADD VALUE IF NOT EXISTS 'COMPLIMENTARY'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop a single enum value without recreating the type.
  }
}
