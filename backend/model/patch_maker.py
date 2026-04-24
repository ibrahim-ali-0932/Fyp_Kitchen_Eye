
import os
import re
import time
import subprocess
from pathlib import Path

FFMPEG_EXE  = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
FFPROBE_EXE = r"C:\ffmpeg\ffmpeg-8.1-essentials_build\bin\ffprobe.exe"
VIDEO_DIR            = r"D:\sem 7\FYP\Frontend\backend\app\videos"          # Folder containing Cam-001.mp4 etc.
PATCH_DIR            = r"D:\sem 7\FYP\Frontend\backend\model\patches"         # Output folder for patches
PATCH_LENGTH_SEC     = 3                    # Duration of each patch in seconds
OVERLAP_SEC          = 2                     # Overlap between consecutive patches
REFRESH_INTERVAL_SEC = 60                    # How often to re-scan VIDEO_DIR (seconds)

VIDEO_EXTENSIONS     = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
FFMPEG_EXE  = None    # e.g. r"C:\ffmpeg\bin\ffmpeg.exe"
FFPROBE_EXE = None    # e.g. r"C:\ffmpeg\bin\ffprobe.exe"
# ─────────────────────────────────────────────────────────────
# ============================================================

PATCH_DIR_PATH = Path(PATCH_DIR)
PATCH_DIR_PATH.mkdir(parents=True, exist_ok=True)

VIDEO_DIR_PATH = Path(VIDEO_DIR)


# ── Resolve ffmpeg / ffprobe executables ─────────────────────
def _resolve_exe(name, override):
    if override:
        p = Path(override)
        if p.is_file():
            return str(p)
        raise FileNotFoundError(f"[patch_maker] {name} not found at: {override}")
    env_val = os.environ.get(f"{name.upper()}_EXE")
    if env_val:
        p = Path(env_val)
        if p.is_file():
            return str(p)
    well_known = Path(r"C:/ffmpeg/bin") / (name + ".exe")
    if well_known.is_file():
        return str(well_known)
    return name  # fall back to PATH


_FFMPEG  = _resolve_exe("ffmpeg",  FFMPEG_EXE)
_FFPROBE = _resolve_exe("ffprobe", FFPROBE_EXE)


def _check_tools():
    ok = True
    for exe, label in [(_FFMPEG, "ffmpeg"), (_FFPROBE, "ffprobe")]:
        try:
            subprocess.run([exe, "-version"], capture_output=True, check=True)
        except (FileNotFoundError, subprocess.CalledProcessError):
            print(f"[patch_maker] ERROR: '{label}' not found (tried: {exe})")
            ok = False
    if not ok:
        print("\n[patch_maker] ERROR: FFmpeg tools not found.")
        print("  This script requires both ffmpeg and ffprobe.")
        print("  Fix options:")
        print("  1) Download from https://www.gyan.dev/ffmpeg/builds/")
        print("     Extract the zip, then in patch_maker.py set:")
        print('       FFMPEG_EXE  = r"C:\\ffmpeg\\bin\\ffmpeg.exe"')
        print('       FFPROBE_EXE = r"C:\\ffmpeg\\bin\\ffprobe.exe"')
        print("  2) Add ffmpeg's /bin folder to your system PATH")
        raise SystemExit(1)
# ─────────────────────────────────────────────────────────────


def get_video_duration(video_path: Path) -> float:
    """Return duration of video in seconds using ffprobe."""
    result = subprocess.run(
        [
            _FFPROBE, "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path),
        ],
        capture_output=True,
        text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def done_marker(video_path: Path) -> Path:
    """Return path to the .done marker file for a given video."""
    return video_path.with_suffix(".done")


def is_already_patched(video_path: Path) -> bool:
    return done_marker(video_path).exists()


def mark_as_patched(video_path: Path):
    done_marker(video_path).write_text("patched")


def normalize_camera_id(stem: str) -> str:
    """
    Extract and normalize camera ID from filename stem.
    e.g. 'Cam-001' -> 'CAM-001', 'cam_002' -> 'CAM-002'
    Preserves the numeric suffix.
    """
    # Accept formats: Cam-001, CAM_001, cam001, Camera-01, etc.
    match = re.search(r"(\d+)$", stem)
    num = match.group(1).zfill(3) if match else "000"
    return f"CAM-{num}"


def split_video(video_path: Path):
    """Split a single video into overlapping patches and save to PATCH_DIR."""
    duration = get_video_duration(video_path)
    if duration <= 0:
        print(f"  [WARN] Could not read duration for {video_path.name}, skipping.")
        return

    cam_id = normalize_camera_id(video_path.stem)   # e.g. CAM-001
    step   = PATCH_LENGTH_SEC - OVERLAP_SEC          # advance per patch

    starts = []
    t = 0.0
    while t < duration:
        starts.append(t)
        t += step

    total = len(starts)
    print(f"  → {cam_id} | duration={duration:.1f}s | {total} patches "
          f"({PATCH_LENGTH_SEC}s each, {OVERLAP_SEC}s overlap)")

    for idx, start in enumerate(starts, start=1):
        patch_name = f"{cam_id}_patch_{idx:03d}.mp4"
        out_path   = PATCH_DIR_PATH / patch_name

        if out_path.exists():
            print(f"    [SKIP] {patch_name} already exists")
            continue

        # Clamp length at end of file
        actual_len = min(PATCH_LENGTH_SEC, duration - start)
        if actual_len <= 0:
            break

        cmd = [
            _FFMPEG,
            "-y",                          # overwrite if exists
            "-ss", str(start),             # seek BEFORE input = fast
            "-i", str(video_path),
            "-t", str(actual_len),
            "-c", "copy",                  # no re-encoding, very fast
            "-avoid_negative_ts", "1",
            str(out_path),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"    [OK]   {patch_name}")
        else:
            print(f"    [ERR]  {patch_name}\n{result.stderr[-300:]}")

    mark_as_patched(video_path)
    print(f"  ✅ Done: {video_path.name} — marked as patched.")


def scan_and_patch():
    videos = sorted(
        p for p in VIDEO_DIR_PATH.iterdir()
        if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS
    )

    if not videos:
        print(f"[patch_maker] No video files found in {VIDEO_DIR}")
        return

    new_count = 0
    for video in videos:
        if is_already_patched(video):
            continue
        print(f"\n[patch_maker] Processing: {video.name}")
        split_video(video)
        new_count += 1

    if new_count == 0:
        print("[patch_maker] No new videos to process.")


def main():
    _check_tools()
    print("=" * 60)
    print("[patch_maker] Starting")
    print(f"  VIDEO_DIR        : {VIDEO_DIR}")
    print(f"  PATCH_DIR        : {PATCH_DIR}")
    print(f"  PATCH_LENGTH_SEC : {PATCH_LENGTH_SEC}s")
    print(f"  OVERLAP_SEC      : {OVERLAP_SEC}s")
    print(f"  REFRESH_INTERVAL : {REFRESH_INTERVAL_SEC}s")
    print("=" * 60)

    while True:
        print(f"\n[patch_maker] Scanning at {time.strftime('%H:%M:%S')} ...")
        scan_and_patch()
        print(f"[patch_maker] Sleeping {REFRESH_INTERVAL_SEC}s before next scan...")
        time.sleep(REFRESH_INTERVAL_SEC)


if __name__ == "__main__":
    main()