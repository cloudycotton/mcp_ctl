// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
require("dotenv").config();
// Create PG pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle client
export const db = drizzle(pool, { schema });
