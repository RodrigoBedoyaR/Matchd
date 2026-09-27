// Business-side REST surface: profile, job posting, candidate ranking,
// invitations, applications and favourites. Every route is scoped to the
// Business row owned by the authenticated user — a business can only ever see
// or mutate its own jobs, invitations and applications.
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import {
  BusinessOnboardingSchema,
  BusinessProfileUpdateSchema,
  InvitationCreateSchema,
  JobCreateSchema,
} from "@matchd/shared";
import { prisma } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  serializeApplication,
  serializeBusiness,
  serializeInvitation,
  serializeJob,
  serializeWorkerForBusiness,
} from "../lib/serialize.js";
import type { MatchBreakdown } from "../lib/matching.js";
import type { Job, WorkerProfile } from "@prisma/client";

export const businessRouter = Router();

const guards = [requireAuth, requireRole("BUSINESS")] as const;

// Every route but onboarding needs the caller's Business row; responds 404 and
// returns null when onboarding hasn't happened yet.
async function requireBusiness(req: Request, res: Response) {
  const business = await prisma.business.findUnique({ where: { userId: req.auth!.userId } });
  if (!business) {
    res.status(404).json({ error: "Complete onboarding first" });
    return null;
  }
  return business;
}

// serializeWorkerForBusiness flattens distanceKm/match into the worker object;
// the frontend contract wants them as siblings of a clean `worker`, so split.
function candidateResult(worker: WorkerProfile, job: Job) {
  const flat = serializeWorkerForBusiness(worker, job) as ReturnType<typeof serializeWorkerForBusiness> & {
    distanceKm: number;
    match: MatchBreakdown;
  };
  const { distanceKm, match, ...rest } = flat;
  return { worker: rest, distanceKm, match };
}

function fail(res: Response, err: unknown) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

/* ------------------------------- profile ---------------------------------- */

businessRouter.post("/onboarding", ...guards, async (req, res) => {
  try {
    const parsed = BusinessOnboardingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const business = await prisma.business.upsert({
      where: { userId: req.auth!.userId },
      create: { userId: req.auth!.userId, ...parsed.data },
      update: parsed.data,
    });
    res.json({ business: serializeBusiness(business) });
  } catch (err) {
    fail(res, err);
  }
});

businessRouter.patch("/profile", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = BusinessProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const updated = await prisma.business.update({ where: { id: business.id }, data: parsed.data });
    res.json({ business: serializeBusiness(updated) });
  } catch (err) {
    fail(res, err);
  }
});

/* --------------------------------- jobs ----------------------------------- */

businessRouter.post("/jobs", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = JobCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const job = await prisma.job.create({
      data: { ...parsed.data, businessId: business.id, active: true },
    });
    res.status(201).json({ job: serializeJob({ ...job, business }) });
  } catch (err) {
    fail(res, err);
  }
});

businessRouter.get("/jobs", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const jobs = await prisma.job.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ jobs: jobs.map((j) => serializeJob({ ...j, business })) });
  } catch (err) {
    fail(res, err);
  }
});

// Pausing/reopening and editing screening questions; the rest of a job is set at creation.
const JobUpdateSchema = z
  .object({
    active: z.boolean(),
    screeningQuestions: JobCreateSchema.shape.screeningQuestions.removeDefault(),
  })
  .partial();

businessRouter.patch("/jobs/:jobId", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = JobUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const job = await prisma.job.findUnique({ where: { id: req.params.jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.businessId !== business.id) return res.status(403).json({ error: "Not your job" });

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: parsed.data,
    });
    res.json({ job: serializeJob({ ...updated, business }) });
  } catch (err) {
    fail(res, err);
  }
});

/* ------------------------------ candidates -------------------------------- */

businessRouter.get("/candidates", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const jobId = typeof req.query.jobId === "string" ? req.query.jobId : undefined;
    if (!jobId) return res.status(400).json({ error: "jobId query parameter is required" });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.businessId !== business.id) return res.status(403).json({ error: "Not your job" });

    const workers = await prisma.workerProfile.findMany();
    const candidates = workers.map((w) => candidateResult(w, job));
    candidates.sort((a, b) => b.match.score - a.match.score);
    res.json({ candidates });
  } catch (err) {
    fail(res, err);
  }
});

