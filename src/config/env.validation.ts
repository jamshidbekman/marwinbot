import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  BOT_TOKEN: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  GOOGLE_SPREADSHEET_ID: Joi.string().required(),
  TARGET_CHAT_ID: Joi.string().required(),
  GOOGLE_CREDENTIALS_PATH: Joi.string().default('marwinbot-8883574c34fd.json'),
});
