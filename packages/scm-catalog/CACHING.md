<!--
Copyright (c) Better Data, Inc.
SPDX-License-Identifier: Apache-2.0
-->

# SCM Catalog Caching Policy

`@betterdata/scm-catalog` is cacheable and should use tag-based invalidation.

## Rule

- Cache catalog read responses by organization.
- Use `revalidateTag('catalog:{orgId}')` invalidation semantics at write/update boundaries.

## Strategy

- Read path keys/tags are scoped by org (`catalog:{orgId}`).
- Mutations to products/categories/suppliers must trigger that org tag invalidation.
- This policy is applied at extraction time and is not deferred.
