// Shared domain vocabulary + validation schemas used by both apps/api and
// apps/web, so a shape only has to change in one place. Keep this file about
// data shape, not UI copy or backend implementation details.
import { z } from "zod";

export const DAYS = [
  { key: "mon", short: "Mon", long: "Monday" },
  { key: "tue", short: "Tue", long: "Tuesday" },
  { key: "wed", short: "Wed", long: "Wednesday" },
  { key: "thu", short: "Thu", long: "Thursday" },
  { key: "fri", short: "Fri", long: "Friday" },
  { key: "sat", short: "Sat", long: "Saturday" },
  { key: "sun", short: "Sun", long: "Sunday" },
] as const;
export const dayKeys = DAYS.map((d) => d.key) as [string, ...string[]];
export const DaySchema = z.enum(dayKeys as [string, ...string[]]);
export type Day = z.infer<typeof DaySchema>;

export const SLOTS = [
  { key: "morning", label: "Morning", hint: "06:00–12:00" },
  { key: "afternoon", label: "Afternoon", hint: "12:00–17:00" },
  { key: "evening", label: "Evening", hint: "17:00–01:00" },
] as const;
export const slotKeys = SLOTS.map((s) => s.key) as [string, ...string[]];
export const SlotSchema = z.enum(slotKeys as [string, ...string[]]);
export type Slot = z.infer<typeof SlotSchema>;

export const CATEGORIES = [
  "Hospitality",
  "Retail",
  "Events",
  "Delivery",
  "Customer service",
  "Administrative",
  "Warehouse",
  "Cleaning",
  "Other",
] as const;
export const CategorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof CategorySchema>;

export const LANGUAGES = ["Dutch", "English", "Spanish", "Arabic", "Polish", "Turkish"] as const;

export const AvailabilitySchema = z.record(DaySchema, z.array(SlotSchema));
export type Availability = z.infer<typeof AvailabilitySchema>;

export const ExperienceEntrySchema = z.object({
  category: CategorySchema,
  summary: z.string().min(1).max(120),
});
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;

export const APPLICATION_STATUSES = [
  "Sent",
  "Viewed",
  "Responded",
  "Interview",
  "Hired",
  "Closed",
] as const;
export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const INVITATION_STATUSES = [
  "Invited",
  "Viewed",
  "Accepted",
  "Declined",
  "Interview",
  "Hired",
  "Closed",
] as const;
export const InvitationStatusSchema = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const EXPERIENCE_LEVELS = ["No experience needed", "Some experience", "Experienced"] as const;
export const ExperienceLevelSchema = z.enum(EXPERIENCE_LEVELS);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const RoleSchema = z.enum(["WORKER", "BUSINESS"]);
export type Role = z.infer<typeof RoleSchema>;

/* --------------------------------- auth ---------------------------------- */

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: RoleSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const ChangeEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1),
});

/* ------------------------------- profiles --------------------------------- */

export const WorkerOnboardingSchema = z.object({
  name: z.string().min(1).max(60),
  age: z.number().int().min(14).max(100).optional(),
  city: z.string().min(1).max(80),
  postalCode: z.string().max(12).optional(),
  maxDistanceKm: z.number().int().min(1).max(100),
  availability: AvailabilitySchema,
  interests: z.array(CategorySchema).min(1),
  languages: z.array(z.string()).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  preferredPay: z.number().min(0).max(100).optional(),
  drivingLicence: z.boolean().default(false),
  bio: z.string().max(280).optional(),
});
export type WorkerOnboardingInput = z.infer<typeof WorkerOnboardingSchema>;

export const WorkerProfileUpdateSchema = WorkerOnboardingSchema.partial();

export const BusinessOnboardingSchema = z.object({
  name: z.string().min(1).max(80),
  industry: z.string().min(1).max(60),
  area: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  emoji: z.string().max(8).optional(),
});
export type BusinessOnboardingInput = z.infer<typeof BusinessOnboardingSchema>;

export const BusinessProfileUpdateSchema = BusinessOnboardingSchema.partial();

/* ---------------------------------- jobs ----------------------------------- */

export const MAX_SCREENING_QUESTIONS = 2;

export const JobCreateSchema = z.object({
  title: z.string().min(1).max(80),
  category: CategorySchema,
  hourlyPay: z.number().min(0).max(200),
  days: z.array(DaySchema).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  area: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  requiredLanguages: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  tasks: z.array(z.string()).default([]),
  offers: z.array(z.string()).default([]),
  description: z.string().min(1).max(1000),
  recurring: z.boolean().default(true),
  experienceLevel: ExperienceLevelSchema,
  screeningQuestions: z.array(z.string().trim().min(1).max(160)).max(MAX_SCREENING_QUESTIONS).default([]),
});
export type JobCreateInput = z.infer<typeof JobCreateSchema>;

/* ------------------------------ applications -------------------------------- */

export const APPLICATION_NOTE_MAX = 500;
export const SCREENING_ANSWER_MAX = 300;

export const ScreeningAnswerSchema = z.object({
  question: z.string().min(1).max(160),
  answer: z.string().trim().min(1).max(SCREENING_ANSWER_MAX),
});
export type ScreeningAnswer = z.infer<typeof ScreeningAnswerSchema>;

export const ApplicationCreateSchema = z.object({
  jobId: z.string().min(1),
  note: z.string().trim().max(APPLICATION_NOTE_MAX).optional(),
  // One answer per job screening question, in the job's order.
  answers: z.array(ScreeningAnswerSchema).max(MAX_SCREENING_QUESTIONS).default([]),
  // True when the match flagged a schedule gap and the worker confirmed they can cover it.
  confirmedScheduleGaps: z.boolean().default(false),
});
export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>;

export const ApplicationStatusUpdateSchema = z.object({
  status: ApplicationStatusSchema,
});

export const InvitationCreateSchema = z.object({
  workerId: z.string().min(1),
  jobId: z.string().min(1),
});

export const InvitationStatusUpdateSchema = z.object({
  status: InvitationStatusSchema,
});

/* ------------------------------- matching ----------------------------------- */

// Explicit weights so a smarter engine can replace the scoring function later
// without touching callers on either side of the API.
export const MATCH_WEIGHTS = {
  availability: 0.4,
  distance: 0.2,
  category: 0.2,
  language: 0.1,
  experience: 0.1,
} as const;
