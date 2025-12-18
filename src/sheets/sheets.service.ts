import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

interface ExpirationItem {
    name: string;
    daysRequest: number;
    type: string;
    department: string;
    number: string;
}

import { DynamicConfigService } from '../config/dynamic-config.service';

@Injectable()
export class SheetsService {
    private readonly logger = new Logger(SheetsService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly dynamicConfigService: DynamicConfigService,
    ) { }

    async checkExpirations(): Promise<ExpirationItem[]> {
        try {
            const credsPath = this.configService.get<string>('GOOGLE_CREDENTIALS_PATH')!;
            const sheetId = this.dynamicConfigService.get<string>('GOOGLE_SPREADSHEET_ID') || this.configService.get<string>('GOOGLE_SPREADSHEET_ID');

            if (!sheetId) {
                this.logger.error('GOOGLE_SPREADSHEET_ID not set in config or dynamic config');
                return [];
            }

            const fullPath = path.resolve(process.cwd(), credsPath);

            if (!fs.existsSync(fullPath)) {
                this.logger.error(`Credentials file not found at ${fullPath}`);
                return [];
            }

            const creds = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

            const serviceAccountAuth = new JWT({
                email: creds.client_email,
                key: creds.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];

            await sheet.loadHeaderRow(2);
            const rows = await sheet.getRows();

            const items: ExpirationItem[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const row of rows) {
                const rowData = row.toObject();
                const values = Object.values(rowData);

                if (values.length < 2) continue;

                const name = String(values[1]).trim();
                const type = String(values[2]).trim();
                const department = String(values[3]).trim();
                const number = String(values[4]).trim();
                const dateStr = String(values[7]).trim();
                const expirationDate = this.parseDate(dateStr);
                if (!expirationDate) continue;

                expirationDate.setHours(0, 0, 0, 0);

                const diffTime = expirationDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if ([60, 53, 36, 29, 22, 15, 8, 1, 0].includes(diffDays) || diffDays < 0) {
                    items.push({ name, daysRequest: diffDays, type, department, number });
                }
            }
            return items;
        } catch (error) {
            this.logger.error('Error checking sheets:', error);
            return [];
        }
    }

    private parseDate(dateStr: string): Date | null {
        const ddmmyyyy = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (ddmmyyyy) {
            return new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]));
        }

        const ddmmyyyySlash = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (ddmmyyyySlash) {
            return new Date(Number(ddmmyyyySlash[3]), Number(ddmmyyyySlash[2]) - 1, Number(ddmmyyyySlash[1]));
        }

        const yyyymmdd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (yyyymmdd) {
            return new Date(Number(yyyymmdd[1]), Number(yyyymmdd[2]) - 1, Number(yyyymmdd[3]));
        }

        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        return null;
    }
}
