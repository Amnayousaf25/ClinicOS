/**
 * Application entry point for the ClinicOS backend.
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dns from 'dns';
import { AppModule } from './app.module';
import { CustomValidationPipe } from 'src/common/pipes/custom-validation.pipe';
import { CONFIG } from 'src/common/constants/config.constants';

// Configure Node.js DNS to use Google and Cloudflare public DNS servers.
// This works around Windows IPv6 DNS resolution issues with MongoDB Atlas SRV URIs.
dns.setServers(['8.8.8.8', '1.1.1.1']);
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

async function bootstrap(): Promise<void> {
  // Load .env before creating the app so CORS origins are available
  const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: envFile });

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new CustomValidationPipe());

  // Build the static allowlist from the env var
  const staticOrigins: string[] = (
    process.env.ALLOWED_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || []
  ).concat([
    'http://localhost:8080',
    'http://localhost:8082',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8082',
    'https://clinic-stride-aid.vercel.app',
  ]);

  // Deduplicate
  const allowedSet = [...new Set(staticOrigins)];
  console.log('CORS allowed origins:', allowedSet);

  app.enableCors({
    /**
     * Use a function so we can:
     *  1. Allow any origin in the static allowlist (exact match).
     *  2. Allow ANY *.vercel.app subdomain — this covers Vercel preview
     *     deployments whose URL we can't know ahead of time.
     *  3. Allow requests with no Origin header (server-to-server / curl).
     */
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // No origin = server-to-server request or same-origin — allow it.
      if (!origin) return callback(null, true);

      // Exact match against the static list
      if (allowedSet.includes(origin)) return callback(null, true);

      // Allow all Vercel preview URLs: https://<anything>.vercel.app
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);

      // Reject everything else
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClinicOS API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  app.enableShutdownHooks();

  const port = Number(config.get(CONFIG.PORT) ?? 3000);
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
