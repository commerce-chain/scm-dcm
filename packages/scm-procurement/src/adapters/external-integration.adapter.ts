// Copyright (c) Better Data, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface ExternalAuditLogInput {
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  organizationId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: "success" | "failure";
}

export interface ExternalIntegrationAdapter {
  createAuditLog?(input: ExternalAuditLogInput): Promise<void>;
}
