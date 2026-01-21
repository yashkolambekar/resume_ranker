import { NextResponse } from 'next/server';
import { db_queries, getDatabase } from '@/lib/db';

export async function GET() {
    try {
        const db = getDatabase();

        // Get all data from database
        const roles = db.prepare('SELECT * FROM roles').all();
        const candidates = db.prepare('SELECT * FROM candidates').all();
        const skills = db.prepare('SELECT * FROM skills').all();
        const assessments = db.prepare('SELECT * FROM ai_assessments').all();

        return NextResponse.json({
            summary: {
                totalRoles: roles.length,
                totalCandidates: candidates.length,
                totalSkills: skills.length,
                totalAssessments: assessments.length
            },
            data: {
                roles,
                candidates,
                skills,
                assessments
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({
            error: 'Failed to fetch debug data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
