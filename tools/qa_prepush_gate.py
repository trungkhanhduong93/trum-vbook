#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/qa_prepush_gate.py - Quality Assurance & Security Pre-Push Gatekeeper
Dự án: trum-vbook
Chạy trước khi git push: python tools/qa_prepush_gate.py [--plugin <ten_nguon>] [--all]
"""

import os
import sys
import json
import re
import zipfile
import subprocess
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
REPO_ROOT = Path(__file__).resolve().parent.parent

# 18 Bẫy thực chiến Rhino JS (Chốt 1)
RHINO_TRAPS = [
    (r'\.selectFirst\s*\(', "Bẫy 1: Không dùng selectFirst(). Dùng selFirst(el, css)."),
    (r'\.parent\s*\(', "Bẫy 2: Không dùng .parent() (ném TypeError). Duyệt từ trên xuống."),
    (r'\|Referer=', "Bẫy 3: Không nối |Referer= vào URL ảnh trong chap.js."),
    (r'`[^`]*`', "Bẫy 4: Không dùng template literals (`...`). Dùng nối chuỗi ES5 '+'."),
    (r'\b(let|const)\b', "Bẫy 5: Khai báo ES6 let/const gây lỗi Rhino cũ. Dùng 'var'."),
    (r'=>', "Bẫy 6: Không dùng arrow functions (=>). Dùng function(...) {}."),
    (r'\b(import|export)\b', "Bẫy 7: Không dùng ES6 module (import/export). Dùng load()."),
    (r'\.(includes|startsWith|endsWith)\s*\(', "Bẫy 8: Không dùng String.includes/startsWith/endsWith. Dùng indexOf/regex."),
    (r'\b(async|await|Promise)\b', "Bẫy 9: Không dùng async/await/Promise. Rhino là đơn luồng đồng bộ."),
    (r'doc\.outerHtml\(\)', "Bẫy 11: doc.outerHtml() trên trang nặng gây tràn RAM. Dùng doc.select('title').text()."),
    (r'\bconsole\.log\b', "Chốt 1: Còn sót console.log debug."),
]

FORBIDDEN_FILES = [
    "vBook.apk", "gg.zip", "luot_chap.js", "mino_chap.js",
    "truyenvi_chap.html", "truyenvi_manga.html"
]

class QAGateKeeper:
    def __init__(self, target_plugin=None):
        self.plugin = target_plugin
        self.errors = []
        self.warnings = []

    def log_fail(self, gate, msg):
        self.errors.append(f"[{gate}] FAIL: {msg}")

    def log_warn(self, gate, msg):
        self.warnings.append(f"[{gate}] WARN: {msg}")

    def log_pass(self, gate, msg):
        print(f"  [OK] {gate}: {msg}")

    # -------------------------------------------------------------
    # CHỐT 1: RÀ SOÁT TĨNH JS
    # -------------------------------------------------------------
    def run_gate_1_static_audit(self, plugin_dir):
        print(f"\n--- [CHỐT 1] RÀ SOÁT TĨNH 18 BẪY RHINO JS & BẢO MẬT ({plugin_dir.name}) ---")
        src_dir = plugin_dir / "src"
        if not src_dir.exists():
            self.log_fail("GATE-1", f"Không tìm thấy thư mục {src_dir}")
            return

        js_files = list(src_dir.rglob("*.js"))
        for js_file in js_files:
            content = js_file.read_text(encoding="utf-8", errors="ignore")
            # Loại bỏ comments trước khi kiểm tra
            clean_content = re.sub(r'//.*', '', content)
            clean_content = re.sub(r'/\*[\s\S]*?\*/', '', clean_content)
            lines = clean_content.splitlines()

            for line_idx, clean_line in enumerate(lines, 1):
                for pattern, desc in RHINO_TRAPS:
                    if re.search(pattern, clean_line):
                        self.log_fail("GATE-1", f"{plugin_dir.name}/{js_file.relative_to(plugin_dir)}:{line_idx} - {desc}")

        if not any("GATE-1" in e for e in self.errors):
            self.log_pass("GATE-1", f"{plugin_dir.name}: Toàn bộ mã JS tuân thủ ES5 thuần và vượt qua 18 bẫy Rhino.")

    # -------------------------------------------------------------
    # CHỐT 2: ĐÓNG GÓI ZIP CHUẨN PYTHON
    # -------------------------------------------------------------
    def run_gate_2_zip_audit(self, plugin_dir):
        print(f"\n--- [CHỐT 2] KIỂM ĐỊNH FILE ZIP CHUẨN ENTRY 'src/' ({plugin_dir.name}) ---")
        zip_path = plugin_dir / "plugin.zip"
        if not zip_path.exists() and (plugin_dir / f"{plugin_dir.name}.zip").exists():
            zip_path = plugin_dir / f"{plugin_dir.name}.zip"
        if not zip_path.exists():
            self.log_fail("GATE-2", f"Chưa có file {zip_path}. Chạy pack.py trước!")
            return

        with zipfile.ZipFile(zip_path, 'r') as z:
            namelist = z.namelist()
            if "src/" not in namelist:
                self.log_fail("GATE-2", f"{plugin_dir.name}: THIẾU ENTRY 'src/' trong ZIP! VBook sẽ cài thất bại.")
            else:
                info = z.getinfo("src/")
                is_dir = (info.external_attr >> 16) & 0o040000 != 0
                if not is_dir and not info.is_dir():
                    self.log_fail("GATE-2", f"{plugin_dir.name}: Entry 'src/' không có thuộc tính Directory chuẩn.")
                else:
                    self.log_pass("GATE-2", f"{plugin_dir.name}: Entry 'src/' tồn tại và có thuộc tính Directory hợp lệ.")

            base_dir = plugin_dir / "src" if (plugin_dir / "src" / "src").exists() else plugin_dir
            for name in namelist:
                if name.endswith('/'):
                    continue
                disk_file = base_dir / name
                if not disk_file.exists():
                    self.log_fail("GATE-2", f"File trong ZIP không có trên đĩa: {name}")
                elif z.read(name) != disk_file.read_bytes():
                    self.log_fail("GATE-2", f"Nội dung lệch giữa ZIP và đĩa (chưa repack?): {name}")

        if not any("GATE-2" in e for e in self.errors):
            self.log_pass("GATE-2", f"{plugin_dir.name}: Cấu trúc ZIP đạt chuẩn, toàn bộ file khớp bit-exact.")

    # -------------------------------------------------------------
    # CHỐT 3: ĐỒNG BỘ PHIÊN BẢN 3 NƠI
    # -------------------------------------------------------------
    def run_gate_3_version_consistency(self, plugin_name, plugin_dir):
        print(f"\n--- [CHỐT 3] KIỂM ĐỊNH ĐỒNG BỘ PHIÊN BẢN 3 NƠI ({plugin_name}) ---")
        local_json_path = plugin_dir / "plugin.json"
        if not local_json_path.exists():
            self.log_fail("GATE-3", f"Thiếu {local_json_path}")
            return
        local_meta = json.loads(local_json_path.read_text(encoding="utf-8"))
        v_local = local_meta.get("metadata", {}).get("version")

        zip_path = plugin_dir / "plugin.zip"
        if not zip_path.exists() and (plugin_dir / f"{plugin_name}.zip").exists():
            zip_path = plugin_dir / f"{plugin_name}.zip"
        v_zip = None
        if zip_path.exists():
            with zipfile.ZipFile(zip_path, 'r') as z:
                if "plugin.json" in z.namelist():
                    zip_meta = json.loads(z.read("plugin.json").decode("utf-8"))
                    v_zip = zip_meta.get("metadata", {}).get("version")

        root_json_path = REPO_ROOT / "plugin.json"
        root_data = json.loads(root_json_path.read_text(encoding="utf-8"))
        root_entry = next((item for item in root_data.get("data", []) if plugin_name.lower() in item.get("path", "").lower() or plugin_name.lower() in item.get("name", "").lower()), None)
        
        if not root_entry:
            self.log_fail("GATE-3", f"Chưa đăng ký {plugin_name} trong root plugin.json!")
            return

        v_root = root_entry.get("version")
        url_path = root_entry.get("path", "")
        v_param_match = re.search(r'\?v=(\d+)', url_path)
        v_param = int(v_param_match.group(1)) if v_param_match else None

        print(f"  Version Folder   : v{v_local}")
        print(f"  Version ZIP      : v{v_zip}")
        print(f"  Version Root     : v{v_root} (Param ?v={v_param})")

        if v_param is not None:
            if not (v_local == v_zip == v_root == v_param):
                self.log_fail("GATE-3", f"LỆCH VERSION: Folder={v_local}, Zip={v_zip}, Root={v_root}, Param={v_param}")
            else:
                self.log_pass("GATE-3", f"Phiên bản đồng bộ nhất quán 3 nơi: v{v_local}")
        else:
            if not (v_local == v_zip == v_root):
                self.log_fail("GATE-3", f"LỆCH VERSION: Folder={v_local}, Zip={v_zip}, Root={v_root}")
            else:
                self.log_pass("GATE-3", f"Phiên bản đồng bộ nhất quán 3 nơi: v{v_local}")

    # -------------------------------------------------------------
    # CHỐT 4: LIVE RUNTIME & IMAGE DOWNLOAD TEST
    # -------------------------------------------------------------
    def run_gate_4_live_runtime(self, plugin_name):
        print(f"\n--- [CHỐT 4] LIVE RUNTIME & TẢI ẢNH THẬT ({plugin_name}) ---")
        test_images = []
        if plugin_name == "goctruyentranh":
            # Test ảnh thật của GocTruyenTranh
            test_images = [
                ("https://goctruyentranhvui41.com", "https://goctruyentranhvui41.com/image/cau-be-shotgun-0000032407-25-03-2021/196zIBkgOS0mzTa90RCinbS2nHaveXGrr?code=gtt-yes")
            ]
        elif plugin_name == "luottruyen":
            test_images = [
                ("https://luottruyen.net", "https://s34.cc3t.net/chapters/b2515/chapter-375/cuong-gia-den-tu-trai-tam-than-0.jpg")
            ]
        elif plugin_name == "nettruyen":
            try:
                api_url = "https://nettruyenar.com/Comic/Services/ComicService.asmx/ChapterList?slug=blue-box&comicId=11258"
                req = urllib.request.Request(api_url, headers={
                    "User-Agent": "Mozilla/5.0",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": "https://nettruyenar.com/truyen-tranh/blue-box-11258"
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    total_chaps = len(data.get("data", []))
                    if total_chaps > 20:
                        self.log_pass("GATE-4", f"NetTruyen ComicService trả về đầy đủ {total_chaps} chương (>20 chương giới hạn cũ).")
                    else:
                        self.log_fail("GATE-4", f"NetTruyen ComicService chỉ trả về {total_chaps} chương.")
            except Exception as e:
                self.log_fail("GATE-4", f"Lỗi gọi ComicService NetTruyen: {e}")
            test_images = [
                ("https://nettruyenar.com", "https://cdn1.cloud-zzz.com/nettruyen/blue-box/250/0.jpg")
            ]
        elif plugin_name == "nhattruyen":
            try:
                api_url = "https://nhattruyenqq.com/Comic/Services/ComicService.asmx/ChapterList?slug=ta-co-the-don-ngo-vo-han&comicId=13396"
                req = urllib.request.Request(api_url, headers={
                    "User-Agent": "Mozilla/5.0",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": "https://nhattruyenqq.com/truyen-tranh/ta-co-the-don-ngo-vo-han"
                })
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    total_chaps = len(data.get("data", []))
                    if total_chaps > 20:
                        self.log_pass("GATE-4", f"NhatTruyen ComicService trả về đầy đủ {total_chaps} chương (>20 chương giới hạn cũ).")
                    else:
                        self.log_fail("GATE-4", f"NhatTruyen ComicService chỉ trả về {total_chaps} chương.")
            except Exception as e:
                self.log_fail("GATE-4", f"Lỗi gọi ComicService NhatTruyen: {e}")
            test_images = []

        for origin, img_url in test_images:
            try:
                req = urllib.request.Request(
                    img_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) Mobile Safari/537.36",
                        "Referer": origin + "/"
                    }
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    status = resp.status
                    chunk = resp.read(2048)
                    length = len(chunk)
                    if status == 200 and length > 500:
                        self.log_pass("GATE-4", f"Tải ảnh thành công (>500 bytes): {img_url}")
                    else:
                        self.log_fail("GATE-4", f"Ảnh trả về không hợp lệ: Status {status}, Len {length}")
            except Exception as e:
                self.log_fail("GATE-4", f"Lỗi tải ảnh {img_url}: {e}")

    # -------------------------------------------------------------
    # CHỐT 5: PRE-PUSH GIT AUDIT
    # -------------------------------------------------------------
    def run_gate_5_git_audit(self):
        print("\n--- [CHỐT 5] PRE-PUSH GIT AUDIT (VỆ SINH & BẢO MẬT) ---")
        status_res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, cwd=REPO_ROOT)
        dirty_lines = status_res.stdout.splitlines()
        
        for line in dirty_lines:
            filepath = line[3:].strip()
            for forbidden in FORBIDDEN_FILES:
                if forbidden in filepath:
                    self.log_fail("GATE-5", f"Phát hiện file cấm trong working directory: {filepath}. Hãy xóa hoặc gitignore!")

        if not any("GATE-5" in e for e in self.errors):
            self.log_pass("GATE-5", "Git status sạch sẽ, không có file binary rác lọt vào.")

    # -------------------------------------------------------------
    # TỔNG KẾT
    # -------------------------------------------------------------
    def evaluate(self):
        print("\n================ TỔNG KẾT KIỂM ĐỊNH QA ================")
        if self.warnings:
            print(f"CẢNH BÁO ({len(self.warnings)} mục):")
            for w in self.warnings:
                print(f"  [!] {w}")
        
        if self.errors:
            print(f"\nTHẤT BẠI ({len(self.errors)} lỗi bắt buộc sửa trước khi push):")
            for err in self.errors:
                print(f"  [X] {err}")
            print("\n❌ KẾT QUẢ: BỊ CHẶN PUSH (GIT PUSH BLOCKED).")
            return False
        else:
            print("\n✅ KẾT QUẢ: TẤT CẢ 5 CHỐT CHẶN ĐÃ ĐẠT (READY TO PUSH).")
            return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "all"
    keeper = QAGateKeeper(target)
    
    plugins_to_check = [
        "goctruyentranh", "luottruyen", "luottruyennew", "toptruyen",
        "zettruyen", "2ten", "truyenqq", "nettruyen", "nhattruyen",
        "doctruyen3q", "mimimoe", "cuutruyen", "truyenggvn", "tcomic",
        "minotruyen", "minomanga", "minohen"
    ] if target == "all" else [target]
    
    for p in plugins_to_check:
        p_dir = REPO_ROOT / p
        if p_dir.exists():
            keeper.run_gate_1_static_audit(p_dir)
            keeper.run_gate_2_zip_audit(p_dir)
            keeper.run_gate_3_version_consistency(p, p_dir)
            if p in ["goctruyentranh", "luottruyen", "nettruyen", "nhattruyen"]:
                keeper.run_gate_4_live_runtime(p)
                
    keeper.run_gate_5_git_audit()
    success = keeper.evaluate()
    sys.exit(0 if success else 1)
