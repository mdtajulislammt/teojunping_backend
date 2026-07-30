// src/command/seed.command.ts

import { Command, CommandRunner } from 'nest-commander';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Command({
  name: 'seed',
  description: 'Prisma DB Seed for Plans, Roles, Admin, Agent, and Clients',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run(): Promise<void> {
    console.log('🚀 [SEED]: Starting database seeding...');
    try {
      // Run seeds sequentially
      console.log('🔄 Seeding plans...');
      await this.planSeed();

      console.log('🔄 Seeding roles...');
      await this.roleSeed();

      console.log('🔄 Seeding users...');
      await this.userSeed();

      console.log('✅ [SEED SUCCESS]: Database seeding completed.');
      console.log('\n🔑 TEST CREDENTIALS:');
      console.log(`   Admin:    admin@gmail.com / 12345678`);
      console.log(`   Agent:    agent@gmail.com / 12345678`);
      console.log(`   Client:   client@gmail.com / 12345678 (Basic Plan)`);
      console.log(`   Client2:  client2@gmail.com / 12345678 (Standard Plan)`);
      console.log(`   Client3:  client3@gmail.com / 12345678 (Premium Plan)`);
      console.log(`   Client4:  client4@gmail.com / 12345678 (No Plan)`);

      process.exit(0);
    } catch (error: any) {
      console.error('❌ [SEED ERROR]:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  // ==============================
  // PLAN SEED (FIXED)
  // ==============================
  private async planSeed() {
    try {
      const plans = [
        {
          id: 'plan_basic',
          name: 'BASIC',
          display_name: 'Basic',
          description: 'Perfect for individuals',
          price: 149,
          currency: 'GBP',
          features: [
            'Single will document',
            'Professional will writer',
            'PDF generation',
            '1 year vault storage',
            '1 revision included',
          ],
          max_wills: 1,
          max_revisions: 1,
          vault_storage_years: 1,
          has_priority_support: false,
          has_lpa_guidance: false,
          has_mirror_wills: false,
        },
        {
          id: 'plan_standard',
          name: 'STANDARD',
          display_name: 'Standard',
          description: 'Most Popular - For couples & families',
          price: 249,
          currency: 'GBP',
          features: [
            'Mirror wills (2 documents)',
            'Dedicated will writer',
            'PDF generation',
            '3 years vault storage',
            '3 revisions included',
            'Priority appointment booking',
          ],
          max_wills: 2,
          max_revisions: 3,
          vault_storage_years: 3,
          has_priority_support: true,
          has_lpa_guidance: false,
          has_mirror_wills: true,
        },
        {
          id: 'plan_premium',
          name: 'PREMIUM',
          display_name: 'Premium',
          description: 'Complete estate planning',
          price: 399,
          currency: 'GBP',
          features: [
            'Full estate planning suite',
            'Senior will writer assigned',
            'PDF generation & storage',
            'Lifetime vault storage',
            'Unlimited revisions',
            'Priority support',
            'LPA guidance included',
          ],
          max_wills: null,
          max_revisions: null,
          vault_storage_years: null,
          has_priority_support: true,
          has_lpa_guidance: true,
          has_mirror_wills: true,
        },
      ];

      for (const plan of plans) {
        // ✅ FIXED: Added .plan before .findUnique
        const existing = await this.prisma.plan.findUnique({
          where: { id: plan.id },
        });

        if (existing) {
          await this.prisma.plan.update({
            where: { id: plan.id },
            data: plan,
          });
          console.log(`   ↳ Updated plan: ${plan.display_name}`);
        } else {
          await this.prisma.plan.create({
            data: plan,
          });
          console.log(`   ↳ Created plan: ${plan.display_name}`);
        }
      }
      console.log(
        '   ✅ Plans seeded: Basic (£149), Standard (£249), Premium (£399)',
      );
    } catch (error: any) {
      console.error('   ❌ Plan seed failed:', error.message);
      throw error;
    }
  }

  // ==============================
  // ROLE SEED
  // ==============================
  private async roleSeed() {
    try {
      const roles = [
        { id: '1', title: 'Admin', name: 'admin' },
        { id: '2', title: 'Agent', name: 'agent' },
        { id: '3', title: 'Client', name: 'client' },
      ];

      for (const role of roles) {
        const existing = await this.prisma.role.findUnique({
          where: { id: role.id },
        });

        if (existing) {
          await this.prisma.role.update({
            where: { id: role.id },
            data: role,
          });
        } else {
          await this.prisma.role.create({
            data: role,
          });
        }
      }
      console.log('   ✅ Roles seeded: Admin, Agent, Client');
    } catch (error: any) {
      console.error('   ❌ Role seed failed:', error.message);
      throw error;
    }
  }

  // ==============================
  // USER SEED
  // ==============================
  private async userSeed() {
    try {
      const hashedPassword = await bcrypt.hash('12345678', 10);

      // Get plan IDs
      const basicPlan = await this.prisma.plan.findUnique({
        where: { name: 'BASIC' },
      });
      const standardPlan = await this.prisma.plan.findUnique({
        where: { name: 'STANDARD' },
      });
      const premiumPlan = await this.prisma.plan.findUnique({
        where: { name: 'PREMIUM' },
      });

      if (!basicPlan || !standardPlan || !premiumPlan) {
        throw new Error('Plans not found. Please run planSeed first.');
      }

      // ==============================
      // 1. ADMIN USER
      // ==============================
      const admin = await this.prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {
          username: 'admin_user',
          password: hashedPassword,
          first_name: 'System',
          last_name: 'Admin',
          type: 'ADMIN',
          status: 1,
          email_verified_at: new Date(),
        },
        create: {
          username: 'admin_user',
          email: 'admin@gmail.com',
          password: hashedPassword,
          first_name: 'System',
          last_name: 'Admin',
          type: 'ADMIN',
          status: 1,
          email_verified_at: new Date(),
        },
      });
      console.log(`   ↳ Admin: ${admin.email} (${admin.id})`);

      // ==============================
      // 2. AGENT USER
      // ==============================
      const agent = await this.prisma.user.upsert({
        where: { email: 'agent@gmail.com' },
        update: {
          username: 'agent_pro',
          password: hashedPassword,
          first_name: 'John',
          last_name: 'Agent',
          type: 'AGENT',
          specialisation: 'Will Writing & Estate Planning',
          years_of_experience: '5',
          certification_body: 'Society of Will Writers',
          certification_number: 'SWW-2024-001',
          professional_bio:
            'Experienced will writer with 5+ years of experience.',
          preferred_working_hours: 'Mon-Fri 9am-5pm',
          max_clients_per_month: 20,
          status: 1,
          email_verified_at: new Date(),
        },
        create: {
          username: 'agent_pro',
          email: 'agent@gmail.com',
          password: hashedPassword,
          first_name: 'John',
          last_name: 'Agent',
          type: 'AGENT',
          specialisation: 'Will Writing & Estate Planning',
          years_of_experience: '5',
          certification_body: 'Society of Will Writers',
          certification_number: 'SWW-2024-001',
          professional_bio:
            'Experienced will writer with 5+ years of experience.',
          preferred_working_hours: 'Mon-Fri 9am-5pm',
          max_clients_per_month: 20,
          status: 1,
          email_verified_at: new Date(),
        },
      });
      console.log(`   ↳ Agent: ${agent.email} (${agent.id})`);

      // ==============================
      // 3-6. CLIENTS
      // ==============================
      const clients = [
        {
          email: 'client@gmail.com',
          username: 'client_basic',
          first_name: 'Sarah',
          last_name: 'Client',
          plan_id: basicPlan.id,
          phone: '+44 7700 900001',
          address: '12 Elm Street, London, EC1A 1BB',
        },
        {
          email: 'client2@gmail.com',
          username: 'client_standard',
          first_name: 'John',
          last_name: 'Doe',
          plan_id: standardPlan.id,
          phone: '+44 7700 900002',
          address: '45 Park Avenue, London, W1A 1AA',
        },
        {
          email: 'client3@gmail.com',
          username: 'client_premium',
          first_name: 'Emma',
          last_name: 'Williams',
          plan_id: premiumPlan.id,
          phone: '+44 7700 900003',
          address: '78 High Street, Oxford, OX1 1AA',
        },
        {
          email: 'client4@gmail.com',
          username: 'client_noplan',
          first_name: 'Michael',
          last_name: 'Brown',
          plan_id: null,
          phone: '+44 7700 900004',
          address: '22 Church Road, Manchester, M1 1AA',
        },
      ];

      for (const clientData of clients) {
        const client = await this.prisma.user.upsert({
          where: { email: clientData.email },
          update: {
            username: clientData.username,
            password: hashedPassword,
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            type: 'CLIENT',
            plan_id: clientData.plan_id,
            assigned_agent_id: agent.id,
            status: 1,
            email_verified_at: new Date(),
            phone_number: clientData.phone,
            address: clientData.address,
          },
          create: {
            username: clientData.username,
            email: clientData.email,
            password: hashedPassword,
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            type: 'CLIENT',
            plan_id: clientData.plan_id,
            assigned_agent_id: agent.id,
            status: 1,
            email_verified_at: new Date(),
            phone_number: clientData.phone,
            address: clientData.address,
          },
        });
        const planName = clientData.plan_id
          ? (
              await this.prisma.plan.findUnique({
                where: { id: clientData.plan_id },
              })
            )?.name
          : 'No Plan';
        console.log(`   ↳ Client: ${client.email} (${planName})`);
      }

      // ==============================
      // ROLE USER MAPPINGS
      // ==============================
      // Get all users
      const allUsers = await this.prisma.user.findMany({
        where: {
          email: {
            in: [
              'admin@gmail.com',
              'agent@gmail.com',
              'client@gmail.com',
              'client2@gmail.com',
              'client3@gmail.com',
              'client4@gmail.com',
            ],
          },
        },
      });

      // Admin role
      const adminUser = allUsers.find((u) => u.email === 'admin@gmail.com');
      if (adminUser) {
        await this.prisma.roleUser.upsert({
          where: { role_id_user_id: { user_id: adminUser.id, role_id: '1' } },
          update: {},
          create: { user_id: adminUser.id, role_id: '1' },
        });
      }

      // Agent role
      const agentUser = allUsers.find((u) => u.email === 'agent@gmail.com');
      if (agentUser) {
        await this.prisma.roleUser.upsert({
          where: { role_id_user_id: { user_id: agentUser.id, role_id: '2' } },
          update: {},
          create: { user_id: agentUser.id, role_id: '2' },
        });
      }

      // Client roles
      const clientEmails = [
        'client@gmail.com',
        'client2@gmail.com',
        'client3@gmail.com',
        'client4@gmail.com',
      ];
      for (const email of clientEmails) {
        const clientUser = allUsers.find((u) => u.email === email);
        if (clientUser) {
          await this.prisma.roleUser.upsert({
            where: {
              role_id_user_id: { user_id: clientUser.id, role_id: '3' },
            },
            update: {},
            create: { user_id: clientUser.id, role_id: '3' },
          });
        }
      }

      console.log('   ✅ Role relations mapped');
    } catch (error: any) {
      console.error('   ❌ User seed failed:', error.message);
      throw error;
    }
  }
}
