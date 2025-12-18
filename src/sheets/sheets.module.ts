import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SheetsService } from './sheets.service';

@Module({
    imports: [ConfigModule],
    providers: [SheetsService],
    exports: [SheetsService],
})
export class SheetsModule { }
