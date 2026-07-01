import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL || `file:${path.resolve(__dirname, '../../dev.db')}`
const authToken = process.env.TURSO_AUTH_TOKEN

const adapter = new PrismaLibSql({ url, authToken })

export const prisma = new PrismaClient({ adapter } as any)
