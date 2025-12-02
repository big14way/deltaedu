// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Brain,
  MessageSquare,
  PlusCircle,
  Trophy,
  FileText,
  Sparkles,
  LogOut,
  User,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  totalNotes: number;
  quizzesTaken: number;
  studyTime: number;
  averageScore: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    quizzesTaken: 0,
    studyTime: 0,
    averageScore: 0,
  });

  useEffect(() => {
    // Check if user is logged in and fetch stats
    const checkAuth = async () => {
      try {
        // For now, we'll use localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Fetch dashboard stats
          await fetchDashboardStats(userData.id);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>DeltaEDU</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/notes"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                My Notes
              </Link>
              <Link
                href="/dashboard/quiz"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Quizzes
              </Link>
              <Link
                href="/dashboard/tutor"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                AI Tutor
              </Link>

              <div className="flex items-center gap-2 pl-4 border-l">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.totalNotes}</div>
            <div className="text-sm text-muted-foreground">Notes Uploaded</div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-8 w-8 text-primary" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.quizzesTaken}</div>
            <div className="text-sm text-muted-foreground">Quizzes Completed</div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-primary" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.studyTime}h</div>
            <div className="text-sm text-muted-foreground">Study Time</div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-8 w-8 text-primary" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/notes/upload"
              className="bg-card border rounded-lg p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Add new study materials to your library
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/tutor"
              className="bg-card border rounded-lg p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Chat with AI Tutor</h3>
                  <p className="text-sm text-muted-foreground">
                    Get help understanding your materials
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/quiz/generate"
              className="bg-card border rounded-lg p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Generate Quiz</h3>
                  <p className="text-sm text-muted-foreground">
                    Test your knowledge with AI-generated quizzes
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity yet</p>
              <p className="text-sm mt-1">Start by uploading your first note!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
