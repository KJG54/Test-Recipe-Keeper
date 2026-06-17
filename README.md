# Recipe Keeper

Recipe Keeper is a local-first desktop app for storing personal recipes.

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

Use `npm.cmd` in PowerShell on this machine.

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run tauri dev
```

To compile the desktop app without building an installer:

```powershell
npm.cmd run tauri build -- --debug --no-bundle
```

## Current Limitations

- Website recipe import is planned for a later version.
- Photo support is currently a text/path reference, not a file picker or image preview.
- Nutrition is currently a manual notes field.
- Installer packaging is not finalized yet.
