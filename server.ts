import express from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Prisma Lazy Initialization ---
let prismaClient: PrismaClient | null = null;

function getPrisma() {
  if (!prismaClient) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error("DATABASE_URL is missing. Please set your connection string (PostgreSQL or SQLite) in your environment variables.");
    }
    
    // Allow both PostgreSQL and SQLite
    const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
    const isSqlite = url.startsWith("file:");
    
    if (!isPostgres && !isSqlite) {
      throw new Error(`DATABASE_URL is invalid. It must start with 'postgresql://', 'postgres://', or 'file:'. Current value starts with: ${url.substring(0, 15)}...`);
    }
    
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

const app = express();
const PORT = 3000;

// --- File Upload Setup ---
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ใช้ uploadDir (Absolute Path) แทนการใช้ string สั้นๆ เพื่อความชัวร์บน Windows
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"); // ลบช่องว่างในชื่อไฟล์ออก
    console.log("Saving file as:", fileName);
    cb(null, fileName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // ขยายขีดจำกัดเป็น 10MB ชั่วคราวเพื่อทดสอบ
});

app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// --- API Routes ---

// File Upload Endpoint
app.post("/api/upload", (req, res, next) => {
  console.log("Receive upload request...");
  upload.single("resume")(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("File uploaded successfully:", req.file.filename);
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

// Auth Mock (For demo purposes, we'll use simple header-based auth or just return a user)
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await getPrisma().user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

    const user = await getPrisma().user.create({
      data: { name, email, password, role: role || "EMPLOYEE" }
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getPrisma().user.findUnique({ where: { email } });
    if (user && user.password === password) {
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const { status, department, type, search } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (department) where.department = department;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }
    const jobs = await getPrisma().job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } }
    });
    res.json(jobs);
  } catch (error: any) {
    console.error("Fetch jobs error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const job = await getPrisma().job.create({ data: req.body });
    res.json(job);
  } catch (error: any) {
    console.error("Create job error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/jobs/:id", async (req, res) => {
  try {
    const job = await getPrisma().job.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(job);
  } catch (error: any) {
    console.error("Update job error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    await getPrisma().job.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete job error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Applications
app.get("/api/applications", async (req, res) => {
  try {
    const { userId, jobId } = req.query;
    const where: any = {};
    if (userId) where.userId = String(userId);
    if (jobId) where.jobId = String(jobId);
    
    const applications = await getPrisma().application.findMany({
      where,
      include: { job: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (error: any) {
    console.error("Fetch applications error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/applications", async (req, res) => {
  try {
    const { jobId, userId, resumeUrl } = req.body;
    
    // ตรวจสอบว่าเคยสมัครไปแล้วหรือยัง (ตามคำขอ: ไม่ควรมีซ้ำ)
    const existing = await getPrisma().application.findUnique({
      where: {
        jobId_userId: { jobId, userId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: "คุณได้สมัครตำแหน่งนี้ไปแล้ว" });
    }

    const application = await getPrisma().application.create({
      data: {
        jobId,
        userId,
        resumeUrl,
        status: "APPLIED",
      },
    });
    
    res.json(application);
  } catch (error: any) {
    console.error("Create application error:", error);
    res.status(500).json({ error: error.message });
  }
});

const STATUS_FLOW: Record<string, string[]> = {
  "APPLIED": ["INTERVIEWING", "REJECTED"],
  "INTERVIEWING": ["OFFERED", "REJECTED"],
  "OFFERED": [],
  "REJECTED": [],
};

app.patch("/api/applications/:id", async (req, res) => {
  try {
    const { status, reason } = req.body;
    const current = await getPrisma().application.findUnique({ where: { id: req.params.id } });
    
    if (!current) return res.status(404).json({ error: "ไม่พบใบสมัคร" });

    // ตรวจสอบ Flow (ห้ามย้อนกลับ)
    const allowed = STATUS_FLOW[current.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `ไม่สามารถเปลี่ยนสถานะจาก ${current.status} เป็น ${status} ได้` });
    }

    const application = await getPrisma().application.update({
      where: { id: req.params.id },
      data: { status, reason },
    });
    res.json(application);
  } catch (error: any) {
    console.error("Update application error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stats for Dashboard
app.get("/api/stats", async (req, res) => {
  try {
    const openJobs = await getPrisma().job.count({ where: { status: "OPEN" } });
    const totalApplications = await getPrisma().application.count();
    const recentApplications = await getPrisma().application.findMany({
      take: 5,
      include: { job: true, user: true },
      orderBy: { createdAt: "desc" }
    });
    
    // กราฟที่มีประโยชน์กว่าเดิม: จำนวนใบสมัครแยกตามสถานะ
    const statusStats = await getPrisma().application.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // กราฟที่มีประโยชน์กว่าเดิม: จำนวนใบสมัครแยกตามแผนก
    const deptStats = await getPrisma().job.findMany({
      select: {
        department: true,
        _count: { select: { applications: true } }
      }
    });

    // รวมข้อมูลแผนก (เพราะ groupBy อาจจะซ้ำถ้ามีหลายงานในแผนกเดียวกัน)
    const deptMap: Record<string, number> = {};
    deptStats.forEach(d => {
      deptMap[d.department] = (deptMap[d.department] || 0) + d._count.applications;
    });

    const chartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
    const statusChartData = statusStats.map(s => ({ name: s.status, value: s._count.id }));

    res.json({ 
      openJobs, 
      totalApplications, 
      recentApplications, 
      chartData, 
      statusChartData 
    });
  } catch (error: any) {
    console.error("Fetch stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Seed Data Route (for demo)
app.post("/api/seed", async (req, res) => {
  try {
    const userCount = await getPrisma().user.count();
    if (userCount > 0) return res.json({ message: "Already seeded" });

    await getPrisma().user.createMany({
      data: [
        { email: "admin@company.com", password: "password", name: "HR Admin", role: "ADMIN" },
        { email: "employee@company.com", password: "password", name: "John Doe", role: "EMPLOYEE" },
      ]
    });

    await getPrisma().job.createMany({
      data: [
        { title: "Senior Frontend Developer", department: "Engineering", category: "Technology", location: "Bangkok, TH", type: "Full-time", description: "Build amazing UIs with React." },
        { title: "UX/UI Designer", department: "Design", category: "Design", location: "Remote", type: "Full-time", description: "Design the future of our products." },
        { title: "Data Analyst", department: "Marketing", category: "Data Science", location: "Chiang Mai, TH", type: "Full-time", description: "Analyze market trends." },
        { title: "HR Business Partner", department: "HR", category: "Human Resources", location: "Bangkok, TH", type: "Full-time", description: "Support our growing team." },
      ]
    });

    res.json({ message: "Seeded successfully" });
  } catch (error: any) {
    console.error("Seed error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Users
app.patch("/api/users/:id", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await getPrisma().user.update({
      where: { id: req.params.id },
      data: { name, email },
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Global Error Handler (Catch Multer and other errors)
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    return res.status(400).json({ error: `ไฟล์มีปัญหา: ${err.message}` });
  }
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
});

// --- Vite Middleware & Static Files ---
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  // API routes are already registered above, so this catch-all will handle the frontend
  app.get("*", (req, res, next) => {
    // If it's an API request that didn't match any route, don't send index.html
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // In development, we use Vite middleware
  async function setupDevServer() {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  setupDevServer();
}

export default app;
