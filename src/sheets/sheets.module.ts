import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SheetsService } from './sheets.service';
import { DynamicConfigService } from '../config/dynamic-config.service';

@Module({
    imports: [ConfigModule],
    providers: [SheetsService, DynamicConfigService],
    exports: [SheetsService],
})
export class SheetsModule { }
