import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SiteSettingsService } from './site-settings.service';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @SkipThrottle()
  @Get()
  getPublic() {
    return this.siteSettingsService.getPublic();
  }
}
