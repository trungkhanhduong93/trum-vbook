#!/usr/bin/env python3
"""Đóng gói plugin.zip cho một hoặc nhiều nguồn, đúng chuẩn vBook.

    python tools/pack.py luottruyen            # đóng lại, giữ nguyên version
    python tools/pack.py luottruyen --bump     # tăng version 1 nấc ở cả 3 nơi
    python tools/pack.py --all                 # đóng lại toàn bộ nguồn

Ba chỗ version phải khớp nhau, QA gate chốt 3 kiểm đúng điều này:
  <nguon>/plugin.json  ->  metadata.version
  plugin.json (gốc)    ->  data[].version  và  đuôi ?v= trong data[].path
  plugin.zip           ->  bản plugin.json nằm trong zip

ZIP bắt buộc có entry thư mục "src/" (không có thì vBook cài thất bại) và nội
dung mọi file phải trùng bit với file trên đĩa.
"""

import json
import os
import sys
import time
import zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "https://raw.githubusercontent.com/trungkhanhduong93/trum-vbook/main"


def doc_plugin_dirs():
    """Mọi thư mục có plugin.json riêng — tức là một nguồn."""
    out = []
    for name in sorted(os.listdir(REPO)):
        d = os.path.join(REPO, name)
        if name.startswith(".") or not os.path.isdir(d):
            continue
        if os.path.exists(os.path.join(d, "plugin.json")):
            out.append(name)
    return out


def src_dir(name):
    """2ten lồng thêm một tầng src/src — dò cho đúng."""
    a = os.path.join(REPO, name, "src", "src")
    if os.path.exists(os.path.join(a, "config.js")):
        return a
    return os.path.join(REPO, name, "src")


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def bump_version(name):
    """Tăng version 1 nấc ở plugin.json của nguồn và ở registry gốc."""
    pj = os.path.join(REPO, name, "plugin.json")
    p = read_json(pj)
    new = int(p["metadata"]["version"]) + 1
    p["metadata"]["version"] = new
    write_json(pj, p)

    # 2ten còn một bản manifest thứ hai trong src/ — bỏ sót là QA đỏ.
    alt = os.path.join(REPO, name, "src", "plugin.json")
    if os.path.exists(alt):
        a = read_json(alt)
        a.setdefault("metadata", {})["version"] = new
        write_json(alt, a)

    root = os.path.join(REPO, "plugin.json")
    r = read_json(root)
    want = p["metadata"]["name"]
    for e in r["data"]:
        if e.get("name") == want:
            e["version"] = new
            e["path"] = "%s/%s/plugin.zip?v=%d" % (RAW, name, new)
    write_json(root, r)
    return new


def pack(name):
    d = os.path.join(REPO, name)
    zpath = os.path.join(d, "plugin.zip")
    sdir = src_dir(name)
    # Khi src lồng hai tầng thì gốc của mọi đường dẫn trong zip là thư mục src.
    base = os.path.dirname(sdir) if sdir.endswith(os.path.join("src", "src")) else d

    entries = []
    for fname in ("icon.png", "plugin.json"):
        p = os.path.join(base, fname)
        if os.path.exists(p):
            entries.append((fname, p))

    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for arc, p in entries:
            zi = zipfile.ZipInfo(arc, date_time=time.localtime(os.path.getmtime(p))[:6])
            zi.external_attr = 0o100666 << 16
            zi.compress_type = zipfile.ZIP_DEFLATED
            with open(p, "rb") as f:
                z.writestr(zi, f.read())

        # Entry thư mục src/ — vBook bắt buộc phải thấy nó.
        zd = zipfile.ZipInfo("src/")
        zd.external_attr = (0o040755 << 16) | 0x10
        z.writestr(zd, b"")

        for fname in sorted(os.listdir(sdir)):
            p = os.path.join(sdir, fname)
            if not os.path.isfile(p):
                continue
            zi = zipfile.ZipInfo("src/" + fname, date_time=time.localtime(os.path.getmtime(p))[:6])
            zi.external_attr = 0o100666 << 16
            zi.compress_type = zipfile.ZIP_DEFLATED
            with open(p, "rb") as f:
                z.writestr(zi, f.read())

    # Tự nghiệm thu ngay: thiếu src/ hoặc lệch một byte là báo đỏ tại chỗ.
    with zipfile.ZipFile(zpath) as z:
        names = z.namelist()
        assert "src/" in names, "%s: thieu entry src/" % name
        for n in names:
            if n.endswith("/"):
                continue
            with open(os.path.join(base, n), "rb") as f:
                assert z.read(n) == f.read(), "%s: lech noi dung %s" % (name, n)
    ver = read_json(os.path.join(d, "plugin.json"))["metadata"]["version"]
    print("  %-16s v%-3s %2d file  %6.1f KB" % (name, ver, len(names), os.path.getsize(zpath) / 1024))


def main():
    args = [a for a in sys.argv[1:]]
    do_bump = "--bump" in args
    args = [a for a in args if not a.startswith("--")]
    targets = doc_plugin_dirs() if "--all" in sys.argv[1:] else args
    if not targets:
        print(__doc__)
        return 1
    for name in targets:
        if do_bump:
            bump_version(name)
        pack(name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
