ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_status_check;

ALTER TABLE public.referrals
ADD CONSTRAINT referrals_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pending'::text,
      'contacted'::text,
      'scheduled'::text,
      'attended'::text,
      'converted'::text,
      'confirmed'::text,
      'rejected'::text
    ]
  )
);