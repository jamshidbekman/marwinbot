import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SheetsService } from '../sheets/sheets.service';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { DynamicConfigService } from '../config/dynamic-config.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly sheetsService: SheetsService,
        private readonly configService: ConfigService,
        private readonly dynamicConfigService: DynamicConfigService,
        @InjectBot() private readonly bot: Telegraf<Context>,
    ) { }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM, {
        timeZone: 'Asia/Tashkent',
    })
    async handleDailyCron() {
        this.logger.log('Running daily expiration check...');

        const items = await this.sheetsService.checkExpirations();

        if (!items || items.length === 0) {
            this.logger.log('No expiring items found today.');
            return;
        }

        const chatId =
            this.dynamicConfigService.get<string>('TARGET_CHAT_ID') ||
            this.configService.get<string>('TARGET_CHAT_ID');

        if (!chatId) {
            this.logger.error('TARGET_CHAT_ID not configured');
            return;
        }

        for (const item of items) {
            try {
                if (typeof item.daysRequest !== 'number') continue;

                if (item.daysRequest < -600) continue;

                const department = item.department || '-';
                const number = item.number || '-';
                const name = item.name || '-';

                let message = '';

                if (item.daysRequest === 0) {
                    message = `
⚠️ <b>DIQQAT!</b>

Bo'lim: <i>${department}</i>
Raqam: <code>${number}</code>
Nomi: <b>${name}</b>

⏰ Muddati <b>BUGUN</b> tugaydi!
`;
                } else if (item.daysRequest > 0) {
                    message = `
📅 <b>Eslatma</b>

Bo'lim: <i>${department}</i>
Raqam: <code>${number}</code>
Nomi: <b>${name}</b>

🕒 Muddati tugashiga <b>${item.daysRequest} kun</b> qoldi.
`;
                } else {
                    message = `
🚨 <b>KECHIKDI</b>

Bo'lim: <i>${department}</i>
Raqam: <code>${number}</code>
Nomi: <b>${name}</b>

⛔ Muddati tugaganiga <b>${Math.abs(item.daysRequest)} kun</b> bo‘ldi.
`;
                }

                await this.bot.telegram.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                });

                this.logger.log(`Sent notification for ${name}`);

                await this.delay(1500);

            } catch (error: any) {

                const retryAfter = error?.response?.parameters?.retry_after;
                if (retryAfter) {
                    this.logger.warn(`Rate limited. Retry after ${retryAfter}s`);
                    await this.delay((retryAfter + 1) * 1000);
                    continue;
                }

                const newChatId = error?.response?.parameters?.migrate_to_chat_id;
                if (newChatId) {
                    try {
                        await this.bot.telegram.sendMessage(newChatId, error.on?.payload?.text, {
                            parse_mode: 'HTML',
                        });
                        await this.delay(1500);
                        continue;
                    } catch (e) {
                        this.logger.error('Failed after chat migration', e);
                    }
                }

                this.logger.error(
                    `Failed to send notification for ${item?.name || 'unknown'}`,
                    error,
                );

                await this.delay(2000);
            }
        }

        this.logger.log('Daily expiration check completed.');
    }
}
