import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SITE_SETTINGS_ID,
  SiteSettings,
} from './entities/site-settings.entity';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export type DeliveryMethod = 'EASYBOX' | 'ADDRESS';

export type PublicSiteSettings = {
  easyboxFeeRon: number;
  addressFeeRon: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
};

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settingsRepository: Repository<SiteSettings>,
  ) {}

  async getPublic(): Promise<PublicSiteSettings> {
    const settings = await this.ensure();
    return this.toPublic(settings);
  }

  async update(dto: UpdateSiteSettingsDto): Promise<PublicSiteSettings> {
    if (dto.deliveryDaysMin > dto.deliveryDaysMax) {
      throw new BadRequestException(
        'Termenul minim de livrare nu poate fi mai mare decât cel maxim.',
      );
    }

    const settings = await this.ensure();
    settings.easyboxFeeRon = dto.easyboxFeeRon;
    settings.addressFeeRon = dto.addressFeeRon;
    settings.deliveryDaysMin = dto.deliveryDaysMin;
    settings.deliveryDaysMax = dto.deliveryDaysMax;
    const saved = await this.settingsRepository.save(settings);
    return this.toPublic(saved);
  }

  async feeFor(method: DeliveryMethod): Promise<number> {
    const settings = await this.getPublic();
    return method === 'EASYBOX'
      ? settings.easyboxFeeRon
      : settings.addressFeeRon;
  }

  parseDeliveryMethod(value: unknown): DeliveryMethod {
    if (value === 'EASYBOX' || value === 'ADDRESS') {
      return value;
    }
    throw new BadRequestException('Metodă de livrare invalidă.');
  }

  private async ensure(): Promise<SiteSettings> {
    const existing = await this.settingsRepository.findOne({
      where: { id: SITE_SETTINGS_ID },
    });
    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({
        id: SITE_SETTINGS_ID,
        easyboxFeeRon: 15,
        addressFeeRon: 15,
        deliveryDaysMin: 3,
        deliveryDaysMax: 7,
      }),
    );
  }

  private toPublic(settings: SiteSettings): PublicSiteSettings {
    return {
      easyboxFeeRon: Number(settings.easyboxFeeRon),
      addressFeeRon: Number(settings.addressFeeRon),
      deliveryDaysMin: settings.deliveryDaysMin,
      deliveryDaysMax: settings.deliveryDaysMax,
    };
  }
}
