require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, AUDIT_ACTIONS } = require('../config/constants');

const permissionsData = [
  { key: PERMISSIONS.USERS_VIEW, name: 'View Users', module: 'Users', description: 'Can view user directory and profiles' },
  { key: PERMISSIONS.USERS_CREATE, name: 'Create Users', module: 'Users', description: 'Can invite and create new user accounts' },
  { key: PERMISSIONS.USERS_UPDATE, name: 'Update Users', module: 'Users', description: 'Can update user profiles and status' },
  { key: PERMISSIONS.USERS_DELETE, name: 'Delete Users', module: 'Users', description: 'Can permanently remove user records' },
  { key: PERMISSIONS.ROLES_MANAGE, name: 'Manage Roles', module: 'Roles', description: 'Can configure roles and grant permissions' },
  { key: PERMISSIONS.REPORTS_VIEW, name: 'View Analytics', module: 'Analytics', description: 'Can view system reports and metrics' },
  { key: PERMISSIONS.AUDIT_VIEW, name: 'View Audit Logs', module: 'Audit', description: 'Can inspect historical security and operational logs' },
  { key: PERMISSIONS.NOTIFICATIONS_MANAGE, name: 'Manage Notifications', module: 'Notifications', description: 'Can broadcast and manage system notifications' },
  { key: PERMISSIONS.SETTINGS_MANAGE, name: 'Manage Settings', module: 'Settings', description: 'Can alter platform configurations and security parameters' }
];

