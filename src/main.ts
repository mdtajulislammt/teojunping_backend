// external imports
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
// internal imports
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/exception/custom-exception.filter';
import { PrismaExceptionFilter } from './common/exception/prisma-exception.filter';
import { TajulStorage } from './common/lib/Disk/TajulStorage';
import appConfig from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api');
  app.enableCors();
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public'), {
    index: false,
    prefix: '/public',
  });
  app.useStaticAssets(join(process.cwd(), 'public/storage'), {
    index: false,
    prefix: '/storage',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(
    new CustomExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // storage setup
  TajulStorage.config({
    driver: 'local',
    connection: {
      rootUrl: appConfig().storageUrl.rootUrl,
      publicUrl: appConfig().storageUrl.rootUrlPublic,
      awsBucket: appConfig().fileSystems.s3.bucket,
      awsAccessKeyId: appConfig().fileSystems.s3.key,
      awsSecretAccessKey: appConfig().fileSystems.s3.secret,
      awsDefaultRegion: appConfig().fileSystems.s3.region,
      awsEndpoint: appConfig().fileSystems.s3.endpoint,
      minio: true,
    },
  });

  // swagger setup
  const options = new DocumentBuilder()
    .setTitle(`${process.env.APP_NAME} API`)
    .setDescription(`${process.env.APP_NAME} API docs`)
    .setVersion('1.0')
    .addTag(`${process.env.APP_NAME ?? 'Application'}`)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth', // target auth identity key
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);

  // Absolute Persistence Automation Script
  const persistentAuthScript = `
    (function() {
      const AUTH_KEY = 'JWT-auth';
      const STORAGE_KEY = 'authorizedAuthorized';

      // 1. Intercept Fetch Request to auto-capture token on login
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        const url = args[0];
        
        if (url && (url.includes('/login') || url.includes('/auth/login')) && response.status === 201) {
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            const token = data?.authorization?.access_token;
            
            if (token) {
              const authObject = {
                [AUTH_KEY]: {
                  schema: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'Authorization',
                    in: 'header'
                  },
                  value: token
                }
              };
              
              // LocalStorage payload write
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authObject));
              
              // Instant UI apply without refresh
              if (window.ui && window.ui.authActions) {
                window.ui.authActions.authorize(authObject);
              }
              console.log('Token secured & storage state mapping complete.');
            }
          } catch (err) {
            console.error('Error handling sync storage token:', err);
          }
        }
        return response;
      };

      // 2. Pure Hook for Page Reload: Force state parsing into Swagger UI Bundle memory
      function forceHydrateAuth() {
        try {
          const savedAuth = localStorage.getItem(STORAGE_KEY);
          if (savedAuth && window.ui && window.ui.authActions) {
            const authObject = JSON.parse(savedAuth);
            if (authObject && authObject[AUTH_KEY]) {
              window.ui.authActions.authorize(authObject);
              console.log('Auth dynamic state re-hydrated on reload successfully.');
            }
          }
        } catch (e) {
          console.error('Failed to auto-hydrate auth state:', e);
        }
      }

      // Continuous checking loop until Swagger UI Bundle object renders completely
      const checkUiInterval = setInterval(() => {
        if (window.ui && window.ui.authActions) {
          clearInterval(checkUiInterval);
          forceHydrateAuth();
        }
      }, 100);
    })();
  `;

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
      displayRequestDuration: true,
      docExpansion: 'list',
    },
    customJsStr: persistentAuthScript,
  });

  await app.listen(process.env.PORT ?? 6001, '0.0.0.0');
}
bootstrap();
