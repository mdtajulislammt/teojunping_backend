// src/command/seed.command.ts
import { Command, CommandRunner } from 'nest-commander';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Command({ name: 'seed', description: 'Prisma DB Seed for Admin, Agent, and Client' })
export class SeedCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 [SEED CRITICAL]: Run method successfully invoked by Commander!');
    try {
      await this.prisma.$transaction(async ($tx) => {
        console.log('🔄 [SEED TRANSACTION]: Executing roles...');
        await this.roleSeed($tx);
        
        console.log('🔄 [SEED TRANSACTION]: Executing users...');
        await this.userSeed($tx);
      });
      console.log('✅ [SEED SUCCESS]: Database seeding completed.');
      
      // CRITICAL FIX: Redis/BullMQ connections context background thread force-exit kora holo
      setTimeout(() => {
        process.exit(0);
      }, 1000);

    } catch (error) {
      console.error('❌ [SEED ERROR]: Exception caught inside run():', error);
      process.exit(1);
    }
  }

  private async roleSeed(tx: any) {
    const roles = [
      { id: '1', title: 'Admin', name: 'admin' },
      { id: '2', title: 'Agent', name: 'agent' },
      { id: '3', title: 'Client', name: 'client' },
    ];
    for (const role of roles) {
      await tx.role.upsert({
        where: { id: role.id },
        update: {},
        create: role,
      });
    }
    console.log('   ↳ Roles upserted.');
  }

  private async userSeed(tx: any) {
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // A. Admin User
    const admin = await tx.user.upsert({
      where: { email: 'admin@system.com' },
      update: {},
      create: {
        username: 'admin_user',
        email: 'admin@system.com',
        password: hashedPassword,
        first_name: 'System',
        last_name: 'Admin',
        type: 'ADMIN',
        status: 1,
      },
    });
    console.log(`   ↳ Admin created: ${admin.id}`);

    // B. Agent User
    const agent = await tx.user.upsert({
      where: { email: 'agent@service.com' },
      update: {},
      create: {
        username: 'agent_pro',
        email: 'agent@service.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Agent',
        type: 'AGENT',
        specialisation: 'Backend Development',
        years_of_experience: '5',
        status: 1,
      },
    });
    console.log(`   ↳ Agent created: ${agent.id}`);

    // C. Client User (Linked with Agent ID)
    const client = await tx.user.upsert({
      where: { email: 'client@startup.com' },
      update: {},
      create: {
        username: 'client_alpha',
        email: 'client@startup.com',
        password: hashedPassword,
        first_name: 'Sarah',
        last_name: 'Client',
        type: 'CLIENT',
        service_plan: 'BASIC',
        assigned_agent_id: agent.id, // Relation mapping
        status: 1,
      },
    });
    console.log(`   ↳ Client created: ${client.id}`);

    // Role Users Map Mapping
    await tx.roleUser.upsert({
      where: { role_id_user_id: { user_id: admin.id, role_id: '1' } },
      update: {},
      create: { user_id: admin.id, role_id: '1' },
    });
    await tx.roleUser.upsert({
      where: { role_id_user_id: { user_id: agent.id, role_id: '2' } },
      update: {},
      create: { user_id: agent.id, role_id: '2' },
    });
    await tx.roleUser.upsert({
      where: { role_id_user_id: { user_id: client.id, role_id: '3' } },
      update: {},
      create: { user_id: client.id, role_id: '3' },
    });
    console.log('   ↳ Role relations mapped.');
  }
}