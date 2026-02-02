if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://user:password@localhost:5432/ai_ads_review";
}
