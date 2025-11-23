-- Run this in your Supabase SQL Editor to enable Realtime for the Comment table

-- 1. Enable replication for the table
alter table "Comment" replica identity full;

-- 2. Add the table to the publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table "Comment";
commit;

-- OR if the publication already exists and you just want to add the table:
-- alter publication supabase_realtime add table "Comment";
