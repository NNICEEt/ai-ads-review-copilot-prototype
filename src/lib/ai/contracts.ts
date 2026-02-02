import { z } from "zod";

export const EvidenceRefSchema = z.enum(["E1", "E2", "E3"]);
export const SeveritySchema = z.enum(["low", "med", "high"]);
export const InsightTypeSchema = z.enum([
  "efficiency",
  "traffic_quality",
  "creative_fatigue",
  "volume",
  "learning",
]);

export const InsightJSONSchema = z
  .object({
    insightSummary: z.string().min(1),
    evidenceBullets: z
      .array(
        z.object({
          text: z.string().min(1),
          evidenceRef: z.array(EvidenceRefSchema).min(1),
        }),
      )
      .min(1),
    insights: z
      .array(
        z.object({
          type: InsightTypeSchema,
          title: z.string().min(1),
          detail: z.string().min(1),
          severity: SeveritySchema,
          evidenceRef: z.array(EvidenceRefSchema).min(1),
        }),
      )
      .min(1),
    limits: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const RecommendationJSONSchema = z
  .object({
    summary: z.string().min(1),
    recommendations: z
      .array(
        z.object({
          action: z.string().min(1),
          reason: z.string().min(1),
          confidence: SeveritySchema,
          basedOn: z.array(z.string().regex(/^(insight:|evidence:).+/)).min(1),
        }),
      )
      .min(1),
    notes: z.string().min(1),
  })
  .strict();

export type InsightJSON = z.infer<typeof InsightJSONSchema>;
export type RecommendationJSON = z.infer<typeof RecommendationJSONSchema>;
