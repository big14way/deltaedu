// src/app/page.tsx
import Link from 'next/link';
import { 
  BookOpen, 
  Brain, 
  MessageSquare, 
  FileUp, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  Trophy
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>DeltaEDU</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <span className="mr-2">🇳🇬</span>
            Built for Delta State Students
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            Transform Your Notes Into
            <span className="text-primary"> Interactive Learning</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Upload your study materials and let AI create personalized quizzes, 
            summaries, and tutoring sessions. Prepare smarter for WAEC, NECO, 
            and JAMB.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-lg font-medium hover:bg-muted transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Active Students', value: '500+' },
              { label: 'Notes Processed', value: '2,000+' },
              { label: 'Quizzes Completed', value: '5,000+' },
              { label: 'Success Rate', value: '94%' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful AI-driven features designed specifically for Nigerian students
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: FileUp,
              title: 'Smart Upload',
              description: 'Upload PDFs, Word docs, or paste text. Our AI extracts and organizes your content automatically.',
            },
            {
              icon: Brain,
              title: 'AI Summaries',
              description: 'Get instant summaries of your study materials with key points highlighted.',
            },
            {
              icon: MessageSquare,
              title: 'Personal Tutor',
              description: 'Chat with an AI tutor that understands your notes and answers questions 24/7.',
            },
            {
              icon: CheckCircle,
              title: 'Auto Quizzes',
              description: 'Generate practice quizzes in WAEC/JAMB format to test your understanding.',
            },
            {
              icon: Trophy,
              title: 'Track Progress',
              description: 'Monitor your study sessions and quiz scores to see your improvement.',
            },
            {
              icon: Users,
              title: 'Study Groups',
              description: 'Share notebooks with classmates and study together.',
            },
          ].map((feature) => (
            <div 
              key={feature.title}
              className="flex flex-col items-start p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              How DeltaEDU Works
            </h2>
            <p className="text-muted-foreground">
              Three simple steps to transform your learning
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Upload Your Notes',
                description: 'Drop your PDFs, Word documents, or paste text directly. We support all common formats.',
              },
              {
                step: '2',
                title: 'AI Processes Content',
                description: 'Our AI analyzes your materials, creates summaries, and prepares personalized content.',
              },
              {
                step: '3',
                title: 'Learn & Practice',
                description: 'Chat with your AI tutor, take quizzes, and track your progress as you master the material.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="rounded-2xl bg-primary p-8 md:p-16 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of Delta State students who are already studying smarter 
            with DeltaEDU. It's completely free to get started.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-background text-foreground px-8 py-3 text-lg font-medium hover:bg-background/90 transition-colors"
          >
            Create Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">DeltaEDU</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for Delta State students • Delta Tech Week Hackathon 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
