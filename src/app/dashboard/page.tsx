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
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalNotes: number;
  quizzesTaken: number;
  studyTime: number;
  averageScore: number;
}

interface Activity {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    quizzesTaken: 0,
    studyTime: 0,
    averageScore: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let currentUserId: string | null = null;

    // Check if user is logged in and fetch stats
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          currentUserId = session.user.id;
          setUser(session.user);
          // Fetch dashboard stats and activities
          await fetchDashboardStats(session.user.id);
          await fetchRecentActivities(session.user.id);
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

    // Refresh stats when returning to the page
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUserId) {
        fetchDashboardStats(currentUserId);
        fetchRecentActivities(currentUserId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const fetchDashboardStats = async (userId: string) => {
    try {
      // Add cache busting to ensure fresh data
      const res = await fetch(`/api/dashboard/stats?userId=${userId}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[Dashboard] Stats updated:', data.stats);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentActivities = async (userId: string) => {
    try {
      const res = await fetch(`/api/activity/recent?userId=${userId}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleRefresh = async () => {
    if (!user || refreshing) return;

    console.log('[Dashboard] Manual refresh triggered');
    setRefreshing(true);

    try {
      await Promise.all([
        fetchDashboardStats(user.id),
        fetchRecentActivities(user.id)
      ]);
      console.log('[Dashboard] Manual refresh completed');
    } catch (error) {
      console.error('[Dashboard] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-muted-foreground">
              Ready to continue your learning journey?
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            title="Refresh dashboard stats"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity yet</p>
                <p className="text-sm mt-1">Start by uploading your first note!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const icon =
                    activity.activity_type === 'note_upload' ? (
                      <FileText className="h-5 w-5 text-primary" />
                    ) : activity.activity_type === 'quiz_completed' ? (
                      <Trophy className="h-5 w-5 text-primary" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-primary" />
                    );

                  const message =
                    activity.activity_type === 'note_upload'
                      ? `Uploaded "${activity.activity_data?.title || 'a note'}"`
                      : activity.activity_type === 'quiz_completed'
                      ? `Completed quiz on ${activity.activity_data?.topic || 'a topic'} (Score: ${activity.activity_data?.score || 0}%)`
                      : 'Had a chat session';

                  const timeAgo = new Date(activity.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
