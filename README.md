# @jive-sh/docs

The Jive API reference, published at https://docs.jive.sh. An Astro Starlight site; each page is a markdown file under
`src/content/docs/`.

```sh
bun install
bun run dev     # http://localhost:4321
bun run build   # static site in dist/
```

It extends [jive-abstract-app-github-pages](https://github.com/jive-sh/jive-abstract-app-github-pages), whose
`jive:cicd:build` runs `bun run build` and adds the `CNAME` (`docs.jive.sh`) and `.nojekyll` files GitHub Pages reads,
and whose `jive:cicd:deploy` publishes `dist/` to the `gh-pages` branch and waits until GitHub Pages has built it. Its
settings are the `jive` block in `package.json`; `bun run dev:schema` keeps `package.schema.json` current so an editor
checks that block.

The repository has no `.github/workflows/pipeline.yml` yet, so nothing runs those hooks on a push: the deploy needs
`contents: write` and `pages: write`, which Jive's shared deploy job does not pass on today (see the abstract's
README, "The deploy job's permissions").
