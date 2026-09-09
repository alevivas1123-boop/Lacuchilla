import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit solo necesita esta variable para `push` o `studio`.
    // `generate` produce el SQL sin conectarse a ninguna base.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/lacuchilla",
  },
  strict: true,
  verbose: true,
} satisfies Config;
