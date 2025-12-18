import { Start, Update, Ctx, On, Message, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BotService } from './bot.service';
import { DynamicConfigService } from '../config/dynamic-config.service';
import { ConfigService } from '@nestjs/config';

@Update()
export class BotUpdate {
    constructor(
        private readonly botService: BotService,
        private readonly configService: ConfigService,
        private readonly dynamicConfigService: DynamicConfigService,
    ) { }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        await ctx.reply(this.botService.getHello());
    }

    @On('text')
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        const ADMIN_ID = this.configService.get<number>('BOT_ADMIN')!;
        const COMPANY_ADMIN_ID = this.configService.get<number>('COMPANY_ADMIN')!;

        if (ctx.chat?.id !== +ADMIN_ID && ctx.chat?.id !== +COMPANY_ADMIN_ID) {
            return;
        }

        if (text === '/groups') {
            const groups = this.dynamicConfigService.getGroups();
            if (groups.length === 0) {
                await ctx.reply('📭 Hozircha saqlangan guruhlar yo\'q.');
                return;
            }

            const buttons = groups.map((g) => [
                Markup.button.callback(g.name, `select_group:${g.id}`),
            ]);

            await ctx.reply('📋 Xabar yuboriladigan guruhni tanlang:', Markup.inlineKeyboard(buttons));
        }

        const sheetMatch = text.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetMatch && sheetMatch[1]) {
            const sheetId = sheetMatch[1];
            this.dynamicConfigService.set('GOOGLE_SPREADSHEET_ID', sheetId);
            await ctx.reply(`✅ Jadval muvaffaqiyatli saqlandi.\nID: ${sheetId}`);
            return;
        }
    }

    @On('my_chat_member')
    async onMyChatMember(@Ctx() ctx: Context) {
        const chat = ctx.chat;
        const newStatus = ctx.myChatMember?.new_chat_member.status;

        if (chat && ['group', 'supergroup'].includes(chat.type) && ['member', 'administrator'].includes(newStatus!)) {
            // @ts-ignore
            const title = chat.title || 'No Title';
            this.dynamicConfigService.addGroup(chat.id.toString(), title);
            // Optional: notify the group that it has been saved? Maybe too spammy.
        }
    }

    @Action(/^select_group:(.+)$/)
    async onSelectGroup(@Ctx() ctx: Context) {
        // @ts-ignore
        const match = ctx.match;
        const groupId = match[1];

        this.dynamicConfigService.set('TARGET_CHAT_ID', groupId);

        const groups = this.dynamicConfigService.getGroups();
        const selectedGroup = groups.find(g => g.id === groupId);
        const name = selectedGroup ? selectedGroup.name : groupId;

        await ctx.deleteMessage();
        await ctx.reply(`✅ <b>${name}</b> guruhi asosiy guruh sifatida tanlandi.`, { parse_mode: 'HTML' });
    }
}
