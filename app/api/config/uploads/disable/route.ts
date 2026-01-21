import { NextResponse } from 'next/server';
import { updateConfig } from '@/lib/config';

export async function GET() {
    try {
        const config = updateConfig({ enableResumeUploads: false });
        return NextResponse.json({
            message: 'Resume uploads disabled',
            config
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
