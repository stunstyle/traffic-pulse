import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export async function initSchema() {
  try {
    // Note: With @neondatabase/serverless neon() function, we use template strings slightly differently 
    // or just call them as functions. neon() returns a function that can be used as a tagged template.
    await sql`
      CREATE TABLE IF NOT EXISTS traffic_snapshots (
        id SERIAL PRIMARY KEY,
        camera_id VARCHAR(50) NOT NULL,
        count_15min INTEGER NOT NULL,
        count_1hour INTEGER NOT NULL,
        captured_at TIMESTAMPTZ NOT NULL,
        UNIQUE(camera_id, captured_at)
      );
    `;
    console.log("Schema initialized successfully.");
  } catch (error) {
    console.error("Schema initialization failed:", error);
    throw error;
  }
}

export { sql };
