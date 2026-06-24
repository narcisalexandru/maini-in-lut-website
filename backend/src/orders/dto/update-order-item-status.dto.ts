import { IsEnum } from 'class-validator';
import { OrderItemStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderItemStatusDto {
  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;
}
