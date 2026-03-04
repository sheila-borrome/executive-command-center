-- Seed the 5 entities
insert into public.entities (name, slug, color, sort_order) values
  ('LDU', 'ldu', '#f59e0b', 1),
  ('LDG', 'ldg', '#10b981', 2),
  ('SLDG', 'sldg', '#3b82f6', 3),
  ('LA County', 'lacounty', '#8b5cf6', 4),
  ('Big Kika', 'bigkika', '#ec4899', 5)
on conflict (slug) do update set name = excluded.name, color = excluded.color, sort_order = excluded.sort_order;
