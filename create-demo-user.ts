
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'dr.schauerte@compliai.tech' // Individuelle Email
  const password = 'ent02' // Sehr einfaches Passwort, passend zum Modul
  const name = 'Dr. Schauerte'
  const company = 'Universität Münster'

  console.log(`Creating tailored demo user for ${name}...`)

  // 1. Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // 2. Upsert User (Create or Update if exists)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      emailVerified: new Date(), // WICHTIG: Sofort verifiziert
      name,
      company,
      role: 'DEMO',
      onboarded: true
    },
    create: {
      email,
      passwordHash,
      name,
      company,
      role: 'DEMO',
      emailVerified: new Date(), // WICHTIG: Sofort verifiziert
      onboarded: true
    }
  })

  console.log(`User created/updated: ${user.email}`)

  // 3. Create a Dummy Compliance Check (so dashboard isn't empty)
  const existingCheck = await prisma.complianceCheck.findFirst({
    where: { userId: user.id }
  })

  if (!existingCheck) {
    console.log('Creating demo compliance check data...')
    
    // Simulating a High Risk AI System (Recruiting Tool)
    const answers = {
      "system-name": "Vorlesungs-Planungs AI",
      "system-description": "KI-System zur Optimierung von Raum- und Zeitplänen an der Universität.",
      "risk-category": "LIMITED", // Etwas weniger riskant als Recruiting, passt zur Uni
      "purpose": "Administration",
      "data-usage": "Interne Daten"
    }

    await prisma.complianceCheck.create({
      data: {
        userId: user.id,
        status: 'COMPLETED',
        riskLevel: 'LIMITED',
        overallScore: 92, // Guter Score macht guten Eindruck
        documentationScore: 88,
        technicalScore: 95,
        governanceScore: 90,
        completedAt: new Date(),
        answers: answers,
        recommendations: [
            {
                category: "Transparenz",
                title: "Kennzeichnungspflicht",
                description: "Nutzer müssen informiert werden, dass sie mit einer KI interagieren.",
                priority: "MEDIUM"
            }
        ]
      }
    })
    console.log('Demo compliance check created.')
  } else {
    console.log('Demo compliance check already exists, skipping.')
  }

  console.log('------------------------------------------------')
  console.log('✅ INDIVIDUAL ACCOUNT READY')
  console.log('URL: https://www.compliai.tech/login')
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log('------------------------------------------------')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
