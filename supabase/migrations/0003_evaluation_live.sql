-- Margin — live evaluation support (additive, safe to re-run).
--
-- Scoring moved out of this app into an external evaluator service
-- (see src/lib/evaluatorClient.ts). An evaluation row now tracks lifecycle
-- only: it starts "running", and lands on "done" or "failed" once the
-- service responds. `result` holds the full normalized report as JSON.
--
-- `feedback_status` distinguishes "scoring succeeded, written feedback
-- generation failed" from a full failure, so the score/dimensions can be
-- preserved and shown even when the feedback narrative needs a retry.

alter table public.evaluations
  add column if not exists feedback_status text not null default 'done'
    check (feedback_status in ('pending', 'done', 'failed')),
  add column if not exists feedback_error text;
