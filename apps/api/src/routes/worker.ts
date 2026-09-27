// Worker-side REST surface: onboarding/profile, ranked job matches, applications,
// received invitations and favourited jobs. Every route is worker-only, and every
// route past onboarding needs an existing WorkerProfile.
//
// Express 4 does not funnel async rejections into app.ts's error middleware, so
// each handler catches its own errors.
import { Router } from "express";
import type { Request, Response } from "express";
import { Prisma, type WorkerProfile } from "@prisma/client";
import { z } from "zod";
import {
  ApplicationCreateSchema,
  WorkerOnboardingSchema,
  WorkerProfileUpdateSchema,
} from "@matchd/shared";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  serializeApplication,
  serializeInvitation,
  serializeJob,
  serializeWorkerSelf,
} from "../lib/serialize.js";

export const workerRouter = Router();

const workerOnly = [requireAuth, requireRole("WORKER")] as const;

// Resolves the caller's profile, or answers 404 and returns null. Callers must
// bail out as soon as this yields null — the response has already been sent.
async function loadWorker(req: Request, res: Response): Promise<WorkerProfile | null> {
  const worker = await prisma.workerProfile.findUnique({ where: { userId: req.auth!.userId } });
  if (!worker) {
    res.status(404).json({ error: "Complete onboarding first" });
    return null;
  }
  return worker;
}

function fail(res: Response, err: unknown) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

/* ------------------------------- onboarding -------------------------------- */

workerRouter.post("/onboarding", ...workerOnly, async (req, res) => {
  try {
    const parsed = WorkerOnboardingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const input = parsed.data;

    // availability / experience go straight into the Json columns.
    const fields = {
      name: input.name,
      age: input.age ?? null,
      city: input.city,
      postalCode: input.postalCode ?? null,
      maxDistanceKm: input.maxDistanceKm,
      availability: input.availability as Prisma.InputJsonValue,
      interests: input.interests,
      languages: input.languages,
      experience: input.experience as Prisma.InputJsonValue,
      preferredPay: input.preferredPay ?? null,
      drivingLicence: input.drivingLicence,
      bio: input.bio ?? null,
    };

    const worker = await prisma.workerProfile.upsert({
      where: { userId: req.auth!.userId },
      create: { userId: req.auth!.userId, ...fields },
      update: fields,
    });

    res.json({ worker: serializeWorkerSelf(worker) });
  } catch (err) {
    fail(res, err);
  }
});

workerRouter.patch("/profile", ...workerOnly, async (req, res) => {
  try {
    const existing = await loadWorker(req, res);
    if (!existing) return;

    const parsed = WorkerProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const input = parsed.data;

    // Only the keys actually present in the request are written.
    const data: Prisma.WorkerProfileUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.age !== undefined) data.age = input.age;
    if (input.city !== undefined) data.city = input.city;
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;
    if (input.maxDistanceKm !== undefined) data.maxDistanceKm = input.maxDistanceKm;
    if (input.availability !== undefined) data.availability = input.availability as Prisma.InputJsonValue;
    if (input.interests !== undefined) data.interests = input.interests;
    if (input.languages !== undefined) data.languages = input.languages;
    if (input.experience !== undefined) data.experience = input.experience as Prisma.InputJsonValue;
    if (input.preferredPay !== undefined) data.preferredPay = input.preferredPay;
    if (input.drivingLicence !== undefined) data.drivingLicence = input.drivingLicence;
    if (input.bio !== undefined) data.bio = input.bio;

    const worker = await prisma.workerProfile.update({ where: { id: existing.id }, data });
    res.json({ worker: serializeWorkerSelf(worker) });
  } catch (err) {
    fail(res, err);
  }
});

/* ---------------------------- matches and jobs ----------------------------- */

