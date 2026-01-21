'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

interface CandidateDetail {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    appliedDate: string;
    status: 'shortlisted' | 'in-review' | 'rejected';
    score: number;
    resumeUrl: string;

    // Basic info
    experience: string;
    education: string;
    currentRole: string;

    // Job alignment
    skillsMatch: {
        required: { skill: string; hasSkill: boolean; proficiency: number }[];
        matchPercentage: number;
    };
    experienceMatch: {
        required: string;
        candidate: string;
        matches: boolean;
    };

    // AI Assessment
    aiAssessment: {
        overallScore: number;
        breakdown: {
            technical: number;
            experience: number;
            education: number;
            cultural: number;
        };
        strengths: string[];
        weaknesses: string[];
        recommendation: string;
        detailedComments: string;
    };
}



export default function CandidateDetailPage() {
    const params = useParams();
    const roleId = params.id as string;
    const candidateId = params.candidateId as string;

    const [candidate, setCandidate] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/candidates/${candidateId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data.candidate);
                    setSkills(data.skills);
                    setAssessment(data.assessment);
                }
            } catch (error) {
                console.error('Error fetching candidate:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [candidateId]);

    if (loading) return <div className="p-8 text-center">Loading candidate data...</div>;
    if (!candidate) return <div className="p-8 text-center">Candidate not found</div>;

    const strengths = assessment?.strengths ? JSON.parse(assessment.strengths) : [];
    const weaknesses = assessment?.weaknesses ? JSON.parse(assessment.weaknesses) : [];

    const getStatusColor = (status: CandidateDetail['status']) => {
        switch (status) {
            case 'shortlisted': return 'default';
            case 'in-review': return 'secondary';
            case 'rejected': return 'destructive';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link
                        href={`/roles/${roleId}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Candidates
                    </Link>
                    <div className="flex items-start justify-between mt-2">
                        <div>
                            <h1 className="text-3xl font-semibold">{candidate.name}</h1>
                            <p className="text-muted-foreground mt-1">{candidate.current_role || 'Role not specified'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={getStatusColor(candidate.status)} className="text-sm px-3 py-1">
                                {candidate.status}
                            </Badge>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{candidate.score}</div>
                                <div className="text-xs text-muted-foreground">Overall Score</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{candidate.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{candidate.phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{candidate.location}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Applied on {new Date(candidate.applied_date).toLocaleDateString()}</span>
                                </div>
                                <Separator />
                                {candidate.resume_path ? (
                                    <Button className="w-full gap-2" variant="outline" asChild>
                                        <a href={candidate.resume_path} target="_blank" rel="noopener noreferrer" download>
                                            <Download className="h-4 w-4" />
                                            Download Resume
                                        </a>
                                    </Button>
                                ) : (
                                    <Button className="w-full gap-2" variant="outline" disabled>
                                        <Download className="h-4 w-4" />
                                        Resume Not Available
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Education & Experience */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Background</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium mb-1">Experience</div>
                                    <div className="text-sm text-muted-foreground">{candidate.experience || 'Not specified'}</div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="text-sm font-medium mb-1">Education</div>
                                    <div className="text-sm text-muted-foreground">{candidate.education || 'Not specified'}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Job Alignment & AI Assessment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* AI Assessment Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Assessment Overview</CardTitle>
                                <CardDescription>Powered by Gemini AI</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Technical</div>
                                        <div className="text-2xl font-bold">{assessment?.technical_score || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Experience</div>
                                        <div className="text-2xl font-bold">{assessment?.experience_score || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Education</div>
                                        <div className="text-2xl font-bold">{assessment?.education_score || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Cultural Fit</div>
                                        <div className="text-2xl font-bold">{assessment?.cultural_score || 0}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    <div>
                                        <div className="font-medium">Recommendation: {assessment?.recommendation || 'Pending'}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {assessment?.detailed_comments || 'Assessment in progress...'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Skills Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills Analysis</CardTitle>
                                <CardDescription>
                                    Extracted technical skills and proficiency
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {skills.map((skill) => (
                                        <div key={skill.id}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm font-medium">{skill.skill_name}</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {skill.proficiency}%
                                                </span>
                                            </div>
                                            <Progress value={skill.proficiency} className="h-2" />
                                        </div>
                                    ))}
                                    {skills.length === 0 && (
                                        <div className="text-sm text-muted-foreground">No skills extracted yet.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>



                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        Strengths
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {strengths.map((strength: string, index: number) => (
                                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                                                <span className="text-green-500 mt-1">•</span>
                                                <span>{strength}</span>
                                            </li>
                                        ))}
                                        {strengths.length === 0 && <li className="text-sm text-muted-foreground">No strengths listed.</li>}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                        Areas for Consideration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {weaknesses.map((weakness: string, index: number) => (
                                            <li key={index} className="text-sm text-muted-foreground flex gap-2">
                                                <span className="text-yellow-500 mt-1">•</span>
                                                <span>{weakness}</span>
                                            </li>
                                        ))}
                                        {weaknesses.length === 0 && <li className="text-sm text-muted-foreground">No areas for consideration listed.</li>}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
