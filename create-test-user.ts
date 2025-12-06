import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'test@compliai.local'
  const password = 'password123'
  const name = 'Local Tester'

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashedPassword,
        name,
        emailVerified: new Date(), // Direkt verifiziert
        onboarded: true
      },
    })
    console.log(`User created: ${user.email}`)
    console.log(`Password: ${password}`)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
