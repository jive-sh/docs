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

**Built** (jive 0.13, `@jive-sh/server` 0.13). On a person's machine only `jive-daemon` signs in. `jive login`, any
`jive` command that needs a session, the Jive browser extension, and any program that runs one of them ask the daemon
on its socket, so programs asking at the same time share one request and the person gets one prompt.

1. The daemon reads which program asked from the socket's peer process and its parents. It keeps only program names
   ([caller-chain](https://github.com/jive-sh/jive/blob/b3a76b58034bcaf158ff1ea4284ed2fd57dc1f75/src/modules/caller-chain/program-names.ts#L1-L28)), never command lines.
2. When no request is waiting, the daemon opens one at `POST /sign-in-requests`
   ([http.ts](https://github.com/jive-sh/server/blob/5f587db973bbda948148b03f0f11ae73dc5eb1cc/convex/http.ts#L33-L52)). The request names the machine by its key, an ECDSA P-256 key the
   daemon created, and by the name its operating system gives it. It is signed with that key and names the programs.
   The server records the address the request came from.
   - When a request is already waiting, the program is added to it instead (`signInRequests:addCaller`).
3. The person opens `https://jive.sh/login?request=<id>` and signs in with their passkey. There is no code to compare.
   - The page and the phone show the programs, the machine's nickname, its key name, whether the account trusts it,
     roughly where the request came from, and the address.
   - **Trust this machine** marks the machine trusted under a nickname, which starts as its OS name. Trust is only a
     label: every sign-in still needs the passkey. Its job is to make a fake machine stand out, so a trusted machine
     shows ✓ and an untrusted one ⚠, in words as well as color, and the phone titles an untrusted machine's request
     "⚠ Sign in from an untrusted machine?".
   - The **key name** is three words from the SHA-256 of the machine's public key, so a machine copying a trusted
     machine's nickname still shows another key name. Trust follows the whole key.
   - The **location** comes from the server looking the address up at [ipinfo.is](https://ipinfo.is/), whose privacy
     policy says "Lookup queries are not stored or logged". Only the address is sent, private addresses are skipped,
     and only the city, region, country and coordinates to a tenth of a degree are kept
     ([ipLocation.ts](https://github.com/jive-sh/server/blob/37139d3d218fc6b8ed68ebe5177355e57ac1ed35/convex/model/ipLocation.ts#L1-L12)).
4. The daemon calls `signInRequests:claim`, signing each claim with the machine's key, until it answers with the
   machine's own session token ([machineKeys.ts](https://github.com/jive-sh/server/blob/5f587db973bbda948148b03f0f11ae73dc5eb1cc/convex/model/machineKeys.ts#L1-L33)). Someone holding only
   the claim secret gets nothing.

The machine's key lives in `~/.jive/machine-key.json`, readable by its owner only. *Planned:* the Secure Enclave on a
Mac and a TPM elsewhere, where even the daemon can't read the private half. `signInRequests:open`, which takes no
machine, stays for the Jive app and for jive 0.12 and older.

**Built:** with phone approval enabled, step 3 can happen on the person's phone instead. The request is pushed to
the Jive app, with a notification naming the programs, the machine, its trust and the address. Approving it there with
the passkey grants the program its session
([approvalDevices.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/approvalDevices.ts#L9-L21)).
Not yet tested on a real phone.

## Signing a pipeline in

**Built**
([pipelineSessions.ts](https://github.com/jive-sh/server/blob/371b2dadf7ba5898fe86bb914c490075f4589bd3/convex/pipelineSessions.ts#L10-L29)).
The deploy job asks GitHub for an ID token with audience `https://api.jive.sh` and calls `pipelineSessions:signIn`
with it. The server checks the token and that the repository is registered, then answers with a one-hour session
bound to that repository.
