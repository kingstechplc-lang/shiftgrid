// Seed ShiftGrid database with realistic sample data
// Run via: bun run /home/z/my-project/scripts/seed.ts
import { PrismaClient, Role, OfferType, OfferStatus, Visibility, ApplicationStatus } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

const PASSWORD = hashPassword('password123')

async function main() {
  console.log('Clearing existing data...')
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.savedOffer.deleteMany()
  await db.auditEvent.deleteMany()
  await db.credential.deleteMany()
  await db.application.deleteMany()
  await db.offer.deleteMany()
  await db.user.deleteMany()
  await db.hospital.deleteMany()

  console.log('Creating hospitals...')
  const hospitals = await Promise.all([
    db.hospital.create({
      data: {
        name: 'St. Mary\u2019s General Hospital',
        description: 'A 600-bed tertiary care centre specializing in emergency medicine, cardiology, and women\u2019s health. Serving the community since 1937.',
        address: '125 Queen St E, Toronto, ON M5C 1S6',
        logoUrl: '',
        verified: true,
      },
    }),
    db.hospital.create({
      data: {
        name: 'Lakeside Regional Medical Centre',
        description: 'A modern 420-bed regional hospital with a Level II trauma centre, advanced oncology unit, and a thriving allied health program.',
        address: '880 Lakefront Dr, Mississauga, ON L5B 0E9',
        logoUrl: '',
        verified: true,
      },
    }),
    db.hospital.create({
      data: {
        name: 'Northgate Community Hospital',
        description: 'A 280-bed community hospital focused on family medicine, geriatrics, and outpatient surgery. Strong teaching affiliation.',
        address: '15 Northgate Blvd, North York, ON M3N 1V9',
        logoUrl: '',
        verified: false,
      },
    }),
  ])

  console.log('Creating admins...')
  const admins = await Promise.all([
    db.user.create({ data: { email: 'sarah.chen@stmarys.test', name: 'Sarah Chen', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[0].id } }),
    db.user.create({ data: { email: 'mark.lu@stmarys.test', name: 'Mark Lu', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[0].id } }),
    db.user.create({ data: { email: 'priya.n@lakeside.test', name: 'Priya Nair', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[1].id } }),
    db.user.create({ data: { email: 'david.k@lakeside.test', name: 'David Kim', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[1].id } }),
    db.user.create({ data: { email: 'linda.f@northgate.test', name: 'Linda Ford', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[2].id } }),
    db.user.create({ data: { email: 'omar.s@northgate.test', name: 'Omar Saleh', passwordHash: PASSWORD, role: Role.hospital_admin, hospitalId: hospitals[2].id } }),
  ])

  console.log('Creating staff...')
  const staff = await Promise.all([
    db.user.create({
      data: {
        email: 'james.morrison@staff.test', name: 'James Morrison', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Emergency Medicine', experienceYears: 8, location: 'Toronto, ON',
        availability: 'Weekends, evenings', preferredTypes: 'locum,permanent',
        bio: 'Board-certified ER physician with 8 years of experience in high-volume urban trauma centres.',
      },
    }),
    db.user.create({
      data: {
        email: 'anita.rao@staff.test', name: 'Anita Rao', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'ICU Nursing', experienceYears: 6, location: 'Mississauga, ON',
        availability: 'Full-time', preferredTypes: 'permanent',
        bio: 'Critical care RN with CCRN certification. Experienced in ECMO and post-cardiac surgical care.',
      },
    }),
    db.user.create({
      data: {
        email: 'kevin.park@staff.test', name: 'Kevin Park', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Internal Medicine', experienceYears: 4, location: 'Toronto, ON',
        availability: 'Flexible', preferredTypes: 'locum',
        bio: 'IM hospitalist looking for short-term locum blocks. Comfortable with admissions and code response.',
      },
    }),
    db.user.create({
      data: {
        email: 'sofia.delgado@staff.test', name: 'Sofia Delgado', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Pediatric Nursing', experienceYears: 10, location: 'North York, ON',
        availability: 'Part-time', preferredTypes: 'locum,permanent',
        bio: 'Pediatric RN with extensive peds ED experience. Bilingual EN/ES.',
      },
    }),
    db.user.create({
      data: {
        email: 'robert.ng@staff.test', name: 'Robert Ng', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Anesthesiology', experienceYears: 12, location: 'Toronto, ON',
        availability: 'Select weekends', preferredTypes: 'locum',
        bio: 'Staff anesthesiologist seeking supplemental locum shifts. Regional anesthesia sub-specialty.',
      },
    }),
    db.user.create({
      data: {
        email: 'hannah.yusuf@staff.test', name: 'Hannah Yusuf', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Physiotherapy', experienceYears: 5, location: 'Mississauga, ON',
        availability: 'Full-time', preferredTypes: 'permanent',
        bio: 'Registered physiotherapist with orthopaedic and post-surgical rehab focus.',
      },
    }),
    db.user.create({
      data: {
        email: 'carlos.rivera@staff.test', name: 'Carlos Rivera', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Family Medicine', experienceYears: 3, location: 'North York, ON',
        availability: 'Full-time', preferredTypes: 'permanent',
        bio: 'Family physician relocating to GTA; looking for a permanent outpatient or hybrid role.',
      },
    }),
    db.user.create({
      data: {
        email: 'emily.tan@staff.test', name: 'Emily Tan', passwordHash: PASSWORD, role: Role.staff,
        specialty: 'Diagnostic Radiology', experienceYears: 7, location: 'Toronto, ON',
        availability: 'Evenings / weekends', preferredTypes: 'locum',
        bio: 'Radiologist with teleradiology experience. Available for evening/weekend locum reads.',
      },
    }),
  ])

  console.log('Creating credentials...')
  const credSpecs: Array<{user: typeof staff[number]; type: string; name: string; expiryInDays?: number}> = [
    { user: staff[0], type: 'license', name: 'CPSO License — Emergency Medicine', expiryInDays: 220 },
    { user: staff[0], type: 'certification', name: 'ACLS Certification', expiryInDays: 25 },
    { user: staff[0], type: 'certification', name: 'ATLS Certification', expiryInDays: 400 },
    { user: staff[1], type: 'license', name: 'CNO Registration — RN', expiryInDays: 18 },
    { user: staff[1], type: 'certification', name: 'CCRN — Adult Critical Care', expiryInDays: 600 },
    { user: staff[2], type: 'license', name: 'CPSO License — Internal Medicine', expiryInDays: 500 },
    { user: staff[3], type: 'license', name: 'CNO Registration — RN, Peds', expiryInDays: 320 },
    { user: staff[3], type: 'certification', name: 'PALS Certification', expiryInDays: 90 },
    { user: staff[4], type: 'license', name: 'CPSO License — Anesthesiology', expiryInDays: 730 },
    { user: staff[5], type: 'license', name: 'College of Physiotherapists of Ontario', expiryInDays: 28 },
    { user: staff[6], type: 'license', name: 'CPSO License — Family Medicine', expiryInDays: 410 },
    { user: staff[7], type: 'license', name: 'CPSO License — Diagnostic Radiology', expiryInDays: 200 },
  ]
  for (const c of credSpecs) {
    const issue = new Date(Date.now() - 365 * 24 * 3600 * 1000)
    const expiry = c.expiryInDays ? new Date(Date.now() + c.expiryInDays * 24 * 3600 * 1000) : null
    await db.credential.create({
      data: {
        userId: c.user.id, type: c.type, name: c.name, fileUrl: '',
        issueDate: issue, expiryDate: expiry, verified: true,
      },
    })
  }

  console.log('Creating offers...')
  const now = Date.now()
  const day = 24 * 3600 * 1000

  const offerSpecs: Array<{ adminIdx: number; hospitalIdx: number; type: OfferType; title: string; specialty: string; status: OfferStatus; locum?: any; perm?: any; urgent?: boolean }>= [
    { adminIdx: 0, hospitalIdx: 0, type: OfferType.locum, title: 'Locum ER Physician — Weekend Coverage', specialty: 'Emergency Medicine', status: OfferStatus.published, urgent: true,
      locum: { shiftStart: new Date(now + 4*day), shiftEnd: new Date(now + 5*day), rate: 220, rateUnit: 'hourly' } },
    { adminIdx: 0, hospitalIdx: 0, type: OfferType.permanent, title: 'Staff Cardiologist — Full-Time', specialty: 'Cardiology', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 380000, salaryMax: 460000, benefits: 'Comprehensive benefits, RRSP matching, CME stipend $5,000, 6 weeks vacation.' } },
    { adminIdx: 1, hospitalIdx: 0, type: OfferType.locum, title: 'Locum ICU RN — Night Shifts', specialty: 'ICU Nursing', status: OfferStatus.published,
      locum: { shiftStart: new Date(now + 10*day), shiftEnd: new Date(now + 12*day), rate: 65, rateUnit: 'hourly' } },
    { adminIdx: 1, hospitalIdx: 0, type: OfferType.permanent, title: 'OB/GYN — Permanent Part-Time', specialty: 'Obstetrics & Gynecology', status: OfferStatus.draft,
      perm: { employmentType: 'part-time', salaryMin: 180000, salaryMax: 220000, benefits: 'Prorated benefits, CMPA coverage.' } },
    { adminIdx: 2, hospitalIdx: 1, type: OfferType.locum, title: 'Locum Hospitalist — 2-Week Block', specialty: 'Internal Medicine', status: OfferStatus.published,
      locum: { shiftStart: new Date(now + 14*day), shiftEnd: new Date(now + 28*day), rate: 1800, rateUnit: 'daily' } },
    { adminIdx: 2, hospitalIdx: 1, type: OfferType.permanent, title: 'Oncology Pharmacist — Full-Time', specialty: 'Pharmacy', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 120000, salaryMax: 145000, benefits: 'Pension, health/dental, professional development fund.' } },
    { adminIdx: 3, hospitalIdx: 1, type: OfferType.locum, title: 'Locum Anesthesiologist — Evenings', specialty: 'Anesthesiology', status: OfferStatus.published, urgent: true,
      locum: { shiftStart: new Date(now + 6*day), shiftEnd: new Date(now + 7*day), rate: 250, rateUnit: 'hourly' } },
    { adminIdx: 3, hospitalIdx: 1, type: OfferType.permanent, title: 'Senior Physiotherapist — Orthopaedics', specialty: 'Physiotherapy', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 85000, salaryMax: 102000, benefits: 'HOOPP pension, CE budget $2,500, flexible scheduling.' } },
    { adminIdx: 2, hospitalIdx: 1, type: OfferType.locum, title: 'Locum Peds RN — Holiday Coverage', specialty: 'Pediatric Nursing', status: OfferStatus.filled,
      locum: { shiftStart: new Date(now - 2*day), shiftEnd: new Date(now - 1*day), rate: 70, rateUnit: 'hourly' } },
    { adminIdx: 4, hospitalIdx: 2, type: OfferType.permanent, title: 'Family Physician — Outpatient Clinic', specialty: 'Family Medicine', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 280000, salaryMax: 340000, benefits: 'RRSP match 5%, CMPA reimbursement, 4 weeks vacation to start.' } },
    { adminIdx: 4, hospitalIdx: 2, type: OfferType.locum, title: 'Locum Radiologist — Weekday Reads', specialty: 'Diagnostic Radiology', status: OfferStatus.published,
      locum: { shiftStart: new Date(now + 3*day), shiftEnd: new Date(now + 9*day), rate: 1500, rateUnit: 'daily' } },
    { adminIdx: 5, hospitalIdx: 2, type: OfferType.permanent, title: 'Geriatric Nurse Practitioner', specialty: 'Geriatrics', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 130000, salaryMax: 152000, benefits: 'Pension, licensure reimbursement, mentoring program.' } },
    { adminIdx: 5, hospitalIdx: 2, type: OfferType.locum, title: 'Locum Pharmacist — Maternity Leave Coverage', specialty: 'Pharmacy', status: OfferStatus.closed,
      locum: { shiftStart: new Date(now + 60*day), shiftEnd: new Date(now + 150*day), rate: 75, rateUnit: 'hourly' } },
    { adminIdx: 4, hospitalIdx: 2, type: OfferType.locum, title: 'Locum ER Physician — Stat (Tonight)', specialty: 'Emergency Medicine', status: OfferStatus.published, urgent: true,
      locum: { shiftStart: new Date(now + 0.2*day), shiftEnd: new Date(now + 0.5*day), rate: 260, rateUnit: 'hourly' } },
    { adminIdx: 2, hospitalIdx: 1, type: OfferType.permanent, title: 'Clinical Psychologist — Mental Health Program', specialty: 'Psychology', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 95000, salaryMax: 115000, benefits: 'Comprehensive benefits, supervision hours toward licensure supported.' } },
    // Additional offers for richer demo data
    { adminIdx: 0, hospitalIdx: 0, type: OfferType.locum, title: 'Locum Trauma Surgeon — On-Call', specialty: 'Surgery', status: OfferStatus.published, urgent: true,
      locum: { shiftStart: new Date(now + 2*day), shiftEnd: new Date(now + 3*day), rate: 320, rateUnit: 'hourly' } },
    { adminIdx: 1, hospitalIdx: 0, type: OfferType.permanent, title: 'Psychiatric Nurse Practitioner', specialty: 'Psychology', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 125000, salaryMax: 148000, benefits: 'Pension, CE allowance, supervision provided.' } },
    { adminIdx: 2, hospitalIdx: 1, type: OfferType.locum, title: 'Locum ER RN — Day Shifts', specialty: 'ICU Nursing', status: OfferStatus.published,
      locum: { shiftStart: new Date(now + 7*day), shiftEnd: new Date(now + 9*day), rate: 60, rateUnit: 'hourly' } },
    { adminIdx: 3, hospitalIdx: 1, type: OfferType.permanent, title: 'Orthopaedic Surgeon — Joint Replacement', specialty: 'Orthopaedics', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 420000, salaryMax: 510000, benefits: 'CMPA reimbursement, 7 weeks vacation, OR block time guaranteed.' } },
    { adminIdx: 4, hospitalIdx: 2, type: OfferType.locum, title: 'Locum Pediatrician — Weekend Clinic', specialty: 'Pediatric Nursing', status: OfferStatus.published,
      locum: { shiftStart: new Date(now + 5*day), shiftEnd: new Date(now + 6*day), rate: 200, rateUnit: 'hourly' } },
    { adminIdx: 5, hospitalIdx: 2, type: OfferType.permanent, title: 'Internal Medicine Hospitalist', specialty: 'Internal Medicine', status: OfferStatus.published,
      perm: { employmentType: 'full-time', salaryMin: 320000, salaryMax: 380000, benefits: 'Block scheduling (7 on / 7 off), comprehensive benefits, RRSP match.' } },
  ]

  const offers: any[] = []
  for (const s of offerSpecs) {
    const admin = admins[s.adminIdx]
    const hospital = hospitals[s.hospitalIdx]
    const o = await db.offer.create({
      data: {
        hospitalId: hospital.id,
        createdById: admin.id,
        type: s.type,
        title: s.title,
        specialty: s.specialty,
        description: `Join ${hospital.name} as ${s.title}. We are looking for a qualified ${s.specialty} professional who can integrate into our team and contribute to high-quality patient care. This is a ${s.type === 'locum' ? 'locum' : 'permanent'} opportunity with ${s.urgent ? 'urgent' : 'standard'} timing.`,
        requirements: JSON.stringify(['Active provincial license', 'Minimum 2 years relevant experience', 'Current BLS/ACLS as applicable', 'Excellent communication skills']),
        location: hospital.address,
        status: s.status,
        visibility: Visibility.public,
        deadline: new Date(now + 30 * day),
        shiftStart: s.locum?.shiftStart ?? null,
        shiftEnd: s.locum?.shiftEnd ?? null,
        rate: s.locum?.rate ?? null,
        rateUnit: s.locum?.rateUnit ?? null,
        urgent: s.urgent ?? false,
        employmentType: s.perm?.employmentType ?? null,
        salaryMin: s.perm?.salaryMin ?? null,
        salaryMax: s.perm?.salaryMax ?? null,
        benefits: s.perm?.benefits ?? null,
      },
    })
    offers.push(o)
  }

  console.log('Creating applications...')
  const appSpecs: Array<{offerIdx: number; staffIdx: number; status: ApplicationStatus; daysAgo: number; note?: string}> = [
    { offerIdx: 0, staffIdx: 0, status: ApplicationStatus.shortlisted, daysAgo: 3, note: 'Available all weekend. Familiar with St. Mary\u2019s EMR.' },
    { offerIdx: 0, staffIdx: 2, status: ApplicationStatus.under_review, daysAgo: 2 },
    { offerIdx: 0, staffIdx: 6, status: ApplicationStatus.applied, daysAgo: 1 },
    { offerIdx: 4, staffIdx: 2, status: ApplicationStatus.offered, daysAgo: 5, note: '2-week block fits perfectly between rotations.' },
    { offerIdx: 4, staffIdx: 0, status: ApplicationStatus.applied, daysAgo: 4 },
    { offerIdx: 7, staffIdx: 5, status: ApplicationStatus.shortlisted, daysAgo: 6 },
    { offerIdx: 1, staffIdx: 0, status: ApplicationStatus.applied, daysAgo: 8 },
    { offerIdx: 9, staffIdx: 6, status: ApplicationStatus.offered, daysAgo: 10, note: 'Permanent role aligns with long-term relocation plans.' },
    { offerIdx: 10, staffIdx: 7, status: ApplicationStatus.applied, daysAgo: 2 },
    { offerIdx: 3, staffIdx: 3, status: ApplicationStatus.under_review, daysAgo: 1 },
    { offerIdx: 5, staffIdx: 1, status: ApplicationStatus.applied, daysAgo: 4 },
    { offerIdx: 13, staffIdx: 0, status: ApplicationStatus.accepted, daysAgo: 1, note: 'Confirming availability for tonight.' },
    { offerIdx: 2, staffIdx: 1, status: ApplicationStatus.applied, daysAgo: 1 },
    { offerIdx: 7, staffIdx: 4, status: ApplicationStatus.applied, daysAgo: 3 },
    // Applications to additional offers
    { offerIdx: 15, staffIdx: 7, status: ApplicationStatus.applied, daysAgo: 2, note: 'Sub-specialty in trauma imaging — happy to cover call.' },
    { offerIdx: 17, staffIdx: 3, status: ApplicationStatus.under_review, daysAgo: 3, note: 'Peds ED experience directly transferable to weekend clinic.' },
    { offerIdx: 17, staffIdx: 1, status: ApplicationStatus.applied, daysAgo: 1 },
    { offerIdx: 18, staffIdx: 2, status: ApplicationStatus.shortlisted, daysAgo: 4, note: 'Block scheduling fits perfectly — 7 on 7 off is ideal.' },
    { offerIdx: 18, staffIdx: 6, status: ApplicationStatus.applied, daysAgo: 2 },
    { offerIdx: 16, staffIdx: 0, status: ApplicationStatus.applied, daysAgo: 5 },
    { offerIdx: 14, staffIdx: 5, status: ApplicationStatus.under_review, daysAgo: 4 },
    { offerIdx: 14, staffIdx: 6, status: ApplicationStatus.applied, daysAgo: 2 },
  ]
  for (const a of appSpecs) {
    const offer = offers[a.offerIdx]
    const user = staff[a.staffIdx]
    if (!offer || !user) continue
    const appliedAt = new Date(now - a.daysAgo * day)
    await db.application.create({
      data: {
        offerId: offer.id,
        userId: user.id,
        status: a.status,
        coverNote: a.note ?? null,
        appliedAt,
        updatedAt: new Date(now - Math.max(0, a.daysAgo - 1) * day),
      },
    })
  }

  console.log('Creating saved offers...')
  await db.savedOffer.create({ data: { userId: staff[0].id, offerId: offers[4].id } })
  await db.savedOffer.create({ data: { userId: staff[0].id, offerId: offers[1].id } })
  await db.savedOffer.create({ data: { userId: staff[2].id, offerId: offers[13].id } })
  await db.savedOffer.create({ data: { userId: staff[5].id, offerId: offers[7].id } })

  console.log('Creating messages...')
  await db.message.create({ data: { offerId: offers[0].id, senderId: admins[0].id, recipientId: staff[0].id, body: 'Hi James — thanks for applying! Could you confirm your ACLS is current through the shift dates?', createdAt: new Date(now - 2*day) } })
  await db.message.create({ data: { offerId: offers[0].id, senderId: staff[0].id, recipientId: admins[0].id, body: 'Hi Sarah — yes, ACLS is valid until late 2026. I can forward the certificate.', read: true, createdAt: new Date(now - 2*day + 3600*1000) } })
  await db.message.create({ data: { offerId: offers[0].id, senderId: admins[0].id, recipientId: staff[0].id, body: 'Great, please do. Looking forward to having you on the weekend.', read: true, createdAt: new Date(now - 1*day) } })
  await db.message.create({ data: { offerId: offers[4].id, senderId: admins[2].id, recipientId: staff[2].id, body: 'Hi Kevin — we\u2019d love to extend an offer for the 2-week block. Please review the terms in your dashboard.', createdAt: new Date(now - 1*day) } })
  // Additional message threads
  await db.message.create({ data: { offerId: offers[1].id, senderId: admins[0].id, recipientId: staff[0].id, body: 'Hi James — thanks for your interest in the Cardiologist role. Are you available for an interview next week?', createdAt: new Date(now - 4*day) } })
  await db.message.create({ data: { offerId: offers[1].id, senderId: staff[0].id, recipientId: admins[0].id, body: 'Hi Sarah — yes, Tuesday or Thursday afternoon works. Happy to come on-site or do a video call.', read: true, createdAt: new Date(now - 4*day + 7200*1000) } })
  await db.message.create({ data: { offerId: offers[18].id, senderId: admins[5].id, recipientId: staff[2].id, body: 'Hi Kevin — your background is a great fit for the Hospitalist role. Can we schedule a quick call?', createdAt: new Date(now - 2*day) } })
  await db.message.create({ data: { offerId: offers[17].id, senderId: admins[4].id, recipientId: staff[3].id, body: 'Hi Sofia — thanks for applying to the weekend peds clinic. We\u2019re reviewing applications now.', createdAt: new Date(now - 2*day) } })
  await db.message.create({ data: { senderId: admins[2].id, recipientId: staff[5].id, body: 'Hi Hannah — we liked your physiotherapy application. Could you share a reference contact?', createdAt: new Date(now - 5*day) } })
  await db.message.create({ data: { senderId: staff[5].id, recipientId: admins[2].id, body: 'Hi Priya — sure, I\u2019ll email you the details today. Thanks for getting back to me!', read: true, createdAt: new Date(now - 5*day + 5400*1000) } })

  console.log('Creating notifications...')
  await db.notification.create({ data: { userId: staff[0].id, type: 'message', title: 'New message from Sarah Chen', body: 'Hi James — thanks for applying! Could you confirm...', createdAt: new Date(now - 2*day) } })
  await db.notification.create({ data: { userId: staff[0].id, type: 'match', title: 'New offer matches your profile', body: 'Locum ER Physician — Weekend Coverage at St. Mary\u2019s.', createdAt: new Date(now - 3*day) } })
  await db.notification.create({ data: { userId: staff[0].id, type: 'credential_expiry', title: 'ACLS expires in 25 days', body: 'Renew before it lapses to keep applications active.', createdAt: new Date(now - 1*day) } })
  await db.notification.create({ data: { userId: staff[1].id, type: 'credential_expiry', title: 'CNO Registration expires in 18 days', body: 'Renew before it lapses.', createdAt: new Date(now - 1*day) } })
  await db.notification.create({ data: { userId: staff[2].id, type: 'application_status', title: 'Application status updated', body: 'Locum Hospitalist — you\u2019ve been shortlisted.', createdAt: new Date(now - 1*day) } })
  await db.notification.create({ data: { userId: staff[2].id, type: 'match', title: 'New offer matches your profile', body: 'Locum Hospitalist — 2-Week Block at Lakeside Regional.', createdAt: new Date(now - 5*day) } })
  await db.notification.create({ data: { userId: staff[5].id, type: 'application_status', title: 'Application status updated', body: 'Senior Physiotherapist — shortlisted.', createdAt: new Date(now - 6*day) } })
  await db.notification.create({ data: { userId: staff[0].id, type: 'urgent_shift', title: 'Shift starts in 24 hours', body: 'Locum ER Physician — Stat (Tonight). Please confirm.', createdAt: new Date(now - 0.1*day) } })
  await db.notification.create({ data: { userId: admins[0].id, type: 'application', title: 'New application received', body: 'James Morrison applied to Locum ER Physician — Weekend Coverage.', createdAt: new Date(now - 3*day) } })
  await db.notification.create({ data: { userId: admins[2].id, type: 'application', title: 'New application received', body: 'Kevin Park applied to Locum Hospitalist — 2-Week Block.', createdAt: new Date(now - 5*day) } })
  // Additional notifications
  await db.notification.create({ data: { userId: staff[2].id, type: 'message', title: 'New message from Omar Saleh', body: 'Hi Kevin — your background is a great fit...', createdAt: new Date(now - 2*day) } })
  await db.notification.create({ data: { userId: staff[3].id, type: 'message', title: 'New message from Linda Ford', body: 'Hi Sofia — thanks for applying to the weekend peds clinic...', createdAt: new Date(now - 2*day) } })
  await db.notification.create({ data: { userId: staff[5].id, type: 'message', title: 'New message from Priya Nair', body: 'Hi Hannah — we liked your physiotherapy application...', createdAt: new Date(now - 5*day) } })
  await db.notification.create({ data: { userId: staff[7].id, type: 'match', title: 'New offer matches your profile', body: 'Locum Trauma Surgeon — On-Call at St. Mary\u2019s.', createdAt: new Date(now - 1*day) } })
  await db.notification.create({ data: { userId: staff[6].id, type: 'match', title: 'New offer matches your profile', body: 'Internal Medicine Hospitalist at Northgate Community.', createdAt: new Date(now - 3*day) } })
  await db.notification.create({ data: { userId: staff[5].id, type: 'credential_expiry', title: 'Physiotherapists of Ontario license expires in 28 days', body: 'Renew before it lapses.', createdAt: new Date(now - 1*day) } })
  await db.notification.create({ data: { userId: admins[4].id, type: 'application', title: 'New application received', body: 'Sofia Delgado applied to Locum Pediatrician — Weekend Clinic.', createdAt: new Date(now - 3*day) } })
  await db.notification.create({ data: { userId: admins[5].id, type: 'application', title: 'New application received', body: 'Kevin Park applied to Internal Medicine Hospitalist.', createdAt: new Date(now - 4*day) } })
  await db.notification.create({ data: { userId: admins[0].id, type: 'application', title: 'New application received', body: 'Carlos Rivera applied to Psychiatric Nurse Practitioner.', createdAt: new Date(now - 5*day) } })

  console.log('Creating audit events...')
  for (const o of offers) {
    await db.auditEvent.create({ data: { offerId: o.id, actorId: o.createdById, action: 'created', detail: 'Offer created', createdAt: o.createdAt } })
    if (o.status !== 'draft') {
      await db.auditEvent.create({ data: { offerId: o.id, actorId: o.createdById, action: 'published', detail: 'Offer published', createdAt: new Date(o.createdAt.getTime() + 60000) } })
    }
  }

  console.log('\n--- Seed complete ---')
  console.log(`Hospitals: ${hospitals.length}`)
  console.log(`Admins: ${admins.length}`)
  console.log(`Staff: ${staff.length}`)
  console.log(`Offers: ${offers.length}`)
  console.log(`Applications: ${appSpecs.length}`)
  console.log('\nLogin credentials:')
  console.log('  Any seeded account, password: password123')
  console.log('  Try: sarah.chen@stmarys.test (admin)  or  james.morrison@staff.test (staff)')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
