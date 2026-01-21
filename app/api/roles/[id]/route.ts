import { NextRequest, NextResponse } from 'next/server';
import { db_queries } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const roleId = parseInt(id);
        const role = db_queries.getRoleById(roleId);

        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        const candidates = db_queries.getCandidatesByRole(roleId);

        return NextResponse.json({ role, candidates });
    } catch (error) {
        console.error('Error fetching role details:', error);
        return NextResponse.json({ error: 'Failed to fetch role details' }, { status: 500 });
    }
}
