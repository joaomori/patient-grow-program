ALTER TABLE public.reward_rules ADD COLUMN IF NOT EXISTS image_url text;
CREATE POLICY "Public can view metas" ON storage.objects FOR SELECT USING (bucket_id = 'metas');
CREATE POLICY "Admins upload metas" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'metas' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update metas" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'metas' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete metas" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'metas' AND public.has_role(auth.uid(), 'admin'));