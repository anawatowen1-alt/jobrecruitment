import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role || "EMPLOYEE"
      }
    });

    res.json(user);

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
}