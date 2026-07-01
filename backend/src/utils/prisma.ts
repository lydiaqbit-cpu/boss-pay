import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:./dev.db'
const authToken = process.env.TURSO_AUTH_TOKEN

const client = createClient({ url, authToken })
const adapter = new PrismaLibSQL(client)

export const prisma = new PrismaClient({ adapter } as any)
