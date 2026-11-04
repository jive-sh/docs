---
title: API reference
description: Every contract Jive's packages, CLI, daemon, extension and server agree on.
---

This reference covers every contract a package author, a pipeline, a person's machine or the Jive server relies on,
not only the server's functions.

| Part | Page |
| --- | --- |
| Package names: what a name means, and how the CLI finds packages by name | [Package names](/packages/names/) |
| What an abstract owns: its hooks, the config it asks of an extending package, the folders under `src`, the shared tsconfig | [Abstracts](/packages/abstracts/) |
| How a package runs in CI/CD | [CI/CD hooks](/packages/cicd/) |
| Resource providers: the resource types a provider offers, and what its implementation exposes | [Resource providers](/resources/providers/) |
| Connecting an account: how a credential gets from an outside system to Jive | [Connecting an account](/resources/connect/) |
| Provisioning: making sure a resource exists | [Provisioning](/resources/provision/) |
| Sessions: the only three ways to get one | [Sessions](/server/sessions/) |
| The server's functions | [Server functions](/server/functions/) |
| The `jive` CLI | [CLI](/cli/) |

## Status labels

Every contract on these pages carries one of these labels:

- **Built:** in code today, linked to the lines at a fixed commit.
- **Decided:** Alex decided it, quoted with the date; not built yet.
- **Proposed:** the default in effect until Alex changes it; not built yet.
