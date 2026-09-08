# Build tools

General-purpose command-line build tools integrating depot_tools, gclient, GN, and Ninja. This repository is installed as a Git checkout by [build-tools-installer](https://github.com/tctony-labs/build-tools-installer); it is not published directly to npm.

## Installation

```sh
npm install -g @tctony/build-tools --registry=https://registry.npmjs.org/
xw --help
```

The first run asks for an installation directory, defaulting to `~/.xiaowei_build_tools`. The installer records the installation path in `~/.xwrc`.

Requires Node.js 18+, npm, and Git. Individual projects may require additional build toolchains. Windows execution requires separate verification.

## Commands

| Command | Purpose |
| --- | --- |
| `xw gc` / `xw gclient` | Manage source checkouts and DEPS with gclient |
| `xw gn` | Generate build files |
| `xw nj` / `xw ninja` | Build using autoninja |
| `xw t <name>` | Run a script from tools/ |
| `xw p <key>` | Print version or installation paths |
| `xw auto-update` | Check for updates or enable/disable automatic updates |

Tools include `set-dep-for`, `last-commit`, `last-commit-info`, `copy-file`, and `fix-fetch-url`.

## Git updates

```sh
xw auto-update check
xw auto-update enable
xw auto-update disable
```

Automatic checks run at most once every 24 hours when enabled. Updates use `git pull --rebase --autostash`, then install dependencies with Yarn 1.22.22 from the public npm registry if HEAD changed. Run updates on the remote's main branch. The installer wrapper itself is upgraded with `npm update -g @tctony/build-tools`.

## Workspace integration

gclient configurations use `build_tools_path` as the custom variable and `BUILD_TOOLS_PATH` as the child-process environment variable. Use `build_tools_path` in `.gclient` and `DEPS` to reference the build-tools installation.

Git cache is stored at `~/.git_cache`. Chromium depot_tools is downloaded from its public upstream as needed and is not included in this repository. Set `DEPOT_TOOLS_DIR` to an absolute path to use a different depot_tools directory; downloads, updates, command lookup, and `xw p depot_tools_path` all use this location.

## Zsh completion

Add to `.zshrc` after installing:

```sh
FPATH="$(xw p install_path)/zsh-completion:$FPATH"
autoload -U compinit
compinit
```

## Development

```sh
npx --yes --registry=https://registry.npmjs.org/ yarn@1.22.22 install --frozen-lockfile --registry=https://registry.npmjs.org/
npm test
npm run lint
```

Third-party dependency licenses and source attributions remain intact.
