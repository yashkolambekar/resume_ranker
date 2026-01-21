'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, TrendingUp, Users, Award, FileText } from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    email: string;
    score: number;
    status: 'in-review' | 'shortlisted' | 'rejected';
    skills: { name: string; level: number }[];
    appliedDate: string;
}



export default function RolePage() {
    const params = useParams();
    const roleId = params.id as string;

    const [role, setRole] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchRoleData();
    }, [roleId]);

    const fetchRoleData = async () => {
        try {
            const response = await fetch(`/api/roles/${roleId}`);
            if (response.ok) {
                const data = await response.json();
                setRole(data.role);
                setCandidates(data.candidates);
            }
        } catch (error) {
            console.error('Error fetching role data:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score);
    const avgScore = candidates.length > 0
        ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length)
        : 0;
    const topScore = candidates.length > 0 ? Math.max(...candidates.map(c => c.score)) : 0;
    const pendingReview = candidates.filter(c => c.status === 'in-review').length;



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('roleId', roleId);
            formData.append('resume', selectedFile);

            const response = await fetch('/api/candidates', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setIsUploadOpen(false);
                setSelectedFile(null);
                // Refresh role data instead of full page reload
                fetchRoleData();
            } else {
                const error = await response.json();
                alert(`Upload failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status: Candidate['status']) => {
        switch (status) {
            case 'shortlisted':
                return 'default';
            case 'in-review':
                return 'secondary';
            case 'rejected':
                return 'destructive';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-lg">Loading role data...</div>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-lg">Role not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Roles
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <h1 className="text-3xl font-semibold">{role.title}</h1>
                            <p className="text-muted-foreground mt-1">{role.department} Department</p>
                        </div>

                        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload Resume
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Resume</DialogTitle>
                                    <DialogDescription>
                                        Upload resume for {role.title}. AI will extract candidate info automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Resume (PDF or DOCX)</label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                        {selectedFile && (
                                            <p className="text-sm text-muted-foreground">
                                                {selectedFile.name}
                                            </p>
                                        )}
                                    </div>

                                    {uploading && (
                                        <div className="bg-primary/10 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <span className="text-sm font-medium">Processing...</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                AI is analyzing the resume. This may take 30-60 seconds.
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading}
                                        className="w-full"
                                    >
                                        {uploading ? 'Processing...' : 'Upload & Analyze'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Total Candidates
                            </CardDescription>
                            <CardTitle className="text-3xl">{candidates.length}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Average Score
                            </CardDescription>
                            <CardTitle className="text-3xl">{avgScore}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Top Score
                            </CardDescription>
                            <CardTitle className="text-3xl">{topScore}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Pending Review
                            </CardDescription>
                            <CardTitle className="text-3xl">{pendingReview}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>


                {/* Candidates Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Candidates</CardTitle>
                        <CardDescription>
                            {sortedCandidates.length} candidates ranked by score
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Rank</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-24">Score</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-32">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCandidates.map((candidate, index) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium">#{index + 1}</TableCell>
                                        <TableCell>{candidate.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{candidate.score}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(candidate.status)}>
                                                {candidate.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/roles/${roleId}/candidates/${candidate.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