businessRouter.get("/candidates/:workerId", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const worker = await prisma.workerProfile.findUnique({ where: { id: req.params.workerId } });
    if (!worker) return res.status(404).json({ error: "Candidate not found" });

    const jobId = typeof req.query.jobId === "string" ? req.query.jobId : undefined;
    if (!jobId) return res.json({ worker: serializeWorkerForBusiness(worker) });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.businessId !== business.id) return res.status(403).json({ error: "Not your job" });

    res.json(candidateResult(worker, job));
  } catch (err) {
    fail(res, err);
  }
});

/* ------------------------------ invitations ------------------------------- */

businessRouter.post("/invitations", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = InvitationCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { workerId, jobId } = parsed.data;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.businessId !== business.id) return res.status(403).json({ error: "Not your job" });

    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: "Candidate not found" });

    // Re-inviting the same worker for the same job is a no-op, not an error.
    const invitation = await prisma.invitation.upsert({
      where: { workerId_jobId: { workerId, jobId } },
      create: { businessId: business.id, workerId, jobId, status: "Invited" },
      update: {},
    });
    res.status(201).json({ invitation: serializeInvitation(invitation) });
  } catch (err) {
    fail(res, err);
  }
});

businessRouter.get("/invitations", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const invitations = await prisma.invitation.findMany({
      where: { businessId: business.id },
      include: { worker: true, job: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      invitations: invitations.map((i) => ({
        ...serializeInvitation(i),
        worker: serializeWorkerForBusiness(i.worker),
        job: serializeJob(i.job),
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});

// "Invited" is set at creation; "Accepted"/"Declined" belong to the worker.
const BusinessInvitationStatusSchema = z.object({
  status: z.enum(["Viewed", "Interview", "Hired", "Closed"]),
});

businessRouter.patch("/invitations/:id", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = BusinessInvitationStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const invitation = await prisma.invitation.findUnique({ where: { id: req.params.id } });
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });
    if (invitation.businessId !== business.id) {
      return res.status(403).json({ error: "Not your invitation" });
    }

    const updated = await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: parsed.data.status },
    });
    res.json({ invitation: serializeInvitation(updated) });
  } catch (err) {
    fail(res, err);
  }
});

/* ----------------------------- applications ------------------------------- */

businessRouter.get("/applications", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const applications = await prisma.application.findMany({
      where: { job: { businessId: business.id } },
      include: { job: true, worker: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      applications: applications.map((a) => ({
        ...serializeApplication(a),
        job: serializeJob(a.job),
        worker: serializeWorkerForBusiness(a.worker),
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});

// "Sent" is worker-set at creation time only.
const BusinessApplicationStatusSchema = z.object({
  status: z.enum(["Viewed", "Responded", "Interview", "Hired", "Closed"]),
});

businessRouter.patch("/applications/:id", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const parsed = BusinessApplicationStatusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { job: true },
    });
    if (!application) return res.status(404).json({ error: "Application not found" });
    if (application.job.businessId !== business.id) {
      return res.status(403).json({ error: "Not your application" });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: parsed.data.status },
    });
    res.json({ application: serializeApplication(updated) });
  } catch (err) {
    fail(res, err);
  }
});

/* ------------------------------- favourites ------------------------------- */

businessRouter.post("/favorites/candidates/:workerId", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const workerId = req.params.workerId;
    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) return res.status(404).json({ error: "Candidate not found" });

    const existing = await prisma.favoriteCandidate.findUnique({
      where: { businessId_workerId: { businessId: business.id, workerId } },
    });
    if (existing) {
      await prisma.favoriteCandidate.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }
    await prisma.favoriteCandidate.create({ data: { businessId: business.id, workerId } });
    res.json({ favorited: true });
  } catch (err) {
    fail(res, err);
  }
});

businessRouter.get("/favorites/candidates", ...guards, async (req, res) => {
  try {
    const business = await requireBusiness(req, res);
    if (!business) return;

    const rows = await prisma.favoriteCandidate.findMany({ where: { businessId: business.id } });
    res.json({ workerIds: rows.map((r) => r.workerId) });
  } catch (err) {
    fail(res, err);
  }
});
