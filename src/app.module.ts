import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SheetsModule } from './sheets/sheets.module';
import { envValidationSchema } from './config/env.validation';
import { DynamicConfigService } from './config/dynamic-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN')!,
        middlewares: [
          async (ctx, next) => {
            if (ctx.updateType === 'message') {
              if (ctx.chat?.type !== 'private') {
                return;
              }
            }
            return next();
          },
        ],
        include: [BotModule],
      }),
      inject: [ConfigService],
    }),
    BotModule,
    SchedulerModule,
    SheetsModule,
  ],
  controllers: [],
  providers: [DynamicConfigService],
  exports: [DynamicConfigService],
})
export class AppModule { }
