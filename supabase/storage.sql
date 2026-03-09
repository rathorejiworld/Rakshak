-- Create storage bucket for evidence files
insert into storage.buckets (id, name, public) 
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Storage policies for evidence bucket
create policy "Evidence upload for authenticated users"
on storage.objects for insert
to authenticated
with check (bucket_id = 'evidence');

create policy "Evidence download for authorized users"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidence'
  and (
    -- Root can access all
    exists (select 1 from public.profiles where id = auth.uid() and role = 'root')
    or
    -- Teachers can access evidence for their reports
    exists (
      select 1 from public.evidence e
      join public.reports r on r.id = e.report_id
      join public.profiles p on p.id = auth.uid()
      where e.storage_path = name
        and p.role = 'teacher'
        and (r.teacher_owner = p.id or r.reporter_id in (select id from public.profiles where class = p.class))
    )
    or
    -- Students can access their own evidence
    exists (
      select 1 from public.evidence e
      join public.reports r on r.id = e.report_id
      where e.storage_path = name
        and (r.reporter_id = auth.uid() or e.uploaded_by = auth.uid())
    )
  )
);

create policy "Evidence delete for root only"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'evidence'
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'root')
);
