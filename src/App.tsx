import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Clock3,
  X,
  User as UserIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'ADMIN' | 'EMPLOYEE';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  category: string;
  location: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  _count?: { applications: number };
}

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
  reason?: string;
  resumeUrl?: string;
  createdAt: string;
  job: Job;
  user: User;
}

// --- Components ---

const Sidebar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = useLocation();
  
  const menuItems = user.role === 'ADMIN' ? [
    { icon: LayoutDashboard, label: 'ภาพรวม', path: '/admin' },
    { icon: Briefcase, label: 'ตำแหน่งงาน', path: '/admin/jobs' },
    { icon: FileText, label: 'จัดการใบสมัคร', path: '/admin/applications' },
    { icon: Settings, label: 'ตั้งค่า', path: '/settings' },
  ] : [
    { icon: Briefcase, label: 'ค้นหางาน', path: '/jobs' },
    { icon: FileText, label: 'ใบสมัครของฉัน', path: '/my-applications' },
    { icon: Settings, label: 'ตั้งค่า', path: '/settings' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Briefcase size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">JobBoard</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary-light text-primary font-semibold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
          <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-primary-light rounded-2xl text-primary">
        <Icon size={24} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

// --- Pages ---

const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isRegister ? '/api/register' : '/api/login';
    const body = isRegister ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    await fetch('/api/seed', { method: 'POST' });
    alert('สร้างข้อมูลตัวอย่างเรียบร้อยแล้ว');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6">
            <Briefcase size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isRegister ? 'สมัครสมาชิก' : 'Internal Job Board'}
          </h1>
          <p className="text-slate-500">
            {isRegister ? 'สร้างบัญชีใหม่เพื่อเริ่มใช้งาน' : 'ลงชื่อเข้าใช้งานระบบรับสมัครงานภายใน'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="สมชาย ใจดี"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ตำแหน่ง</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="EMPLOYEE">พนักงาน (Employee)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">อีเมลพนักงาน</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่าน</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : (isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-bold text-primary hover:underline"
          >
            {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
          </button>
        </div>

        {!isRegister && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
            <p className="text-center text-sm text-slate-500">บัญชีทดสอบ:</p>
            <div className="flex gap-2">
              <button onClick={() => { setEmail('admin@company.com'); setPassword('password'); }} className="flex-1 py-2 text-xs font-medium text-primary bg-primary-light rounded-xl hover:bg-primary/20 transition-colors">Admin</button>
              <button onClick={() => { setEmail('employee@company.com'); setPassword('password'); }} className="flex-1 py-2 text-xs font-medium text-primary bg-primary-light rounded-xl hover:bg-primary/20 transition-colors">Employee</button>
            </div>
            <button onClick={seedData} className="text-xs text-slate-400 hover:text-primary underline">กดที่นี่เพื่อสร้างข้อมูลตัวอย่างครั้งแรก</button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl">
        <h2 className="text-lg font-bold mb-2">เกิดข้อผิดพลาดในการดึงข้อมูล</h2>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    </div>
  );

  if (!stats) return <div className="p-8">กำลังโหลด...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ภาพรวมระบบ</h1>
          <p className="text-slate-500">สรุปข้อมูลการรับสมัครงานล่าสุด</p>
        </div>
        <Link to="/admin/jobs" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
          <Plus size={20} />
          <span>สร้างตำแหน่งใหม่</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="ตำแหน่งงานที่เปิดรับ" value={stats.openJobs} icon={Briefcase} trend="+2 ในเดือนนี้" />
        <StatCard title="จำนวนผู้สมัครทั้งหมด" value={stats.totalApplications} icon={UserIcon} trend="+12% จากสัปดาห์ก่อน" />
        <StatCard title="อัตราการตอบรับ" value="15%" icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6">ใบสมัครแยกตามแผนก</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#6d28d9" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6">สถานะใบสมัครทั้งหมด</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statusChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminJobCard: React.FC<{ job: Job; onEdit: () => void; onDelete: () => void }> = ({ job, onEdit, onDelete }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-primary-light rounded-2xl text-primary">
        <Building2 size={24} />
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={cn(
          "text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider border",
          job.status === 'OPEN' ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-400 bg-slate-50 border-slate-100"
        )}>
          {job.status}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          {job.type} • {job.location}
        </span>
      </div>
    </div>
    
    <div className="flex-1">
      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{job.department} • {job.category}</p>
      
      <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed">
        {job.description}
      </p>
    </div>

    <div className="flex gap-3 mt-auto">
      <button 
        onClick={onEdit}
        className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-2"
      >
        <Settings size={18} />
        แก้ไข
      </button>
      <button 
        onClick={onDelete}
        className="px-4 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100"
      >
        <XCircle size={18} />
      </button>
    </div>
  </div>
);

const AdminJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = () => {
    const deptQuery = selectedDept !== 'All' ? `&department=${selectedDept}` : '';
    const typeQuery = selectedType !== 'All' ? `&type=${selectedType}` : '';
    fetch(`/api/jobs?search=${search}${deptQuery}${typeQuery}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch jobs');
        }
      })
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingJob?.id ? 'PUT' : 'POST';
    const url = editingJob?.id ? `/api/jobs/${editingJob.id}` : '/api/jobs';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingJob)
    });
    setShowModal(false);
    fetchJobs();
  };

  const deleteJob = async (id: string) => {
    if (confirm('ยืนยันการลบตำแหน่งงานนี้?')) {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    }
  };

  const departments = ['All', ...Array.from(new Set(jobs.map(j => j.department)))].sort();
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

  const groupedJobsByDept: Record<string, Job[]> = {};
  jobs.forEach(job => {
    const dept = job.department || 'Other';
    if (!groupedJobsByDept[dept]) {
      groupedJobsByDept[dept] = [];
    }
    groupedJobsByDept[dept].push(job);
  });

  const activeDepts = Object.keys(groupedJobsByDept).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">จัดการตำแหน่งงาน</h1>
            <p className="text-slate-500">{jobs.length} ตำแหน่งทั้งหมดในระบบ</p>
          </div>
          <button 
            onClick={() => { setEditingJob({ title: '', department: 'Engineering', category: 'Technology', location: 'Bangkok, TH', type: 'Full-time', description: '', status: 'OPEN' }); setShowModal(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
          >
            <Plus size={20} />
            <span>สร้างตำแหน่งใหม่</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาตำแหน่งงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              {jobTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    selectedType === type 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {type === 'All' ? 'ทุกประเภท' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">แผนก:</span>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                selectedDept === dept 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
              )}
            >
              {dept === 'All' ? 'ทั้งหมด' : dept}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-16">
        {activeDepts.map((dept) => (
          <div key={dept} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{dept}</h2>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {groupedJobsByDept[dept].length} ตำแหน่ง
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedJobsByDept[dept].map((job: Job) => (
                <AdminJobCard 
                  key={job.id} 
                  job={job} 
                  onEdit={() => { setEditingJob(job); setShowModal(true); }} 
                  onDelete={() => deleteJob(job.id)} 
                />
              ))}
            </div>
          </div>
        ))}

        {activeDepts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ไม่พบตำแหน่งงาน</h3>
            <p className="text-slate-400 max-w-xs mx-auto">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">{editingJob?.id ? 'แก้ไขตำแหน่งงาน' : 'สร้างตำแหน่งงานใหม่'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อตำแหน่ง</label>
                  <input 
                    type="text" 
                    value={editingJob?.title}
                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">แผนก</label>
                  <select 
                    value={editingJob?.department}
                    onChange={(e) => setEditingJob({...editingJob, department: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>HR</option>
                    <option>Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">หมวดหมู่</label>
                  <select 
                    value={editingJob?.category}
                    onChange={(e) => setEditingJob({...editingJob, category: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option>Technology</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Human Resources</option>
                    <option>Data Science</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภทงาน</label>
                  <select 
                    value={editingJob?.type}
                    onChange={(e) => setEditingJob({...editingJob, type: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">สถานะ</label>
                  <select 
                    value={editingJob?.status}
                    onChange={(e) => setEditingJob({...editingJob, status: e.target.value as 'OPEN' | 'CLOSED'})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="OPEN">เปิดรับสมัคร (OPEN)</option>
                    <option value="CLOSED">ปิดรับสมัคร (CLOSED)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">รายละเอียดงาน</label>
                  <textarea 
                    value={editingJob?.description}
                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                    rows={4}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const JobCard: React.FC<{ job: Job; onApply: () => void; onView: () => void }> = ({ job, onApply, onView }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-primary-light rounded-2xl text-primary">
        <Building2 size={24} />
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-emerald-100">
          {job.type}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          {job.location}
        </span>
      </div>
    </div>
    
    <div className="flex-1">
      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{job.department}</p>
      
      <p className="text-slate-500 text-sm line-clamp-3 mb-8 leading-relaxed">
        {job.description}
      </p>
    </div>

    <div className="flex flex-col gap-3 mt-auto">
      <button 
        onClick={onView}
        className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
      >
        ดูรายละเอียด
      </button>
      <button 
        onClick={onApply}
        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/10"
      >
        สมัครงานนี้
      </button>
    </div>
  </div>
);

const CandidatePortal = ({ user }: { user: User }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const deptQuery = selectedDept !== 'All' ? `&department=${selectedDept}` : '';
      const typeQuery = selectedType !== 'All' ? `&type=${selectedType}` : '';
      const [jobsRes, appsRes] = await Promise.all([
        fetch(`/api/jobs?status=OPEN&search=${search}${deptQuery}${typeQuery}`),
        fetch(`/api/applications?userId=${user.id}`)
      ]);
      const jobsData = await jobsRes.json();
      const appsData = await appsRes.json();
      
      if (Array.isArray(jobsData)) setJobs(jobsData);
      else console.error('Jobs data is not an array:', jobsData);

      if (Array.isArray(appsData)) setUserApplications(appsData);
      else console.error('Applications data is not an array:', appsData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedType]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('กรุณาอัปโหลด Resume');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload file');
      
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: applyingJob?.id, userId: user.id, resumeUrl: uploadData.url })
      });

      if (res.ok) {
        alert('ส่งใบสมัครเรียบร้อยแล้ว!');
        setApplyingJob(null);
        setFile(null);
        fetchData(); // Refresh to hide applied job
      } else {
        const appData = await res.json();
        alert(appData.error || 'เกิดข้อผิดพลาดในการส่งใบสมัคร');
      }
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการส่งใบสมัคร');
    } finally {
      setUploading(false);
    }
  };

  // Filter out jobs that the user has already applied for
  const appliedJobIds = new Set(userApplications.map(app => app.jobId));
  const availableJobs = jobs.filter(job => !appliedJobIds.has(job.id));
  
  // Get unique departments for filtering
  const departments = ['All', ...Array.from(new Set(availableJobs.map(j => j.department)))].sort();
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

  // Group jobs by department
  const groupedJobsByDept: Record<string, Job[]> = {};
  availableJobs.forEach(job => {
    const dept = job.department || 'Other';
    if (!groupedJobsByDept[dept]) {
      groupedJobsByDept[dept] = [];
    }
    groupedJobsByDept[dept].push(job);
  });

  const activeDepts = Object.keys(groupedJobsByDept).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาตำแหน่งงานหรือรายละเอียด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              {jobTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    selectedType === type 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {type === 'All' ? 'ทุกประเภท' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">แผนก:</span>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                selectedDept === dept 
                  ? "bg-primary/10 text-primary border-primary/20" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
              )}
            >
              {dept === 'All' ? 'ทั้งหมด' : dept}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-16">
        {activeDepts.map((dept) => (
          <div key={dept} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{dept}</h2>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {groupedJobsByDept[dept].length} ตำแหน่ง
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groupedJobsByDept[dept].map((job: Job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onApply={() => setApplyingJob(job)} 
                  onView={() => setViewingJob(job)}
                />
              ))}
            </div>
          </div>
        ))}

        {activeDepts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ไม่พบตำแหน่งงานที่ค้นหา</h3>
            <p className="text-slate-400 max-w-xs mx-auto">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองแผนกและประเภทงานใหม่อีกครั้ง</p>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {viewingJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-10 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{viewingJob.title}</h2>
                    <p className="text-slate-500 font-medium">{viewingJob.department} • {viewingJob.location}</p>
                  </div>
                </div>
                <button onClick={() => setViewingJob(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-100">
                  {viewingJob.type}
                </span>
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider border border-blue-100">
                  {viewingJob.location}
                </span>
                <span className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-100">
                  โพสต์เมื่อ {format(new Date(viewingJob.createdAt), 'dd MMM yyyy')}
                </span>
              </div>

              <div className="prose prose-slate max-w-none">
                <h4 className="text-lg font-bold text-slate-900 mb-4">รายละเอียดงาน</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {viewingJob.description}
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setViewingJob(null)} 
                className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                ปิดหน้าต่าง
              </button>
              <button 
                onClick={() => { setApplyingJob(viewingJob); setViewingJob(null); }}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all"
              >
                สมัครงานนี้เลย
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {applyingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary mb-6">
                <FileText size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">สมัครตำแหน่ง {applyingJob.title}</h2>
              <p className="text-slate-500">กรุณาตรวจสอบข้อมูลก่อนกดยืนยัน</p>
            </div>
            <form onSubmit={handleApply} className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 relative">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="text-slate-400" />
                <p className="text-sm font-medium text-slate-500">
                  {file ? file.name : 'อัปโหลด Resume (PDF)'}
                </p>
                <p className="text-[10px] text-slate-400">ขนาดไฟล์ไม่เกิน 5MB</p>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setApplyingJob(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {uploading ? 'กำลังอัปโหลด...' : 'ยืนยันการสมัคร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


const MyApplications = ({ user }: { user: User }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/applications?userId=${user.id}`).then(res => res.json()).then(setApps);
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'APPLIED': return <Clock3 className="text-blue-500" size={18} />;
      case 'INTERVIEWING': return <Clock3 className="text-amber-500" size={18} />;
      case 'OFFERED': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'REJECTED': return <XCircle className="text-red-500" size={18} />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ใบสมัครของฉัน</h1>
        <p className="text-slate-500">ติดตามสถานะการสมัครงานทั้งหมดของคุณ</p>
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <div key={app.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
                <Building2 size={28} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-slate-900">{app.job.title}</h3>
                <p className="text-sm text-slate-500">{app.job.department} • {app.job.location}</p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-1">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider",
                  app.status === 'APPLIED' && "bg-blue-50 text-blue-600",
                  app.status === 'INTERVIEWING' && "bg-amber-50 text-amber-600",
                  app.status === 'OFFERED' && "bg-emerald-50 text-emerald-600",
                  app.status === 'REJECTED' && "bg-red-50 text-red-600",
                )}>
                  {getStatusIcon(app.status)}
                  <span>{app.status}</span>
                </div>
                <p className="text-[10px] text-slate-400">สมัครเมื่อ {format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
              </div>
              <div className="md:pl-6 md:border-l border-slate-100">
                <button 
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className={cn(
                    "p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all",
                    expandedId === app.id && "rotate-90 text-primary bg-slate-50"
                  )}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {expandedId === app.id && (
              <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3">รายละเอียดงาน</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{app.job.description}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">สถานะและเหตุผล</h4>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-700">
                          {app.status === 'APPLIED' && "ใบสมัครของคุณถูกส่งเข้าสู่ระบบแล้ว กำลังรอฝ่ายบุคคลตรวจสอบ"}
                          {app.status === 'INTERVIEWING' && "คุณได้รับเลือกให้เข้าสู่ขั้นตอนการสัมภาษณ์ โปรดรอการติดต่อกลับ"}
                          {app.status === 'OFFERED' && "ยินดีด้วย! คุณได้รับข้อเสนอเข้าทำงาน"}
                          {app.status === 'REJECTED' && `ขอแสดงความเสียใจ ใบสมัครของคุณไม่ผ่านการพิจารณา ${app.reason ? `(เหตุผล: ${app.reason})` : ''}`}
                        </p>
                      </div>
                    </div>
                    {app.resumeUrl && (
                      <a 
                        href={app.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                      >
                        <FileText size={16} />
                        <span>ดู Resume ที่ส่งไป</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {apps.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">คุณยังไม่มีประวัติการสมัครงาน</p>
            <Link to="/jobs" className="text-primary font-bold mt-2 inline-block hover:underline">ไปที่หน้าค้นหางาน</Link>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminApplications = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingApp, setUpdatingApp] = useState<{ id: string, status: string } | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchApps = () => {
    setLoading(true);
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApps(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch applications');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingApp) return;

    const res = await fetch(`/api/applications/${updatingApp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatingApp.status, reason })
    });

    if (res.ok) {
      setUpdatingApp(null);
      setReason('');
      fetchApps();
    } else {
      const data = await res.json();
      alert(data.error || 'เกิดข้อผิดพลาด');
    }
  };

  const STATUS_FLOW: Record<string, string[]> = {
    "APPLIED": ["INTERVIEWING", "REJECTED"],
    "INTERVIEWING": ["OFFERED", "REJECTED"],
    "OFFERED": [],
    "REJECTED": [],
  };

  if (error) return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl">
        <h2 className="text-lg font-bold mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    </div>
  );

  if (loading) return <div className="p-8">กำลังโหลดใบสมัคร...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">จัดการใบสมัคร</h1>
        <p className="text-slate-500">ตรวจสอบและอัปเดตสถานะผู้สมัครทั้งหมด</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">ผู้สมัคร</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">ตำแหน่งงาน</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Resume</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะปัจจุบัน</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {apps.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                      {app.user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{app.user.name}</p>
                      <p className="text-xs text-slate-400">{app.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm text-slate-600 font-medium">{app.job.title}</p>
                  <p className="text-[10px] text-slate-400">สมัครเมื่อ {format(new Date(app.createdAt), 'dd/MM/yyyy')}</p>
                </td>
                <td className="px-8 py-6 text-sm text-slate-500">
                  {app.resumeUrl ? (
                    <a 
                      href={app.resumeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText size={14} />
                      <span>ดูไฟล์</span>
                    </a>
                  ) : (
                    <span className="text-slate-300">ไม่มีไฟล์</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase inline-block w-fit",
                      app.status === 'APPLIED' && "bg-blue-50 text-blue-600",
                      app.status === 'INTERVIEWING' && "bg-amber-50 text-amber-600",
                      app.status === 'OFFERED' && "bg-emerald-50 text-emerald-600",
                      app.status === 'REJECTED' && "bg-red-50 text-red-600",
                    )}>
                      {app.status}
                    </span>
                    {app.reason && <p className="text-[10px] text-slate-400 italic">เหตุผล: {app.reason}</p>}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    {(STATUS_FLOW[app.status] || []).map(nextStatus => (
                      <button 
                        key={nextStatus}
                        onClick={() => setUpdatingApp({ id: app.id, status: nextStatus })}
                        className={cn(
                          "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
                          nextStatus === 'REJECTED' ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-primary bg-primary-light hover:bg-primary/20"
                        )}
                      >
                        {nextStatus}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {apps.length === 0 && (
          <div className="p-20 text-center text-slate-400">ยังไม่มีใบสมัครในระบบ</div>
        )}
      </div>

      {updatingApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">ยืนยันการเปลี่ยนสถานะ</h2>
            <p className="text-slate-500 mb-6">เปลี่ยนสถานะเป็น <span className="font-bold text-primary">{updatingApp.status}</span></p>
            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ระบุเหตุผล (ถ้ามี)</label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="เช่น ขาดทักษะบางประการ หรือ ผ่านการสัมภาษณ์รอบแรก"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setUpdatingApp(null); setReason(''); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all">ยืนยัน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = ({ user, onUpdate }: { user: User; onUpdate: (user: User) => void }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
        setMessage('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
      } else {
        setMessage('เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (err) {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ตั้งค่าโปรไฟล์</h1>
        <p className="text-slate-500">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary/20 mb-4">
            {user.name[0]}
          </div>
          <p className="text-slate-400 text-sm">{user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">อีเมล</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              required
            />
          </div>
          {message && (
            <p className={cn(
              "text-sm font-medium p-4 rounded-xl",
              message.includes('เรียบร้อย') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {message}
            </p>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="pl-64 min-h-screen">
          <Routes>
            {user.role === 'ADMIN' ? (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/jobs" element={<AdminJobs />} />
                <Route path="/admin/applications" element={<AdminApplications />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </>
            ) : (
              <>
                <Route path="/jobs" element={<CandidatePortal user={user} />} />
                <Route path="/my-applications" element={<MyApplications user={user} />} />
                <Route path="*" element={<Navigate to="/jobs" />} />
              </>
            )}
            <Route path="/settings" element={<SettingsPage user={user} onUpdate={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
