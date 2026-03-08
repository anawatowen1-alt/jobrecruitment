import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  try {
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data cleared.');
  } catch (error: any) {
    console.log('Note: Could not clear existing data. This is normal if the database is fresh.');
    if (error.code !== 'P2021') {
      console.error('Unexpected error during clear:', error.message);
    }
  }

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: 'password',
      name: 'HR Admin',
      role: 'ADMIN',
    },
  });

  // Create Employee
  const employee = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      password: 'password',
      name: 'John Doe',
      role: 'EMPLOYEE',
    },
  });

  // Create Jobs
  const jobs = await prisma.job.createMany({
    data: [
      {
        title: 'Senior Frontend Developer',
        department: 'Engineering',
        location: 'Bangkok, TH',
        type: 'Full-time',
        description: 'We are looking for a Senior Frontend Developer to join our team. You will be responsible for building high-quality user interfaces using React and Tailwind CSS.',
        status: 'OPEN',
      },
      {
        title: 'UX/UI Designer',
        department: 'Design',
        location: 'Remote',
        type: 'Full-time',
        description: 'Join our design team to create beautiful and intuitive user experiences. You will work closely with product managers and engineers to bring ideas to life.',
        status: 'OPEN',
      },
      {
        title: 'Data Analyst',
        department: 'Marketing',
        location: 'Chiang Mai, TH',
        type: 'Full-time',
        description: 'Analyze market trends and customer behavior to help our marketing team make data-driven decisions.',
        status: 'OPEN',
      },
      {
        title: 'HR Business Partner',
        department: 'HR',
        location: 'Bangkok, TH',
        type: 'Full-time',
        description: 'Support our growing team by managing recruitment, employee relations, and performance management.',
        status: 'OPEN',
      },
      {
        title: 'Backend Engineer (Node.js)',
        department: 'Engineering',
        location: 'Remote',
        type: 'Contract',
        description: 'Build scalable backend services using Node.js and Prisma. Experience with MySQL is a plus.',
        status: 'OPEN',
      },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
