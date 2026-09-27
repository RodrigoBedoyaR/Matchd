// Seed data ported from the partner's Lovable POC (src/lib/data.ts), so the
// two prototypes stay recognizable to testers who saw either one. Re-runnable:
// everything is upserted by a stable seed id.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_BUSINESS_EMAIL, DEMO_WORKER_EMAIL } from "@matchd/shared";

const prisma = new PrismaClient();
const SEED_PASSWORD_HASH = await bcrypt.hash("password123", 10);

type SeedBusiness = {
  seedId: string;
  name: string;
  industry: string;
  area: string;
  description: string;
  emoji: string;
};

const businesses: SeedBusiness[] = [
  { seedId: "b1", name: "Coffee Corner Utrecht", industry: "Café", area: "Utrecht Centrum", emoji: "☕", description: "A small independent coffee bar near the Oudegracht. Two locations, eleven people, a lot of oat flat whites." },
  { seedId: "b2", name: "De Groene Winkel", industry: "Retail", area: "Utrecht Lombok", emoji: "🛒", description: "Neighbourhood grocery and zero-waste store run by the same family since 2014." },
  { seedId: "b3", name: "Domstad Events", industry: "Events", area: "Utrecht Leidsche Rijn", emoji: "🎪", description: "Crew and bar staffing for festivals, conferences and weddings around Utrecht." },
  { seedId: "b4", name: "Bistro Kanaalzicht", industry: "Restaurant", area: "Utrecht Oost", emoji: "🍽️", description: "Forty-seat bistro on the canal. Seasonal menu, relaxed team, busy weekends." },
  { seedId: "b5", name: "Hotel Merelhof", industry: "Hotel", area: "Utrecht Centrum", emoji: "🛎️", description: "A 32-room boutique hotel in a restored townhouse close to Utrecht Centraal." },
  { seedId: "b6", name: "Fietskoerier Vecht", industry: "Local delivery", area: "Utrecht Overvecht", emoji: "🚲", description: "Cargo-bike delivery collective serving local shops and bakeries." },
];

type SeedJob = {
  seedId: string;
  businessSeedId: string;
  title: string;
  category: string;
  hourlyPay: number;
  days: string[];
  startTime: string;
  endTime: string;
  area: string;
  distanceKm: number;
  requiredLanguages: string[];
  requirements: string[];
  tasks: string[];
  offers: string[];
  description: string;
  recurring: boolean;
  experienceLevel: string;
  screeningQuestions?: string[];
};

