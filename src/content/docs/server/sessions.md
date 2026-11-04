---
title: Sessions
description: Every Jive call takes a session token, and there are exactly three ways to get one.
---

Every call to the Jive server takes a session token and nothing else. Signing in is how a caller gets one.

**Decided** (Alex, 2026-11-01): "a session should only be obtainable via human passkey, cicd oidc token exchange, or
jive mints a token and hands it off to a compute provider running an agent workflow. So three methods and only 2 of
them are available via cli".

| Method | Who | CLI | Status |
| --- | --- | --- | --- |
| Passkey | A person, in the browser at jive.sh, or approving a program's sign-in request | `jive login` | Built |
| CI/CD OIDC exchange | A deploy job, trading its GitHub Actions ID token | `jive login --cicd` | Built |
| Minted by Jive | An agent workflow on a compute provider | none | Not built; waits for the compute resource type |

## Signing a program in with a passkey

**Built**
([signInRequests.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/signInRequests.ts#L11-L26)).
A CLI or the daemon holds no passkey, so:

1. The program calls `signInRequests:open` and keeps the claim secret it gets back.
2. The person opens `https://jive.sh/login?request=<id>` and signs in with their passkey. There is no code to compare.
3. The program calls `signInRequests:claim` until it answers with the program's own session token.

**Built:** with phone approval enabled, step 2 can happen on the person's phone instead. The request is pushed to
the Jive app, and approving it there with the passkey grants the program its session
([approvalDevices.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/approvalDevices.ts#L9-L21)).
Not yet tested on a real phone.

## Signing a pipeline in

**Built**
([pipelineSessions.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/pipelineSessions.ts#L10-L29)).
The deploy job asks GitHub for an ID token with audience `https://api.jive.sh` and calls `pipelineSessions:signIn`
with it. The server checks the token and that the repository is registered, then answers with a one-hour session
bound to that repository.
