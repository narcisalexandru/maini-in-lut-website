import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum BulkOrderAction {
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  DELETE = 'delete',
}

export class BulkOrdersDto {
  @IsEnum(BulkOrderAction)
  action: BulkOrderAction;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  orderIds: number[];
}
