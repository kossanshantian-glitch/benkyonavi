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
    const rows = await db.query(
      'select column_name, data_type, udt_name from information_schema.columns where table_name=\'history\' and column_name in (\'causes\', \'actions\') order by column_name'
    );
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
})();
