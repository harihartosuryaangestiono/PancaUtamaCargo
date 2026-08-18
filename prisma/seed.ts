import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting Initial Seed ---')

  // 1. Initial Users (Hariharto & Emily)
  const ownerEmail = process.env.INITIAL_OWNER_EMAIL || 'hariharto@pancautamacargo.com'
  const ownerPassword = process.env.INITIAL_OWNER_PASSWORD || 'Owner123!'

  const financeEmail = process.env.INITIAL_FINANCE_EMAIL || 'emily@pancautamacargo.com'
  const financePassword = process.env.INITIAL_FINANCE_PASSWORD || 'Finance123!'

  const ownerHash = await bcrypt.hash(ownerPassword, 10)
  const financeHash = await bcrypt.hash(financePassword, 10)

  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      name: 'Hariharto',
      role: 'OWNER',
      passwordHash: ownerHash,
    },
    create: {
      name: 'Hariharto',
      email: ownerEmail,
      role: 'OWNER',
      passwordHash: ownerHash,
    },
  })
  console.log(`Seeded Owner Account: ${ownerUser.name} (${ownerUser.email})`)

  const ownerSuryaHash = await bcrypt.hash('hari123!', 10)
  const ownerSuryaUser = await prisma.user.upsert({
    where: { email: 'hariharto.surya@gmail.com' },
    update: {
      name: 'Hariharto Surya',
      role: 'OWNER',
      passwordHash: ownerSuryaHash,
    },
    create: {
      name: 'Hariharto Surya',
      email: 'hariharto.surya@gmail.com',
      role: 'OWNER',
      passwordHash: ownerSuryaHash,
    },
  })
  console.log(`Seeded Owner Account: ${ownerSuryaUser.name} (${ownerSuryaUser.email})`)

  const financeUser = await prisma.user.upsert({
    where: { email: financeEmail },
    update: {
      name: 'Emily',
      role: 'FINANCE',
      passwordHash: financeHash,
    },
    create: {
      name: 'Emily',
      email: financeEmail,
      role: 'FINANCE',
      passwordHash: financeHash,
    },
  })
  console.log(`Seeded Finance Account: ${financeUser.name} (${financeUser.email})`)

  // 2. Company Settings (Single System Config Record)
  const settings = await prisma.companySettings.findFirst()
  if (!settings) {
    await prisma.companySettings.create({
      data: {
        companyName: 'Panca Utama Cargo',
        defaultTireLifetimeKm: 60000.0,
        tireWarningPercent: 70.0,
        tireCriticalPercent: 90.0,
      },
    })
    console.log('Seeded System CompanySettings (60,000 KM tire lifetime baseline)')
  }

  // 3. Default Income Categories
  const incomeCategories = ['Hasil Pengiriman', 'Pendapatan Lain-lain']
  for (const name of incomeCategories) {
    await prisma.incomeCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // 4. Default Expense Categories
  const expenseCategories = [
    'Bahan Bakar',
    'Tol',
    'Maintenance & Perbaikan',
    'Pembelian Sparepart',
    'Pembelian Ban',
    'Gaji Driver',
    'Pajak & Asuransi',
    'Pengeluaran Operasional Lain',
  ]
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  // 5. Default Sparepart Categories
  const sparepartCategories = [
    'Engine',
    'Brake',
    'Suspension',
    'Electrical',
    'Transmission',
    'Steering',
    'Tire',
    'Body',
    'Other',
  ]
  for (const name of sparepartCategories) {
    await prisma.sparepartCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('--- Initial Seed Complete ---')
  console.log('STRICT CONFIRMATION: 0 Trucks, 0 Tires, 0 Shipments, 0 Transactions generated.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
