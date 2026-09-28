const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { AUDIT_ACTIONS, ROLES } = require('../config/constants');
const { logAudit } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

/**
 * @desc Get paginated users with search, role, status filtering, and sorting
 * @route GET /api/v1/users
 * @access Private (users.view)
 */
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    // Search by name or email
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { department: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('role', 'name description isSystem permissions')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit) || 1,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single user details with activity summary
 * @route GET /api/v1/users/:id
 * @access Private (users.view)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Fetch recent audit logs for this user (actions by them or actions on them)
    const recentActivity = await AuditLog.find({
      $or: [
        { 'actor.id': user._id },
        { resourceId: String(user._id) }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new user account
 * @route POST /api/v1/users
 * @access Private (users.create)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const roleDoc = await Role.findById(role);
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || 'General',
      phone: phone || '',
      status: status || 'active'
    });

    const populatedUser = await User.findById(user._id).populate('role');

    // Audit Log
    await logAudit({
      req,
      action: AUDIT_ACTIONS.USER_CREATED,
      resource: 'User',
      resourceId: user._id,
      details: `Created new user account for ${email} with role ${roleDoc.name}`,
      metadata: { name, email, role: roleDoc.name, department }
    });

    // Notify administrators
    await createNotification({
      title: 'New User Registered',
      message: `${name} (${email}) has been added to ${department || 'organization'} as ${roleDoc.name}.`,
      type: 'info',
      link: `/users/${user._id}`
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update existing user details
 * @route PUT /api/v1/users/:id
 * @access Private (users.update)
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, email, role, department, phone, status, password } = req.body;

    // Check if email conflict
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Another user is already registered with this email address'
        });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    if (role) {
      const roleDoc = await Role.findById(role);
      if (!roleDoc) {
        return res.status(400).json({
          success: false,
          message: 'Specified role not found'
        });
      }
      user.role = role;
    }

    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate('role');

    // Audit Log
    await logAudit({
      req,
      action: AUDIT_ACTIONS.USER_UPDATED,
      resource: 'User',
      resourceId: user._id,
      details: `Updated details for user: ${user.email}`,
      metadata: { name: user.name, email: user.email, status: user.status }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle user status (active / inactive / suspended)
 * @route PATCH /api/v1/users/:id/status
 * @access Private (users.update)
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await User.findById(req.params.id).populate('role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Safety checks: Cannot deactivate self or primary Super Admin
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status.'
      });
    }

    if (user.role?.name === ROLES.SUPER_ADMIN && status !== 'active') {
      const superAdminCount = await User.countDocuments({
        role: user.role._id,
        status: 'active'
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the sole active Super Admin account.'
        });
      }
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    const action = status === 'active' ? AUDIT_ACTIONS.USER_ACTIVATED : AUDIT_ACTIONS.USER_DEACTIVATED;
    await logAudit({
      req,
      action,
      resource: 'User',
      resourceId: user._id,
      details: `Changed account status of ${user.email} from ${previousStatus} to ${status}`
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete user account
 * @route DELETE /api/v1/users/:id
 * @access Private (users.delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    if (user.role?.name === ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin accounts cannot be permanently deleted.'
      });
    }

    await User.findByIdAndDelete(user._id);

    await logAudit({
      req,
      action: AUDIT_ACTIONS.USER_DELETED,
      resource: 'User',
      resourceId: user._id,
      details: `Permanently removed user account: ${user.email}`
    });

    res.status(200).json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
};
