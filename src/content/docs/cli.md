---
title: CLI
description: The jive command, what it has today and what is decided for it.
---

`jive` (npm package `@jive-sh/jive`) signs a machine or a pipeline in to Jive, makes every repository in a workspace
sign and push with your Jive account key, loads repositories into a workspace, provisions resources, and manages its
daemon.

```sh
bun add -g @jive-sh/jive
```

Installing registers `jive-daemon` to start at login (a LaunchAgent on macOS, a `systemctl --user` unit on Linux, a
scheduled task on Windows).

## Commands

| Command | Does | Status |
| --- | --- | --- |
| `jive login` | Opens `https://jive.sh/login?request=…`, where you sign in with your jive.sh passkey; then fetches your account's public key into `~/.jive/ssh/account.pub`, which git signing and pushes use | Built |
| `jive login --cicd` | In a GitHub Actions job with `id-token: write`: trades the job's GitHub ID token for a session of its pipeline | Built |
| `jive whoami` | Prints the handle of the account this machine is signed in as, as `jive-daemon` reports it; offline, the handle saved at the last check, marked not confirmed | Built |
| `jive init` | Marks the workspace root ([Workspace layout](#workspace-layout)). Then, in that root: rewrites every `.gitmodules` URL to `https://github.com/<owner>/<repo>`, checks out every submodule, makes the root and every repository inside it sign through `jive-ssh-sign` and fetch and push over SSH through `jive-ssh`, and links the packages among them with each other ([Workspace links](#workspace-links)). Safe to run again | Built |
| `jive load <org> <repo>` | Adds `github.com/<org>/<repo>` to the workspace as a submodule at `packages/<its package.json name>`. It clones the repo, or adopts a checkout of it already there and keeps its uncommitted work. It stages only the repo's own `.gitmodules` entry and gitlink, and commits nothing. Then it configures the repo as `jive init` does, runs `bun install` in it, and links it with the workspace's packages | Built |
| `jive unload <org> <repo>` | Removes the workspace's links into the repository, running `bun install` in each package that had one so it gets its registry copy back, then removes the submodule | Built |
| `jive on <org> <repo> -- <command>` | Runs a command in a loaded repository's folder; its exit code is jive's | Built |
| `jive provision <kind> <name>` | Makes sure a resource exists ([Provisioning](/resources/provision/)). Needs a pipeline session from `jive login --cicd` | Built; decided as `<provider kind> <resource type> <name>` |
| `jive daemons` | Lists every Jive daemon registered on this machine, with its state, executable and log | Built |
| `jive upgrade` | Upgrades jive with the package manager that installed it | Built |
| `jive connect <provider kind>` | Connects an organization's account on an outside system ([Connecting an account](/resources/connect/)) | Decided, not built; name proposed |
| `jive create <kind> …` | Scaffolds a package extending `jive-abstract-<kind>` ([Package names](/packages/names/)) | Decided, not built; removed in 0.3.0, to return |

Every command takes `--help`; `jive --version` prints the version, and `jive --setup-completion` turns on Tab
completion in your shell.

Commands at jive 0.9.0
([program.ts](https://github.com/jive-sh/jive/blob/fc7ac076f46e489f4028186b4ce8053e332622d9/src/program.ts#L32-L198)).

### Workspace layout

A workspace is a git monorepo whose root `package.json` has `"jive": { "root": true }`. `jive init` finds the root as
the nearest directory, from the current one upward, whose `package.json` has that mark. When there is none, the root is
the top of the outermost git repository you are in, and `jive init` writes the mark into its `package.json`, creating
the file if it's missing and keeping its other fields and indentation. Every other command finds the root by the mark.
Outside a marked workspace, they stop and tell you to run `jive init`.

Each repository `jive load` adds is a submodule at `packages/<its package.json name>`: `@jive-sh/jive` at
`packages/@jive-sh/jive`, `jive-abstract-library` at `packages/jive-abstract-library`. It's the only layout, and there is
no option to put a repository elsewhere. A repository without a `package.json` naming its package can't be loaded. A
checkout of the repository somewhere else under `packages/` is refused, with the `git mv` that moves it into place.
`jive unload` and `jive on` find a loaded repository by its GitHub URL in the root `.gitmodules`
([README](https://github.com/jive-sh/jive/blob/fc7ac076f46e489f4028186b4ce8053e332622d9/README.md#workspace-layout),
[layout](https://github.com/jive-sh/jive/blob/fc7ac076f46e489f4028186b4ce8053e332622d9/src/modules/tool-state/workspace-layout.ts)).

### Workspace links

A workspace's packages are separate repositories, each with its own `package.json`, lockfile and pipeline. Wherever one
depends on another, `jive init` and `jive load` replace the dependent's `node_modules/<name>` with a symlink to the
dependency's checkout, or to its build in `dist/base` for a package built by a Jive abstract. No `package.json` or
lockfile is written, so each repository still installs alone from its own lockfile, locally and in CI. A `bun install`
in a dependent puts the registry copies back; run `jive init` again afterwards.

## Programs it installs

| Program | Does | Status |
| --- | --- | --- |
| `jive-daemon` | The daemon, started at login. It serves the SSH agent protocol on `~/.jive/signing-agent.sock`, holding no key: it sends each signing request to `ssh:sign` on the server. On `~/.jive/jive-daemon.sock` it answers who is signed in, for `jive whoami`, `jive-ssh`, `jive-ssh-sign` and the Jive browser extension | Built |
| `jive-ssh` | ssh with your Jive key and no other; git runs it as `core.sshCommand`. Before ssh runs, it asks `jive-daemon` whether the key can sign and stops with the reason when it can't (signed out, server unreachable, daemon not running) | Built |
| `jive-ssh-sign` | What git runs as `gpg.ssh.program` to sign a commit: ssh-keygen through the agent, with the same check before `-Y sign` | Built |
| `jive-native-host` | What Chrome starts for the Jive browser extension; it relays the extension's messages to `jive-daemon` ([Connecting an account](/resources/connect/)) | Built |
| `jive-ssh-keygen` | The signing program jive 0.7.0 configured. Since 0.8.0 it only refuses, telling you to run `jive init` in the repository | Kept for repositories 0.7.0 configured |

**Decided** (Alex, 2026-11-01): signing and pushing need no GitHub sign-in, no GitHub CLI and no git credential
helper. Built that way: jive holds no GitHub token, and GitHub must know the account key's public half as an SSH and
signing key.
