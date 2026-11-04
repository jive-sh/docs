---
title: CLI
description: The jive command, what it has today and what is decided for it.
---

`jive` (npm package `@jive-sh/jive`) replaces `ozy-cli`. It signs a machine or a pipeline in, sets up git signing
through the Jive server, provisions resources, and manages its daemons.

## Commands

| Command | Does | Status |
| --- | --- | --- |
| `jive login` | Signs in with your jive.sh passkey and fetches your account's public key, which git signing and pushes use | Built |
| `jive login --cicd` | In a deploy job: trades the job's GitHub ID token for a session | Built |
| `jive whoami` | Prints the account this machine is signed in as | Built; prints an email-like address, decided to print the handle |
| `jive init` | Makes the git repository you are in a Jive workspace: `.gitmodules` on https, every submodule checked out, every repository signing with your Jive key and pushing through Jive's agent | Built; not yet run on a real workspace |
| `jive load <org> <repo>` | Adds a repository to the workspace as a submodule, then installs and links it | Built |
| `jive unload <org> <repo>` | Removes a loaded repository | Built |
| `jive on <org> <repo> -- <command>` | Runs a command in a loaded repository's folder | Built |
| `jive provision …` | Makes sure a resource exists ([Provisioning](/resources/provision/)) | Built as `<kind> <name>`; decided as `<provider kind> <resource type> <name>` |
| `jive connect <provider kind>` | Connects an organization's account on an outside system ([Connecting an account](/resources/connect/)) | Decided; name proposed |
| `jive create <kind> …` | Scaffolds a package extending `jive-abstract-<kind>` ([Package names](/packages/names/)) | Decided; removed in 0.3.0, to return |
| `jive daemons` | Lists every Jive daemon registered on this machine | Built |
| `jive upgrade` | Upgrades jive with the package manager that installed it | Built |

Commands at jive 0.5.3
([program.ts](https://github.com/jive-sh/jive/blob/462dff763e8194b412b3c040feeaf9f854b6a3e1/src/program.ts#L27-L200)).

## Programs it installs

| Program | Does | Status |
| --- | --- | --- |
| `jive-signing-agent` | A daemon serving the SSH agent protocol on `~/.jive/signing-agent.sock`. It holds no key: it forwards each signing request to `ssh:sign` on the server. | Built |
| `jive-ssh-keygen` | What git runs as `gpg.ssh.program` to sign a commit; it signs through the agent | Built |

**Decided** (Alex, 2026-11-01): signing and pushing need no GitHub sign-in, no GitHub CLI and no git credential
helper.
