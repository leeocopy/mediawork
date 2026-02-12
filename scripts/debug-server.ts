import { prisma } from '../lib/prisma';
import { findUserByEmail } from '../lib/db';
import { loginSchema } from '../lib/validation';

async function main() {
    console.log('🚀 Starting server debug script...');

    try {
        console.log('1. Testing Prisma connection...');
        const userCount = await prisma.user.count();
        console.log(`✅ Prisma connected. User count: ${userCount}`);

        console.log('2. Testing findUserByEmail...');
        const user = await findUserByEmail('sarah@example.com');
        console.log(`✅ foundUserByEmail: ${user ? user.email : 'Not found'}`);

        console.log('3. Testing loginSchema...');
        const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password' });
        console.log(`✅ loginSchema: ${result.success ? 'Success' : 'Failed'}`);

        console.log('✨ All checks passed!');
    } catch (error) {
        console.error('❌ Debug script failed:');
        console.error(error);
        process.exit(1);
    }
}

main();
