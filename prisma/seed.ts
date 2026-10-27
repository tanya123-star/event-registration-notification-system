import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { createRegistrationReference } from "../src/features/events/reference";
import {
  AttendanceMethod,
  EventStatus,
  NotificationAudience,
  Role,
} from "../src/generated/prisma/browser";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL. Check your .env file.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ADMIN_EMAIL = "admin@acdeducation.com";
const DEV_EMAIL = "johnreyrabosa.f@gmail.com";
const OFFICER_EMAIL = "officer@acdeducation.com";
const STUDENT_EMAIL = "student@acdeducation.com";
const STUDENT_TWO_EMAIL = "student.two@acdeducation.com";
const OFFICER_TWO_EMAIL = "officer.two@acdeducation.com";
const STUDENT_THREE_EMAIL = "student.three@acdeducation.com";
const INACTIVE_STUDENT_EMAIL = "inactive.student@acdeducation.com";

function atDaysFromNow(
  days: number,
  hour: number,
  durationHours = 2,
): { startAt: Date; endAt: Date } {
  const startAt = new Date();
  startAt.setDate(startAt.getDate() + days);
  startAt.setHours(hour, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + durationHours);
  return { startAt, endAt };
}

async function seedUsers() {
  const users = [
    {
      email: DEV_EMAIL,
      name: "John Rey Rabosa",
      role: Role.DEV,
      isActive: true,
    },
    {
      email: ADMIN_EMAIL,
      name: "Maria Santos",
      role: Role.ADMIN,
      isActive: true,
    },
    {
      email: OFFICER_EMAIL,
      name: "Liza Mercado",
      role: Role.OFFICER,
      isActive: true,
    },
    {
      email: STUDENT_EMAIL,
      name: "Carlo Reyes",
      role: Role.STUDENT,
      isActive: true,
      studentNumber: "2026-00001",
    },
    {
      email: STUDENT_TWO_EMAIL,
      name: "Ana Dela Cruz",
      role: Role.STUDENT,
      isActive: true,
      studentNumber: "2026-00002",
    },
    {
      email: OFFICER_TWO_EMAIL,
      name: "Miguel Tan",
      role: Role.OFFICER,
      isActive: true,
    },
    {
      email: STUDENT_THREE_EMAIL,
      name: "Grace Lim",
      role: Role.STUDENT,
      isActive: true,
      studentNumber: "2026-00003",
    },
    {
      email: INACTIVE_STUDENT_EMAIL,
      name: "Paolo Garcia",
      role: Role.STUDENT,
      isActive: false,
    },
  ];

  const byEmail = new Map<string, { id: string }>();
  for (const user of users) {
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        studentNumber: user.studentNumber ?? null,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        studentNumber: user.studentNumber ?? null,
        emailVerified: new Date(),
      },
    });
    byEmail.set(user.email, row);
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }
  return byEmail;
}

async function seedEvents(userByEmail: Map<string, { id: string }>) {
  const events = [
    {
      title: "General Assembly 2026",
      description:
        "Kick-off assembly for the first semester. We will present the organization's plans, calendar of activities, and committee sign-ups.",
      venue: "AVR 1, Main Building",
      createdByEmail: OFFICER_EMAIL,
      ...atDaysFromNow(5, 13, 3),
    },
    {
      title: "Tech Talk: Introduction to Artificial Intelligence",
      description:
        "A beginner-friendly session on AI concepts, real-world applications, and career paths, followed by a Q&A with alumni.",
      venue: "Computer Laboratory 3",
      createdByEmail: OFFICER_EMAIL,
      ...atDaysFromNow(12, 9, 2),
    },
    {
      title: "Campus Clean-Up Drive",
      description:
        "Join KASAMA in keeping our campus clean. Cleaning materials and snacks will be provided.",
      venue: "Covered Court",
      createdByEmail: ADMIN_EMAIL,
      ...atDaysFromNow(8, 7, 4),
    },
    {
      title: "Coding Bootcamp: Web Development 101",
      description:
        "Hands-on workshop covering HTML, CSS, and JavaScript fundamentals. Bring your own laptop.",
      venue: "Computer Laboratory 1",
      createdByEmail: OFFICER_TWO_EMAIL,
      ...atDaysFromNow(15, 13, 4),
    },
    {
      title: "Blood Donation Drive",
      description:
        "Partnered with the local chapter of the Philippine Red Cross. Walk-ins are welcome; light meals will be served.",
      venue: "Gymnasium",
      createdByEmail: ADMIN_EMAIL,
      ...atDaysFromNow(21, 8, 6),
    },
  ];

  const byTitle = new Map<string, { id: string }>();
  for (const event of events) {
    const createdById = userByEmail.get(event.createdByEmail)?.id;
    if (!createdById) throw new Error(`Missing seeded user: ${event.createdByEmail}`);

    const data = {
      title: event.title,
      description: event.description,
      venue: event.venue,
      startAt: event.startAt,
      endAt: event.endAt,
      createdById,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      registrationClosesAt: event.startAt,
    };

    const existing = await prisma.event.findFirst({ where: { title: event.title } });
    const row = existing
      ? await prisma.event.update({ where: { id: existing.id }, data })
      : await prisma.event.create({ data });
    byTitle.set(event.title, row);
    console.log(`Seeded event: ${event.title}`);
  }
  return byTitle;
}

