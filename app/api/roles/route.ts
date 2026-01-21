import { NextRequest, NextResponse } from 'next/server';
import { db_queries } from '@/lib/db';

export async function GET() {
    try {
        const roles = db_queries.getAllRoles();
        return NextResponse.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
    try {
        // Feature Toggle Check
        const config = getConfig();
        if (!config.enableNewRoleCreation) {
            return NextResponse.json({ error: 'New role creation is currently disabled' }, { status: 403 });
        }

        const body = await request.json();
        const { title, department, location, type, status } = body;

        if (!title || !department || !location || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const roleId = db_queries.createRole({ title, department, location, type, status: status || 'open' });
        const role = db_queries.getRoleById(Number(roleId));

        return NextResponse.json(role, { status: 201 });
    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}