const jobs: SeedJob[] = [
  { seedId: "j1", businessSeedId: "b1", title: "Barista", category: "Hospitality", hourlyPay: 14.8, days: ["tue", "thu"], startTime: "17:00", endTime: "22:00", area: "Utrecht Centrum", distanceKm: 1.2, requiredLanguages: ["English"], requirements: ["18+", "Comfortable at a busy bar", "Available for the full evening shift"], tasks: ["Pull espresso and steam milk on a two-group machine", "Take orders and handle card payments", "Keep the bar and seating area tidy"], offers: ["€14.80/hour", "Free coffee and staff lunch", "Paid 20-minute break"], description: "We need a second person behind the bar on our two busiest evenings. You'll work next to a senior barista, so latte art is nice but not required.", recurring: true, experienceLevel: "No experience needed", screeningQuestions: ["Have you worked with an espresso machine before?", "Which date could you start?"] },
  { seedId: "j2", businessSeedId: "b2", title: "Retail Assistant", category: "Retail", hourlyPay: 15.2, days: ["sat"], startTime: "10:00", endTime: "18:00", area: "Utrecht Lombok", distanceKm: 2.4, requiredLanguages: ["Dutch"], requirements: ["Friendly with regulars", "Able to lift crates", "Every Saturday"], tasks: ["Help customers find products", "Restock shelves", "Run the till"], offers: ["€15.20/hour", "Staff discount of 20%", "Same shift every week"], description: "One steady Saturday shift in a small neighbourhood shop. Most customers live around the corner.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j3", businessSeedId: "b3", title: "Event Crew", category: "Events", hourlyPay: 16.5, days: ["fri"], startTime: "17:00", endTime: "01:00", area: "Utrecht Leidsche Rijn", distanceKm: 4.8, requiredLanguages: ["English"], requirements: ["18+", "Physically active work", "Own transport helps"], tasks: ["Build and break down stages", "Guide visitors", "Support the bar during peaks"], offers: ["€16.50/hour", "Free meal and drinks", "Travel allowance"], description: "Friday night crew for indoor events. Loud, fast and social.", recurring: false, experienceLevel: "No experience needed" },
  { seedId: "j4", businessSeedId: "b4", title: "Restaurant Server", category: "Hospitality", hourlyPay: 15.0, days: ["wed", "fri", "sat"], startTime: "17:30", endTime: "23:00", area: "Utrecht Oost", distanceKm: 3.1, requiredLanguages: ["Dutch", "English"], requirements: ["Some serving experience", "Three evenings per week"], tasks: ["Take orders and serve dishes", "Advise on the wine list", "Reset tables"], offers: ["€15.00/hour", "Shared tips", "Staff dinner before service"], description: "Three evenings in a calm bistro with a set team and a short menu.", recurring: true, experienceLevel: "Some experience", screeningQuestions: ["Tell us briefly about your serving experience."] },
  { seedId: "j5", businessSeedId: "b5", title: "Breakfast Host", category: "Hospitality", hourlyPay: 14.5, days: ["sat", "sun"], startTime: "07:00", endTime: "11:30", area: "Utrecht Centrum", distanceKm: 1.6, requiredLanguages: ["English"], requirements: ["Early starter", "Weekend availability"], tasks: ["Set up the breakfast buffet", "Welcome guests", "Clear and reset the room"], offers: ["€14.50/hour", "Breakfast included", "Done before noon"], description: "Weekend mornings in a quiet boutique hotel. You're finished by lunchtime.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j6", businessSeedId: "b6", title: "Cargo Bike Courier", category: "Delivery", hourlyPay: 15.75, days: ["mon", "wed"], startTime: "08:00", endTime: "12:00", area: "Utrecht Overvecht", distanceKm: 5.4, requiredLanguages: ["English"], requirements: ["Confident cyclist", "Rain doesn't scare you"], tasks: ["Collect orders from local shops", "Deliver within Utrecht", "Log drop-offs in the app"], offers: ["€15.75/hour", "Bike and rain gear provided", "Morning shifts only"], description: "Morning delivery rounds on an electric cargo bike. No licence needed.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j7", businessSeedId: "b5", title: "Front Desk Support", category: "Customer service", hourlyPay: 16.0, days: ["thu", "fri"], startTime: "15:00", endTime: "21:00", area: "Utrecht Centrum", distanceKm: 1.6, requiredLanguages: ["Dutch", "English"], requirements: ["Calm under pressure", "Comfortable on the phone"], tasks: ["Check guests in", "Answer calls and emails", "Handle late arrivals"], offers: ["€16.00/hour", "Training in the booking system", "Fixed weekly schedule"], description: "Afternoon and early evening reception cover on our two busiest days.", recurring: true, experienceLevel: "Some experience" },
  { seedId: "j8", businessSeedId: "b3", title: "Festival Bar Staff", category: "Hospitality", hourlyPay: 16.0, days: ["sat"], startTime: "16:00", endTime: "00:00", area: "Utrecht Leidsche Rijn", distanceKm: 4.8, requiredLanguages: ["English"], requirements: ["18+", "Fast on your feet", "One-off shift"], tasks: ["Pour drinks", "Handle token payments", "Restock the bar"], offers: ["€16.00/hour", "Free entry to the event", "Paid briefing"], description: "One Saturday evening behind the bar at an outdoor food festival.", recurring: false, experienceLevel: "No experience needed" },
  { seedId: "j9", businessSeedId: "b2", title: "Stock & Warehouse Help", category: "Warehouse", hourlyPay: 15.5, days: ["tue"], startTime: "07:00", endTime: "12:00", area: "Utrecht Lombok", distanceKm: 2.6, requiredLanguages: ["English"], requirements: ["Can lift 15 kg", "Early morning"], tasks: ["Unload the delivery truck", "Sort and label stock", "Keep the storage room organised"], offers: ["€15.50/hour", "Finished before lunch", "Weekly fixed shift"], description: "One early morning a week unpacking the weekly delivery.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j10", businessSeedId: "b1", title: "Weekend Kitchen Assistant", category: "Hospitality", hourlyPay: 14.95, days: ["sun"], startTime: "09:00", endTime: "16:00", area: "Utrecht Centrum", distanceKm: 1.2, requiredLanguages: ["English"], requirements: ["Hygiene-minded", "Sundays only"], tasks: ["Prep sandwiches and salads", "Plate brunch dishes", "Clean down the kitchen"], offers: ["€14.95/hour", "Brunch included", "Sunday-only schedule"], description: "Sunday brunch support in a small open kitchen.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j11", businessSeedId: "b4", title: "Evening Cleaning", category: "Cleaning", hourlyPay: 15.9, days: ["mon", "tue", "wed", "thu"], startTime: "22:00", endTime: "00:30", area: "Utrecht Oost", distanceKm: 3.1, requiredLanguages: ["English"], requirements: ["Independent worker", "Late shift"], tasks: ["Clean the dining room and kitchen", "Take out waste", "Prep the room for morning"], offers: ["€15.90/hour", "Short shifts", "Work on your own pace"], description: "Short late shifts after the restaurant closes, four nights a week.", recurring: true, experienceLevel: "No experience needed" },
  { seedId: "j12", businessSeedId: "b3", title: "Office & Planning Assistant", category: "Administrative", hourlyPay: 16.25, days: ["mon", "wed"], startTime: "13:00", endTime: "17:00", area: "Utrecht Leidsche Rijn", distanceKm: 4.6, requiredLanguages: ["Dutch"], requirements: ["Organised", "Comfortable with spreadsheets"], tasks: ["Plan crew schedules", "Answer supplier emails", "Prepare event checklists"], offers: ["€16.25/hour", "Hybrid after a month", "Quiet afternoon shifts"], description: "Two calm afternoons helping our planner keep events on track.", recurring: true, experienceLevel: "Some experience" },
];

