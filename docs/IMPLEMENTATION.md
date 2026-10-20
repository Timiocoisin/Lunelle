# Implementation record · 2026-10-19

## New implementation boundary

All `app/`, `ui/`, `scripts/`, and `tests/` code was newly authored in this
directory. No previous application's main process, renderer, CSS, config,
plugin, tests, lockfile, node_modules or packaged runtime was copied.
Interoperability is based on official Codex/Electron documentation.

Prior familiarity with another desktop companion exists, so this is not a
claim of legally certified clean-room development or proven non-infringement.
No required notices have been removed from actual reused third-party files.

## Asset imports (not code)

Four unmodified official font binaries and their full upstream licenses were
reused from local download cache. Their release hashes are verified by the
font downloader. Marker font was extracted from the official release ZIP.
The owner-provided Lunelle bust was imported from the conversation attachment.
The full-body owner-selected Lunelle image was retrieved from the earlier local
asset cache. Both remain Git-ignored and excluded from default public builds.
No existing application's mascot/icon assets were knowingly substituted for
these user-selected images. The project's application mark is newly drawn.

## Architecture

- Transparent single pet surface with a fixed logical drawing board; the
  panel is above the pet, scaled as one composition to fit the actual work area.
- Hover transfer is a set-based state machine over pet/panel/bridge; leave
  timer closes only when no region or keyboard focus remains active.
- Settings is a separate, single-instance window with an allowlisted preload.
- Host validates sender identity and exposes only named commands, no arbitrary
  filesystem, URL, shell, process-spawn, or raw IPC primitives to renderer.
- Read-only stdio RPC starts a private official Codex app-server child, permits
  only initialization/account/rate-limit reads, discards all account identifiers,
  and kills the child at the end. No direct auth-file extraction is implemented.
- Log index lives in a worker; unchanged JSONL files are cached in memory,
  raw conversations are neither persisted nor returned to UI.
- User preferences use a new directory and atomic rename, with no old-profile
  migration. Public build uses a dedicated staging allowlist.

## Typography contract

CSS font roles are separate named tokens rather than a single font applied
globally. UI regression queries Chromium's actual platform fonts at six nodes
to prove all four families render, including Chinese labels and notes.
No synthetic bold is used for these single-weight font files.

## Current limits

Read-only local CLI interoperability still depends on the installed Codex
version and supported authentication. Unavailable data must remain unavailable.
Usage logs are local and may be partial; resets without last-response telemetry
are counted conservatively and marked incomplete. The active frontmost model
is not inferred from screen contents. Windows is the only desktop validation
target in this iteration. Installer signing, automatic updates and startup
integration are not implemented or claimed.
