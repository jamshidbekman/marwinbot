import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { DynamicConfigService } from '../config/dynamic-config.service';

@Module({
    providers: [BotService, BotUpdate, DynamicConfigService],
})
export class BotModule { }
