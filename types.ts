
export enum JobStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  INTERN = 'Intern'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  salaryRange?: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
}

export type JobInput = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;
