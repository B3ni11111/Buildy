-- Undo window: an update (or resolve) can be taken back for 5 minutes. The undone row stays,
-- hidden, as the author's draft until it expires.
ALTER TABLE "issue_updates" ADD COLUMN "undone_at" TIMESTAMP(3);
