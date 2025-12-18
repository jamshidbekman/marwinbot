import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SheetsModule } from '../sheets/sheets.module';
import { ConfigModule } from '@nestjs/config';
import { DynamicConfigService } from '../config/dynamic-config.service';

@Module({
    imports: [SheetsModule, ConfigModule],
    providers: [SchedulerService, DynamicConfigService],
})
export class SchedulerModule { }