async function seedRegistrations(
  eventByTitle: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const groups = [
    {
      eventTitle: "General Assembly 2026",
      studentEmails: [STUDENT_EMAIL, STUDENT_TWO_EMAIL, STUDENT_THREE_EMAIL],
    },
    {
      eventTitle: "Tech Talk: Introduction to Artificial Intelligence",
      studentEmails: [STUDENT_EMAIL, STUDENT_THREE_EMAIL],
    },
    { eventTitle: "Campus Clean-Up Drive", studentEmails: [STUDENT_TWO_EMAIL] },
    { eventTitle: "Coding Bootcamp: Web Development 101", studentEmails: [STUDENT_EMAIL] },
    { eventTitle: "Blood Donation Drive", studentEmails: [STUDENT_THREE_EMAIL] },
  ];

  for (const group of groups) {
    const eventId = eventByTitle.get(group.eventTitle)?.id;
    if (!eventId) continue;

    for (const email of group.studentEmails) {
      const studentId = userByEmail.get(email)?.id;
      if (!studentId) continue;

      const row = await prisma.registration.upsert({
        where: { eventId_studentId: { eventId, studentId } },
        update: {},
        create: { eventId, studentId, reference: createRegistrationReference() },
        select: { reference: true },
      });
      console.log(`Seeded registration: ${email} @ ${group.eventTitle} (${row.reference})`);
    }
  }
}

async function seedAttendances(
  eventByTitle: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const recordedById = userByEmail.get(OFFICER_EMAIL)?.id;
  const attendances = [
    { eventTitle: "General Assembly 2026", studentEmail: STUDENT_EMAIL },
    { eventTitle: "General Assembly 2026", studentEmail: STUDENT_TWO_EMAIL },
    {
      eventTitle: "Tech Talk: Introduction to Artificial Intelligence",
      studentEmail: STUDENT_EMAIL,
    },
    { eventTitle: "Campus Clean-Up Drive", studentEmail: STUDENT_TWO_EMAIL },
    { eventTitle: "Coding Bootcamp: Web Development 101", studentEmail: STUDENT_EMAIL },
    { eventTitle: "Blood Donation Drive", studentEmail: STUDENT_THREE_EMAIL },
  ];

  for (const attendance of attendances) {
    const eventId = eventByTitle.get(attendance.eventTitle)?.id;
    const studentId = userByEmail.get(attendance.studentEmail)?.id;
    if (!eventId || !studentId) continue;

    await prisma.attendance.upsert({
      where: { eventId_studentId: { eventId, studentId } },
      update: { method: AttendanceMethod.MANUAL, recordedById },
      create: {
        eventId,
        studentId,
        method: AttendanceMethod.MANUAL,
        recordedById,
        photoUrl: `seed/attendance/${studentId}-${eventId}.jpg`,
      },
    });
    console.log(`Seeded attendance: ${attendance.studentEmail} @ ${attendance.eventTitle}`);
  }
}

