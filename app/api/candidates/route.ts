import { NextRequest, NextResponse } from 'next/server';
import { db_queries } from '@/lib/db';
import { writeFile } from 'fs/promises';
import { readFile } from 'fs/promises';
import path from 'path';
import { processResume } from '@/lib/resume-parser';

// @ts-ignore
import PDFParser from 'pdf2json';
import { getConfig } from '@/lib/config';

// Simple in-memory rate limiter
const uploadRateLimits = new Map<string, number>();

// Helper to extract text from PDF
async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
    try {
        if (filename.toLowerCase().endsWith('.pdf')) {
            return new Promise((resolve, reject) => {
                const pdfParser = new PDFParser(null, 1 as any); // 1 = text content only

                pdfParser.on("pdfParser_dataError", (errData: any) => {
                    console.error('PDF Parser Error:', errData.parserError);
                    reject(new Error(errData.parserError));
                });

                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    // Extract raw text content
                    const text = pdfParser.getRawTextContent();
                    resolve(text);
                });

                pdfParser.parseBuffer(buffer);
            });
        }
        // Fallback for other files
        return `[File content for ${filename}]`;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return `[Error parsing file: ${filename}]`;
    }
}

export async function POST(request: NextRequest) {
    console.log('=== UPLOAD API CALLED ===');
    try {
        // Rate Limiting Check
        const config = getConfig();
        if (config.uploadRateLimitSeconds > 0) {
            const ip = request.headers.get('x-forwarded-for') || 'unknown';
            const lastUpload = uploadRateLimits.get(ip);
            const now = Date.now();

            if (lastUpload && (now - lastUpload) < config.uploadRateLimitSeconds * 1000) {
                const remaining = Math.ceil((config.uploadRateLimitSeconds * 1000 - (now - lastUpload)) / 1000);
                return NextResponse.json({
                    error: `Rate limit exceeded. Please wait ${remaining} seconds before uploading again.`
                }, { status: 429 });
            }

            uploadRateLimits.set(ip, now);
        }

        // Feature Toggle Check
        if (config.enableResumeUploads === false) {
            return NextResponse.json({
                error: 'Resume uploads are currently disabled.'
            }, { status: 403 });
        }

        const formData = await request.formData();
        console.log('FormData received');

        // Extract form fields
        const roleId = formData.get('roleId') as string;
        const resume = formData.get('resume') as File | null;
        console.log('Extracted fields:', { roleId, resumeName: resume?.name, resumeSize: resume?.size });

        if (!roleId || !resume) {
            console.error('Missing fields:', { roleId: !!roleId, resume: !!resume });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get role details for AI context
        const role = db_queries.getRoleById(parseInt(roleId));
        if (!role) {
            console.error('Role not found:', roleId);
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }
        console.log('Found role:', role.title);

        // Save resume file
        console.log('Saving resume file...');
        const bytes = await resume.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const sanitized = resume.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${timestamp}_${sanitized}`;
        const filepath = path.join(process.cwd(), 'public', 'uploads', 'resumes', filename);

        await writeFile(filepath, buffer);
        console.log('Resume saved to:', filepath);
        const resumePath = `/uploads/resumes/${filename}`;

        // Create candidate with placeholder data (will be updated by AI)
        console.log('Creating candidate in database...');
        const candidateId = db_queries.createCandidate({
            role_id: parseInt(roleId),
            name: 'Processing...',
            email: 'processing@temp.com',
            phone: undefined,
            location: undefined,
            experience: undefined,
            education: undefined,
            current_role: undefined,
            resume_path: resumePath,
            status: 'in-review',
            score: 0
        });
        console.log('Candidate created with ID:', candidateId);

        // Extract text from resume
        console.log('Extracting text from resume...');
        const resumeText = await extractTextFromFile(buffer, resume.name);
        console.log('Resume text extracted, length:', resumeText.length);

        // Start AI processing in background (non-blocking)
        console.log('Starting background AI processing...');
        processResume(Number(candidateId), resumeText, role.title)
            .then(() => {
                console.log('AI processing completed for candidate:', candidateId);
            })
            .catch(error => {
                console.error('Background processing error for candidate', candidateId, ':', error);
            });

        const candidate = db_queries.getCandidateById(Number(candidateId));
        console.log('Returning success response');

        return NextResponse.json({
            ...candidate,
            message: 'Resume uploaded successfully. AI analysis in progress.'
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating candidate:', error);
        return NextResponse.json({
            error: 'Failed to create candidate',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
