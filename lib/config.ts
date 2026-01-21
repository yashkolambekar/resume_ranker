import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

export interface AppConfig {
    uploadRateLimitSeconds: number;
    enableNewRoleCreation: boolean;
    enableResumeUploads: boolean;
}

export function getConfig(): AppConfig {
    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(fileContent);
        // Ensure all fields exist with defaults
        return {
            uploadRateLimitSeconds: config.uploadRateLimitSeconds ?? 0,
            enableNewRoleCreation: config.enableNewRoleCreation ?? true,
            enableResumeUploads: config.enableResumeUploads ?? true
        };
    } catch (error) {
        console.error('Error reading config:', error);
        // Default fallback
        return {
            uploadRateLimitSeconds: 0,
            enableNewRoleCreation: true,
            enableResumeUploads: true
        };
    }
}

export function updateConfig(updates: Partial<AppConfig>) {
    try {
        const currentConfig = getConfig();
        const newConfig = { ...currentConfig, ...updates };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4));
        return newConfig;
    } catch (error) {
        console.error('Error writing config:', error);
        throw error;
    }
}
