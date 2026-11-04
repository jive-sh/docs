---
title: Provisioning
description: Making sure a resource exists, from a deploy job or a person's terminal.
---

`provision` makes sure one resource exists. It is idempotent: a deploy calls it every run, and a resource that
already exists comes back `ready`.

## The CLI

**Decided** (Alex, 2026-11-04): "For provision, shouldn't kind be any kind of resource? And then the resource's
creation args need to be supplied. If we're adding a resource provider, both the resource provider and the type of
resource on that provider must be supplied."

```sh
jive provision <provider kind> <resource type> <name>
jive provision package-registry package @my-scope/some-package
```

- `<provider kind>` completes from the `jive-abstract-resource-provider-*` packages, and `<resource type>` from the
  types that abstract defines.
- **Proposed:** the creation arguments come from the package's `package.json`, under
  `jive.resources.<provider kind>.<resource type>.<name>`. A flag per argument, generated from the resource type's
  schema, overrides them.

**Built** today (jive 0.5.3): `jive provision <kind> <name>`, with the instance read from
`jive.resources.<kind>.<name>` or given as `--instance '<json>'`
([program.ts](https://github.com/jive-sh/jive/blob/462dff763e8194b412b3c040feeaf9f854b6a3e1/src/program.ts#L144-L163)).

## The server call

**Proposed** shape:

```ts
provision({
  sessionToken: string,
  providerKind: string,   // "package-registry"
  resourceType: string,   // "package"
  args: unknown,          // checked against the resource type's schema
}) → { status: "ready"; resourceId: string; resource: unknown }
   | { status: "inProgress"; retryAfterSeconds: number }
   | { status: "personNeeded"; reason: string; url: string }
   | { status: "refused"; reason: string }
```

The server finds the session's organization, that organization's implementation of the provider kind and its
connected credential. Then it calls the component's `<resource type>.ensure` with the arguments, the caller and the
credential.

**Built** today: `provision({ sessionToken, kind, instance })`, with `kind` `connector-package-registry` the only kind
([provision.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/provision.ts#L21-L25)).
`packages:provision` is its older form for npm packages, which `jive-abstract-library`'s deploy calls.
