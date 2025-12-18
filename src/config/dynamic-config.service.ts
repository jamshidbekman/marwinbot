import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DynamicConfigService {
    private readonly logger = new Logger(DynamicConfigService.name);
    private readonly configPath = path.resolve(process.cwd(), 'dynamic_config.json');
    private config: Record<string, any> = {};

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        if (fs.existsSync(this.configPath)) {
            try {
                const data = fs.readFileSync(this.configPath, 'utf8');
                this.config = JSON.parse(data);
                this.logger.log('Dynamic config loaded successfully');
            } catch (error) {
                this.logger.error('Failed to load dynamic config', error);
                this.config = {};
            }
        } else {
            this.logger.log('Dynamic config file not found, creating new one');
            this.saveConfig();
        }
    }

    private saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            this.logger.error('Failed to save dynamic config', error);
        }
    }

    get<T>(key: string): T | undefined {
        this.loadConfig();
        return this.config[key];
    }

    set(key: string, value: any) {
        this.config[key] = value;
        this.saveConfig();
        this.logger.log(`Config updated: ${key} = ${value}`);
    }

    addGroup(id: string, name: string) {
        if (!this.config.saved_groups) {
            this.config.saved_groups = [];
        }

        const groups = this.config.saved_groups as { id: string; name: string }[];
        const exists = groups.find((g) => g.id === id);

        if (!exists) {
            groups.push({ id, name });
            this.saveConfig();
            this.logger.log(`Group added: ${name} (${id})`);
        }
    }

    getGroups(): { id: string; name: string }[] {
        return this.config.saved_groups || [];
    }
}
