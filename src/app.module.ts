import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { envValidationSchema } from './config/env.validation';
import { BotModule } from './bot/bot.module';
import { SheetsModule } from './sheets/sheets.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN')!,
        include: [BotModule, SchedulerModule],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    BotModule,
    SheetsModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
