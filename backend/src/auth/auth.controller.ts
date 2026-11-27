import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto, ResendVerificationDto, VerifyEmailDto } from './dto/login.dto';
import {
  ACCESS_TOKEN_COOKIE,
  OAUTH_STATE_COOKIE,
  accessTokenCookieOptions,
  oauthStateCookieOptions,
} from './auth-cookie.util';
import { GoogleStateGuard } from './guards/google-state.guard';
import { googleCallbackUrl } from './google-callback-url';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.authService.register(createUserDto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.is_email_verified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }
    const result = await this.authService.login(user);
    this.attachSession(res.req, res, result.access_token);
    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(
      ACCESS_TOKEN_COOKIE,
      accessTokenCookieOptions(this.configService, res.req),
    );
    return { success: true };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Get('google')
  googleAuth(@Req() req: Request, @Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = googleCallbackUrl(this.configService);
    if (!clientId || !callbackUrl) {
      throw new BadRequestException('Google auth is not configured');
    }
    const state = randomBytes(32).toString('base64url');
    res.cookie(
      OAUTH_STATE_COOKIE,
      state,
      oauthStateCookieOptions(this.configService, req),
    );
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'email profile');
    url.searchParams.set('state', state);
    return res.redirect(url.toString());
  }

  @Get('google/callback')
  @UseGuards(GoogleStateGuard, AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const frontend = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const result = await this.authService.googleLogin(req);
    if (!result || typeof result === 'string') {
      return res.redirect(`${frontend}/login`);
    }
    this.attachSession(res.req, res, result.access_token);
    return res.redirect(`${frontend}/auth/google-callback`);
  }

  private attachSession(req: Request, res: Response, accessToken: string) {
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      accessTokenCookieOptions(this.configService, req),
    );
  }
}
