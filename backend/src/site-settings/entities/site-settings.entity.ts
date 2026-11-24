import { Column, Entity, PrimaryColumn } from 'typeorm';

export const SITE_SETTINGS_ID = 1;

@Entity('site_settings')
export class SiteSettings {
  @PrimaryColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2, default: 15 })
  easyboxFeeRon: number;

  @Column('decimal', { precision: 10, scale: 2, default: 15 })
  addressFeeRon: number;

  @Column({ type: 'int', default: 3 })
  deliveryDaysMin: number;

  @Column({ type: 'int', default: 7 })
  deliveryDaysMax: number;
}
