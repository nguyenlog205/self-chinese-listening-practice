#!/usr/bin/env bash
# Creates the backend venv on first run, then launches the API server.
# Prints "READY <port>" to stdout once listening — Electron's main process
# watches for this line.
#
# When BACKEND_DIR is writable (running from a repo checkout during dev),
# the venv and an editable install live alongside the source directly.
#
# When BACKEND_DIR is read-only (installed system-wide, e.g. the Fedora .rpm
# into /opt), pip can never install straight from it: setuptools' egg_info
# build step always writes a `<pkg>.egg-info/` directory INSIDE the source
# tree it's building from -- this happens for a regular (non-editable)
# install too, not just editable ones, so there is no pip flag that avoids
# it. The only way to install from a read-only source is to first copy it
# into a writable location and install from that copy instead -- which is
# what the else-branch below does, refreshing the copy on every launch so
# it stays in sync with whatever RPM version is currently installed.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -w "$BACKEND_DIR" ]; then
  VENV_DIR="$BACKEND_DIR/.venv"
  SOURCE_FOR_INSTALL="$BACKEND_DIR"
else
  DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/ListeningPractice"
  mkdir -p "$DATA_DIR"
  VENV_DIR="$DATA_DIR/venv"
  SOURCE_FOR_INSTALL="$DATA_DIR/backend-src"
  rm -rf "$SOURCE_FOR_INSTALL"
  cp -a "$BACKEND_DIR" "$SOURCE_FOR_INSTALL"
fi

# A marker file (not just VENV_DIR existing) tracks completion, since the
# venv directory is created up front by `python3 -m venv` -- if setup gets
# interrupted (app closed, network drop) partway through the much longer
# `pip install`, a bare directory-existence check would wrongly treat that
# half-installed venv as done on the next launch.
#
# The marker stores a hash of pyproject.toml, not just a bare touch: if the
# app is upgraded and pyproject.toml's dependencies change, a marker left
# over from an older install must not cause the new dependencies to be
# silently skipped.
MARKER="$VENV_DIR/.install-complete"
DEPS_HASH="$(sha256sum "$SOURCE_FOR_INSTALL/pyproject.toml" | cut -d' ' -f1)"

if [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$DEPS_HASH" ]; then
  echo "Setting up backend virtual environment (first run only)..." >&2
  if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
  fi
  "$VENV_DIR/bin/pip" install --upgrade pip >&2
  "$VENV_DIR/bin/pip" install -e "$SOURCE_FOR_INSTALL" >&2
  echo "$DEPS_HASH" > "$MARKER"
fi

exec "$VENV_DIR/bin/python" -m listening_backend.main