// Always the full ranked list: search, filtering and re-sorting happen client-side.
workerRouter.get("/matches", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const jobs = await prisma.job.findMany({ where: { active: true }, include: { business: true } });
    // serializeJob only attaches `match` when a worker is passed, hence the narrowing.
    const scoreOf = (job: ReturnType<typeof serializeJob>) => ("match" in job ? job.match.score : 0);
    const ranked = jobs
      .map((job) => serializeJob(job, worker))
      .sort((a, b) => scoreOf(b) - scoreOf(a));

    res.json({ jobs: ranked });
  } catch (err) {
    fail(res, err);
  }
});

// Inactive jobs are still readable — a worker who already applied keeps the detail view.
workerRouter.get("/jobs/:jobId", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: { business: true },
    });
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({ job: serializeJob(job, worker) });
  } catch (err) {
    fail(res, err);
  }
});

/* ------------------------------ applications ------------------------------- */

workerRouter.post("/applications", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const parsed = ApplicationCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { jobId, note, answers, confirmedScheduleGaps } = parsed.data;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!job.active) return res.status(409).json({ error: "This job is no longer taking applications" });

    // Every screening question needs an answer, matched by question text so a
    // stale client can't answer a question the business has since changed.
    const answerFor = new Map(answers.map((a) => [a.question, a.answer]));
    const missing = job.screeningQuestions.filter((q) => !answerFor.get(q));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Please answer: ${missing.join(" / ")}` });
    }
    const orderedAnswers = job.screeningQuestions.map((q) => ({ question: q, answer: answerFor.get(q)! }));

    // Applying twice is a no-op, not an error.
    const application = await prisma.application.upsert({
      where: { workerId_jobId: { workerId: worker.id, jobId } },
      create: {
        workerId: worker.id,
        jobId,
        status: "Sent",
        note: note || null,
        answers: orderedAnswers as Prisma.InputJsonValue,
        confirmedScheduleGaps,
      },
      update: {},
    });

    res.json({ application: serializeApplication(application) });
  } catch (err) {
    fail(res, err);
  }
});

workerRouter.get("/applications", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const applications = await prisma.application.findMany({
      where: { workerId: worker.id },
      include: { job: { include: { business: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      applications: applications.map((a) => ({
        ...serializeApplication(a),
        job: serializeJob(a.job),
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});

/* ------------------------------- invitations -------------------------------- */

workerRouter.get("/invitations", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const invitations = await prisma.invitation.findMany({
      where: { workerId: worker.id },
      include: { job: { include: { business: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      invitations: invitations.map((i) => ({
        ...serializeInvitation(i),
        job: serializeJob(i.job),
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});

// Worker-side decision only: the other invitation statuses belong to the business.
const InvitationDecisionSchema = z.object({ status: z.enum(["Accepted", "Declined"]) });

workerRouter.patch("/invitations/:id", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const parsed = InvitationDecisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const existing = await prisma.invitation.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Invitation not found" });
    if (existing.workerId !== worker.id) return res.status(403).json({ error: "Not your invitation" });

    const invitation = await prisma.invitation.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });

    res.json({ invitation: serializeInvitation(invitation) });
  } catch (err) {
    fail(res, err);
  }
});

/* -------------------------------- favorites --------------------------------- */

workerRouter.post("/favorites/jobs/:jobId", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const { jobId } = req.params;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existing = await prisma.favoriteJob.findUnique({
      where: { workerId_jobId: { workerId: worker.id, jobId } },
    });

    if (existing) {
      await prisma.favoriteJob.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }

    await prisma.favoriteJob.create({ data: { workerId: worker.id, jobId } });
    res.json({ favorited: true });
  } catch (err) {
    fail(res, err);
  }
});

workerRouter.get("/favorites/jobs", ...workerOnly, async (req, res) => {
  try {
    const worker = await loadWorker(req, res);
    if (!worker) return;

    const rows = await prisma.favoriteJob.findMany({ where: { workerId: worker.id } });
    res.json({ jobIds: rows.map((r) => r.jobId) });
  } catch (err) {
    fail(res, err);
  }
});
