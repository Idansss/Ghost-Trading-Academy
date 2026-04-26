import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const targetEmail = process.argv[2]

if (!targetEmail) {
  console.error("Usage: npx tsx scripts/disable-2fa.ts <email>")
  process.exit(1)
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: targetEmail.toLowerCase() },
  })

  if (!user) {
    console.error(`No user found with email: ${targetEmail}`)
    process.exit(1)
  }

  console.log(`Found user: ${user.id}`)
  console.log(`Current 2FA status: ${user.twoFactorEnabled}`)

  if (!user.twoFactorEnabled) {
    console.log("2FA is already disabled for this user.")
    return
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    }),
    prisma.twoFactorBackupCode.deleteMany({
      where: { userId: user.id },
    }),
  ])

  console.log(`2FA disabled for ${targetEmail}`)
  console.log(`The user can now log in with just email + password.`)
  console.log(`They should re-enable 2FA after logging in if they want to use it again.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
