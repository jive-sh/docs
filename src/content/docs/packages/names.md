---
title: Package names
description: What a Jive package name means, and how the CLI finds packages by name.
---

A package's name is part of the API: it says what the package is, and the CLI finds packages by their names.

## A name is its extends path

**Decided** (Alex, 2026-10-31). A package is named by the chain of abstracts it extends, so the name alone says
what it is and what it implements.

| Prefix | What it is | Example |
| --- | --- | --- |
| `jive-abstract-<kind>` | An **abstract**: defines one kind of package, as an abstract class does. Other packages extend it. | `jive-abstract-library` |
| `jive-abstract-<kind>-<subkind>` | An abstract extending `jive-abstract-<kind>` | `jive-abstract-app-expo` |
| `jive-abstract-resource-provider-<kind>` | A **resource provider abstract**: defines the resource types one kind of outside system offers | `jive-abstract-resource-provider-package-registry` |
| `jive-resource-provider-<kind>-<system>` | A **resource provider implementation** for one system | `jive-resource-provider-package-registry-npm` |
| `jive-agentic-<kind>` | Agentic workflows, skills and workforces | |
| anything else | A package that extends an abstract to do its own work (a CLI, an app, a server) | `@jive-sh/jive` |

**Decided** (Alex, 2026-11-04): "resource provider" replaces "connector". A provider offers several resource types,
as a source control host offers orgs, repos and teams. Today's packages still carry the old names
([Resource providers](/resources/providers/) lists the renames).

## The CLI turns names into menus

**Decided** (Alex, 2026-11-04 for `provision`; the `create` design predates this site). The CLI lists packages by
prefix and splits the rest of each name on hyphens, so a hyphen is a menu level and never part of a word.

- `jive create <kind>` offers every `jive-abstract-<kind>`: `jive create app expo` scaffolds a package extending
  `jive-abstract-app-expo`. **Not built:** jive 0.3.0 removed `create`.
- `jive provision <provider kind> <resource type> <name>` offers every `jive-abstract-resource-provider-<kind>` for
  the first argument, and that abstract's resource types for the second:
  `jive provision package-registry package @my-scope/some-package`.

## An abstract's CLI drops "abstract"

**Built.** An abstract ships a CLI named without "abstract", which an extending package's hooks call:
`jive-abstract-library` ships `jive-library`, so a library's build hook is `jive-library cicd build`.
