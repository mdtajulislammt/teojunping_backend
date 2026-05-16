// src/cmd.ts
import { CommandFactory } from 'nest-commander';
import { CliModule } from './command/cli.module';

async function bootstrap() {
  console.log('🏁 [CLI]: CommandFactory starting execution...');
  // CliModule use kora hoyeche — lightweight, Redis/BullMQ connection lage na
  await CommandFactory.run(CliModule, ['log', 'error', 'warn', 'debug']);
}

bootstrap().catch((err) => {
  console.error('❌ [CLI BOOTSTRAP CRITICAL ERROR]:', err);
  process.exit(1);
});