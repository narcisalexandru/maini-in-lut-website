import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  OrderItemStatus,
  OrderPaymentStatus,
} from '../../common/enums/order-status.enum';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  paymentStatus?: OrderPaymentStatus;

  @IsOptional()
  @IsEnum(OrderItemStatus)
  itemStatus?: OrderItemStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  archived?: boolean;
}
