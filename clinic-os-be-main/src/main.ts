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

async function bootstrap(): Promise<void> {
  // Load .env before creating the app so CORS origins are available
  const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: envFile });

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new CustomValidationPipe());

  const allowedOrigins = (process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) || [
    'http://localhost:8080',
    'http://localhost:8082',
    'https://clinic-stride-aid.vercel.app',
  ]).concat([
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8082',
  ]);
  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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
