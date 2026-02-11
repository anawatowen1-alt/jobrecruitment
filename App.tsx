
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, JobInput, JobStatus, User, UserRole } from './types';
import { dbService } from './services/dbService';
import JobCard from './components/JobCard';
import JobForm from './components/JobForm';
import LoginForm from './components/LoginForm';

const App: React.FC = () => {
  // --- States ---
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('careerhub_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<JobStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDbExplorerOpen, setIsDbExplorerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>();
  const [dbViewFormat, setDbViewFormat] = useState<'JSON' | 'TABLE'>('TABLE');

  // --- Auth Actions ---
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('careerhub_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('careerhub_session');
  };

  const toggleViewMode = () => {
    if (!user) return;
    const newRole = user.role === UserRole.ADMIN ? UserRole.EMPLOYEE : UserRole.ADMIN;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('careerhub_session', JSON.stringify(updatedUser));
  };

  // --- CRUD Actions ---
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchJobs();
  }, [fetchJobs, user]);

  const handleCreateOrUpdate = async (input: JobInput) => {
    if (editingJob) {
      await dbService.updateJob(editingJob.id, input);
    } else {
      await dbService.createJob(input);
    }
    setIsModalOpen(false);
    setEditingJob(undefined);
    fetchJobs();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประกาศงานนี้?')) {
      await dbService.deleteJob(id);
      fetchJobs();
    }
  };

  const handleArchive = async (id: string) => {
    await dbService.archiveJob(id);
    fetchJobs();
  };

  const handleResetDb = async () => {
    if (window.confirm('ยืนยันการล้างข้อมูลทั้งหมด?')) {
      localStorage.removeItem('careerhub_internal_jobs');
      await fetchJobs();
      setIsDbExplorerOpen(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (user?.role === UserRole.EMPLOYEE) {
      list = list.filter(j => j.status === JobStatus.OPEN);
    }
    return list.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           job.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'ALL' || job.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [jobs, searchQuery, activeTab, user]);

  const translateStatus = (status: string) => {
    switch(status) {
      case 'ALL': return 'ทั้งหมด';
      case JobStatus.OPEN: return 'เปิดรับสมัคร';
      case JobStatus.CLOSED: return 'ปิดรับสมัคร';
      case JobStatus.ARCHIVED: return 'เก็บถาวร';
      default: return status;
    }
  };

  if (!user) return <LoginForm onLogin={handleLogin} />;

  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Internal Job Board <span className="text-indigo-600 font-normal">ระบบประกาศรับสมัครงานภายใน</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleViewMode}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors hidden sm:block"
              >
                สลับเป็น {isAdmin ? 'มุมมองพนักงาน' : 'มุมมองผู้ดูแล'}
              </button>
              
              {isAdmin && (
                <button
                  onClick={() => { setEditingJob(undefined); setIsModalOpen(true); }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  ลงประกาศงานใหม่
                </button>
              )}

              <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 p-2" title="ออกจากระบบ">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs / Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
               {['ALL', ...Object.values(JobStatus)].map((tab) => {
                if (!isAdmin && tab !== 'ALL' && tab !== JobStatus.OPEN) return null;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {translateStatus(tab)}
                  </button>
                )
               })}
            </div>
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={isAdmin ? (job) => { setEditingJob(job); setIsModalOpen(true); } : undefined as any}
                onDelete={isAdmin ? handleDelete : undefined as any}
                onArchive={isAdmin ? handleArchive : undefined as any}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-slate-500 text-sm">
          <p>CareerHub ระบบประกาศงานภายใน</p>
          {isAdmin && (
            <button 
              onClick={() => setIsDbExplorerOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              จัดการฐานข้อมูล
            </button>
          )}
        </div>
      </footer>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingJob ? 'แก้ไขประกาศงาน' : 'ลงประกาศงานใหม่'}</h3>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <JobForm initialData={editingJob} onSubmit={handleCreateOrUpdate} onCancel={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* DB Explorer */}
      {isDbExplorerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setIsDbExplorerOpen(false)}></div>
          <div className="bg-white rounded-xl w-full max-w-4xl h-[70vh] z-10 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">จัดการฐานข้อมูล</h3>
              <button onClick={handleResetDb} className="text-red-600 text-sm">รีเซ็ตข้อมูล</button>
            </div>
            <div className="flex-grow p-4 overflow-auto bg-slate-900 text-green-400 font-mono text-xs">
              <pre>{JSON.stringify(jobs, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
