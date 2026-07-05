-- Scholar-Pulse: Seed Kenyan applicants from the Mt. Kenya region
-- Run this in Supabase Dashboard → SQL Editor
-- Prerequisite: ALTER TABLE applicants ADD COLUMN IF NOT EXISTS profile_photo_url text;

INSERT INTO applicants (
  id, first_name, last_name, email, date_of_birth, nationality,
  institution, program, year_of_study, location, age,
  child_status, academic_merit, character_leadership,
  guardian_name, guardian_contact,
  hardship_chronically_ill, hardship_distance_to_school,
  hardship_heavy_chores, hardship_no_clean_water,
  notes, status, total_score, applied_date
) VALUES

-- 1. Nyeri High School
(gen_random_uuid(), 'Wanjiku', 'Kariuki', 'wanjiku.kariuki@student.ke',
 '2010-03-14', 'Kenyan', 'Nyeri High School', 'Sciences', 9,
 'Nyeri', 14, 'double_orphan', 'ee', 'excellent',
 'Mama Wanjiku (Aunt)', '+254 722 001 001',
 true, false, true, false,
 'Top student in her class. Both parents passed in 2020.',
 'pending', 87, '2026-05-10'),

-- 2. Nyeri High School
(gen_random_uuid(), 'Kamau', 'Mwangi', 'kamau.mwangi@student.ke',
 '2010-08-22', 'Kenyan', 'Nyeri High School', 'Humanities', 9,
 'Nyeri', 14, 'single_orphan', 'me', 'good',
 'John Mwangi (Father)', '+254 733 002 002',
 false, true, false, true,
 'Father is the sole provider. School is 12 km from home.',
 'pending', 63, '2026-05-11'),

-- 3. Kagumo High School (Nyeri)
(gen_random_uuid(), 'Njeri', 'Gitau', 'njeri.gitau@student.ke',
 '2010-01-05', 'Kenyan', 'Kagumo High School', 'Sciences', 9,
 'Nyeri', 14, 'child_of_disabled', 'ee', 'excellent',
 'Grace Gitau (Mother)', '+254 711 003 003',
 false, false, true, false,
 'Father is wheelchair-bound. Njeri excels in STEM.',
 'pending', 79, '2026-05-12'),

-- 4. Kagumo High School
(gen_random_uuid(), 'Maina', 'Ndegwa', 'maina.ndegwa@student.ke',
 '2010-11-18', 'Kenyan', 'Kagumo High School', 'Arts', 9,
 'Nyeri', 14, 'guardian_only', 'me', 'average',
 'Peter Ndegwa (Uncle)', '+254 700 004 004',
 false, true, true, false,
 'Raised by uncle after both parents migrated. Reliable attendance.',
 'pending', 54, '2026-05-13'),

-- 5. Kamuthe Girls High School (Nyeri)
(gen_random_uuid(), 'Wambui', 'Njogu', 'wambui.njogu@student.ke',
 '2010-06-30', 'Kenyan', 'Kamuthe Girls High School', 'Sciences', 9,
 'Nyeri', 14, 'double_orphan', 'me', 'excellent',
 'Agnes Njogu (Grandmother)', '+254 722 005 005',
 true, false, false, true,
 'Living with aging grandmother. Chronic illness in household.',
 'pending', 75, '2026-05-14'),

-- 6. Kamuthe Girls High School
(gen_random_uuid(), 'Faith', 'Wachira', 'faith.wachira@student.ke',
 '2010-04-09', 'Kenyan', 'Kamuthe Girls High School', 'Humanities', 9,
 'Nyeri', 14, 'both_parents', 'ee', 'excellent',
 'James Wachira (Father)', '+254 733 006 006',
 false, false, false, false,
 'Strong academic record. Parents present but income is very low.',
 'pending', 60, '2026-05-15'),

-- 7. Chuka High School (Tharaka-Nithi)
(gen_random_uuid(), 'Gitonga', 'Mburugu', 'gitonga.mburugu@student.ke',
 '2010-09-25', 'Kenyan', 'Chuka High School', 'Sciences', 9,
 'Tharaka-Nithi', 14, 'single_orphan', 'ee', 'good',
 'Esther Mburugu (Mother)', '+254 711 007 007',
 false, true, false, true,
 'Mother is a casual labourer. Long distance to school.',
 'pending', 72, '2026-05-16'),

