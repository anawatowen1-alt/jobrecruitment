
import { Job, JobStatus, JobType } from '../types';

const STORAGE_KEY = 'careerhub_internal_jobs';

const SEED_DATA: Job[] = [
  {
    id: 'job-001',
    title: 'Senior Frontend Developer (React)',
    department: 'Software Engineering',
    location: 'Bangkok Headquarter',
    type: JobType.FULL_TIME,
    description: 'เรารับสมัครผู้เชี่ยวชาญด้าน React เพื่อร่วมทีมพัฒนา Internal Tools ให้มีประสิทธิภาพสูงสุด...',
    requirements: ['React 18+', 'TypeScript Proficiency', 'State Management (Zustand/Redux)'],
    salaryRange: '80,000 - 120,000 THB',
    status: JobStatus.OPEN,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'job-002',
    title: 'UX/UI Designer',
    department: 'Design & Product',
    location: 'Remote / Flexible',
    type: JobType.FULL_TIME,
    description: 'ร่วมงานกับเราในการออกแบบประสบการณ์ผู้ใช้ที่ยอดเยี่ยมสำหรับพนักงานในองค์กร...',
    requirements: ['Figma Expert', 'User Research experience', 'Design System creation'],
    salaryRange: '60,000 - 90,000 THB',
    status: JobStatus.OPEN,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dbService = {
  getJobs: async (): Promise<Job[]> => {
    await delay(600);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(stored);
  },

  getJobById: async (id: string): Promise<Job | undefined> => {
    const jobs = await dbService.getJobs();
    return jobs.find(j => j.id === id);
  },

  createJob: async (input: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
    await delay(800);
    const jobs = await dbService.getJobs();
    const newJob: Job = {
      ...input,
      id: `JOB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedJobs = [newJob, ...jobs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
    return newJob;
  },

  updateJob: async (id: string, updates: Partial<Job>): Promise<Job> => {
    await delay(700);
    const jobs = await dbService.getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index === -1) throw new Error('ไม่พบข้อมูลงานที่ระบุ');

    const updatedJob = { ...jobs[index], ...updates, updatedAt: Date.now() };
    jobs[index] = updatedJob;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return updatedJob;
  },

  deleteJob: async (id: string): Promise<void> => {
    await delay(500);
    const jobs = await dbService.getJobs();
    const updatedJobs = jobs.filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs));
  },

  archiveJob: async (id: string): Promise<Job> => {
    return dbService.updateJob(id, { status: JobStatus.ARCHIVED });
  }
};
