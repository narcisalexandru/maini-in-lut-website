/* eslint-disable @typescript-eslint/no-floating-promises */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { ACCESS_TOKEN_COOKIE } from './auth/auth-cookie.util';
import { AppModule } from './app.module';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret === 'change-me') {
    throw new Error('JWT_SECRET must be set and must not be the example value.');
  }
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (!frontendUrl) {
    throw new Error('FRONTEND_URL must be set.');
  }
  let frontendOrigin: string;
  try {
    frontendOrigin = new URL(frontendUrl).origin;
  } catch {
    throw new Error('FRONTEND_URL must be an absolute URL.');
  }
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'deny' },
      hsts: process.env.NODE_ENV === 'production',
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!UNSAFE_METHODS.has(req.method) || !req.cookies?.[ACCESS_TOKEN_COOKIE]) {
      next();
      return;
    }
    if (req.get('x-requested-with') === 'maini') {
      next();
      return;
    }
    res.status(403).json({ message: 'Cerere respinsa.' });
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const allowedOrigins = new Set([
    frontendOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'X-Requested-With',
      'X-Guest-Cart-Id',
      'Authorization',
    ],
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
