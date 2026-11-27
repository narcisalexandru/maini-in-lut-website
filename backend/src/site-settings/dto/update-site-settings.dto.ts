import { IsInt, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  easyboxFeeRon: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  addressFeeRon: number;

  @IsInt()
  @Min(1)
  @Max(60)
  deliveryDaysMin: number;

  @IsInt()
  @Min(1)
  @Max(60)
  deliveryDaysMax: number;

  @IsString()
  @MaxLength(300)
  announcementTextRo: string;

  @IsString()
  @MaxLength(300)
  announcementTextEn: string;
}
