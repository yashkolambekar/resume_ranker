import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'resume-ranker.db');
let db: Database.Database | null = null;

export function getDatabase() {
    if (!db) {
        const dbExists = fs.existsSync(dbPath);
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        if (!dbExists) {
            console.log('New database created. Initializing schema...');
            try {
                const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf-8');
                db.exec(schema);
                console.log('Database initialized successfully');
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        }
    }
    return db;
}

export function initializeDatabase() {
    const db = getDatabase();
    const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);

    console.log('Database initialized successfully');
}

export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}

// Type definitions
export interface Role {
    id: number;
    title: string;
    department: string;
    location: string;
    type: string;
    status: string;
    created_at: string;
}

export interface Candidate {
    id: number;
    role_id: number;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    experience?: string;
    education?: string;
    current_role?: string;
    resume_path?: string;
    status: string;
    score: number;
    applied_date: string;
}

export interface Skill {
    id: number;
    candidate_id: number;
    skill_name: string;
    proficiency: number;
}

export interface AIAssessment {
    id: number;
    candidate_id: number;
    technical_score: number;
    experience_score: number;
    education_score: number;
    cultural_score: number;
    recommendation: string;
    detailed_comments: string;
    strengths: string; // JSON array
    weaknesses: string; // JSON array
}

// Helper functions
export const db_queries = {
    // Roles
    getAllRoles: () => {
        const db = getDatabase();
        return db.prepare(`
      SELECT r.*, COUNT(DISTINCT c.id) as applicants
      FROM roles r
      LEFT JOIN candidates c ON r.id = c.role_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).all() as (Role & { applicants: number })[];
    },

    getRoleById: (id: number) => {
        const db = getDatabase();
        return db.prepare('SELECT * FROM roles WHERE id = ?').get(id) as Role | undefined;
    },

    createRole: (role: Omit<Role, 'id' | 'created_at'>) => {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO roles (title, department, location, type, status)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = stmt.run(role.title, role.department, role.location, role.type, role.status);
        return result.lastInsertRowid;
    },

    // Candidates
    getCandidatesByRole: (roleId: number) => {
        const db = getDatabase();
        return db.prepare('SELECT * FROM candidates WHERE role_id = ? ORDER BY score DESC').all(roleId) as Candidate[];
    },

    getCandidateById: (id: number) => {
        const db = getDatabase();
        return db.prepare('SELECT * FROM candidates WHERE id = ?').get(id) as Candidate | undefined;
    },

    createCandidate: (candidate: Omit<Candidate, 'id' | 'applied_date'>) => {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO candidates (role_id, name, email, phone, location, experience, education, current_role, resume_path, status, score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(
            candidate.role_id,
            candidate.name,
            candidate.email,
            candidate.phone || null,
            candidate.location || null,
            candidate.experience || null,
            candidate.education || null,
            candidate.current_role || null,
            candidate.resume_path || null,
            candidate.status,
            candidate.score
        );
        return result.lastInsertRowid;
    },

    updateCandidate: (id: number, updates: Partial<Candidate>) => {
        const db = getDatabase();
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE candidates SET ${fields} WHERE id = ?`);
        return stmt.run(...values, id);
    },

    // Skills
    getSkillsByCandidate: (candidateId: number) => {
        const db = getDatabase();
        return db.prepare('SELECT * FROM skills WHERE candidate_id = ?').all(candidateId) as Skill[];
    },

    addSkill: (candidateId: number, skillName: string, proficiency: number) => {
        const db = getDatabase();
        const stmt = db.prepare('INSERT INTO skills (candidate_id, skill_name, proficiency) VALUES (?, ?, ?)');
        return stmt.run(candidateId, skillName, proficiency);
    },

    // AI Assessments
    getAssessmentByCandidate: (candidateId: number) => {
        const db = getDatabase();
        return db.prepare('SELECT * FROM ai_assessments WHERE candidate_id = ?').get(candidateId) as AIAssessment | undefined;
    },

    createAssessment: (assessment: Omit<AIAssessment, 'id'>) => {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO ai_assessments (candidate_id, technical_score, experience_score, education_score, cultural_score, recommendation, detailed_comments, strengths, weaknesses)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(
            assessment.candidate_id,
            assessment.technical_score,
            assessment.experience_score,
            assessment.education_score,
            assessment.cultural_score,
            assessment.recommendation,
            assessment.detailed_comments,
            assessment.strengths,
            assessment.weaknesses
        );
        return result.lastInsertRowid;
    }
};
