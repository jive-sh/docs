---
title: Abstracts
description: What an abstract owns, and what a package that extends one gets from it.
---

An **abstract** (`jive-abstract-<kind>`) defines one kind of package. A package **extends** an abstract by pointing
its six CI/CD hooks at the abstract's CLI. From then on, the abstract decides how the package builds, tests and
deploys. An abstract can extend another abstract: `jive-abstract-app-expo` extends `jive-abstract-library`.

An abstract owns four contracts with the packages that extend it.

## 1. The hooks

**Built.** The extending package's `package.json` names the abstract's CLI in all six `jive:cicd:*` scripts:

```json
"jive:cicd:build": "jive-library cicd build"
```

What each hook must do is on [CI/CD hooks](/packages/cicd/).

## 2. The config it asks of an extending package

**Built.** Each abstract defines the `jive` block of an extending package's `package.json` as an Effect Schema. It
publishes that schema as JSON Schema, so an editor completes and checks the block. Every abstract's block has `cicd`
(the pipeline's settings) and one block named after the abstract's kind with that kind's own settings. For
`jive-abstract-library` that block is `library`
([manifest.ts](https://github.com/jive-sh/jive-abstract-library/blob/94e609ce9c2c34a4a7d9ab9f7193fe25708d771c/src/internal/public/manifest.ts#L224-L227)):

```json
"jive": {
  "cicd": { "deploy": { … }, "runsOn": "ubuntu-latest", … },
  "library": { "daemons": ["jive-signing-agent"], "provisionWithJive": null }
}
```

- Every field is required. The schema is how an author finds out what can be configured, so an abstract fills in
  the values when it scaffolds a package, never defaults them at run time.
- An abstract builds its schema with `makeJivePackageJsonSchema`
  ([manifest.ts](https://github.com/jive-sh/jive-abstract-library/blob/94e609ce9c2c34a4a7d9ab9f7193fe25708d771c/src/internal/public/manifest.ts#L276-L278)),
  so `cicd` and the hook list can't drift between abstracts.
- `files`, `exports` and `repository` are banned in a source `package.json`: the build generates them
  ([manifest.ts](https://github.com/jive-sh/jive-abstract-library/blob/94e609ce9c2c34a4a7d9ab9f7193fe25708d771c/src/internal/public/manifest.ts#L12)).
- `$schema` points at `./package.schema.json`. That file is gitignored: `jive-library dev`, the dev server,
  regenerates it on every change to `src/` or `package.json`.

## 3. The folders under `src`

Each abstract says what each folder under `src` means. Packages expose what they implement through these folders,
never through hand-written `exports`.

| Abstract | Folder | Means | Status |
| --- | --- | --- | --- |
| `jive-abstract-library` | `src/index.ts` | The library's exports | Built |
| | `src/entrypoints/<command>.ts` | One command on the installer's PATH, named after the file | Built ([constants.ts](https://github.com/jive-sh/jive-abstract-library/blob/94e609ce9c2c34a4a7d9ab9f7193fe25708d771c/src/internal/common/constants.ts#L4-L5)) |
| | `src/daemons/<name>.ts` | A daemon started at login, which `jive.library.daemons` must list | Built |
| `jive-abstract-resource` | `src/component/` | The Convex component: `convex.config.ts`, `schema.ts` and its functions | Built |
| `jive-abstract-resource-provider-<kind>` | `src/component/<resource type>.ts` | One module per resource type the abstract defines | Proposed |
| | `src/connect/` | The provider's frontend code that walks a person through the outside system's screens to produce a credential ([Connecting an account](/resources/connect/)) | Proposed |

## 4. The shared tsconfig

**Decided** (Alex, 2026-11-04: "abstract libraries should probably come with a tsconfig that gets inhereted from"),
not built. **Proposed** shape: each abstract publishes `tsconfig.json` in its package, an extending package's
`tsconfig.json` is one line, and an abstract that extends another extends that one's tsconfig:

```json
{ "extends": "jive-abstract-library/tsconfig.json" }
```

Today every package keeps its own full `tsconfig.json`.
