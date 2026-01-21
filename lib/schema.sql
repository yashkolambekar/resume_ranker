-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  experience TEXT,
  education TEXT,
  current_role TEXT,
  resume_path TEXT,
  status TEXT DEFAULT 'in-review',
  score INTEGER DEFAULT 0,
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency INTEGER,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- Create ai_assessments table
CREATE TABLE IF NOT EXISTS ai_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL UNIQUE,
  technical_score INTEGER,
  experience_score INTEGER,
  education_score INTEGER,
  cultural_score INTEGER,
  recommendation TEXT,
  detailed_comments TEXT,
  strengths TEXT,
  weaknesses TEXT,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- Seed data for roles
INSERT INTO roles (title, department, location, type, status) VALUES
  ('Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'Full-time', 'open'),
  ('Product Manager', 'Product', 'Remote', 'Full-time', 'open'),
  ('UX/UI Designer', 'Design', 'New York, NY', 'Full-time', 'open'),
  ('Data Scientist', 'Analytics', 'San Francisco, CA', 'Full-time', 'open'),
  ('DevOps Engineer', 'Engineering', 'Remote', 'Full-time', 'open'),
  ('Marketing Manager', 'Marketing', 'Austin, TX', 'Full-time', 'closed');
