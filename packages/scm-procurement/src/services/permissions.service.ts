// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type POPermission =
  | "po.create"
  | "po.view"
  | "po.edit"
  | "po.delete"
  | "po.place"
  | "po.rollback"
  | "po.cancel"
  | "po.add_line"
  | "po.edit_line"
  | "po.delete_line"
  | "po.cancel_line"
  | "po.add_adjustment"
  | "po.edit_adjustment"
  | "po.create_shipment"
  | "po.create_invoice";

export type PORole =
  | "BUYER"
  | "PURCHASING_MANAGER"
  | "PURCHASING_APPROVER"
  | "WAREHOUSE_MANAGER"
  | "INVOICE_USER"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface POContext {
  id: string;
  organizationId: string;
  status: string;
  hasShipments: boolean;
  hasInvoices: boolean;
  hasPrepaidLines: boolean;
  createdByUserId: string;
}

export interface UserPOContext {
  userId: string;
  organizationId: string;
  roles: PORole[];
  isSuperAdmin?: boolean;
}

const ROLE_PERMISSIONS: Record<PORole, POPermission[]> = {
  BUYER: [
    "po.create",
    "po.view",
    "po.edit",
    "po.delete",
    "po.add_line",
    "po.edit_line",
    "po.delete_line",
    "po.cancel_line",
    "po.add_adjustment",
    "po.edit_adjustment"
  ],
  PURCHASING_MANAGER: [
    "po.create",
    "po.view",
    "po.edit",
    "po.delete",
    "po.add_line",
    "po.edit_line",
    "po.delete_line",
    "po.cancel_line",
    "po.add_adjustment",
    "po.edit_adjustment",
    "po.create_shipment"
  ],
  PURCHASING_APPROVER: [
    "po.create",
    "po.view",
    "po.edit",
    "po.delete",
    "po.place",
    "po.rollback",
    "po.cancel",
    "po.add_line",
    "po.edit_line",
    "po.delete_line",
    "po.cancel_line",
    "po.add_adjustment",
    "po.edit_adjustment",
    "po.create_shipment",
    "po.create_invoice"
  ],
  WAREHOUSE_MANAGER: ["po.view", "po.place", "po.rollback", "po.create_shipment"],
  INVOICE_USER: ["po.view", "po.create_invoice"],
  ADMIN: [
    "po.create",
    "po.view",
    "po.edit",
    "po.delete",
    "po.place",
    "po.rollback",
    "po.cancel",
    "po.add_line",
    "po.edit_line",
    "po.delete_line",
    "po.cancel_line",
    "po.add_adjustment",
    "po.edit_adjustment",
    "po.create_shipment",
    "po.create_invoice"
  ],
  SUPER_ADMIN: [
    "po.create",
    "po.view",
    "po.edit",
    "po.delete",
    "po.place",
    "po.rollback",
    "po.cancel",
    "po.add_line",
    "po.edit_line",
    "po.delete_line",
    "po.cancel_line",
    "po.add_adjustment",
    "po.edit_adjustment",
    "po.create_shipment",
    "po.create_invoice"
  ]
};

const APPROVER_ROLES: PORole[] = [
  "PURCHASING_APPROVER",
  "WAREHOUSE_MANAGER",
  "ADMIN",
  "SUPER_ADMIN"
];

const MANAGER_ROLES: PORole[] = [
  "BUYER",
  "PURCHASING_MANAGER",
  "PURCHASING_APPROVER",
  "WAREHOUSE_MANAGER",
  "ADMIN",
  "SUPER_ADMIN"
];

export class POPermissions {
  static hasPermission(userContext: UserPOContext, permission: POPermission): boolean {
    return userContext.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
  }

  static isApprover(userContext: UserPOContext): boolean {
    return userContext.roles.some((role) => APPROVER_ROLES.includes(role));
  }

  static isManager(userContext: UserPOContext): boolean {
    return userContext.roles.some((role) => MANAGER_ROLES.includes(role));
  }

  static getUserPermissions(userContext: UserPOContext): POPermission[] {
    const permissions = new Set<POPermission>();
    userContext.roles.forEach((role) =>
      ROLE_PERMISSIONS[role]?.forEach((permission) => permissions.add(permission))
    );
    return Array.from(permissions);
  }

  static canView(userContext: UserPOContext, poContext: POContext): PermissionCheckResult {
    if (poContext.organizationId !== userContext.organizationId && !userContext.isSuperAdmin) {
      return { allowed: false, reason: "Access denied" };
    }
    if (!this.hasPermission(userContext, "po.view")) {
      return { allowed: false, reason: "No permission to view purchase orders" };
    }
    return { allowed: true };
  }

  static canCreate(userContext: UserPOContext): PermissionCheckResult {
    if (!this.hasPermission(userContext, "po.create")) {
      return { allowed: false, reason: "No permission to create purchase orders" };
    }
    return { allowed: true };
  }

  static canEdit(userContext: UserPOContext, poContext: POContext): PermissionCheckResult {
    if (poContext.organizationId !== userContext.organizationId) {
      return { allowed: false, reason: "Access denied" };
    }
    if (!this.hasPermission(userContext, "po.edit")) {
      return { allowed: false, reason: "No permission to edit purchase orders" };
    }
    if (poContext.status === "PENDING" && this.isManager(userContext)) return { allowed: true };
    if (poContext.status === "PLACED" && this.isApprover(userContext)) return { allowed: true };
    if (poContext.status === "CANCELLED" || poContext.status === "CLOSED") {
      return { allowed: false, reason: `Cannot edit ${poContext.status.toLowerCase()} purchase orders` };
    }
    return { allowed: false, reason: "Edit not allowed for current status/role" };
  }

  /**
   * Auth/session is injected as context to keep OSS package auth-agnostic.
   */
  static getUserContextFromAuthContext(context: {
    userId: string;
    organizationId: string;
    roles: string[];
    isSuperAdmin?: boolean;
  }): UserPOContext {
    const roles = context.roles.filter((role): role is PORole =>
      [
        "BUYER",
        "PURCHASING_MANAGER",
        "PURCHASING_APPROVER",
        "WAREHOUSE_MANAGER",
        "INVOICE_USER",
        "ADMIN",
        "SUPER_ADMIN"
      ].includes(role)
    );
    if (context.isSuperAdmin && !roles.includes("SUPER_ADMIN")) {
      roles.push("SUPER_ADMIN");
    }
    return {
      userId: context.userId,
      organizationId: context.organizationId,
      roles,
      isSuperAdmin: context.isSuperAdmin ?? false
    };
  }
}

export default POPermissions;
