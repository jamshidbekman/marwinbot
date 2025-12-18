import { Start, Update, Ctx, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
    constructor(private readonly botService: BotService) { }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        await ctx.reply(this.botService.getHello());
    }

    @On('text')
    async onMessage(@Message('text') text: string, @Ctx() ctx: Context) {
        if (text.startsWith('/')) return;
        // await ctx.reply(this.botService.echo(text));
    }
}
