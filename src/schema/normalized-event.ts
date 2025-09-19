import { z } from "zod";

// Zod schema for Normalized Event (aligned with docs/specs/ne.schema.json)
// Keep this strict and mirror enums/optionals carefully.

export const RepoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean().optional(),
    visibility: z.enum(["public", "private", "internal"]).nullable().optional(),
  })
  .strict();

export const RefSchema = z
  .object({
    name: z.string().optional(),
    type: z.enum(["branch", "tag", "unknown"]).nullable().optional(),
    sha: z.string().optional(),
    base: z.string().optional(),
    head: z.string().optional(),
  })
  .strict();

export const ActorSchema = z
  .object({
    id: z.number(),
    login: z.string(),
    type: z.string(),
  })
  .strict();

export const ProvenanceSchema = z
  .object({
    source: z.enum(["action", "webhook", "cli"]),
    workflow: z
      .object({
        name: z.string().optional(),
        run_id: z.union([z.number(), z.string()]).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const NormalizedEventSchema = z
  .object({
    id: z.string(),
    provider: z.enum(["github"]),
    type: z.enum([
      "workflow_run",
      "pull_request",
      "push",
      "issue_comment",
      "commit",
      "job",
      "step",
      "issue",
      "release",
      "deployment",
      "check_run",
      "alert",
      "repository_dispatch",
    ]),
    occurred_at: z.string().datetime(),
    repo: RepoSchema,
    ref: RefSchema.optional(),
    actor: ActorSchema,
    payload: z.union([z.object({}).passthrough(), z.array(z.any())]),
    enriched: z.object({}).passthrough().optional(),
    labels: z.array(z.string()).optional(),
    provenance: ProvenanceSchema,
    composed: z
      .array(
        z
          .object({
            key: z.string(),
            reason: z.union([z.string(), z.null()]).optional(),
            targets: z.array(z.string()).optional(),
            labels: z.array(z.string()).optional(),
            payload: z
              .union([z.object({}).passthrough(), z.array(z.any()), z.null()])
              .optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type NormalizedEventZ = z.infer<typeof NormalizedEventSchema>;
