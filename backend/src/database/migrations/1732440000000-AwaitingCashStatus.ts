import { MigrationInterface, QueryRunner } from 'typeorm';

export class AwaitingCashStatus1732440000000 implements MigrationInterface {
  name = 'AwaitingCashStatus1732440000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addEnumValue(queryRunner, 'order_paymentstatus_enum', 'AWAITING_CASH');
    await this.addEnumValue(
      queryRunner,
      'admin_audit_logs_action_enum',
      'ORDER_CASH_CONFIRMED',
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop a single enum value without recreating the type.
  }

  private async addEnumValue(
    queryRunner: QueryRunner,
    typeName: string,
    value: string,
  ): Promise<void> {
    const existing = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = $1`,
      [typeName],
    )) as unknown[];
    if (!existing.length) {
      return;
    }
    await queryRunner.query(
      `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}'`,
    );
  }
}
