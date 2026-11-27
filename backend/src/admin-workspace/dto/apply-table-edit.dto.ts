import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class ApplyTableEditDto {
  @IsIn(['order-item-status', 'order-delivery', 'order-note', 'product-fields', 'customer-fields'])
  kind:
    | 'order-item-status'
    | 'order-delivery'
    | 'order-note'
    | 'product-fields'
    | 'customer-fields';

  @IsInt()
  @Min(1)
  targetId: number;

  @IsString()
  @MaxLength(40)
  field: string;

  @IsString()
  @MaxLength(80)
  fieldLabel: string;

  @IsString()
  @MaxLength(200)
  rowLabel: string;

  @IsString()
  @MaxLength(1000)
  previousValue: string;

  @IsString()
  @MaxLength(1000)
  nextValue: string;
}
