# Typescript Template

## Things to update

Consider changing the following after cloning:

-   [package.json](./package.json): name, repository, author, license
-   [LICENSE](./LICENSE): default is MIT, change author
-   [Dockerfile](./Dockerfile), [.dockeringore](./dockerignore): delete if unused
-   [docs](./docs): delete or re-generate
-   [.env](.env), [.env.test](./.env.test), [utils/environment.ts](utils/environment.ts): update envvars

## Installing

Save storage with [pnpm](https://pnpm.js.org/). You can also use regular NPM or Yarn.

```
pnpm i
```

## Cloning

To clone this starter repo and add it as an upstream folow below:

```
git clone git@github.com:leovigna/starter-solidity.git myproject
cd myproject
git remote set-url origin git@github.com:leovigna/myproject.git
git remote add upstream git@github.com:leovigna/starter-solidity.git
git push origin master
git push --all
```

Then to sync any new changes form this repo to the new repo follow [this](https://help.github.com/en/articles/syncing-a-fork):

```
git fetch upstream && git checkout master
```

You can then merge or rebase:

```
git merge upstream/master
```

```
git rebase upstream/master
```
