import { NextRequest, NextResponse } from 'next/server';
import { db_queries } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const candidateId = parseInt(id);
        const candidate = db_queries.getCandidateById(candidateId);

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
        }

        const skills = db_queries.getSkillsByCandidate(candidateId);
        const assessment = db_queries.getAssessmentByCandidate(candidateId);

        return NextResponse.json({ candidate, skills, assessment });
    } catch (error) {
        console.error('Error fetching candidate:', error);
        return NextResponse.json({ error: 'Failed to fetch candidate' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const candidateId = parseInt(id);
        const body = await request.json();

        db_queries.updateCandidate(candidateId, body);
        const candidate = db_queries.getCandidateById(candidateId);

        return NextResponse.json(candidate);
    } catch (error) {
        console.error('Error updating candidate:', error);
        return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
    }
}
