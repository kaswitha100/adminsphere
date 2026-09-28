const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { AUDIT_ACTIONS, PERMISSIONS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

/**
 * @desc Get all roles with user count and permission sets
 * @route GET /api/v1/roles
 * @access Private (roles.manage or users.view)
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });

    // Attach active user count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const count = await User.countDocuments({ role: role._id });
        return {
          ...role.toObject(),
          userCount: count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: rolesWithCounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get master permission catalog grouped by module
 * @route GET /api/v1/roles/permissions
 * @access Private (roles.manage)
 */
const getPermissionsList = async (req, res, next) => {
  try {
    let permissions = await Permission.find().sort({ module: 1, key: 1 });

    // Fallback if permission collection is currently empty
    if (permissions.length === 0) {
      permissions = Object.entries(PERMISSIONS).map(([k, v]) => ({
        key: v,
        name: k.replace(/_/g, ' ').toLowerCase(),
        module: v.split('.')[0]
      }));
    }

    // Group by module
    const grouped = permissions.reduce((acc, perm) => {
      const mod = perm.module || 'General';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: permissions,
      grouped
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create custom organizational role
 * @route POST /api/v1/roles
 * @access Private (roles.manage)
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists.'
      });
    }

    const role = await Role.create({
      name: name.trim(),
      description,
      permissions: permissions || [],
      isSystem: false
    });

    await logAudit({
      req,
      action: AUDIT_ACTIONS.ROLE_CREATED,
      resource: 'Role',
      resourceId: role._id,
      details: `Created new custom role: ${role.name}`,
      metadata: { permissions: role.permissions }
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update role permissions and description
 * @route PUT /api/v1/roles/:id
 * @access Private (roles.manage)
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const { name, description, permissions } = req.body;

    // Do not allow renaming default system roles
    if (role.isSystem && name && name !== role.name) {
      return res.status(400).json({
        success: false,
        message: 'System role names cannot be renamed.'
      });
    }

    if (name && !role.isSystem) role.name = name.trim();
    if (description !== undefined) role.description = description;
    if (permissions && Array.isArray(permissions)) {
      role.permissions = permissions;
    }

    await role.save();

    await logAudit({
      req,
      action: AUDIT_ACTIONS.PERMISSIONS_UPDATED,
      resource: 'Role',
      resourceId: role._id,
      details: `Updated permissions/details for role: ${role.name}`,
      metadata: { permissions: role.permissions }
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getPermissionsList,
  createRole,
  updateRole
};
