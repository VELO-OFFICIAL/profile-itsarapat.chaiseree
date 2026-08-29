-- ============================================================
-- Put SSR.SHOP — โครงสร้างฐานข้อมูล Supabase
-- ใช้ร่วมกันได้ทั้ง 3 เว็บ (แยกด้วยคอลัมน์ source_site)
--
-- วิธีใช้: เปิด Supabase → เมนูซ้าย "SQL Editor" → New query
--          วางโค้ดทั้งหมดนี้ → กด Run
--          รันซ้ำได้ไม่พัง (ใช้ IF NOT EXISTS ทุกจุด)
-- ============================================================


-- ------------------------------------------------------------
-- ตารางที่ 1: contact_submissions — ข้อความจากฟอร์มติดต่อ/สั่งซื้อ
-- ------------------------------------------------------------
create table if not exists public.contact_submissions (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 100),
  contact          text not null check (char_length(contact) between 1 and 200),
  product_interest text          check (product_interest is null or char_length(product_interest) <= 100),
  message          text          check (message is null or char_length(message) <= 2000),
  source_site      text not null default 'put-ssr-shop' check (char_length(source_site) <= 50),
  created_at       timestamptz not null default now()
);

comment on table public.contact_submissions is 'ข้อความที่ลูกค้าส่งผ่านฟอร์มติดต่อของแต่ละเว็บ';
comment on column public.contact_submissions.contact is 'อีเมลหรือ LINE ID ที่ลูกค้ากรอกให้ติดต่อกลับ';
comment on column public.contact_submissions.source_site is 'เว็บที่ส่งมา เช่น put-ssr-shop';


-- ------------------------------------------------------------
-- ตารางที่ 2: page_visits — นับผู้เข้าชมแบบไม่ระบุตัวตน
-- ไม่เก็บ IP, ไม่เก็บ user agent, ไม่เก็บ cookie ระบุตัวบุคคล
-- ------------------------------------------------------------
create table if not exists public.page_visits (
  id          bigint generated always as identity primary key,
  page_path   text not null check (char_length(page_path) <= 300),
  source_site text not null default 'put-ssr-shop' check (char_length(source_site) <= 50),
  created_at  timestamptz not null default now()
);

comment on table public.page_visits is 'สถิติผู้เข้าชมแบบไม่ระบุตัวตน — ไม่มีข้อมูลส่วนบุคคลใดๆ';


-- ------------------------------------------------------------
-- Index ให้หน้า admin ดึงข้อมูลเร็ว
-- ------------------------------------------------------------
create index if not exists idx_contact_created  on public.contact_submissions (created_at desc);
create index if not exists idx_contact_site     on public.contact_submissions (source_site, created_at desc);
create index if not exists idx_visits_created   on public.page_visits (created_at desc);
create index if not exists idx_visits_site      on public.page_visits (source_site, created_at desc);


-- ============================================================
-- ความปลอดภัย (Row Level Security)
--
-- สำคัญมาก: API key ที่ฝังในหน้าเว็บ ใครก็เปิดดูได้
-- กฎด้านล่างจึงกำหนดให้ key นั้น "เขียนได้อย่างเดียว อ่านไม่ได้"
-- คนนอกส่งฟอร์มเข้ามาได้ แต่ดึงรายชื่อลูกค้าออกไปไม่ได้
-- ส่วนหน้า admin ต้องล็อกอินก่อนถึงจะอ่านข้อมูลได้
-- ============================================================

alter table public.contact_submissions enable row level security;
alter table public.page_visits         enable row level security;


-- ผู้เข้าชมทั่วไป (anon) — ส่งฟอร์มได้อย่างเดียว
drop policy if exists "anon_can_insert_contact" on public.contact_submissions;
create policy "anon_can_insert_contact"
  on public.contact_submissions
  for insert to anon
  with check (true);

-- ผู้เข้าชมทั่วไป (anon) — บันทึกสถิติเข้าชมได้อย่างเดียว
drop policy if exists "anon_can_insert_visit" on public.page_visits;
create policy "anon_can_insert_visit"
  on public.page_visits
  for insert to anon
  with check (true);


-- ผู้ที่ล็อกอินแล้ว (หน้า admin) — อ่านข้อมูลได้
drop policy if exists "authed_can_read_contact" on public.contact_submissions;
create policy "authed_can_read_contact"
  on public.contact_submissions
  for select to authenticated
  using (true);

drop policy if exists "authed_can_read_visits" on public.page_visits;
create policy "authed_can_read_visits"
  on public.page_visits
  for select to authenticated
  using (true);

-- ผู้ที่ล็อกอินแล้ว — ลบข้อความสแปมทิ้งได้
drop policy if exists "authed_can_delete_contact" on public.contact_submissions;
create policy "authed_can_delete_contact"
  on public.contact_submissions
  for delete to authenticated
  using (true);


-- ============================================================
-- VIEW สำหรับหน้า admin (สร้างไว้ล่วงหน้า ใช้ทีหลังได้เลย)
-- ============================================================

-- ยอดเข้าชมรายวัน แยกตามเว็บ
create or replace view public.daily_visits as
select
  source_site,
  date_trunc('day', created_at)::date as visit_date,
  count(*) as visits
from public.page_visits
group by source_site, date_trunc('day', created_at)::date
order by visit_date desc;


-- ============================================================
-- ตรวจสอบว่าติดตั้งสำเร็จ — ควรได้ 2 แถว และ rowsecurity = true ทั้งคู่
-- ============================================================
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('contact_submissions', 'page_visits');
