import { PrismaClient, Role, SubscriptionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apexvip.com' },
    update: {},
    create: {
      email: 'admin@apexvip.com',
      name: 'Apex Admin',
      password: hashedPassword,
      role: Role.ADMIN,
      accountBalance: 50000,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiry: new Date('2099-12-31'),
    },
  })

  const vipUser = await prisma.user.upsert({
    where: { email: 'vip@apexvip.com' },
    update: {},
    create: {
      email: 'vip@apexvip.com',
      name: 'VIP Member',
      password: await bcrypt.hash('vip123', 12),
      role: Role.VIP,
      accountBalance: 10000,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionExpiry: new Date('2025-12-31'),
    },
  })

  console.log('Seeded admin:', admin.email)
  console.log('Seeded VIP user:', vipUser.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
