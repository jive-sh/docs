---
title: CI/CD hooks
description: How any package gets a pipeline from Jive without writing GitHub Actions YAML.
---

**Built.** Every Jive package defines six scripts in its `package.json`, and Jive's shared GitHub Actions pipeline
runs them. Nobody writes Actions YAML for a package; extending an abstract supplies all six.

| Hook | Runs in | Does |
| --- | --- | --- |
| `jive:cicd:get-config` | context job | Prints the package's `jive` block as JSON on stdout |
| `jive:cicd:build` | build job | Builds |
| `jive:cicd:audit` | build job | Typechecks and tests |
| `jive:cicd:deploy:plan` | build job, once per environment | Prints `{"deploy":false}`, or `{"deploy":true,"url":"…"}` |
| `jive:cicd:upload-artifacts` | build job | Hands the build output to the deploy job |
| `jive:cicd:deploy` | deploy job, once per environment | Deploys, after `jive login --cicd` and `jive provision` for what it deploys to |

Each hook runs as `bun run <name>` with no arguments. Two variables carry its inputs: `JIVE_PIPELINE_CONTEXT` (JSON
describing the run) and `JIVE_DEPLOY_ENVIRONMENT` (the target's name). Anything else the two stdout-parsed hooks
print goes to stderr.

The full contract is
[CICD_API.md](https://github.com/jive-sh/jive/blob/462dff763e8194b412b3c040feeaf9f854b6a3e1/CICD_API.md) in the
jive repository; this page summarizes it.

**Decided** (Alex, 2026-11-01): "We have a deploy hook in CI. That should do a `jive login --cicd` then
`jive provision` for a given resource". Built today as `packages:provision` for npm packages only
([Provisioning](/resources/provision/)).
