import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  LogIn,
  Lock,
  Download,
  Eye,
  Search,
  Shield,
  Sparkles,
  Upload,
  Trash2,
  Pencil,
  Gauge,
  Folder,
  Home,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  Grid3X3,
  Loader2,
  ShieldCheck,
  UserCog,
  Menu,
  Calendar,
  PanelTop
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase, getCurrentProfile, ADMIN_ROLE } from './lib/supabase';
import type { PdfRecord, Profile } from './types';

const WEBSITE_NAME = 'NovaStudy';
const PDF_SIZE_LIMIT = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function useAuthState() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        try {
          const currentProfile = await getCurrentProfile();
          setProfile(currentProfile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          const currentProfile = await getCurrentProfile();
          setProfile(currentProfile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading, isAdmin: profile?.role === ADMIN_ROLE };
}

function App() {
  const auth = useAuthState();
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const pushToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100">
      <AppRouter auth={auth} pushToast={pushToast} />
      <ToastStack toasts={toasts} />
    </div>
  );
}

function AppRouter({ auth, pushToast }: { auth: ReturnType<typeof useAuthState>; pushToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const { session, profile, loading, isAdmin } = auth;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<SiteLayout isAdmin={isAdmin} profile={profile} />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage pushToast={pushToast} />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="pdf/:id" element={<PdfViewerPage />} />

        <Route
          path="admin/login"
          element={
            <AuthOnlyRoute session={session} profile={profile} isAdmin={isAdmin}>
              <AdminLoginPage pushToast={pushToast} />
            </AuthOnlyRoute>
          }
        />

        <Route
          path="admin/setup"
          element={
            <SetupRoute profile={profile}>
              <AdminSetupPage pushToast={pushToast} />
            </SetupRoute>
          }
        />

        <Route
          path="admin"
          element={
            <AdminRoute isAdmin={isAdmin} session={session}>
              <AdminDashboardPage pushToast={pushToast} />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SiteLayout({ isAdmin, profile }: { isAdmin: boolean; profile: Profile | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/library', label: 'Study Materials' },
    { to: '/subjects', label: 'Subjects' },
    { to: '/library', label: 'PDF Library' },
    { to: isAdmin ? '/admin' : '/admin/login', label: 'Admin Login' }
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <IntroOverlay />
      <div className="relative min-h-screen overflow-x-hidden bg-space-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_30%)]" />
        </div>

        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-glow">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-[0.22em] text-cyan-200">{WEBSITE_NAME}</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-cyan-500/15 text-cyan-200 shadow-glow' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {profile?.role === ADMIN_ROLE ? (
                <Link to="/admin" className="metal-button px-4 py-2">Admin Dashboard</Link>
              ) : (
                <Link to="/admin/login" className="metal-button px-4 py-2">Admin Login</Link>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 md:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </button>
          </div>

          {menuOpen && (
            <div className="mx-4 mb-4 space-y-2 rounded-2xl border border-white/10 bg-slate-950/95 p-3 md:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium ${
                      isActive ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </header>

        <main className="relative z-10">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function IntroOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5600);
    return () => window.clearTimeout(timer);
  }, []);

  const skipIntro = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="intro-overlay fixed inset-0 z-[100] overflow-hidden bg-[#040816] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(50,94,255,0.12),_transparent_36%),radial-gradient(circle_at_20%_30%,_rgba(6,182,212,0.12),_transparent_22%),linear-gradient(180deg,#020611_0%,#040916_42%,#070d1b_100%)]" />
      <div className="particle-layer" />
      <div className="smoke smoke-one" />
      <div className="smoke smoke-two" />
      <div className="smoke smoke-three" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="intro-character">
          <div className="helmet-glow" />
          <div className="mask-outline" />
          <div className="energy-ring energy-ring-one" />
          <div className="energy-ring energy-ring-two" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-100/80 shadow-glow">
          Systems online
        </div>
      </div>

      <button
        type="button"
        onClick={skipIntro}
        className="absolute bottom-6 right-6 rounded-full border border-cyan-400/30 bg-slate-900/80 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-slate-800"
      >
        SKIP INTRO
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-space-950">
      <div className="flex items-center gap-3 text-cyan-200">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="tracking-[0.2em] uppercase text-xs">Loading</span>
      </div>
    </div>
  );
}

function AdminRoute({ children, isAdmin, session }: { children: React.ReactNode; isAdmin: boolean; session: any }) {
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function AuthOnlyRoute({ children, session, profile, isAdmin }: { children: React.ReactNode; session: any; profile: Profile | null; isAdmin: boolean }) {
  if (session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (session && profile && profile.role !== ADMIN_ROLE) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SetupRoute({ children, profile }: { children: React.ReactNode; profile: Profile | null }) {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.from('profiles').select('id').eq('role', ADMIN_ROLE).limit(1);
      setHasAdmin(Boolean(data && data.length > 0));
    };

    checkAdmin();
  }, [profile]);

  if (hasAdmin === null) return <LoadingScreen />;
  if (hasAdmin) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
}

function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_25%)]" />
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 md:px-8 md:pb-20 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
              <Sparkles size={12} />
              Future-ready learning
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-4xl font-black leading-none tracking-tight text-white md:text-6xl">
                Your Study. Your Knowledge. Your Future.
              </h1>
              <p className="max-w-lg text-lg text-slate-300 md:text-xl">
                Access all your study materials in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/library" className="metal-button inline-flex items-center gap-2 px-6 py-3 text-base font-semibold">
                Explore PDFs
                <ArrowRight size={18} />
              </Link>
              <Link to="/admin/login" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/10">
                Admin Login
              </Link>
            </div>

            <div className="grid max-w-lg gap-4 sm:grid-cols-3">
              {[
                { value: '24/7', label: 'Access' },
                { value: '100+', label: 'Notes' },
                { value: 'Secure', label: 'Admin' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                  <div className="text-2xl font-black text-cyan-200">{stat.value}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="parallax-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Study Hub</p>
                  <h2 className="mt-2 text-3xl font-black text-white">Knowledge Engine</h2>
                </div>
                <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-200">
                  <Gauge size={22} />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                {[
                  { subject: 'Mathematics', progress: 82, color: 'from-cyan-500 to-blue-500' },
                  { subject: 'Physics', progress: 74, color: 'from-violet-500 to-purple-500' },
                  { subject: 'Chemistry', progress: 91, color: 'from-emerald-500 to-teal-500' }
                ].map((item) => (
                  <div key={item.subject}>
                    <div className="mb-2 flex justify-between text-sm text-slate-300">
                      <span>{item.subject}</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800">
                      <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2 text-cyan-200"><Folder size={16} /> <span className="text-xs uppercase tracking-[0.2em]">PDFs</span></div>
                  <div className="mt-3 text-3xl font-black text-white">3.4k</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-2 text-violet-200"><ShieldCheck size={16} /> <span className="text-xs uppercase tracking-[0.2em]">Secure</span></div>
                  <div className="mt-3 text-3xl font-black text-white">99.9%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LibraryPage({ pushToast }: { pushToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');

  const fetchPdfs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('study_pdfs').select('*').order('created_at', { ascending: false });
    if (error) {
      pushToast('Unable to load PDFs right now.', 'error');
      setPdfs([]);
    } else {
      setPdfs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(pdfs.map((item) => item.subject))).sort((a, b) => a.localeCompare(b)),
    [pdfs]
  );

  const filteredPdfs = useMemo(() => {
    let next = [...pdfs];

    if (search.trim()) {
      next = next.filter((item) => item.title.toLowerCase().includes(search.trim().toLowerCase()));
    }

    if (subject !== 'all') {
      next = next.filter((item) => item.subject === subject);
    }

    switch (sort) {
      case 'oldest':
        next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'a-z':
        next.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        next.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'newest':
      default:
        next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return next;
  }, [pdfs, search, subject, sort]);

  const downloadPdf = async (pdf: PdfRecord) => {
    const { data, error } = await supabase.storage.from('study-pdfs').createSignedUrl(pdf.file_path, 60 * 60);
    if (error || !data?.signedUrl) {
      pushToast('Download failed. Please try again.', 'error');
      return;
    }

    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = pdf.file_name || `${pdf.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    pushToast('Download started.', 'success');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8 rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-steel backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Library</p>
            <h2 className="mt-2 text-3xl font-black text-white">PDF Library</h2>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search PDFs"
                className="w-full rounded-full border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/50"
              />
            </div>

            <div className="relative min-w-[180px]">
              <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full appearance-none rounded-full border border-white/10 bg-slate-950/80 py-3 pl-11 pr-10 text-sm text-white outline-none focus:border-cyan-400/50"
              >
                <option value="all">All subjects</option>
                {subjects.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'newest' | 'oldest' | 'a-z' | 'z-a')}
              className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
        </div>
      ) : filteredPdfs.length === 0 ? (
        <EmptyLibraryState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPdfs.map((pdf) => (
            <div key={pdf.id} className="group rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-steel transition hover:border-cyan-400/40 hover:bg-slate-900/90">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                    <FileText size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{pdf.subject}</p>
                    <h3 className="mt-1 text-xl font-bold text-white">{pdf.title}</h3>
                  </div>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-300">
                {pdf.description || 'No description provided for this PDF.'}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-500">Size</div>
                  <div className="mt-1 font-semibold text-white">{formatBytes(pdf.file_size)}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  <div className="text-slate-500">Uploaded</div>
                  <div className="mt-1 font-semibold text-white">{formatDate(pdf.created_at)}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Link to={`/pdf/${pdf.id}`} className="flex-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
                  View PDF
                </Link>
                <button type="button" onClick={() => downloadPdf(pdf)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('study_pdfs').select('subject');
      if (!error) {
        setSubjects(Array.from(new Set((data || []).map((item) => item.subject))).sort((a, b) => a.localeCompare(b)));
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Subjects</p>
        <h2 className="mt-2 text-3xl font-black text-white">Browse by subject</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {subjects.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-300">
            No subjects available yet.
          </div>
        ) : (
          subjects.map((subject) => (
            <Link
              key={subject}
              to="/library"
              className="group rounded-[24px] border border-white/10 bg-slate-900/80 p-6 shadow-steel transition hover:border-cyan-400/40 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                  <Grid3X3 size={20} />
                </div>
                <ChevronRight className="text-slate-400 transition group-hover:text-cyan-200" size={18} />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-white">{subject}</h3>
              <p className="mt-2 text-sm text-slate-300">Explore curated PDFs for this subject.</p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function PdfViewerPage() {
  const { id } = useParams();
  const [pdf, setPdf] = useState<PdfRecord | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data, error } = await supabase.from('study_pdfs').select('*').eq('id', id).maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }

      setPdf(data);

      const { data: signedData, error: signedError } = await supabase.storage.from('study-pdfs').createSignedUrl(data.file_path, 60 * 60);
      if (!signedError && signedData?.signedUrl) {
        setSignedUrl(signedData.signedUrl);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!pdf) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-100">
          PDF not found.
        </div>
      </section>
    );
  }

  const openInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const download = async () => {
    if (!signedUrl) return;
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = pdf.file_name || `${pdf.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-steel md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Viewer</p>
          <h2 className="mt-2 text-3xl font-black text-white">{pdf.title}</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={openInNewTab} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100">
            Open in new tab
          </button>
          <button type="button" onClick={download} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100">
            Download PDF
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-steel">
        {signedUrl ? (
          <iframe title={pdf.title} src={signedUrl} className="h-[76vh] w-full bg-white" allowFullScreen />
        ) : (
          <div className="flex h-[76vh] items-center justify-center text-slate-300">Preparing PDF viewer...</div>
        )}
      </div>
    </section>
  );
}

function AdminLoginPage({ pushToast }: { pushToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('email not verified')) {
          pushToast('Check your email to verify your account', 'error');
          return; 
        }
        throw error;
      }

      const profile = await getCurrentProfile();
      if (!profile || profile.role !== ADMIN_ROLE) {
        await supabase.auth.signOut();
        pushToast('This account does not have admin privileges.', 'error');
        return;
      }

      pushToast('Login successful.', 'success');
      navigate('/admin', { replace: true });
    } catch (error: any) {
      pushToast(error?.message || 'Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      pushToast('Enter your email to receive a reset link.', 'error');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/login`
    });

    if (error) {
      pushToast(error.message, 'error');
      return;
    }

    pushToast('Password reset email sent.', 'success');
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16 md:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-7 shadow-steel backdrop-blur-xl md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Secure access</p>
            <h2 className="mt-2 text-3xl font-black text-white">Admin Login</h2>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-200">
            <Shield size={20} />
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          If email confirmation is enabled in Supabase, disable it in <strong>Authentication → Providers → Email</strong> and disable <strong>Confirm email</strong> for the initial admin setup.
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              placeholder="admin@novastudy.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={loading} className="metal-button flex-1 justify-center py-3 font-semibold">
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
            <button type="button" onClick={handleForgotPassword} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
              FORGOT PASSWORD
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function AdminSetupPage({ pushToast }: { pushToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password || !form.confirmPassword) {
      pushToast('Please complete all fields.', 'error');
      return;
    }

    if (form.password.length < 8) {
      pushToast('Password must be at least 8 characters.', 'error');
      return;
    }

    if (form.password !== form.confirmPassword) {
      pushToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('user already registered')) {
          pushToast('This admin account already exists. Please log in instead.', 'error');
          return;
        }

        if (error.message.toLowerCase().includes('email not verified')) {
          pushToast('Check your email to verify your account', 'error');
          return;
        }

        throw error;
      }

      const user = data.user;
      if (!user) {
        pushToast('Admin setup could not complete. Please try again.', 'error');
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        role: ADMIN_ROLE,
        created_at: new Date().toISOString()
      });

      if (profileError) {
        throw profileError;
      }

      pushToast('Initial admin created successfully.', 'success');
      navigate('/admin', { replace: true });
    } catch (error: any) {
      pushToast(error?.message || 'Admin setup failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-16 md:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-7 shadow-steel backdrop-blur-xl md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">First admin</p>
            <h2 className="mt-2 text-3xl font-black text-white">Admin Setup</h2>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-200">
            <UserCog size={20} />
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          This page is visible only when no admin exists. After the first admin is created, it is disabled automatically.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Admin email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((value) => ({ ...value, confirmPassword: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="metal-button w-full justify-center py-3 font-semibold">
            {loading ? 'CREATING ADMIN...' : 'CREATE ADMIN'}
          </button>
        </form>
      </div>
    </section>
  );
}

function AdminDashboardPage({ pushToast }: { pushToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<PdfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadPdfs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('study_pdfs').select('*').order('created_at', { ascending: false });
    if (!error) setPdfs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPdfs();
  }, []);

  const totalSubjects = useMemo(() => Array.from(new Set(pdfs.map((pdf) => pdf.subject))).length, [pdfs]);
  const thisMonthCount = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return pdfs.filter((pdf) => new Date(pdf.created_at) >= oneMonthAgo).length;
  }, [pdfs]);
  const latestPdf = pdfs[0];

  const subjects = useMemo(() => Array.from(new Set(pdfs.map((pdf) => pdf.subject))).sort((a, b) => a.localeCompare(b)), [pdfs]);

  const filteredPdfs = useMemo(() => {
    let next = [...pdfs];

    if (search.trim()) {
      next = next.filter((item) => item.title.toLowerCase().includes(search.trim().toLowerCase()));
    }

    if (subject !== 'all') {
      next = next.filter((item) => item.subject === subject);
    }

    switch (sort) {
      case 'oldest':
        next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'a-z':
        next.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        next.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        next.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return next;
  }, [pdfs, search, subject, sort]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      pushToast('Only PDF files are allowed.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > PDF_SIZE_LIMIT) {
      pushToast(`PDF size exceeds the limit of ${formatBytes(PDF_SIZE_LIMIT)}.`, 'error');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setUploadForm((current) => ({ ...current, title: file.name.replace(/\.pdf$/i, ''), subject: current.subject || 'General' }));
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadForm({ title: '', subject: '', description: '' });
    setUploading(false);
    setUploadProgress(0);
    setIsUploadOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      pushToast('Please select a PDF file first.', 'error');
      return;
    }

    if (!uploadForm.title.trim() || !uploadForm.subject.trim()) {
      pushToast('Title and subject are required.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const safeName = `${Date.now()}-${slugify(uploadForm.title)}-${selectedFile.name}`;
      const { data: uploadedData, error: uploadError } = await supabase.storage
        .from('study-pdfs')
        .upload(safeName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      const { error: insertError } = await supabase.from('study_pdfs').insert({
        title: uploadForm.title.trim(),
        subject: uploadForm.subject.trim(),
        description: uploadForm.description.trim() || null,
        file_path: uploadedData.path,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || null
      });

      if (insertError) throw insertError;
      setUploadProgress(100);
      pushToast('PDF uploaded successfully!', 'success');
      resetUploadForm();
      await loadPdfs();
    } catch (error: any) {
      pushToast(error?.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  const handleDelete = async (pdf: PdfRecord) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this PDF?');
    if (!confirmed) return;

    try {
      const { error: removeStorageError } = await supabase.storage.from('study-pdfs').remove([pdf.file_path]);
      if (removeStorageError) throw removeStorageError;

      const { error: deleteError } = await supabase.from('study_pdfs').delete().eq('id', pdf.id);
      if (deleteError) throw deleteError;

      pushToast('PDF deleted successfully.', 'success');
      await loadPdfs();
    } catch (error: any) {
      pushToast(error?.message || 'Delete failed. Please try again.', 'error');
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;

    const { data, error } = await supabase
      .from('study_pdfs')
      .update({
        title: uploadForm.title,
        subject: uploadForm.subject,
        description: uploadForm.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingId)
      .select();

    if (error) {
      pushToast(error.message, 'error');
      return;
    }

    pushToast('PDF updated successfully.', 'success');
    setEditingId(null);
    setUploadForm({ title: '', subject: '', description: '' });
    setSelectedFile(null);
    await loadPdfs();
  };

  const openEditDialog = (pdf: PdfRecord) => {
    setEditingId(pdf.id);
    setUploadForm({ title: pdf.title, subject: pdf.subject, description: pdf.description || '' });
    setSelectedFile(null);
    setIsUploadOpen(true);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-steel md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Admin panel</p>
          <h2 className="mt-2 text-3xl font-black text-white">Dashboard</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setIsUploadOpen(true)} className="metal-button px-5 py-3 font-semibold">
            + UPLOAD PDF
          </button>
          <button type="button" onClick={handleLogout} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-100">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total PDFs" value={String(pdfs.length)} icon={<FileText size={18} />} />
        <StatCard label="Total Subjects" value={String(totalSubjects)} icon={<Folder size={18} />} />
        <StatCard label="Uploaded this month" value={String(thisMonthCount)} icon={<Calendar size={18} />} />
        <StatCard label="Latest uploaded PDF" value={latestPdf ? latestPdf.title : 'None'} icon={<PanelTop size={18} />} compact />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 shadow-steel">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Management</p>
            <h3 className="mt-2 text-2xl font-black text-white">Manage PDFs</h3>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search PDFs"
              className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="all">All subjects</option>
              {subjects.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'newest' | 'oldest' | 'a-z' | 'z-a')}
              className="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A-Z</option>
              <option value="z-a">Z-A</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-300" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 pr-5 font-medium">PDF</th>
                  <th className="py-3 pr-5 font-medium">Subject</th>
                  <th className="py-3 pr-5 font-medium">Size</th>
                  <th className="py-3 pr-5 font-medium">Uploaded Date</th>
                  <th className="py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPdfs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No PDFs found.
                    </td>
                  </tr>
                ) : (
                  filteredPdfs.map((pdf) => (
                    <tr key={pdf.id} className="border-b border-white/5">
                      <td className="py-4 pr-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                            <FileText size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{pdf.title}</div>
                            <div className="text-xs text-slate-400">{pdf.file_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-5">{pdf.subject}</td>
                      <td className="py-4 pr-5">{formatBytes(pdf.file_size)}</td>
                      <td className="py-4 pr-5">{formatDate(pdf.created_at)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/pdf/${pdf.id}`} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">VIEW</Link>
                          <button type="button" onClick={() => openEditDialog(pdf)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100">EDIT</button>
                          <button type="button" onClick={() => handleDelete(pdf)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100">DELETE</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-steel">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Upload</p>
                <h3 className="mt-2 text-2xl font-black text-white">{editingId ? 'Edit PDF' : 'Upload PDF'}</h3>
              </div>
              <button type="button" onClick={resetUploadForm} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200">
                <X size={18} />
              </button>
            </div>

            {!editingId && (
              <div className="mb-6 rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-6">
                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                    <Upload size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Drag & Drop PDF Here</p>
                    <p className="mt-1 text-sm text-slate-400">or</p>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100">
                    Choose PDF
                  </button>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</div>
                  </div>
                </div>
                {!editingId && (
                  <button type="button" onClick={() => setSelectedFile(null)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100">
                    Remove file
                  </button>
                )}
              </div>
            )}

            {uploading && (
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Upload progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Title</label>
                <input
                  value={uploadForm.title}
                  onChange={(event) => setUploadForm((value) => ({ ...value, title: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  placeholder="Lecture Notes"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Subject</label>
                <input
                  value={uploadForm.subject}
                  onChange={(event) => setUploadForm((value) => ({ ...value, subject: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  placeholder="Mathematics"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(event) => setUploadForm((value) => ({ ...value, description: event.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  placeholder="Add study notes or summary..."
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={editingId ? handleEdit : handleUpload} disabled={uploading} className="metal-button flex-1 justify-center py-3 font-semibold">
                  {editingId ? 'SAVE CHANGES' : 'UPLOAD PDF'}
                </button>
                <button type="button" onClick={resetUploadForm} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-100">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, icon, compact = false }: { label: string; value: string; icon: React.ReactNode; compact?: boolean }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-steel">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-200">{icon}</div>
      </div>
      <div className={`mt-5 ${compact ? 'text-base' : 'text-3xl'} font-black text-white`}>{value}</div>
      <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
    </div>
  );
}

function EmptyLibraryState() {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
        <FileText size={28} />
      </div>
      <h3 className="text-2xl font-black text-white">No PDFs available</h3>
      <p className="mt-2 text-slate-300">Check back later or upload new study material from the admin dashboard.</p>
    </div>
  );
}

function ToastStack({ toasts }: { toasts: { id: number; type: 'success' | 'error' | 'info'; message: string }[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-[120] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl ${
            toast.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
              : toast.type === 'error'
                ? 'border-red-500/40 bg-red-500/15 text-red-100'
                : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-100'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <InfoCircle size={18} />}
          <div className="text-sm font-medium">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}

function InfoCircle(props: any) {
  return <div className="h-4 w-4 rounded-full border border-current" {...props} />;
}

export default App;
