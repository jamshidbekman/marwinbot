import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SheetsModule } from '../sheets/sheets.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [SheetsModule, ConfigModule],
    providers: [SchedulerService],
})
export class SchedulerModule { }
