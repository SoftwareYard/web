-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Store semantic embeddings for candidate profiles
CREATE TABLE "candidate_embeddings" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    "candidate_profile_id" TEXT NOT NULL,

    "model" TEXT NOT NULL,

    "embedding" vector(768) NOT NULL,

    "content_hash" TEXT NOT NULL,

    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "candidate_embeddings_profile_model_key"
        UNIQUE ("candidate_profile_id", "model"),

    CONSTRAINT "candidate_embeddings_profile_fkey"
        FOREIGN KEY ("candidate_profile_id")
        REFERENCES "candidate_profiles"("id")
        ON DELETE CASCADE
);
