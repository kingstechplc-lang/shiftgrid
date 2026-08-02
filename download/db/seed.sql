-- ShiftGrid — SQL seed data
-- Run after migration.sql to populate with realistic sample data.
--
-- Usage:
--   psql "$DATABASE_URL" -f seed.sql
--
-- All passwords are SHA-256 of "password123":
--   ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936
--
-- Idempotent: uses ON CONFLICT DO NOTHING so re-running is safe.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Hospitals
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO hospitals (id, name, description, address, verified) VALUES
  ('11111111-0000-0000-0000-000000000001',
   'St. Mary''s General Hospital',
   'A 600-bed tertiary care centre specializing in emergency medicine, cardiology, and women''s health. Serving the community since 1937.',
   '125 Queen St E, Toronto, ON M5C 1S6',
   TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hospitals (id, name, description, address, verified) VALUES
  ('11111111-0000-0000-0000-000000000002',
   'Lakeside Regional Medical Centre',
   'A modern 420-bed regional hospital with a Level II trauma centre, advanced oncology unit, and a thriving allied health program.',
   '880 Lakefront Dr, Mississauga, ON L5B 0E9',
   TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hospitals (id, name, description, address, verified) VALUES
  ('11111111-0000-0000-0000-000000000003',
   'Northgate Community Hospital',
   'A 280-bed community hospital focused on family medicine, geriatrics, and outpatient surgery. Strong teaching affiliation.',
   '15 Northgate Blvd, North York, ON M3N 1V9',
   FALSE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Admins
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000001', 'sarah.chen@stmarys.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Sarah Chen', 'hospital_admin', '11111111-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000002', 'mark.lu@stmarys.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Mark Lu', 'hospital_admin', '11111111-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000003', 'priya.n@lakeside.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Priya Nair', 'hospital_admin', '11111111-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000004', 'david.k@lakeside.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'David Kim', 'hospital_admin', '11111111-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000005', 'linda.f@northgate.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Linda Ford', 'hospital_admin', '11111111-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, hospital_id) VALUES
  ('22222222-0000-0000-0000-000000000006', 'omar.s@northgate.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Omar Saleh', 'hospital_admin', '11111111-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Staff
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000001', 'james.morrison@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'James Morrison', 'staff', 'Emergency Medicine', 8, 'Toronto, ON',
   'Weekends, evenings', 'locum,permanent',
   'Board-certified ER physician with 8 years of experience in high-volume urban trauma centres.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000002', 'anita.rao@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Anita Rao', 'staff', 'ICU Nursing', 6, 'Mississauga, ON',
   'Full-time', 'permanent',
   'Critical care RN with CCRN certification. Experienced in ECMO and post-cardiac surgical care.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000003', 'kevin.park@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Kevin Park', 'staff', 'Internal Medicine', 4, 'Toronto, ON',
   'Flexible', 'locum',
   'IM hospitalist looking for short-term locum blocks. Comfortable with admissions and code response.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000004', 'sofia.delgado@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Sofia Delgado', 'staff', 'Pediatric Nursing', 10, 'North York, ON',
   'Part-time', 'locum,permanent',
   'Pediatric RN with extensive peds ED experience. Bilingual EN/ES.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000005', 'robert.ng@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Robert Ng', 'staff', 'Anesthesiology', 12, 'Toronto, ON',
   'Select weekends', 'locum',
   'Staff anesthesiologist seeking supplemental locum shifts. Regional anesthesia sub-specialty.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000006', 'hannah.yusuf@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Hannah Yusuf', 'staff', 'Physiotherapy', 5, 'Mississauga, ON',
   'Full-time', 'permanent',
   'Registered physiotherapist with orthopaedic and post-surgical rehab focus.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000007', 'carlos.rivera@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Carlos Rivera', 'staff', 'Family Medicine', 3, 'North York, ON',
   'Full-time', 'permanent',
   'Family physician relocating to GTA; looking for a permanent outpatient or hybrid role.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, name, role, specialty, experience_years, location, availability, preferred_types, bio) VALUES
  ('33333333-0000-0000-0000-000000000008', 'emily.tan@staff.test',
   'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e936',
   'Emily Tan', 'staff', 'Diagnostic Radiology', 7, 'Toronto, ON',
   'Evenings / weekends', 'locum',
   'Radiologist with teleradiology experience. Available for evening/weekend locum reads.')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Offers (15 — mix of locum and permanent across all statuses)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO offers (id, hospital_id, created_by, type, title, specialty, description, requirements, location, status, visibility, deadline, shift_start, shift_end, rate, rate_unit, urgent, employment_type, salary_min, salary_max, benefits) VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'locum', 'Locum ER Physician — Weekend Coverage', 'Emergency Medicine',
   'Join St. Mary''s General Hospital as Locum ER Physician — Weekend Coverage.',
   '["Active provincial license","Minimum 2 years relevant experience","Current BLS/ACLS as applicable","Excellent communication skills"]',
   '125 Queen St E, Toronto, ON M5C 1S6', 'published', 'public',
   NOW() + INTERVAL '30 days',
   NOW() + INTERVAL '4 days', NOW() + INTERVAL '5 days', 220, 'hourly', TRUE,
   NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO offers (id, hospital_id, created_by, type, title, specialty, description, requirements, location, status, visibility, deadline, employment_type, salary_min, salary_max, benefits) VALUES
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'permanent', 'Staff Cardiologist — Full-Time', 'Cardiology',
   'Join St. Mary''s General Hospital as Staff Cardiologist.',
   '["Active provincial license","Minimum 2 years relevant experience","Current BLS/ACLS as applicable","Excellent communication skills"]',
   '125 Queen St E, Toronto, ON M5C 1S6', 'published', 'public',
   NOW() + INTERVAL '30 days',
   'full-time', 380000, 460000, 'Comprehensive benefits, RRSP matching, CME stipend $5,000, 6 weeks vacation.')
ON CONFLICT (id) DO NOTHING;

-- (additional offers follow the same pattern — see scripts/seed.ts for the full list)

-- ─────────────────────────────────────────────────────────────────────────────
-- Verification
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 'hospitals' AS table_name, COUNT(*) AS row_count FROM hospitals
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'offers', COUNT(*) FROM offers
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'credentials', COUNT(*) FROM credentials
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'saved_offers', COUNT(*) FROM saved_offers
UNION ALL SELECT 'audit_events', COUNT(*) FROM audit_events
ORDER BY table_name;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Demo logins (password: password123):
--   Hospital admin:  sarah.chen@stmarys.test
--   Healthcare staff: james.morrison@staff.test
-- ─────────────────────────────────────────────────────────────────────────────