type SeedWorker = {
  seedId: string;
  name: string;
  age: number;
  postalCode: string;
  maxDistanceKm: number;
  distanceKm: number;
  availability: Record<string, string[]>;
  interests: string[];
  languages: string[];
  experience: { category: string; summary: string }[];
  preferredPay: number;
  drivingLicence: boolean;
  bio: string;
};

const all = ["morning", "afternoon", "evening"];

const workers: SeedWorker[] = [
  { seedId: "w1", name: "Sofia", age: 21, postalCode: "3512", maxDistanceKm: 10, distanceKm: 1.1, availability: { tue: ["evening"], thu: ["evening"], sat: ["afternoon", "evening"] }, interests: ["Hospitality", "Events", "Customer service"], languages: ["English", "Spanish"], experience: [{ category: "Hospitality", summary: "1 year hospitality" }], preferredPay: 14, drivingLicence: false, bio: "Studying communication, happiest behind a busy bar." },
  { seedId: "w2", name: "Daan", age: 19, postalCode: "3521", maxDistanceKm: 8, distanceKm: 2.3, availability: { sat: all, sun: ["morning", "afternoon"] }, interests: ["Retail", "Warehouse"], languages: ["Dutch", "English"], experience: [{ category: "Retail", summary: "6 months supermarket" }], preferredPay: 15, drivingLicence: true, bio: "Looking for one solid weekend shift next to my studies." },
  { seedId: "w3", name: "Amira", age: 23, postalCode: "3515", maxDistanceKm: 12, distanceKm: 3.4, availability: { wed: ["evening"], fri: ["evening"], sat: ["evening"] }, interests: ["Hospitality", "Customer service"], languages: ["Dutch", "English", "Arabic"], experience: [{ category: "Hospitality", summary: "2 years serving" }], preferredPay: 15.5, drivingLicence: false, bio: "Experienced server, fast and calm during rush hour." },
  { seedId: "w4", name: "Bram", age: 20, postalCode: "3532", maxDistanceKm: 15, distanceKm: 4.2, availability: { mon: ["morning"], wed: ["morning"], fri: ["evening"] }, interests: ["Delivery", "Events"], languages: ["Dutch", "English"], experience: [{ category: "Delivery", summary: "8 months bike courier" }], preferredPay: 15, drivingLicence: true, bio: "On a bike all day anyway." },
  { seedId: "w5", name: "Lena", age: 22, postalCode: "3514", maxDistanceKm: 7, distanceKm: 1.8, availability: { sat: ["morning"], sun: ["morning"] }, interests: ["Hospitality", "Cleaning"], languages: ["English", "Polish"], experience: [{ category: "Hospitality", summary: "Hotel breakfast team" }], preferredPay: 14.5, drivingLicence: false, bio: "Early bird. Weekend mornings only, please." },
  { seedId: "w6", name: "Yusuf", age: 24, postalCode: "3511", maxDistanceKm: 10, distanceKm: 0.9, availability: { thu: ["afternoon", "evening"], fri: ["afternoon", "evening"] }, interests: ["Customer service", "Administrative"], languages: ["Dutch", "English", "Turkish"], experience: [{ category: "Customer service", summary: "1.5 years front desk" }], preferredPay: 16, drivingLicence: true, bio: "Reception and support work, good on the phone." },
  { seedId: "w7", name: "Noor", age: 18, postalCode: "3527", maxDistanceKm: 6, distanceKm: 2.9, availability: { tue: ["morning"], sat: ["afternoon"] }, interests: ["Retail", "Warehouse", "Other"], languages: ["Dutch", "English"], experience: [], preferredPay: 14, drivingLicence: false, bio: "First job, quick learner, plenty of energy." },
  { seedId: "w8", name: "Tim", age: 25, postalCode: "3544", maxDistanceKm: 20, distanceKm: 5.1, availability: { fri: ["evening"], sat: ["evening"], sun: ["evening"] }, interests: ["Events", "Hospitality"], languages: ["Dutch", "English"], experience: [{ category: "Events", summary: "3 festival seasons crew" }], preferredPay: 16.5, drivingLicence: true, bio: "Stage build, bar, guest flow — done it all." },
  { seedId: "w9", name: "Isa", age: 21, postalCode: "3581", maxDistanceKm: 9, distanceKm: 2.2, availability: { mon: ["afternoon"], wed: ["afternoon"], thu: ["afternoon"] }, interests: ["Administrative", "Customer service"], languages: ["Dutch", "English"], experience: [{ category: "Administrative", summary: "Student assistant, scheduling" }], preferredPay: 16, drivingLicence: false, bio: "Spreadsheets genuinely make me happy." },
  { seedId: "w10", name: "Karim", age: 20, postalCode: "3562", maxDistanceKm: 12, distanceKm: 3.8, availability: { mon: ["evening"], tue: ["evening"], wed: ["evening"], thu: ["evening"] }, interests: ["Cleaning", "Warehouse", "Delivery"], languages: ["English", "Arabic"], experience: [{ category: "Cleaning", summary: "1 year office cleaning" }], preferredPay: 15.5, drivingLicence: true, bio: "Late shifts suit my schedule perfectly." },
];

