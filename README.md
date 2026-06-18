# Recipe Keeper

Recipe Keeper is a local-first desktop app for storing personal recipes.

This is a test app made with the agentic Software Factory framework.

## What It Does

Recipe Keeper helps one person keep recipes on their own computer. It stores recipes locally with SQLite and does not require an account, cloud sync, or an internet connection for normal use.

## Current V1 Features

- Create recipes manually
- Read saved recipes in a dedicated detail view
- Edit saved recipes
- Delete saved recipes
- Search by title or tag
- Store recipe data locally in SQLite
- Track ingredients, steps, prep time, cook time, servings, tags, cuisine, difficulty, notes, nutrition notes, source URL, and photo reference

## Stack

- Tauri 2
- React
- TypeScript
- Vite
- SQLite through the Tauri SQL plugin

## Development

Use `npm.cmd` in PowerShell on this machine. Install dependencies from the committed lockfile. This project uses `.npmrc` to keep npm's cache local to the project in `.npm-cache/`.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run tauri dev
```

To compile the desktop app without building an installer:

```powershell
npm.cmd run build:desktop:debug
```

## Reproducibility Checks

From this folder, a clean dependency/build check is:

```powershell
npm.cmd ci
npm.cmd run build
```

From `src-tauri`, verify Rust dependencies and compilation with:

```powershell
cargo metadata --locked --format-version 1
cargo check --locked
```

The JavaScript dependencies are pinned through `package-lock.json`. Rust dependencies are pinned through `src-tauri/Cargo.lock`.

Last verified on 2026-06-18:

- `npm.cmd ci` passed and reported 0 vulnerabilities.
- `npm.cmd run build` passed.
- `cargo metadata --locked --format-version 1` passed.
- `cargo check --locked` passed.
- `npm.cmd run build:desktop:debug` passed and built `src-tauri\target\debug\recipe-keeper.exe`.

`cargo audit` is not currently installed on this machine. Run it later after installing the Cargo audit subcommand.

## Current Limitations

- Website recipe import is planned for a later version.
- Photo support is currently a text/path reference, not a file picker or image preview.
- Nutrition is currently a manual notes field.
- Installer packaging is not finalized yet.
- Rust dependency vulnerability audit is pending `cargo audit` availability.
