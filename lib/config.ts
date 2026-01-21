import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

export interface AppConfig {
    uploadRateLimitSeconds: number;
    enableNewRoleCreation: boolean;
}

export function getConfig(): AppConfig {
    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading config:', error);
        // Default fallback
        return {
            uploadRateLimitSeconds: 0,
            enableNewRoleCreation: true
        };
    }
}
