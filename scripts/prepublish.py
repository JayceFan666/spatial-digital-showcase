#!/usr/bin/env python3
"""Check the Git index by default, or inspect the release tree with --tree."""
import argparse
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".md", ".html", ".css", ".js", ".json", ".py", ".txt", ".yml", ".yaml"}

CHECKS = {
    "疑似凭据": rb"-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{25,}|(?:AKIA|ASIA)[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_\-]{24,}",
    "本地或私有引用": rb"file://|(?:/Users/|/mnt/data/|/workspace/scratch/)|[A-Z]:\\\\Users\\\\|sandbox:/|sharepoint\.com|chatgpt\.com/library",
    "CAD 文件引用": rb"\.(?:dwg|dxf|dwt|dwf)(?=[\s\x22\x27)>?/#]|$)",
    "内嵌资源或长编码段": rb"data:[^\s,;]+;base64,|[A-Za-z0-9+/]{300,}={0,2}",
}
RULES = {name: re.compile(pattern, re.I) for name, pattern in CHECKS.items()}
PRIVATE_COMPONENTS = {"private", "internal", "source-drawings", "construction", "archives"}
CAD_HEADER = re.compile(rb"^(?:AC10\d\d|\s*0\s*SECTION\s*2\s*HEADER)")


def run_git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def tree_paths():
    paths = []
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if ".git" not in relative.parts and (path.is_symlink() or path.is_file()):
            paths.append(relative.as_posix())
    return paths


def staged_paths():
    files = {}
    for record in run_git("ls-files", "--stage", "-z").split(b"\0"):
        if record:
            header, path = record.split(b"\t", 1)
            mode, revision, _ = header.decode().split()
            files[path.decode()] = (mode, revision)
    return files


def inspect(path, data):
    name = Path(path)
    if (set(part.lower() for part in name.parts) & PRIVATE_COMPONENTS
            or any(part.startswith(".env") for part in name.parts)):
        return ["私有文件或目录"]
    if name.suffix.lower() not in TEXT_SUFFIXES and name.name not in {".gitignore", "LICENSE", ".nojekyll"}:
        return ["不在文本发布清单内，先审核文件类型及内容"]
    if CAD_HEADER.search(data) or data.startswith((b"%PDF-", b"PK\x03\x04")) or b"\0" in data:
        return ["发现二进制或图纸文件头"]
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return ["文件并非 UTF-8 文本"]
    # This script documents signatures. The ignore file lists blocked extensions.
    exempt_rules = {"scripts/prepublish.py", ".gitignore"}
    if path in exempt_rules:
        return []
    return [name for name, rule in RULES.items() if rule.search(data)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tree", action="store_true", help="scan local files instead of indexed blobs")
    args = parser.parse_args()
    staged = {} if args.tree else staged_paths()
    paths = tree_paths() if args.tree else staged
    if not paths:
        parser.exit(1, "没有可扫描的发布文件。\n")
    errors = []
    for path in sorted(paths):
        local = ROOT / path
        if args.tree and local.is_symlink() or not args.tree and staged[path][0] not in {"100644", "100755"}:
            errors.append((path, "符号链接、子模块或未知 Git 类型"))
            continue
        data = local.read_bytes() if args.tree else run_git("cat-file", "blob", staged[path][1])
        errors.extend((path, reason) for reason in inspect(path, data))
    for path, reason in errors:
        print(f"{path}: {reason}")
    if errors:
        parser.exit(1, "发布扫描未通过。\n")
    print(f"扫描通过，共 {len(paths)} 个文件。")


if __name__ == "__main__":
    main()
