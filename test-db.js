const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to database...');
        // Try to count users as a simple connectivity check
        const count = await prisma.user.count();
        console.log(`Connection successful! Found ${count} users.`);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
