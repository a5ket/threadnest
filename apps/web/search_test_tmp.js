const { Client } = require('pg')
require('dotenv').config({ path: '.env', quiet: true })

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query('UPDATE "User" SET "emailVerifiedAt" = now() WHERE email IN ($1,$2)', ['report-ui-reporter@example.com', 'report-ui-mod@example.com'])
  const nest = await client.query('SELECT id FROM "Nest" WHERE slug = $1', ['testslug'])
  const mod = await client.query('SELECT id FROM "User" WHERE email = $1', ['report-ui-mod@example.com'])
  await client.query(
    'INSERT INTO "NestMember" ("nestId","userId","role") VALUES ($1,$2,$3) ON CONFLICT ("nestId","userId") DO UPDATE SET role = $3',
    [nest.rows[0].id, mod.rows[0].id, 'MODERATOR']
  )
  console.log('setup done')
  await client.end()
}
main()
