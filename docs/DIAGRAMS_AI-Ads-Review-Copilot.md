# AI Ads Review Copilot — System Diagrams (Mermaid)

## High Level (Non-tech)

```mermaid
flowchart LR
  subgraph P[Data / Adapters]
    SRC[Review Data Source (Mock Meta-like)]
  end

  subgraph C[Canonical Model]
    CAN[Canonical Entities: Account → Campaign → AdGroup → Ad]
  end

  subgraph B[Business Context (Optional)]
    PERIOD[Review Period (3/7/14 days)]
    BC[Business Context: objective/constraints/brand]
    POL[AI Guardrails: deterministic-only numbers]
  end

  subgraph D[Deterministic Analysis Layer (No AI)]
    CALC[Metrics + Deltas Calculator]
    EVI[Evidence Generator: E1–E3]
    SCORE[Scoring + Diagnosis + Priority (Severity × Impact)]
  end

  subgraph A[AI Copilot Layer (Optional, 2-stage)]
    INS[Insight Stage → InsightJSON]
    REC[Recommend Stage → RecommendationJSON]
  end

  subgraph U[UI Layer]
    DASH[Dashboard: Priority List]
    CAMP[Campaign: Breakdown + Summary]
    DETAIL[AdGroup Detail: Evidence + Daily + AI Panel]
  end

  SRC --> CAN

  CAN --> CALC
  PERIOD --> CALC

  CALC --> EVI
  CALC --> SCORE

  SCORE --> DASH
  SCORE --> CAMP

  DASH --> DETAIL
  CAMP --> DETAIL
  EVI --> DETAIL
  CALC --> DETAIL

  EVI --> INS
  SCORE --> INS
  BC --> INS

  INS --> REC
  POL --> REC
  BC --> REC

  INS --> DETAIL
  REC --> DETAIL
```

## Low Level (Tech)

```mermaid
flowchart LR
  subgraph UI[Next.js UI (App Router)]
    RSC[Server Pages (RSC/SSR): Dashboard / Campaign / AdGroup Detail]
    SNIP[AiInsightSnippet (client) → mode=insight]
    PANEL[AiCopilotPanel (client) → mode=full]
    BATCH[PriorityAiBatchButton (client) → /batch]
    CAMPREC[CampaignAiRecommendation (client) → mode=full]
    BCTX[BusinessContext (localStorage)]
    CCACHE[Client AI Cache (in-memory)]
  end

  subgraph API[Next.js Route Handlers (API)]
    AISUM[POST /api/ai/summary]
    AIBATCH[POST /api/ai/summary/batch]
    REVIEWAPI[GET /api/review]
    CAMPAPI[GET /api/campaign/:id/breakdown]
    DETAILAPI[GET /api/detail/adgroup]
  end

  subgraph DET[Deterministic Layer (src/lib/data + src/lib/analysis)]
    REVIEWLIB[getDashboardData / getCampaignBreakdown / getAdGroupDetail]
    PERIODLIB[period.ts: normalize + current/previous range]
    METRICSLIB[metrics.ts: totals → derived + deltas]
    EVILIB[evidence.ts: build E1–E3]
    SCORELIB[scoring.ts: score + label + diagnosis]
    KPICONFIG[config: KPI targets + thresholds]
  end

  subgraph DATA[Data Layer (Pluggable)]
    RDS[ReviewDataSource interface]
    MOCK[createMockReviewSource() (mock dataset)]
  end

  subgraph AI[AI Layer (src/lib/ai)]
    GETSUM[getAiSummary(mode)]
    CACHE[Cache: local Map + inflight dedupe]
    REMOTE[Optional Remote Cache: Upstash REST]
    PAYLOAD[buildInsightPayload(detail)]
    INSSTAGE[Stage A: Insight (derived + evidence) → InsightJSON]
    RECSTAGE[Stage B: Recommend (InsightJSON only) → RecommendationJSON]
    CONTRACTS[Zod contracts + strict JSON parsing]
    AICONFIG[AI_CONFIG: keys/models/timeout/responseFormat]
    LLMCLIENT[callAishop24h()]
  end

  subgraph EXT[External Services]
    LLM[aishop24h API]
    KV[Upstash/Vercel KV REST]
  end

  RSC --> REVIEWLIB
  REVIEWAPI --> REVIEWLIB
  CAMPAPI --> REVIEWLIB
  DETAILAPI --> REVIEWLIB

  REVIEWLIB --> PERIODLIB
  REVIEWLIB --> METRICSLIB
  REVIEWLIB --> EVILIB
  REVIEWLIB --> SCORELIB
  KPICONFIG --> SCORELIB

  REVIEWLIB --> RDS
  RDS --> MOCK

  BCTX --> SNIP
  BCTX --> PANEL
  BCTX --> BATCH

  SNIP --> AISUM
  PANEL --> AISUM
  CAMPREC --> AISUM
  BATCH --> AIBATCH

  SNIP --> CCACHE
  BATCH --> CCACHE
  CCACHE --> SNIP

  AISUM --> GETSUM
  AIBATCH --> GETSUM

  GETSUM --> CACHE
  GETSUM --> REMOTE
  REMOTE --> KV

  GETSUM --> REVIEWLIB
  REVIEWLIB --> PAYLOAD

  PAYLOAD --> INSSTAGE
  AICONFIG --> INSSTAGE
  CONTRACTS --> INSSTAGE
  INSSTAGE --> LLMCLIENT
  LLMCLIENT --> LLM

  INSSTAGE --> RECSTAGE
  AICONFIG --> RECSTAGE
  CONTRACTS --> RECSTAGE
  RECSTAGE --> LLMCLIENT
```
