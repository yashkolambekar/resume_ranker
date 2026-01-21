import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE() {
    try {
        const db = getDatabase();

        // Delete all data from tables
        // Order matters due to foreign key constraints
        db.prepare('DELETE FROM ai_assessments').run();
        db.prepare('DELETE FROM skills').run();
        db.prepare('DELETE FROM candidates').run();
        db.prepare('DELETE FROM roles').run();

        // Reset auto-increment counters (optional but good for "clean slate")
        db.prepare("DELETE FROM sqlite_sequence WHERE name='ai_assessments'").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name='skills'").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name='candidates'").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name='roles'").run();

        // Delete uploaded resume files
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
        try {
            const files = await fs.readdir(uploadsDir);
            for (const file of files) {
                if (file !== '.gitkeep') { // Preserve .gitkeep if it exists
                    await fs.unlink(path.join(uploadsDir, file));
                }
            }
        } catch (error) {
            console.error('Error deleting files:', error);
            // Continue even if file deletion fails
        }

        return NextResponse.json({ message: 'Database and files reset successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error resetting database:', error);
        return NextResponse.json({
            error: 'Failed to reset database',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
