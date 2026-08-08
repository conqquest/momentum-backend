import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ───
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Momentum Backend is running!' });
});

// ─── Auth Middleware ───
// Verifies the Firebase ID token sent from the frontend.
// For now we accept the UID directly in the Authorization header.
// In production, uncomment the firebase-admin verification block.
interface AuthRequest extends Request {
  uid?: string;
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  // TODO: Replace with real Firebase Admin verification:
  // import admin from 'firebase-admin';
  // const decoded = await admin.auth().verifyIdToken(token);
  // req.uid = decoded.uid;

  req.uid = token; // For now, treat the token as the UID
  next();
};

// ─── User Routes ───

// POST /api/user/sync — Create or update user on login
app.post('/api/user/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { email, displayName, gender, themeColor, weight, height, age } = req.body;
    const user = await prisma.user.upsert({
      where: { firebaseUid: req.uid! },
      update: { email, displayName, gender, themeColor, weight, height, age },
      create: { firebaseUid: req.uid!, email, displayName, gender, themeColor, weight, height, age },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// GET /api/user — Fetch full user profile + habits
app.get('/api/user', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.uid! },
      include: { habits: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── Habit Routes ───

// POST /api/habits — Create a new habit
app.post('/api/habits', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid! } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { name, category } = req.body;
    const habit = await prisma.habit.create({
      data: { name, category, userId: user.id },
    });
    res.status(201).json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// DELETE /api/habits/:id — Delete a habit
app.delete('/api/habits/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.habit.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// ─── Daily Log Routes ───

// POST /api/logs/daily — Save or update a day's log
app.post('/api/logs/daily', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid! } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { date, morningReflect, eveningReflect, momentText, moodDetail, protein, carbs, fats, iron, steps, habitsChecked } = req.body;

    const log = await prisma.dailyLog.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: { morningReflect, eveningReflect, momentText, moodDetail, protein, carbs, fats, iron, steps, habitsChecked: habitsChecked ? JSON.stringify(habitsChecked) : undefined },
      create: { userId: user.id, date, morningReflect, eveningReflect, momentText, moodDetail, protein: protein || 0, carbs: carbs || 0, fats: fats || 0, iron: iron || 0, steps: steps || 0, habitsChecked: habitsChecked ? JSON.stringify(habitsChecked) : '[]' },
    });
    res.json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save daily log' });
  }
});

// GET /api/logs/history — Fetch all historical logs
app.get('/api/logs/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid! } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const logs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/logs/:date — Fetch a single day's log
app.get('/api/logs/:date', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid! } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const log = await prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: req.params.date as string } },
    });
    res.json(log || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`🚀 Momentum Backend running on port ${PORT}`);
});
