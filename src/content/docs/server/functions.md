---
title: Server functions
description: The public functions of @jive-sh/server, the Convex deployment that holds Jive's data and credentials.
---

`@jive-sh/server` is a Convex deployment at `https://api.jive.sh`. A caller reaches each function over Convex's HTTP
API (`POST /api/action`, `/api/query` or `/api/mutation` with `{ "path": "<module>:<function>", "args": … }`), or
with `ConvexHttpClient` and the typed `api` from `@jive-sh/server-client`.

All links are to `jive-sh/server` at
[371b2da](https://github.com/jive-sh/server/tree/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex).

## Built

| Function | Does |
| --- | --- |
| `auth:registrationOptions`, `auth:register` | Creates an account and its passkey, and opens its first session. Makes the account's SSH key. |
| `auth:signInOptions`, `auth:signIn` | Signs a person in with a passkey; can also approve a program's sign-in request |
| `auth:addPasskeyOptions`, `auth:addPasskey` | Adds another passkey to the account |
| `signInRequests:open`, `describe`, `claim` | Signs a program in ([Sessions](/server/sessions/)) |
| `pipelineSessions:signIn` | Signs a deploy job in with its GitHub ID token |
| `sessions:signOut` | Revokes the session |
| `accounts:me` | The signed-in account and its passkeys |
| `approvalDevices:enable`, `disable`, `list` | Phone approval |
| `ssh:publicKey` | The account's OpenSSH public key |
| `ssh:sign` | Signs bytes with the account's SSH key, for git commit signing and SSH logins alike |
| `provision` | Makes sure a resource exists ([Provisioning](/resources/provision/)) |
| `packages:provision` | The older form of `provision`, for npm packages |

**Decided** (Alex, 2026-11-01): "There's just an ssh sign request. You don't create keys. You can fetch the public key
or sign". Jive makes each account's key at sign-up and rotates it.

The npm connection functions (`connections:completeNpmConnection`, `npmSessions:*`, `signingPasskey:*`) belong to the
npm publishing work in a separate project and aren't covered here.

## Decided, not built

| Function | Does | Page |
| --- | --- | --- |
| `connections:connect` (**Proposed** name) | Stores an organization's credential for a provider | [Connecting an account](/resources/connect/) |
| Session minting for compute | Hands an agent workflow a session | [Sessions](/server/sessions/) |