-- 8. Chuka High School
(gen_random_uuid(), 'Miriam', 'Kathure', 'miriam.kathure@student.ke',
 '2010-02-17', 'Kenyan', 'Chuka High School', 'Arts', 9,
 'Tharaka-Nithi', 14, 'child_of_disabled', 'me', 'good',
 'Ruth Kathure (Mother)', '+254 722 008 008',
 true, false, true, false,
 'Disabled father. Miriam helps with chores before and after school.',
 'pending', 65, '2026-05-17'),

-- 9. St. Joseph's High School Chogoria (Tharaka-Nithi)
(gen_random_uuid(), 'Samuel', 'Njiru', 'samuel.njiru@student.ke',
 '2010-07-11', 'Kenyan', 'St. Joseph''s High School Chogoria', 'Sciences', 9,
 'Tharaka-Nithi', 14, 'double_orphan', 'ae', 'average',
 'Simon Njiru (Elder Brother)', '+254 700 009 009',
 false, true, true, true,
 'Raised by older sibling. No clean water access at home.',
 'pending', 58, '2026-05-18'),

-- 10. Kangaru High School (Embu)
(gen_random_uuid(), 'Lydia', 'Mwenda', 'lydia.mwenda@student.ke',
 '2010-10-03', 'Kenyan', 'Kangaru High School', 'Sciences', 9,
 'Embu', 14, 'single_orphan', 'ee', 'excellent',
 'David Mwenda (Father)', '+254 711 010 010',
 false, false, false, false,
 'Exceptional student. Father is a small-scale farmer.',
 'pending', 75, '2026-05-19'),

-- 11. Kangaru High School
(gen_random_uuid(), 'Brian', 'Mutua', 'brian.mutua@student.ke',
 '2010-05-20', 'Kenyan', 'Kangaru High School', 'Humanities', 9,
 'Embu', 14, 'guardian_only', 'ae', 'good',
 'Caroline Mutua (Aunt)', '+254 733 011 011',
 false, true, false, true,
 'Parents absent. Brian walks 9 km to school daily.',
 'pending', 50, '2026-05-20'),

-- 12. Kianjokoma Boys High School (Embu)
(gen_random_uuid(), 'Patrick', 'Kimani', 'patrick.kimani@student.ke',
 '2010-12-07', 'Kenyan', 'Kianjokoma Boys High School', 'Sciences', 9,
 'Embu', 14, 'child_of_disabled', 'me', 'good',
 'Anne Kimani (Mother)', '+254 722 012 012',
 true, false, true, false,
 'Mother works as a community health worker. Father disabled.',
 'pending', 63, '2026-05-21'),

-- 13. Muthengera Secondary School (Murang'a)
(gen_random_uuid(), 'Charity', 'Wambui', 'charity.wambui@student.ke',
 '2010-03-28', 'Kenyan', 'Muthengera Secondary School', 'Arts', 9,
 'Murang''a', 14, 'double_orphan', 'me', 'excellent',
 'Mary Wambui (Aunt)', '+254 700 013 013',
 false, false, true, true,
 'Orphaned at 7. Very motivated learner.',
 'pending', 70, '2026-05-22'),

-- 14. Muthengera Secondary School
(gen_random_uuid(), 'George', 'Mugo', 'george.mugo@student.ke',
 '2010-08-14', 'Kenyan', 'Muthengera Secondary School', 'Sciences', 9,
 'Murang''a', 14, 'both_parents', 'ae', 'average',
 'Joseph Mugo (Father)', '+254 711 014 014',
 false, true, false, false,
 'Parents are subsistence farmers. George shows strong potential.',
 'pending', 39, '2026-05-23'),

-- 15. Kimathi Institute Secondary (Nyeri)
(gen_random_uuid(), 'Eunice', 'Wanjiru', 'eunice.wanjiru@student.ke',
 '2010-06-01', 'Kenyan', 'Kimathi Institute Secondary', 'Sciences', 9,
 'Nyeri', 14, 'single_orphan', 'ee', 'excellent',
 'Hannah Wanjiru (Mother)', '+254 722 015 015',
 true, true, false, false,
 'Mother is chronically ill. Eunice top of her class despite hardship.',
 'pending', 78, '2026-05-24')

ON CONFLICT DO NOTHING;
