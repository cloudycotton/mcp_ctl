import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { db } from "../db";
import { packages } from "../db/schema";
import { eq, like } from 'drizzle-orm';
require('dotenv').config();


const app = new Hono();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

app.get('/', (c) => c.json({ status: 'healthy' }));


app.get('/get-package', async (c) => {
  const { package_name, hard_search } = c.req.query();  
  try {
    const allUsers = await db
      .select()
      .from(packages)
      .where(package_name 
        ? hard_search 
          ? eq(packages.name, package_name)
          : like(packages.name, `%${package_name}%`)
        : undefined);
    return c.json({ packages: allUsers });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

export { app, supabase };