async function seedNotifications(
  userByEmail: Map<string, { id: string }>,
  eventByTitle: Map<string, { id: string }>,
) {
  const notifications = [
    {
      title: "Second Semester Enrollment is Open",
      body: "Complete your requirements before the end of the month and confirm your schedule with your adviser.",
      eventTitle: null,
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "System Maintenance on Sunday",
      body: "The student portal will be offline from 12:00 AM to 4:00 AM. We apologize for the inconvenience.",
      eventTitle: null,
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "General Assembly this Friday",
      body: "Doors open at 12:30 PM in AVR 1. Attendance will be checked at the entrance.",
      eventTitle: "General Assembly 2026",
      createdByEmail: OFFICER_EMAIL,
    },
    {
      title: "AI Session RSVP Now Open",
      body: "Reserve a seat for the alumni Q&A. Slots are first-come, first-served.",
      eventTitle: "Tech Talk: Introduction to Artificial Intelligence",
      createdByEmail: OFFICER_EMAIL,
    },
    {
      title: "Volunteers Needed this Weekend",
      body: "Sign up at the KASAMA office to reserve a slot and claim your certificate.",
      eventTitle: "Campus Clean-Up Drive",
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "Web Development 101 Seats Available",
      body: "A few slots remain for the bootcamp. Bring your own laptop and install the required tools.",
      eventTitle: "Coding Bootcamp: Web Development 101",
      createdByEmail: OFFICER_TWO_EMAIL,
    },
    {
      title: "Donors Needed this Month",
      body: "Walk-ins are welcome. You must be at least 18, weigh 50 kg, and be in good health.",
      eventTitle: "Blood Donation Drive",
      createdByEmail: ADMIN_EMAIL,
    },
  ];

  const byTitle = new Map<string, { id: string }>();
  for (const notification of notifications) {
    const createdById = userByEmail.get(notification.createdByEmail)?.id;
    const eventId = notification.eventTitle
      ? (eventByTitle.get(notification.eventTitle)?.id ?? null)
      : null;
    if (!createdById) throw new Error(`Missing seeded user: ${notification.createdByEmail}`);

    const existing = await prisma.notification.findFirst({
      where: { title: notification.title },
    });
    const row = existing
      ? existing
      : await prisma.notification.create({
          data: {
            title: notification.title,
            body: notification.body,
            audience: NotificationAudience.ALL,
            eventId,
            createdById,
          },
        });
    byTitle.set(notification.title, row);
    console.log(`Seeded notification: ${notification.title}`);
  }
  return byTitle;
}

async function seedNotificationReads(
  notificationByTitle: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const reads = [
    {
      notificationTitle: "Second Semester Enrollment is Open",
      userEmail: STUDENT_EMAIL,
    },
    { notificationTitle: "General Assembly this Friday", userEmail: STUDENT_EMAIL },
    { notificationTitle: "AI Session RSVP Now Open", userEmail: STUDENT_EMAIL },
    {
      notificationTitle: "Second Semester Enrollment is Open",
      userEmail: STUDENT_TWO_EMAIL,
    },
  ];

  for (const read of reads) {
    const notificationId = notificationByTitle.get(read.notificationTitle)?.id;
    const userId = userByEmail.get(read.userEmail)?.id;
    if (!notificationId || !userId) continue;

    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: {},
      create: { notificationId, userId },
    });
  }
  console.log("Seeded notification reads");
}

async function seedPendingAssignment(assignedById: string) {
  const pending = {
    email: "new.officer@acdeducation.com",
    role: Role.OFFICER,
  };

  await prisma.pendingRoleAssignment.upsert({
    where: { email: pending.email },
    update: { role: pending.role },
    create: { ...pending, assignedById },
  });
  console.log(`Seeded pending role assignment: ${pending.email}`);
}

async function main() {
  const userByEmail = await seedUsers();
  const eventByTitle = await seedEvents(userByEmail);
  await seedRegistrations(eventByTitle, userByEmail);
  await seedAttendances(eventByTitle, userByEmail);
  const notificationByTitle = await seedNotifications(userByEmail, eventByTitle);
  await seedNotificationReads(notificationByTitle, userByEmail);
  const dev = userByEmail.get(DEV_EMAIL);
  if (!dev) throw new Error(`Missing seeded user: ${DEV_EMAIL}`);
  await seedPendingAssignment(dev.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
