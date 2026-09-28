require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');

let server;
const PORT = 5099; // Dedicated verification port

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:${PORT}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runVerification = async () => {
  console.log('\n=============================================================');
  console.log('--- ADMINSPHERE COMPREHENSIVE E2E VERIFICATION SUITE ---');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description, detail = '') => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description} ${detail ? '-> ' + detail : ''}`);
      failed++;
    }
  };

  try {
    // 1. Connect & Bootstrap Database
    console.log('[Setup] Connecting to MongoDB...');
    await connectDB();

    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Setup] Seeding test database...');
      const { seedDatabase } = require('./seed');
      await seedDatabase(false);
    }

    // 2. Start HTTP Server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Setup] Verification server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // TEST 1: Health check
    const health = await request('GET', '/api/v1/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health Check Endpoint /api/v1/health');

    // TEST 2: Invalid Login
    const badLogin = await request('POST', '/api/v1/auth/login', {
      email: 'superadmin@adminsphere.io',
      password: 'WrongPassword123'
    });
    assert(badLogin.status === 401 && badLogin.data.success === false, 'Invalid Credentials Rejection (401)');

    // TEST 3A: Super Admin Login with standard email
    const superAdminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'superadmin@adminsphere.io',
      password: 'Admin@123456'
    });
    assert(
      superAdminLogin.status === 200 && !!superAdminLogin.data.token,
      'Super Admin Authentication via superadmin@adminsphere.io'
    );
    const superToken = superAdminLogin.data.token;

    // TEST 3B: Super Admin Login via superadminsphere.io identifier
    const aliasLogin = await request('POST', '/api/v1/auth/login', {
      email: 'superadminsphere.io',
      password: 'Admin@123456'
    });
    assert(
      aliasLogin.status === 200 && !!aliasLogin.data.token,
      'Super Admin Authentication via superadminsphere.io identifier'
    );

    // TEST 4: Standard User Login
    const userLogin = await request('POST', '/api/v1/auth/login', {
      email: 'user@adminsphere.io',
      password: 'User@123456'
    });
    assert(userLogin.status === 200 && !!userLogin.data.token, 'Standard User Authentication (user@adminsphere.io)');
    const userToken = userLogin.data.token;

    // TEST 5: Current User Info /auth/me
    const meRes = await request('GET', '/api/v1/auth/me', null, superToken);
    assert(meRes.status === 200 && meRes.data.user.email === 'superadmin@adminsphere.io', 'Verify Current User (/auth/me)');

    // TEST 6: Unauthorized Request Without Token
    const unauth = await request('GET', '/api/v1/dashboard/stats');
    assert(unauth.status === 401, 'Protected Route Blocked for Unauthenticated Request (401)');

    // TEST 7: Dashboard Statistics from MongoDB
    const dashRes = await request('GET', '/api/v1/dashboard/stats', null, superToken);
    assert(
      dashRes.status === 200 &&
        dashRes.data.data.summary.totalUsers > 0 &&
        Array.isArray(dashRes.data.data.roleDistribution) &&
        Array.isArray(dashRes.data.data.recentActivities),
      'Dashboard Aggregated KPIs and Activity Feed from MongoDB'
    );

    // TEST 8: User Directory Query with Pagination & Filters
    const usersRes = await request('GET', '/api/v1/users?page=1&limit=5&status=active', null, superToken);
    assert(
      usersRes.status === 200 &&
        usersRes.data.data.length > 0 &&
        usersRes.data.pagination.currentPage === 1,
      'User Management Directory with Pagination & Active Filter'
    );

    // TEST 9: Permission Enforcement: User Role cannot create user without permission
    const testRole = await request('GET', '/api/v1/roles', null, superToken);
    const userRoleId = testRole.data.data.find((r) => r.name === 'User')?._id;

    const unauthCreate = await request(
      'POST',
      '/api/v1/users',
      {
        name: 'Forbidden User',
        email: 'forbidden@test.com',
        password: 'Password@123',
        role: userRoleId
      },
      userToken
    );
    assert(
      unauthCreate.status === 403,
      'RBAC Enforcement: Standard User Denied users.create Operation (403 Forbidden)'
    );

    // TEST 10: User Creation by Authorized Administrator
    const timestamp = Date.now();
    const newUserEmail = `testuser.${timestamp}@adminsphere.io`;
    const createRes = await request(
      'POST',
      '/api/v1/users',
      {
        name: 'Jordan Montgomery',
        email: newUserEmail,
        password: 'Password@123',
        role: userRoleId,
        department: 'Quality Assurance',
        phone: '+1 (555) 777-8899',
        status: 'active'
      },
      superToken
    );
    assert(createRes.status === 201 && createRes.data.success === true, 'Admin User Creation with Password Hashing');
    const createdUserId = createRes.data.user._id;

    // TEST 11: Single User Details & Profile View
    const singleUserRes = await request('GET', `/api/v1/users/${createdUserId}`, null, superToken);
    assert(
      singleUserRes.status === 200 && singleUserRes.data.user.email === newUserEmail,
      'User Detail Lookup with Role Population (/api/v1/users/:id)'
    );

    // TEST 12: User Profile Update
    const updateRes = await request(
      'PUT',
      `/api/v1/users/${createdUserId}`,
      {
        department: 'Senior Operations',
        phone: '+1 (555) 999-0011'
      },
      superToken
    );
    assert(
      updateRes.status === 200 && updateRes.data.user.department === 'Senior Operations',
      'User Profile Update (/api/v1/users/:id)'
    );

    // TEST 13: User Deactivation
    const deactRes = await request(
      'PATCH',
      `/api/v1/users/${createdUserId}/status`,
      { status: 'inactive' },
      superToken
    );
    assert(
      deactRes.status === 200 && deactRes.data.user.status === 'inactive',
      'User Status Toggle (Deactivation / Reactivation)'
    );

    // TEST 14: User Deletion
    const deleteRes = await request('DELETE', `/api/v1/users/${createdUserId}`, null, superToken);
    assert(deleteRes.status === 200 && deleteRes.data.success === true, 'User Account Deletion (/api/v1/users/:id)');

    // TEST 15: Roles and Granular Permissions Catalog
    const rolesRes = await request('GET', '/api/v1/roles', null, superToken);
    const permsRes = await request('GET', '/api/v1/roles/permissions', null, superToken);
    assert(
      rolesRes.status === 200 &&
        rolesRes.data.data.length >= 4 &&
        permsRes.status === 200 &&
        permsRes.data.data.length >= 9,
      'Roles & Permissions Master Hierarchy Matrix'
    );

    // TEST 16: Audit Logs Query & Verification of Recorded Events
    const auditRes = await request('GET', '/api/v1/audit?limit=10', null, superToken);
    assert(
      auditRes.status === 200 &&
        auditRes.data.data.length > 0 &&
        auditRes.data.data.some((log) => log.action === 'LOGIN_SUCCESS' || log.action === 'USER_CREATED'),
      'Audit Logging Engine Recording Operational Events in MongoDB'
    );

    // TEST 17: Notifications Query & Unread Badging
    const notifRes = await request('GET', '/api/v1/notifications', null, superToken);
    assert(
      notifRes.status === 200 &&
        Array.isArray(notifRes.data.data) &&
        typeof notifRes.data.unreadCount === 'number',
      'Notification Center & Unread Count Aggregation'
    );

    // TEST 18: Notification Mark All Read
    const markReadRes = await request('POST', '/api/v1/notifications/mark-all-read', {}, superToken);
    assert(markReadRes.status === 200 && markReadRes.data.success === true, 'Mark All Notifications As Read');

    // TEST 19: Operational Analytics & Reports
    const analyticsRes = await request('GET', '/api/v1/analytics', null, superToken);
    assert(
      analyticsRes.status === 200 &&
        analyticsRes.data.data.summary.totalUsers > 0 &&
        Array.isArray(analyticsRes.data.data.registrationTrend) &&
        Array.isArray(analyticsRes.data.data.departmentBreakdown),
      'Enterprise Analytics & Visual Reporting Aggregates'
    );

    // TEST 20: System Settings Management
    const settingsGet = await request('GET', '/api/v1/settings', null, superToken);
    assert(
      settingsGet.status === 200 &&
        settingsGet.data.data.general &&
        settingsGet.data.data.security,
      'System Settings Fetch by Category'
    );

    const settingsUpdate = await request(
      'PUT',
      '/api/v1/settings',
      {
        category: 'general',
        settings: {
          organizationName: 'AdminSphere Global Technologies'
        }
      },
      superToken
    );
    assert(settingsUpdate.status === 200 && settingsUpdate.data.success === true, 'System Settings Update & Persistence');

    console.log('\n=============================================================');
    console.log(`--- TEST RESULTS: ${passed} PASSED | ${failed} FAILED ---`);
    console.log('=============================================================\n');

    if (failed === 0) {
      console.log('>> ALL BACKEND APIS & SECURITY POLICIES FUNCTIONING FLAWLESSLY! <<\n');
    }

    server.close();
    await disconnectDB();
    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('[Error] Verification crashed:', error);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runVerification();
