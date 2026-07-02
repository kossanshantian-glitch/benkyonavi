const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const envPath = path.resolve(__dirname, '..', '.env.local');
const env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .reduce((acc, line) => {
        const [k, v] = line.split('=');
        if (k) acc[k] = v;
        return acc;
      }, {})
  : {};

if (!env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const db = neon(env.DATABASE_URL);
(async () => {
  try {
    const columns = await db`select column_name, data_type, udt_name from information_schema.columns where table_name='history' and column_name='causes'`;
    console.log('column metadata:', JSON.stringify(columns, null, 2));

    const sample = await db`select id, causes from history limit 3`;
    console.log('sample rows:', JSON.stringify(sample, null, 2));

    const rows = await db`
      SELECT cause, COUNT(*) AS count
      FROM history, unnest(coalesce(causes, ARRAY[]::text[])) AS cause
      WHERE NOT is_correct
      GROUP BY cause
      ORDER BY count DESC
      LIMIT 5
    `;
    console.log('query rows:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('error running db checks:', error);
  } finally {
    process.exit(0);
  }
})();
