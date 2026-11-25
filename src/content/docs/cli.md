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
| `jive init` | Sets up the workspace, the nearest git repository from where it runs ([Workspace layout](#workspace-layout)); in a folder in no repository, it first makes that folder a new repository on `main`. In it: rewrites every `.gitmodules` already there, at every depth, to `https://github.com/<owner>/<repo>` (a repository with none gets none, and no other file changes), checks out every submodule, makes the root and every repository inside it sign through `jive-ssh-sign` and fetch and push over SSH through `jive-ssh`, and links the packages among them with each other ([Workspace links](#workspace-links)). It asks nothing, except a name and email for the workspace's commits when the root's git config has none. Safe to run again | Built |
| `jive load <org> <repo>` | In a git repository, adds `github.com/<org>/<repo>` to the workspace as a submodule at `packages/<its package.json name>`, logging `Loading <org>/<repo> into <root>/packages/<package name>, in the workspace at <root>`. It clones the repo, or adopts a checkout of it already there and keeps its uncommitted work. It stages only the repo's own `.gitmodules` entry and gitlink, and commits nothing; the workspace's other `.gitmodules` URLs move to https, unstaged. Then it runs `bun install` in the repo, links it with the workspace's packages, and ends by running `jive init` in it. In a folder in no repository, it clones the repo into `./<repo>` (the echoed `git clone` shows where) and runs `jive init` there. Any other words than an org and one repo print `jive load --help`, and `No access to an org named <org>` when GitHub has no account by that name | Built |
| `jive unload <org> <repo>` | Removes the workspace's links into the repository, running `bun install` in each package that had one so it gets its registry copy back, then removes the submodule from the workspace, the nearest git repository from where it runs | Built |
| `jive on <org> <repo> -- <command>` | Runs a command in the folder of a repository loaded in the workspace, the nearest git repository from where it runs; its exit code is jive's | Built |
| `jive provision <kind> <name>` | Makes sure a resource exists ([Provisioning](/resources/provision/)). Needs a pipeline session from `jive login --cicd` | Built; decided as `<provider kind> <resource type> <name>` |
| `jive daemons` | Lists every Jive daemon registered on this machine, with its state, executable and log | Built |
| `jive upgrade` | Upgrades jive with the package manager that installed it | Built |
| `jive connect <provider kind>` | Connects an organization's account on an outside system ([Connecting an account](/resources/connect/)) | Decided, not built; name proposed |
| `jive create <kind words…>` | Makes a new package at `packages/<its package name>` in the workspace from the template of `jive-abstract-<kind words joined by hyphens>`, asking for each input the template names or taking it as `--<input> <value>` ([Package names](/packages/names/)). It writes files only: creating its GitHub repo and `jive load` come after | Built (0.11.0) |

Before each git or bun command whose output you see, jive prints the command itself on stderr, in teal when stderr is
a terminal and `NO_COLOR` is not set to a value, as a shell command you could paste and run from where you ran jive:
`-C <folder>` (git) or `--cwd <folder>` (bun) when it runs elsewhere, and each `-c key=value` on a line of its own
([shell-command.ts](https://github.com/jive-sh/jive/blob/c8a4ade3e1e9f2a8e9a6bc81fd4e6ff6292d16cb/src/modules/command-echo/shell-command.ts)):

```
git \
  -c core.sshCommand=/home/ada/.bun/bin/jive-ssh \
  -c ssh.variant=ssh \
  -c url.git@github.com:.insteadOf=https://github.com/ \
  clone https://github.com/ozyman42/workspace /home/ada/src/workspace
```

Every command takes `--help`; `jive --version` prints the version, and `jive --setup-completion` turns on Tab
completion in your shell.

Commands at jive 0.12.2
([program.ts](https://github.com/jive-sh/jive/blob/c8a4ade3e1e9f2a8e9a6bc81fd4e6ff6292d16cb/src/program.ts#L37-L259)).

### Workspace layout

A workspace is the nearest git repository from the folder a command runs in: the nearest folder, from there up, that
holds `.git` (a repository's folder, or the file a submodule or worktree has). Any nesting level works: inside a
submodule, the submodule is the workspace, and to work in an outer repository you `cd` there first. Nothing marks a
workspace and there is no flag or question to pick one. `jive init`, `jive load`, `jive unload`, `jive on`, `jive create`
and Tab completion all use this rule
([workspace rule](https://github.com/jive-sh/jive/blob/d71b5ba964eeb28eacff528cd5e656499f482b39/src/modules/tool-state/impl.ts)).

Each repository `jive load` adds is a submodule at `packages/<its package.json name>`: `@jive-sh/jive` at
`packages/@jive-sh/jive`, `jive-abstract-library` at `packages/jive-abstract-library`. It's the only layout, and there is
no option to put a repository elsewhere. A repository without a `package.json` naming its package can't be loaded. A
checkout of the repository somewhere else under `packages/` is refused, with the `git mv` that moves it into place.
`jive unload` and `jive on` find a loaded repository by its GitHub URL in the workspace's `.gitmodules`
([README](https://github.com/jive-sh/jive/blob/d71b5ba964eeb28eacff528cd5e656499f482b39/README.md#workspace-layout),
[layout](https://github.com/jive-sh/jive/blob/d71b5ba964eeb28eacff528cd5e656499f482b39/src/modules/tool-state/workspace-layout.ts)).

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
