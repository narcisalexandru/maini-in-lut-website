import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum ReviewProductChangesAction {
  ACCEPT_FIELDS = 'accept-fields',
  REJECT_FIELDS = 'reject-fields',
  ACCEPT_ALL = 'accept-all',
  REJECT_ALL = 'reject-all',
}

export class ReviewProductChangesDto {
  @IsEnum(ReviewProductChangesAction)
  action: ReviewProductChangesAction;

  @ValidateIf(
    (dto: ReviewProductChangesDto) =>
      dto.action === ReviewProductChangesAction.ACCEPT_FIELDS ||
      dto.action === ReviewProductChangesAction.REJECT_FIELDS,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fields?: string[];

  @ValidateIf(
    (dto: ReviewProductChangesDto) =>
      dto.action === ReviewProductChangesAction.REJECT_ALL,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
