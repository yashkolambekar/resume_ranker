import { generateText } from 'ai';
import { gemini25Flash } from './ai/index';
import { db_queries } from './db';

// Hard limits to prevent token exhaustion
const MAX_RETRIES = 3;
const MAX_TEXT_LENGTH = 50000; // Limit resume text to 50k chars (generous for long resumes)
const TIMEOUT_MS = 45000; // 45 second timeout per stage
const MAX_OUTPUT_TOKENS = 4000; // 4k tokens for AI responses

interface ResumeProcessingResult {
    candidateId: number;
    status: 'processing' | 'completed' | 'failed';
    stage: 'extraction' | 'skills' | 'assessment' | 'done';
    error?: string;
}

async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        ),
    ]);
}

async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            console.log(`Retry ${i + 1}/${maxRetries} failed:`, lastError.message);
            if (i < maxRetries - 1) {
                const waitTime = Math.pow(2, i) * 1000;
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

// Stage 1: Extract basic candidate information
async function extractBasicInfo(resumeText: string) {
    console.log('extractBasicInfo: Starting...');
    const prompt = `Extract basic information from this resume and return as JSON:

{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number or null",
  "location": "City, State or null",
  "experience": "X years",
  "education": "Degree, University",
  "currentRole": "Current job title and company"
}

Resume (first 1000 chars):
${resumeText.slice(0, 1000)}

Return ONLY valid JSON, no other text.`;

    console.log('extractBasicInfo: Calling AI...');
    const { text } = await generateText({
        model: gemini25Flash,
        prompt,
    });
    console.log('extractBasicInfo: AI response received, length:', text.length);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error('extractBasicInfo: No JSON found in response:', text);
        throw new Error('Failed to extract basic info');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('extractBasicInfo: Success -', parsed);
    return parsed;
}

// Stage 2: Extract and analyze skills
async function extractSkills(resumeText: string) {
    console.log('extractSkills: Starting...');
    const prompt = `Analyze this resume and extract technical skills with proficiency estimates.

Return as JSON array:
[
  { "name": "Skill name", "proficiency": 0-100 }
]

Base proficiency on:
- Years of experience mentioned
- Project complexity
- Depth of knowledge indicated

Resume text:
${resumeText.slice(0, 3000)}

Return ONLY the JSON array, max 15 skills.`;

    console.log('extractSkills: Calling AI...');
    const { text } = await generateText({
        model: gemini25Flash,
        prompt,
    });
    console.log('extractSkills: AI response received');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        console.error('extractSkills: No JSON array found in response:', text);
        throw new Error('Failed to extract skills');
    }

    const skills = JSON.parse(jsonMatch[0]);
    console.log('extractSkills: Extracted', skills.length, 'skills');
    return skills.slice(0, 15); // Hard limit: max 15 skills
}

// Stage 3: Generate AI assessment
async function generateAssessment(
    candidateId: number,
    resumeText: string,
    roleTitle: string
) {
    console.log('generateAssessment: Starting for candidate', candidateId);
    const candidate = db_queries.getCandidateById(candidateId);
    const skills = db_queries.getSkillsByCandidate(candidateId);
    console.log('generateAssessment: Found', skills.length, 'skills in DB');

    const prompt = `Assess this candidate for: ${roleTitle}

Candidate: ${candidate?.name}
Experience: ${candidate?.experience}
Education: ${candidate?.education}
Skills: ${skills.map(s => `${s.skill_name} (${s.proficiency}%)`).join(', ')}

Resume excerpt:
${resumeText.slice(0, 2000)}

Provide assessment as JSON:
{
  "technicalScore": 0-100,
  "experienceScore": 0-100,
  "educationScore": 0-100,
  "culturalScore": 0-100,
  "recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "detailedComments": "2-3 sentences",
  "strengths": ["max 4 strengths"],
  "weaknesses": ["max 3 concerns"]
}

Return ONLY JSON.`;

    console.log('generateAssessment: Calling AI...');
    const { text } = await generateText({
        model: gemini25Flash,
        prompt,
    });
    console.log('generateAssessment: AI response received');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error('generateAssessment: No JSON found in response:', text);
        throw new Error('Failed to generate assessment');
    }

    const assessment = JSON.parse(jsonMatch[0]);
    console.log('generateAssessment: Success -', assessment.recommendation);
    return assessment;
}

