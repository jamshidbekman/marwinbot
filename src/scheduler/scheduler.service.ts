import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SheetsService } from '../sheets/sheets.service';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly sheetsService: SheetsService,
        private readonly configService: ConfigService,
        @InjectBot() private readonly bot: Telegraf<Context>,
    ) { }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleDailyCron() {
        this.logger.log('Running daily expiration check...');
        const items = await this.sheetsService.checkExpirations();

        if (items.length === 0) {
            this.logger.log('No expiring items found today.');
            return;
        }

        const chatId = this.configService.get<string>('TARGET_CHAT_ID');
        if (!chatId) {
            this.logger.error('TARGET_CHAT_ID not configured');
            return;
        }

        for (const item of items) {
            let message = '';
            if (item.daysRequest === 0) {
                message = `
⚠️ <b>DIQQAT!</b>

Bo'lim: <i>${item.department}</i>
Raqam: <code>${item.number}</code>
Nomi: <b>${item.name}</b>

⏰ Muddati BUGUN tugaydi!
`;
            } else {
                message = `
📅 <b>Eslatma</b>

Bo'lim: <i>${item.department}</i>
Raqam: <code>${item.number}</code>
Nomi: <b>${item.name}</b>

🕒 Muddati tugashiga <b>${item.daysRequest} kun</b> qoldi.
`;
            }

            try {
                await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
                this.logger.log(`Sent notification for ${item.name}`);
            } catch (e) {
                this.logger.error(`Failed to send notification for ${item.name}`, e);
            }
        }

    }
}
