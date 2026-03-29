// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export type ShipmentPermission = "shipment.view" | "shipment.edit" | "shipment.pick" | "shipment.ship";
export type ShipmentRole = "WAREHOUSE_STAFF" | "WAREHOUSE_MANAGER" | "QC_INSPECTOR" | "ADMIN";

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/** Minimal shipment fields used for permission checks (distinct from state-machine ShipmentContext). */
export interface PermissionShipmentContext {
  id: string;
  organizationId: string;
  status: string;
}

export interface UserShipmentContext {
  userId: string;
  organizationId: string;
  roles: ShipmentRole[];
}

export class ShipmentPermissions {
  static hasPermission(user: UserShipmentContext, _permission: ShipmentPermission): boolean {
    return user.roles.length > 0;
  }

  static fromAuthContext(auth: {
    userId: string;
    organizationId: string;
    roles: string[];
  }): UserShipmentContext {
    return {
      userId: auth.userId,
      organizationId: auth.organizationId,
      roles: auth.roles.filter((role): role is ShipmentRole =>
        ["WAREHOUSE_STAFF", "WAREHOUSE_MANAGER", "QC_INSPECTOR", "ADMIN"].includes(role)
      )
    };
  }
}

export default ShipmentPermissions;
