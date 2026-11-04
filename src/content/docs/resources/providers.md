---
title: Resource providers
description: A provider offers several resource types; an implementation is a Convex component plus frontend code.
---

A **resource provider** is one kind of outside system an organization uses: a package registry, a source control
host, a DNS host. It offers several **resource types**. Jive makes sure each resource exists, using credentials the
organization connected once.

**Decided** (Alex, 2026-11-04): "there's probably a resource provider and multiple types of resources that said
resource provides … Like a source control host provides repos, orgs, maybe teams? A package repository probably
provides both packages and orgs." This is the model Terraform's providers and Crossplane's managed resources use;
what Jive adds is that its server holds the credentials, and callers hold only a session.

## Three layers

| Layer | Package | Defines |
| --- | --- | --- |
| Abstract | `jive-abstract-resource-provider` | What every provider exposes: connect, refresh, key sync |
| Provider kind | `jive-abstract-resource-provider-package-registry` | The resource types a package registry offers (`org`, `package`) and the arguments each takes |
| Implementation | `jive-resource-provider-package-registry-npm` | Does it on npm: a Convex component and frontend code |

Each organization configures exactly one implementation per provider kind. **Built** for the one kind that exists
([schema.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/schema.ts#L134-L143)).

## Provider kinds and their resource types

| Provider kind | Resource types | Implementations | Status |
| --- | --- | --- | --- |
| `package-registry` | `package`; `org` | npm | `package` built (as the connector below); `org` proposed |
| `source-control-host` | `org`, `repo`, `team` | GitHub | Proposed. Replaces the proposed `code-repository` connector, which offered repos only. |
| `dns` | `zone`, `record` | Cloudflare | Proposed |

A resource can belong to another: a package to an org, a repo to an org.

## What an implementation exposes

**Decided** (Alex, 2026-11-04): "a package which implements a resource provider needs to have both frontend code and
a convex component".

### The Convex component

`@jive-sh/server` installs it and calls it. **Proposed** contract, one Convex module per concern:

```ts
// Every provider (jive-abstract-resource-provider)
connection.connect({ credential })   // checks the credential against the outside system
  → { status: "connected"; account: { id: string; name: string } } | { status: "refused"; reason: string }
connection.refresh({ credential })   // only for a refreshable credential
  → { status: "refreshed"; credential: Credential } | { status: "refused"; reason: string }
keys.syncPublicKeys({ owner, keys, credential })   // only for a system that holds copies of Jive keys

// One module per resource type the provider kind defines, e.g. package-registry's
package.ensure({ args: { name: string; org: string }, caller, credential }) → EnsureResult
org.ensure({ args: { name: string }, caller, credential }) → EnsureResult

type Credential = {
  blob: string;              // whatever the outside system issued; only the implementation reads it
  expiresAt: number | null;  // ms since epoch; null for one that doesn't expire
  refreshable: boolean;      // whether connection.refresh can renew it (the blob carries what refresh needs)
};
```

- **Decided** (Alex, 2026-11-04): connect takes "the actual credential blob, expiration, and whether it's
  refreshable", and refreshing is a separate call.
- **Decided** (Alex, 2026-11-01): "Connectors must expose an API which allows for key rotation". The draft is
  `keys.syncPublicKeys`
  ([jive_key_rotation_api.md](https://github.com/jive-sh/jive/blob/462dff763e8194b412b3c040feeaf9f854b6a3e1/docs/jive_key_rotation_api.md)).
- A component stores no credentials: the server passes one on every call. **Built** that way today.
- `EnsureResult` is today's `EnsureInstanceResult`: `ready`, `inProgress`, `personNeeded` or `refused`
  ([instance.ts](https://github.com/jive-sh/jive-abstract-resource/blob/d2429164c20ef415c2ec1e76cf0a8c68c157ad24/src/internal/public/instance.ts#L27-L38)).
- The build checks the component's generated `ComponentApi` type against the abstract's contract type for exact
  equality. **Built**
  ([abstract.ts](https://github.com/jive-sh/jive-abstract-resource/blob/d2429164c20ef415c2ec1e76cf0a8c68c157ad24/src/internal/public/abstract.ts#L17-L30)).

### The frontend code

Runs in the Jive browser extension and walks a person through the outside system's own screens to produce the
credential. See [Connecting an account](/resources/connect/).

## What exists today

**Built**, under the names used before "provider":

| Today | Becomes |
| --- | --- |
| `jive-abstract-resource` | stays |
| `jive-abstract-resource-connector`: no contract of its own | `jive-abstract-resource-provider` |
| `jive-abstract-resource-connector-package-registry` | `jive-abstract-resource-provider-package-registry` |
| `jive-resource-connector-package-registry-npm` | `jive-resource-provider-package-registry-npm` |

Today's package-registry contract has one resource type, a package, implied rather than named: `resource.ensureInstance`
with `{ packageName }`. It also has five lower-level calls: `packageExists`, `createPlaceholder`, and list, register
and remove trusted publishers
([contract.ts](https://github.com/jive-sh/jive-abstract-resource-connector-package-registry/blob/cdf5583fae3fec9ce83b231a1a8622c5b23dc80e/src/internal/public/contract.ts#L28-L95)).
There's no connect, refresh or key sync call yet.
