#!/usr/bin/env bash
# Builds an .rpm directly with rpmbuild, bypassing electron-builder's bundled
# fpm tool. fpm 1.9.3 (what electron-builder ships) generates a spec that
# relies on overriding the `buildroot` macro via `--define`, which modern
# rpm (>= 4.19, e.g. Fedora 41+) no longer honors -- rpmbuild silently builds
# into its own computed BUILDROOT instead, so fpm's staged files are never
# found ("File not found" for every file in %files). Writing our own spec
# and letting rpmbuild compute buildroot itself (the standard, modern way)
# sidesteps the incompatibility entirely.
#
# Prerequisite: run `npm run build:linux` first so dist/linux-unpacked/
# exists.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ELECTRON_DIR="$APP_DIR/electron"
DIST_DIR="$APP_DIR/dist"
LINUX_UNPACKED="$DIST_DIR/linux-unpacked"
PACKAGING_DIR="$APP_DIR/packaging/rpm"

if [ ! -d "$LINUX_UNPACKED" ]; then
  echo "error: $LINUX_UNPACKED not found -- run 'npm run build:linux' first." >&2
  exit 1
fi

VERSION="$(node -p "require('$ELECTRON_DIR/package.json').version")"

RPMBUILD_ROOT="$(mktemp -d)"
trap 'rm -rf "$RPMBUILD_ROOT"' EXIT
mkdir -p "$RPMBUILD_ROOT"/{SPECS,SOURCES,BUILD,RPMS,SRPMS,BUILDROOT}

cp -a "$LINUX_UNPACKED" "$RPMBUILD_ROOT/SOURCES/linux-unpacked"
cp "$PACKAGING_DIR/listening-electron.desktop" "$RPMBUILD_ROOT/SOURCES/"

ICON_SRC="$ELECTRON_DIR/node_modules/app-builder-lib/templates/icons/electron-linux/256x256.png"
HAS_ICON=0
if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$RPMBUILD_ROOT/SOURCES/icon.png"
  HAS_ICON=1
fi

SPEC="$RPMBUILD_ROOT/SPECS/listening-electron.spec"

cat > "$SPEC" <<EOF
Name: listening-electron
Version: $VERSION
Release: 1%{?dist}
Summary: Chinese listening practice desktop app
License: Proprietary
URL: https://github.com/nguyenlog205/self-chinese-building-listening-materials
BuildArch: x86_64
AutoReqProv: no

%description
Chinese listening practice desktop app. Paste a YouTube link, it transcribes
with Whisper and converts to pinyin, then lets you practice sentence by
sentence with video, toggleable subtitles/pinyin, and optional dictation.

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/opt/ListeningPractice
cp -a %{_sourcedir}/linux-unpacked/. %{buildroot}/opt/ListeningPractice/
mkdir -p %{buildroot}/usr/share/applications
install -m 644 %{_sourcedir}/listening-electron.desktop %{buildroot}/usr/share/applications/listening-electron.desktop
mkdir -p %{buildroot}/usr/bin
ln -sf /opt/ListeningPractice/listening-electron %{buildroot}/usr/bin/listening-electron
EOF

if [ "$HAS_ICON" = "1" ]; then
  cat >> "$SPEC" <<'EOF'
mkdir -p %{buildroot}/usr/share/icons/hicolor/256x256/apps
install -m 644 %{_sourcedir}/icon.png %{buildroot}/usr/share/icons/hicolor/256x256/apps/listening-electron.png
EOF
fi

cat >> "$SPEC" <<'EOF'

%files
/opt/ListeningPractice
/usr/share/applications/listening-electron.desktop
/usr/bin/listening-electron
EOF

if [ "$HAS_ICON" = "1" ]; then
  echo "/usr/share/icons/hicolor/256x256/apps/listening-electron.png" >> "$SPEC"
fi

rpmbuild --define "_topdir $RPMBUILD_ROOT" -bb "$SPEC"

OUT_RPM="$(find "$RPMBUILD_ROOT/RPMS" -name '*.rpm' | head -1)"
if [ -z "$OUT_RPM" ]; then
  echo "error: rpmbuild did not produce an .rpm file" >&2
  exit 1
fi

mkdir -p "$DIST_DIR"
cp "$OUT_RPM" "$DIST_DIR/"
echo "Built: $DIST_DIR/$(basename "$OUT_RPM")"