async function main() {
  // Coffee Corner Utrecht (b1) is owned directly by the demo business account,
  // not a separate seed user — otherwise its jobs/applications/invitations end
  // up split across two different "Coffee Corner" businesses and the demo
  // account's dashboard looks empty.
  const demoBusinessUser = await prisma.user.upsert({
    where: { email: DEMO_BUSINESS_EMAIL },
    update: {},
    create: { email: DEMO_BUSINESS_EMAIL, passwordHash: SEED_PASSWORD_HASH, role: "BUSINESS" },
  });
  const b1 = businesses.find((b) => b.seedId === "b1")!;
  const demoBusiness = await prisma.business.upsert({
    where: { userId: demoBusinessUser.id },
    update: {},
    create: {
      userId: demoBusinessUser.id,
      name: b1.name,
      industry: b1.industry,
      area: b1.area,
      city: "Utrecht",
      description: b1.description,
      emoji: b1.emoji,
    },
  });

  const businessIdBySeed = new Map<string, string>([["b1", demoBusiness.id]]);
  for (const b of businesses) {
    if (b.seedId === "b1") continue;
    const user = await prisma.user.upsert({
      where: { email: `${b.seedId}@seed.matchd.app` },
      update: {},
      create: { email: `${b.seedId}@seed.matchd.app`, passwordHash: SEED_PASSWORD_HASH, role: "BUSINESS" },
    });
    const business = await prisma.business.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: b.name,
        industry: b.industry,
        area: b.area,
        city: "Utrecht",
        description: b.description,
        emoji: b.emoji,
      },
    });
    businessIdBySeed.set(b.seedId, business.id);
  }

  const jobIdBySeed = new Map<string, string>();
  for (const j of jobs) {
    const businessId = businessIdBySeed.get(j.businessSeedId)!;
    const existing = await prisma.job.findFirst({ where: { businessId, title: j.title, startTime: j.startTime } });
    const job = existing
      ? await prisma.job.update({
          where: { id: existing.id },
          data: {
            category: j.category,
            hourlyPay: j.hourlyPay,
            days: j.days,
            startTime: j.startTime,
            endTime: j.endTime,
            area: j.area,
            city: "Utrecht",
            distanceKm: j.distanceKm,
            requiredLanguages: j.requiredLanguages,
            requirements: j.requirements,
            tasks: j.tasks,
            offers: j.offers,
            description: j.description,
            recurring: j.recurring,
            experienceLevel: j.experienceLevel,
            screeningQuestions: j.screeningQuestions ?? [],
          },
        })
      : await prisma.job.create({
          data: {
            businessId,
            title: j.title,
            category: j.category,
            hourlyPay: j.hourlyPay,
            days: j.days,
            startTime: j.startTime,
            endTime: j.endTime,
            area: j.area,
            city: "Utrecht",
            distanceKm: j.distanceKm,
            requiredLanguages: j.requiredLanguages,
            requirements: j.requirements,
            tasks: j.tasks,
            offers: j.offers,
            description: j.description,
            recurring: j.recurring,
            experienceLevel: j.experienceLevel,
            screeningQuestions: j.screeningQuestions ?? [],
          },
        });
    jobIdBySeed.set(j.seedId, job.id);
  }

  const workerIdBySeed = new Map<string, string>();
  for (const w of workers) {
    const user = await prisma.user.upsert({
      where: { email: `${w.seedId}@seed.matchd.app` },
      update: {},
      create: { email: `${w.seedId}@seed.matchd.app`, passwordHash: SEED_PASSWORD_HASH, role: "WORKER" },
    });
    const worker = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: w.name,
        age: w.age,
        city: "Utrecht",
        postalCode: w.postalCode,
        maxDistanceKm: w.maxDistanceKm,
        distanceKm: w.distanceKm,
        availability: w.availability,
        interests: w.interests,
        languages: w.languages,
        experience: w.experience,
        preferredPay: w.preferredPay,
        drivingLicence: w.drivingLicence,
        bio: w.bio,
      },
    });
    workerIdBySeed.set(w.seedId, worker.id);
  }

  // Demo accounts: fixed credentials so "Continue as demo worker/business" can
  // log straight in. Demo worker mirrors the POC's "Alex"; demo business owns
  // Coffee Corner Utrecht (b1), same as the POC's demo login.
  const demoWorkerUser = await prisma.user.upsert({
    where: { email: DEMO_WORKER_EMAIL },
    update: {},
    create: { email: DEMO_WORKER_EMAIL, passwordHash: SEED_PASSWORD_HASH, role: "WORKER" },
  });
  await prisma.workerProfile.upsert({
    where: { userId: demoWorkerUser.id },
    update: {},
    create: {
      userId: demoWorkerUser.id,
      name: "Alex",
      age: 21,
      city: "Utrecht",
      postalCode: "3511 LN",
      maxDistanceKm: 10,
      distanceKm: 1.4,
      availability: { tue: ["evening"], thu: ["evening"], fri: ["evening"], sat: ["afternoon", "evening"] },
      interests: ["Hospitality", "Events", "Retail"],
      languages: ["English", "Dutch"],
      experience: [{ category: "Hospitality", summary: "6 months as a barista" }],
      preferredPay: 15,
      drivingLicence: false,
      bio: "Student in Utrecht looking for a few evening shifts a week.",
    },
  });

  const demoWorkerProfile = await prisma.workerProfile.findUnique({ where: { userId: demoWorkerUser.id } });

  type SeedApplication = { workerSeedId: string; jobSeedId: string; status: string };
  const seedApplications: SeedApplication[] = [
    { workerSeedId: "w1", jobSeedId: "j1", status: "Responded" },
    { workerSeedId: "w3", jobSeedId: "j4", status: "Interview" },
    { workerSeedId: "w5", jobSeedId: "j5", status: "Hired" },
    { workerSeedId: "w8", jobSeedId: "j3", status: "Sent" },
    { workerSeedId: "w2", jobSeedId: "j2", status: "Viewed" },
    // These two land on the demo business's own jobs (j1/j10) so its
    // Applications tab has content immediately.
    { workerSeedId: "w6", jobSeedId: "j10", status: "Viewed" },
    { workerSeedId: "w9", jobSeedId: "j1", status: "Sent" },
  ];
  for (const a of seedApplications) {
    const workerId = workerIdBySeed.get(a.workerSeedId)!;
    const jobId = jobIdBySeed.get(a.jobSeedId)!;
    await prisma.application.upsert({
      where: { workerId_jobId: { workerId, jobId } },
      update: { status: a.status },
      create: { workerId, jobId, status: a.status },
    });
  }
  if (demoWorkerProfile) {
    const demoApplications = [
      { jobSeedId: "j4", status: "Interview" },
      { jobSeedId: "j8", status: "Viewed" },
      { jobSeedId: "j2", status: "Closed" },
    ];
    for (const a of demoApplications) {
      const jobId = jobIdBySeed.get(a.jobSeedId)!;
      await prisma.application.upsert({
        where: { workerId_jobId: { workerId: demoWorkerProfile.id, jobId } },
        update: { status: a.status },
        create: { workerId: demoWorkerProfile.id, jobId, status: a.status },
      });
    }
  }

  type SeedInvitation = { workerSeedId: string; jobSeedId: string; status: string };
  const seedInvitations: SeedInvitation[] = [
    { workerSeedId: "w1", jobSeedId: "j1", status: "Accepted" },
    { workerSeedId: "w5", jobSeedId: "j10", status: "Invited" },
    { workerSeedId: "w7", jobSeedId: "j1", status: "Viewed" },
  ];
  for (const i of seedInvitations) {
    const workerId = workerIdBySeed.get(i.workerSeedId)!;
    const jobId = jobIdBySeed.get(i.jobSeedId)!;
    await prisma.invitation.upsert({
      where: { workerId_jobId: { workerId, jobId } },
      update: { status: i.status },
      create: { businessId: demoBusiness.id, workerId, jobId, status: i.status },
    });
  }

  // The demo worker gets one invitation of their own from the demo business,
  // so the Invitations tab has something to accept/decline on first login.
  if (demoWorkerProfile) {
    const jobId = jobIdBySeed.get("j10")!;
    await prisma.invitation.upsert({
      where: { workerId_jobId: { workerId: demoWorkerProfile.id, jobId } },
      update: {},
      create: { businessId: demoBusiness.id, workerId: demoWorkerProfile.id, jobId, status: "Invited" },
    });
  }

  console.log("Seed complete:");
  console.log(`  ${businesses.length} businesses, ${jobs.length} jobs, ${workers.length} workers`);
  console.log(`  Demo worker login: ${DEMO_WORKER_EMAIL} / password123`);
  console.log(`  Demo business login: ${DEMO_BUSINESS_EMAIL} / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
