import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const authToken = process.env.TURSO_AUTH_TOKEN

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: { url },
  migrate: {
    async adapter() {
      return new PrismaLibSql(createClient({ url, authToken }))
    }
  }
})
