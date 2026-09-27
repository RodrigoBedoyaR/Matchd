// Response shaping. The rule that matters: a business viewing a candidate
// never gets the worker's exact postal code or coordinates — only city/area
// and a computed distance. See lovable-poc roadmap: "Do not expose sensitive
// personal information such as exact home addresses."
import type { WorkerProfile, Business, Job, Application, Invitation } from "@prisma/client";
import { matchJobToWorker, resolveDistanceKm } from "./matching.js";

export function serializeWorkerSelf(worker: WorkerProfile) {
  return {
    id: worker.id,
    name: worker.name,
    age: worker.age ?? undefined,
    city: worker.city,
    postalCode: worker.postalCode ?? undefined,
    maxDistanceKm: worker.maxDistanceKm,
    availability: worker.availability,
    interests: worker.interests,
    languages: worker.languages,
    experience: worker.experience,
    preferredPay: worker.preferredPay ?? undefined,
    drivingLicence: worker.drivingLicence,
    bio: worker.bio ?? undefined,
  };
}

// Candidate-card / candidate-detail view, as seen by a business. No postal
// code, no raw coordinates.
export function serializeWorkerForBusiness(worker: WorkerProfile, job?: Job) {
  const base = {
    id: worker.id,
    name: worker.name,
    age: worker.age ?? undefined,
    city: worker.city,
    maxDistanceKm: worker.maxDistanceKm,
    availability: worker.availability,
    interests: worker.interests,
    languages: worker.languages,
    experience: worker.experience,
    drivingLicence: worker.drivingLicence,
    bio: worker.bio ?? undefined,
  };
  if (!job) return base;
  const match = matchJobToWorker(job, worker);
  return { ...base, distanceKm: resolveDistanceKm(job, worker), match };
}

export function serializeBusiness(business: Business) {
  return {
    id: business.id,
    name: business.name,
    industry: business.industry,
    area: business.area,
    city: business.city,
    description: business.description ?? undefined,
    emoji: business.emoji ?? undefined,
  };
}

export function serializeJob(job: Job & { business?: Business }, worker?: WorkerProfile) {
  const base = {
    id: job.id,
    businessId: job.businessId,
    business: job.business ? serializeBusiness(job.business) : undefined,
    title: job.title,
    category: job.category,
    hourlyPay: job.hourlyPay,
    days: job.days,
    startTime: job.startTime,
    endTime: job.endTime,
    area: job.area,
    city: job.city,
    requiredLanguages: job.requiredLanguages,
    requirements: job.requirements,
    tasks: job.tasks,
    offers: job.offers,
    description: job.description,
    recurring: job.recurring,
    experienceLevel: job.experienceLevel,
    screeningQuestions: job.screeningQuestions,
    active: job.active,
  };
  if (!worker) return { ...base, distanceKm: job.distanceKm ?? undefined };
  const match = matchJobToWorker(job, worker);
  return { ...base, distanceKm: resolveDistanceKm(job, worker), match };
}

export function serializeApplication(application: Application) {
  return {
    id: application.id,
    workerId: application.workerId,
    jobId: application.jobId,
    status: application.status,
    note: application.note ?? undefined,
    answers: (application.answers as { question: string; answer: string }[] | null) ?? [],
    confirmedScheduleGaps: application.confirmedScheduleGaps,
    createdAt: application.createdAt,
  };
}

export function serializeInvitation(invitation: Invitation) {
  return {
    id: invitation.id,
    businessId: invitation.businessId,
    workerId: invitation.workerId,
    jobId: invitation.jobId,
    status: invitation.status,
    createdAt: invitation.createdAt,
  };
}
