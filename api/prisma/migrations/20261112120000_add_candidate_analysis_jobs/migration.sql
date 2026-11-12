-- Queue of CV analyses for the AI Operations Copilot (one job per application)
CREATE TABLE candidate_analysis_jobs (
    id text PRIMARY KEY,
    application_id text NOT NULL UNIQUE
        REFERENCES job_applications(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    last_error text,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX candidate_analysis_jobs_pending_idx
ON candidate_analysis_jobs (next_attempt_at, created_at)
WHERE status = 'pending';
