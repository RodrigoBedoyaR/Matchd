import { createHash, randomBytes } from "node:crypto";
import { Router, type Response } from "express";
import {
  ChangeEmailSchema,
  ChangePasswordSchema,
  DEMO_BUSINESS_EMAIL,
  DEMO_WORKER_EMAIL,
  DeleteAccountSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from "@matchd/shared";
import { prisma } from "../lib/db.js";
import { hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeBusiness, serializeWorkerSelf } from "../lib/serialize.js";

export const authRouter = Router();

async function loadProfile(userId: string, role: "WORKER" | "BUSINESS") {
  if (role === "WORKER") {
    const worker = await prisma.workerProfile.findUnique({ where: { userId } });
    return { worker: worker ? serializeWorkerSelf(worker) : null, business: null };
  }
  const business = await prisma.business.findUnique({ where: { userId } });
  return { worker: null, business: business ? serializeBusiness(business) : null };
}

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with that email already exists" });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, role } });
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

async function demoLogin(email: string, role: "WORKER" | "BUSINESS") {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Demo account ${email} is missing — run the seed script`);
  return { token: signToken({ userId: user.id, role: user.role }), user };
}

authRouter.post("/demo/worker", async (_req, res) => {
  const { token, user } = await demoLogin(DEMO_WORKER_EMAIL, "WORKER");
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.post("/demo/business", async (_req, res) => {
  const { token, user } = await demoLogin(DEMO_BUSINESS_EMAIL, "BUSINESS");
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const profile = await loadProfile(user.id, user.role);
  res.json({ user: { id: user.id, email: user.email, role: user.role }, ...profile });
});

/* ---------------------------- password reset ------------------------------ */

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const APP_URL = process.env.APP_URL ?? "http://localhost:3200";

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Always answers 200 so the endpoint can't be used to probe which emails exist.
// There is no mail provider yet: the link is logged, and outside production it
// is also returned as `devResetUrl` so the prototype flow can be clicked through.
authRouter.post("/forgot-password", async (req, res) => {
  const parsed = ForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return res.json({ ok: true });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  console.log(`[auth] password reset link for ${user.email}: ${resetUrl}`);

  res.json(process.env.NODE_ENV === "production" ? { ok: true } : { ok: true, devResetUrl: resetUrl });
});

authRouter.post("/reset-password", async (req, res) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(parsed.data.token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired" });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  const token = signToken({ userId: record.user.id, role: record.user.role });
  res.json({ token, user: { id: record.user.id, email: record.user.email, role: record.user.role } });
});

/* -------------------------------- account --------------------------------- */

const DEMO_EMAILS = [DEMO_WORKER_EMAIL, DEMO_BUSINESS_EMAIL];

// Loads the caller and checks their password; answers the error itself and
// returns null on failure. Demo accounts are shared, so they can't be changed.
async function loadVerifiedUser(userId: string, password: string, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  if (DEMO_EMAILS.includes(user.email)) {
    res.status(403).json({ error: "Demo accounts can't be changed" });
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Your current password is incorrect" });
    return null;
  }
  return user;
}

authRouter.patch("/account/password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await loadVerifiedUser(req.auth!.userId, parsed.data.currentPassword, res);
  if (!user) return;

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  res.json({ ok: true });
});

authRouter.patch("/account/email", requireAuth, async (req, res) => {
  const parsed = ChangeEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await loadVerifiedUser(req.auth!.userId, parsed.data.password, res);
  if (!user) return;

  const taken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (taken && taken.id !== user.id) return res.status(409).json({ error: "An account with that email already exists" });

  const updated = await prisma.user.update({ where: { id: user.id }, data: { email: parsed.data.email } });
  res.json({ user: { id: updated.id, email: updated.email, role: updated.role } });
});

// Cascades to the profile, jobs, applications, invitations and favourites.
authRouter.delete("/account", requireAuth, async (req, res) => {
  const parsed = DeleteAccountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await loadVerifiedUser(req.auth!.userId, parsed.data.password, res);
  if (!user) return;

  await prisma.user.delete({ where: { id: user.id } });
  res.json({ ok: true });
});