// Main resume processing pipeline
export async function processResume(
    candidateId: number,
    resumeText: string,
    roleTitle: string,
    onProgress?: (stage: string) => void
): Promise<ResumeProcessingResult> {
    console.log('\n=== STARTING RESUME PROCESSING ===');
    console.log('Candidate ID:', candidateId);
    console.log('Role Title:', roleTitle);
    console.log('Resume Text Length:', resumeText.length);

    try {
        // Truncate resume text to prevent token overflow
        const truncatedText = resumeText.slice(0, MAX_TEXT_LENGTH);
        console.log('Text truncated to:', truncatedText.length, 'chars');

        // Stage 1: Extract basic info
        console.log('\n--- STAGE 1: Extracting Basic Info ---');
        onProgress?.('Extracting candidate information...');
        const basicInfo = await retry(
            () => withTimeout(extractBasicInfo(truncatedText), TIMEOUT_MS),
            MAX_RETRIES
        );
        console.log('Stage 1 Complete:', basicInfo);

        // Update candidate with extracted info
        console.log('Updating candidate with basic info...');

        const updates: any = {
            phone: basicInfo.phone,
            location: basicInfo.location,
            experience: basicInfo.experience,
            education: basicInfo.education,
            current_role: basicInfo.currentRole,
        };

        // Only update name/email if extracted successfully
        if (basicInfo.name) updates.name = basicInfo.name;
        if (basicInfo.email) updates.email = basicInfo.email;

        db_queries.updateCandidate(candidateId, updates);

        // Stage 2: Extract skills
        console.log('\n--- STAGE 2: Extracting Skills ---');
        onProgress?.('Analyzing technical skills...');
        const skills = await retry(
            () => withTimeout(extractSkills(truncatedText), TIMEOUT_MS),
            MAX_RETRIES
        );
        console.log('Stage 2 Complete:', skills.length, 'skills found');

        // Store skills (max 15 due to hard limit)
        console.log('Storing skills in DB...');
        for (const skill of skills.slice(0, 15)) {
            db_queries.addSkill(candidateId, skill.name, skill.proficiency);
        }

        // Stage 3: Generate assessment
        console.log('\n--- STAGE 3: Generating AI Assessment ---');
        onProgress?.('Generating AI assessment...');
        const assessment = await retry(
            () => withTimeout(generateAssessment(candidateId, truncatedText, roleTitle), TIMEOUT_MS),
            MAX_RETRIES
        );
        console.log('Stage 3 Complete');

        // Calculate overall score
        const overallScore = Math.round(
            (assessment.technicalScore +
                assessment.experienceScore +
                assessment.educationScore +
                assessment.culturalScore) / 4
        );
        console.log('Overall Score:', overallScore);

        // Update candidate score
        db_queries.updateCandidate(candidateId, { score: overallScore });

        // Store assessment
        console.log('Storing assessment in DB...');
        db_queries.createAssessment({
            candidate_id: candidateId,
            technical_score: assessment.technicalScore,
            experience_score: assessment.experienceScore,
            education_score: assessment.educationScore,
            cultural_score: assessment.culturalScore,
            recommendation: assessment.recommendation,
            detailed_comments: assessment.detailedComments,
            strengths: JSON.stringify(assessment.strengths.slice(0, 4)),
            weaknesses: JSON.stringify(assessment.weaknesses.slice(0, 3)),
        });

        onProgress?.('Complete!');
        console.log('\n=== PROCESSING COMPLETE ===\n');

        return {
            candidateId,
            status: 'completed',
            stage: 'done',
        };

    } catch (error) {
        console.error('\n!!! PROCESSING FAILED !!!');
        console.error('Error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');

        // Mark candidate as failed
        db_queries.updateCandidate(candidateId, {
            status: 'in-review' // Keep in review for manual processing
        });

        return {
            candidateId,
            status: 'failed',
            stage: 'extraction',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
