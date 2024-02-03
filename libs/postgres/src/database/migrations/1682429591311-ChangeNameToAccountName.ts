import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeNameToAccountName1682429591311 implements MigrationInterface {
    name = 'ChangeNameToAccountName1682429591311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "name" TO "account_name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "account_name" TO "name"`);
    }

}
