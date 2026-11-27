import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectProposalDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
