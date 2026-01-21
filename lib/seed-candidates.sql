-- Add mock candidates for testing
INSERT INTO candidates (role_id, name, email, phone, location, experience, education, current_role, status, score) VALUES
  (1, 'Alice Johnson', 'alice.j@email.com', '+1 (555) 123-4567', 'San Francisco, CA', '8 years', 'Bachelor''s in Computer Science, Stanford University', 'Senior Frontend Engineer at TechCorp', 'shortlisted', 92),
  (1, 'Bob Smith', 'bob.smith@email.com', '+1 (555) 234-5678', 'Seattle, WA', '6 years', 'Master''s in Software Engineering, MIT', 'Full Stack Developer at StartupCo', 'in-review', 88),
  (1, 'Carol Williams', 'carol.w@email.com', '+1 (555) 345-6789', 'Austin, TX', '10 years', 'PhD in Computer Science, UC Berkeley', 'Lead Engineer at BigTech', 'shortlisted', 95);

-- Add skills for candidates
INSERT INTO skills (candidate_id, skill_name, proficiency) VALUES
  (1, 'React', 90),
  (1, 'TypeScript', 85),
  (1, 'Node.js', 80),
  (2, 'React', 85),
  (2, 'Python', 90),
  (2, 'AWS', 75),
  (3, 'React', 95),
  (3, 'TypeScript', 90),
  (3, 'System Design', 88);

-- Add AI assessments
INSERT INTO ai_assessments (candidate_id, technical_score, experience_score, education_score, cultural_score, recommendation, detailed_comments, strengths, weaknesses) VALUES
  (1, 95, 90, 88, 92, 'Strong Hire', 'Alice is an exceptional candidate who exceeds most of our requirements. Her extensive React and TypeScript experience aligns perfectly with our frontend needs. While she lacks AWS experience, her strong technical foundation suggests she would quickly adapt.', '["Exceptional React and TypeScript expertise", "Strong system design knowledge", "Excellent communication skills", "Proven track record of mentoring"]', '["Limited AWS/cloud infrastructure experience", "No direct experience with specific tech stack version", "Might be overqualified for some aspects"]'),
  (2, 88, 85, 92, 86, 'Hire', 'Bob demonstrates strong full-stack capabilities with a good balance of frontend and backend skills. His AWS experience is valuable for our cloud infrastructure needs. Some concern about depth of React expertise compared to other candidates.', '["Strong Python and backend skills", "AWS/cloud experience", "Excellent academic background", "Quick learner"]', '["React experience somewhat limited", "Less frontend focus than ideal", "Startup background may need adjustment"]'),
  (3, 98, 95, 95, 90, 'Strong Hire', 'Carol is the top candidate with exceptional technical depth and breadth. Her PhD background brings valuable research and problem-solving skills. Leadership experience at BigTech demonstrates ability to work at scale. Strong recommendation for senior role or tech lead position.', '["Exceptional technical expertise across stack", "Strong leadership and mentoring experience", "Proven ability to work at scale", "Deep system design knowledge"]', '["May be overqualified and looking for more senior role", "Compensation expectations likely high", "Risk of seeking advancement quickly"]');
