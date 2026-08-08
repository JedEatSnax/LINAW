//
// You can delete or revise this file.
// Only for testing purposes.
//

import { prisma } from "../lib/prisma";

async function main() {
  // Create a new user with a post
  const user = await prisma.user.create({
    data: {
      name: "Test2",
      email: "test2@prisma.io",
      occupation: "Bum",
      status: "Bored",
      license: {
        create: {
          name: "Office",
          product_key: "0x123456789",
          manufacturer: "Microsoft",
        },
      },
    },
  });
  console.log("Created user:", user);

  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({
    include: {
      license: true,
    },
  });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