const seedDatabase = async (isStandalone = false) => {
  try {
    console.log('[Seed] Starting database seed...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // 1. Clear existing collections
    console.log('[Seed] Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Permission.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
      SystemSetting.deleteMany({})
    ]);

    // 2. Insert Permissions
    console.log('[Seed] Seeding permissions catalog...');
    await Permission.insertMany(permissionsData);

    // 3. Create Default Roles
    console.log('[Seed] Seeding system roles...');
    const superAdminRole = await Role.create({
      name: ROLES.SUPER_ADMIN,
      description: 'Complete unrestricted platform administrative authority',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.SUPER_ADMIN],
      isSystem: true
    });

    const adminRole = await Role.create({
      name: ROLES.ADMIN,
      description: 'Platform administrator with operations, user, and security management privileges',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.ADMIN],
      isSystem: true
    });

    const managerRole = await Role.create({
      name: ROLES.MANAGER,
      description: 'Departmental manager with team management and reporting access',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.MANAGER],
      isSystem: true
    });

    const userRole = await Role.create({
      name: ROLES.USER,
      description: 'Standard organization member with directory lookup access',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.USER],
      isSystem: true
    });

    // 4. Create Core Users
    console.log('[Seed] Seeding primary demo accounts...');
    const bcrypt = require('bcryptjs');
    const adminPassHash = await bcrypt.hash('Admin@123456', 10);
    const managerPassHash = await bcrypt.hash('Manager@123456', 10);
    const userPassHash = await bcrypt.hash('User@123456', 10);

    const superAdminUser = await User.create({
      name: 'Eleanor Vance',
      email: 'superadmin@adminsphere.io',
      password: adminPassHash,
      role: superAdminRole._id,
      department: 'Executive Leadership',
      phone: '+1 (555) 019-2834',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 30),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)
    });

    const adminUser = await User.create({
      name: 'Marcus Sterling',
      email: 'admin@adminsphere.io',
      password: adminPassHash,
      role: adminRole._id,
      department: 'IT & Infrastructure',
      phone: '+1 (555) 014-9921',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150)
    });

    const managerUser = await User.create({
      name: 'Sarah Lin',
      email: 'manager@adminsphere.io',
      password: managerPassHash,
      role: managerRole._id,
      department: 'Operations',
      phone: '+1 (555) 018-7743',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 5),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
    });

    const standardUser = await User.create({
      name: 'David Chen',
      email: 'user@adminsphere.io',
      password: userPassHash,
      role: userRole._id,
      department: 'Engineering',
      phone: '+1 (555) 012-3344',
      status: 'active',
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45)
    });

    // 5. Create Additional Users across departments
    console.log('[Seed] Seeding secondary team members...');
    const additionalUsersData = [
      {
        name: 'Sophia Rodriguez',
        email: 'sophia.rodriguez@adminsphere.io',
        password: userPassHash,
        role: managerRole._id,
        department: 'Product Design',
        phone: '+1 (555) 013-4455',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12)
      },
      {
        name: 'Liam Walker',
        email: 'liam.walker@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Engineering',
        phone: '+1 (555) 015-7788',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 8)
      },
      {
        name: 'Emma Watson',
        email: 'emma.watson@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Marketing',
        phone: '+1 (555) 016-1122',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 18)
      },
      {
        name: 'Noah Patel',
        email: 'noah.patel@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Engineering',
        phone: '+1 (555) 017-9900',
        status: 'inactive',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 85),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)
      },
      {
        name: 'Olivia Kim',
        email: 'olivia.kim@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Finance',
        phone: '+1 (555) 018-2233',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 4)
      },
      {
        name: 'Lucas Bennett',
        email: 'lucas.bennett@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Customer Support',
        phone: '+1 (555) 019-6677',
        status: 'suspended',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
      },
      {
        name: 'Aria Montgomery',
        email: 'aria.montgomery@adminsphere.io',
        password: userPassHash,
        role: adminRole._id,
        department: 'Security Operations',
        phone: '+1 (555) 020-8899',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 110),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 1)
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'Sales',
        phone: '+1 (555) 021-4433',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6)
      },
      {
        name: 'Chloe Dupont',
        email: 'chloe.dupont@adminsphere.io',
        password: userPassHash,
        role: userRole._id,
        department: 'People & Talent',
        phone: '+1 (555) 022-7711',
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3)
      }
    ];

    await Promise.all(additionalUsersData.map((u) => User.create(u)));

    // 6. Create Realistic Audit Logs
    console.log('[Seed] Seeding audit log timeline...');
    const auditEvents = [
      {
        actor: { id: superAdminUser._id, name: superAdminUser.name, email: superAdminUser.email, role: 'Super Admin' },
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        resource: 'Auth',
        resourceId: String(superAdminUser._id),
        details: 'Super Admin signed in from corporate network',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        actor: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'Admin' },
        action: AUDIT_ACTIONS.USER_CREATED,
        resource: 'User',
        details: 'Provisioned new account for Chloe Dupont (chloe.dupont@adminsphere.io)',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
        metadata: { department: 'People & Talent', role: 'User' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
      },
      {
        actor: { id: superAdminUser._id, name: superAdminUser.name, email: superAdminUser.email, role: 'Super Admin' },
        action: AUDIT_ACTIONS.SETTINGS_UPDATED,
        resource: 'SystemSetting',
        details: 'Updated Security policy: Enforced 90-day password cycling and session idle limit',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
      },
      {
        actor: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'Admin' },
        action: AUDIT_ACTIONS.USER_DEACTIVATED,
        resource: 'User',
        details: 'Deactivated dormant account for Noah Patel on security review',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
      },
      {
        actor: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'Admin' },
        action: AUDIT_ACTIONS.USER_UPDATED,
        resource: 'User',
        details: 'Suspended account access for Lucas Bennett following security policy alert',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
      },
      {
        actor: { id: managerUser._id, name: managerUser.name, email: managerUser.email, role: 'Manager' },
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        resource: 'Auth',
        resourceId: String(managerUser._id),
        details: 'Manager Sarah Lin signed in to check weekly operational metrics',
        ipAddress: '10.0.4.22',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/129.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
      },
      {
        actor: { id: superAdminUser._id, name: superAdminUser.name, email: superAdminUser.email, role: 'Super Admin' },
        action: AUDIT_ACTIONS.PERMISSIONS_UPDATED,
        resource: 'Role',
        details: 'Audited and re-indexed permission matrix for Manager tier',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18)
      }
    ];

    await AuditLog.insertMany(auditEvents);

    // 7. Create Notifications
    console.log('[Seed] Seeding platform notifications...');
    const notificationsData = [
      {
        recipient: null, // Broadcast to all admins
        title: 'System Maintenance Window Scheduled',
        message: 'Upcoming maintenance scheduled for Sunday at 02:00 UTC. Database indexing optimizations will run.',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
      },
      {
        recipient: null,
        title: 'Security Notice: Dormant Account Flagged',
        message: 'Account noah.patel@adminsphere.io has been flagged as inactive for 20+ days.',
        type: 'warning',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15)
      },
      {
        recipient: null,
        title: 'New User Registered',
        message: 'Chloe Dupont joined the People & Talent department.',
        type: 'success',
        isRead: true,
        readBy: [superAdminUser._id],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        recipient: null,
        title: 'Suspicious IP Range Blocked',
        message: 'Automated firewall blocked multiple brute force attempts targeting API endpoints.',
        type: 'error',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
      }
    ];

    await Notification.insertMany(notificationsData);

    // 8. Create System Settings
    console.log('[Seed] Seeding default system settings...');
    const systemSettings = [
      // General
      {
        category: 'general',
        key: 'organizationName',
        label: 'Organization Name',
        value: 'AdminSphere Global Enterprise',
        description: 'Primary legal enterprise or company brand name',
        updatedBy: superAdminUser._id
      },
      {
        category: 'general',
        key: 'supportEmail',
        label: 'Support Contact Email',
        value: 'support@adminsphere.io',
        description: 'Email address shown to users for assistance',
        updatedBy: superAdminUser._id
      },
      {
        category: 'general',
        key: 'timezone',
        label: 'Default Timezone',
        value: 'UTC',
        description: 'Default time zone for audit logging and display',
        updatedBy: superAdminUser._id
      },
      // Security
      {
        category: 'security',
        key: 'twoFactorRequired',
        label: 'Enforce Two-Factor Authentication',
        value: false,
        description: 'Require all administrative users to complete 2FA',
        updatedBy: superAdminUser._id
      },
      {
        category: 'security',
        key: 'sessionTimeoutMinutes',
        label: 'Session Idle Timeout (Minutes)',
        value: 60,
        description: 'Automatic session logout after period of inactivity',
        updatedBy: superAdminUser._id
      },
      {
        category: 'security',
        key: 'maxFailedLogins',
        label: 'Max Failed Login Attempts',
        value: 5,
        description: 'Temporarily lock account after repeated credential failures',
        updatedBy: superAdminUser._id
      },
      {
        category: 'security',
        key: 'strictAuditLogging',
        label: 'Strict Security Audit Logging',
        value: true,
        description: 'Record user agents, IP addresses, and payload diffs for every admin operation',
        updatedBy: superAdminUser._id
      },
      // Notifications
      {
        category: 'notifications',
        key: 'emailNotificationsEnabled',
        label: 'Email Notifications Enabled',
        value: true,
        description: 'Dispatch administrative alerts via email gateway',
        updatedBy: superAdminUser._id
      },
      {
        category: 'notifications',
        key: 'securityAlertBroadcast',
        label: 'Security Alert Broadcast',
        value: true,
        description: 'Broadcast high-severity security incidents to all administrators immediately',
        updatedBy: superAdminUser._id
      }
    ];

    await SystemSetting.insertMany(systemSettings);

    console.log('\n======================================================');
    console.log('[Seed] Database seeded successfully!');
    console.log('------------------------------------------------------');
    console.log('DEMO ACCOUNTS READY FOR LOGIN:');
    console.log('1. Super Admin : superadmin@adminsphere.io  |  Admin@123456');
    console.log('2. Admin       : admin@adminsphere.io       |  Admin@123456');
    console.log('3. Manager     : manager@adminsphere.io     |  Manager@123456');
    console.log('4. Standard User: user@adminsphere.io       |  User@123456');
    console.log('======================================================\n');

    if (isStandalone) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    if (isStandalone) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };
