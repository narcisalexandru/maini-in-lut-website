import { ConfigService } from '@nestjs/config';

export function googleCallbackUrl(config: ConfigService): string {
  const backend = config.get<string>('BACKEND_URL')?.trim().replace(/\/$/, '');
  if (backend) {
    return `${backend}/auth/google/callback`;
  }
  return config.get<string>('GOOGLE_CALLBACK_URL')?.trim() || '';
}
