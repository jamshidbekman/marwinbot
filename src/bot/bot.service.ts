import { Injectable, OnApplicationBootstrap, OnApplicationShutdown, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(BotService.name);

    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly configService: ConfigService,
    ) { }

    async onApplicationBootstrap() {
        const chatId = this.configService.get<string>('TARGET_CHAT_ID');
        if (chatId) {
            try {
                await this.bot.telegram.sendMessage(chatId, '🚀 <b>Bot ishga tushdi!</b>', { parse_mode: 'HTML' });
                this.logger.log('Sent startup notification');
            } catch (e) {
                this.logger.error('Failed to send startup notification', e);
            }
        }
    }

    async onApplicationShutdown(signal?: string) {
        const chatId = this.configService.get<string>('TARGET_CHAT_ID');
        if (chatId) {
            try {
                await this.bot.telegram.sendMessage(
                    chatId,
                    `🛑 <b>Bot to'xtatildi!</b>\n\nSababi: ${signal || 'Noma\'lum'}`,
                    { parse_mode: 'HTML' },
                );
                this.logger.log(`Sent shutdown notification (Signal: ${signal})`);
            } catch (e) {
                this.logger.error('Failed to send shutdown notification', e);
            }
        }
    }

    getHello(): string {
        return 'Assalomu alaykum!';
    }

    echo(text: string): string {
        return `You said: ${text}`;
    }
}
