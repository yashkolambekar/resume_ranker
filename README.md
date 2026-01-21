# Resume Ranker

AI-Powered Recruitment Platform that automatically ranks candidates based on their resumes.

## Control APIs

Use these simple GET requests to control application features:

### Role Creation
- **Enable**: `GET /api/config/roles/enable`
- **Disable**: `GET /api/config/roles/disable`

### Resume Uploads
- **Enable**: `GET /api/config/uploads/enable`
- **Disable**: `GET /api/config/uploads/disable`

### Database Management
- **Reset Database**: `GET /api/reset`
  - Clears all data (roles, candidates, skills, assessments)
  - Deletes all uploaded resume files
  - Resets auto-increment counters

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker Deployment

The application is fully Dockerized.

```bash
docker-compose up --build
```

- **Fresh Start**: Data is NOT persisted. Each restart creates a clean database.
- **Port**: 3000
