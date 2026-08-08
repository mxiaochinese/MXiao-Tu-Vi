from pathlib import Path
import re
import socket
import subprocess
import time
from urllib.request import urlopen
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
RAW_HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
HYDRATED_HTML = re.sub(r'<link rel="stylesheet"[^>]*>', '', RAW_HTML)
HYDRATED_HTML = re.sub(r'<link rel="manifest"[^>]*>', '', HYDRATED_HTML)
HYDRATED_HTML = re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', HYDRATED_HTML)


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def hydrate(page):
    page.set_content(HYDRATED_HTML, wait_until='domcontentloaded')
    page.add_style_tag(content=(ROOT / 'assets/styles.css').read_text(encoding='utf-8'))
    for file in ['assets/calendar.js', 'assets/engine.bundle.js', 'assets/pdf.bundle.js', 'assets/timezones.js', 'assets/app.js']:
        page.add_script_tag(content=(ROOT / file).read_text(encoding='utf-8'))
    page.wait_for_timeout(500)


def detect_mode(browser, url):
    probe = browser.new_page()
    try:
        probe.goto(url, wait_until='domcontentloaded')
        return 'static-server'
    except PlaywrightError as error:
        if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(error):
            raise
        return 'sandbox-hydration-fallback'
    finally:
        probe.close()


def open_app(page, url, mode):
    if mode == 'static-server':
        page.goto(url, wait_until='networkidle')
        page.wait_for_timeout(500)
    else:
        hydrate(page)


port = free_port()
base_url = f'http://127.0.0.1:{port}'
server = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    deadline = time.time() + 15
    while True:
        try:
            with urlopen(f'{base_url}/index.html', timeout=1) as response:
                assert response.status == 200
            break
        except Exception:
            if time.time() >= deadline:
                raise RuntimeError('Static server did not start in time.')
            time.sleep(0.1)

    with sync_playwright() as p:
        chromium_path = Path('/usr/bin/chromium')
        launch_args = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
        if chromium_path.exists():
            launch_args['executable_path'] = str(chromium_path)
        browser = p.chromium.launch(**launch_args)
        mode = detect_mode(browser, f'{base_url}/index.html')
        desktop = browser.new_page(viewport={'width': 1440, 'height': 1100}, accept_downloads=True)
        errors = []
        external = []
        desktop.on('console', lambda msg: errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
        desktop.on('pageerror', lambda exc: errors.append(f'pageerror: {exc}'))
        desktop.on('response', lambda response: errors.append(f'http {response.status}: {response.url}') if response.status >= 400 else None)
        desktop.on('request', lambda request: external.append(request.url) if not request.url.startswith(base_url) and not request.url.startswith(('blob:', 'data:')) else None)
        open_app(desktop, f'{base_url}/index.html', mode)

        assert desktop.locator('.palace').count() == 12
        assert desktop.locator('.major-star small').count() == 14
        assert desktop.locator('.report-card').count() >= 2
        assert desktop.locator('#timezone option').count() >= 400
        assert desktop.locator('#timezone').input_value() == 'Asia/Ho_Chi_Minh'
        assert desktop.locator('#locationPreset').count() == 0
        assert desktop.locator('#latitude').count() == 0
        assert desktop.locator('#calculationProfile').count() == 1
        assert desktop.locator('#calculationProfile option').count() == 2
        assert desktop.locator('#calculationProfile').input_value() == 'VN_TAN_BIEN_1956'
        assert desktop.locator('#json-button').count() == 0
        assert desktop.locator('[data-topic="Đại vận"]').count() == 1
        assert desktop.locator('[data-topic="Tiểu vận"]').count() == 1
        assert desktop.locator('[data-topic="Vận hạn 2026"]').count() == 1
        assert desktop.locator('[data-topic="Lưu nguyệt tháng 4"]').count() == 1
        assert desktop.locator('[data-topic="Lưu nhật ngày 15"]').count() == 1
        assert desktop.locator('[data-topic="Lưu thời giờ 7"]').count() == 1
        assert desktop.locator('.monthly-fortune').count() >= 1
        assert desktop.locator('.daily-fortune').count() >= 1
        assert desktop.locator('.hourly-fortune').count() >= 1
        assert desktop.locator('#time-exact').count() == 1
        assert desktop.locator('#time-branch').count() == 1
        assert desktop.locator('#viewMonth').input_value() == '4'
        assert desktop.locator('#viewDay').input_value() == '15'
        assert desktop.locator('#viewHourBranch').input_value() == '7'
        assert desktop.locator('.active-decade').count() >= 1
        assert desktop.locator('.annual-decade').count() >= 1
        assert desktop.locator('.minor-fortune').count() >= 1
        assert desktop.locator('.year-branch').count() >= 1
        assert desktop.locator('#viewLeap').count() == 1
        assert desktop.locator('#leapFortuneMode').count() == 1
        desktop.locator('#viewYear').fill('2025')
        desktop.locator('#viewMonth').select_option('6')
        desktop.locator('#viewDay').fill('16')
        desktop.locator('#viewLeap').check()
        desktop.locator('#leapFortuneMode').select_option('split-half-next')
        desktop.locator('#birth-form button[type="submit"]').click()
        desktop.wait_for_timeout(250)
        assert desktop.locator('[data-topic="Lưu nguyệt tháng 6 nhuận"]').count() == 1
        assert 'tháng 6 nhuận' in desktop.locator('#result-meta').inner_text().lower()
        desktop.locator('#demo-button').click()
        assert desktop.locator('#viewLeap').is_checked() is False
        desktop.locator('#birthTime').fill('23:30')
        desktop.locator('#calculationProfile').select_option('VN_TAN_BIEN_1956')
        desktop.locator('#birth-form button[type="submit"]').click()
        tan_meta = desktop.locator('#result-meta').inner_text()
        assert 'Tân Biên' in tan_meta
        desktop.locator('#calculationProfile').select_option('VN_AO_BI_1972')
        desktop.locator('#birth-form button[type="submit"]').click()
        ao_meta = desktop.locator('#result-meta').inner_text()
        assert 'Áo Bí' in ao_meta
        assert tan_meta != ao_meta
        desktop.locator('#demo-button').click()
        assert desktop.locator('#pdf-options-button').count() == 1
        assert desktop.locator('#pdf-options-panel').is_hidden()
        desktop.locator('#pdf-options-button').click()
        assert desktop.locator('#pdf-options-panel').is_visible()
        assert desktop.locator('[data-pdf-section]').count() == 16
        assert desktop.locator('[data-pdf-section]:checked').count() == 16
        assert '16/16' in desktop.locator('#pdf-options-summary').inner_text()
        desktop.locator('[data-pdf-preset="fortune"]').click()
        assert desktop.locator('[data-pdf-section]:checked').count() == 9
        assert desktop.locator('[data-pdf-section="tai_chinh"]').is_checked() is False
        assert desktop.locator('[data-pdf-section="van_han"]').is_checked()
        assert desktop.locator('#print-report .print-page-header h2', has_text='Tài chính').count() == 0
        assert desktop.locator('#print-report .print-page-header h2', has_text='Sự nghiệp').count() == 0
        selected_text_pdf = ROOT / 'sample/MXiao-Tu-Vi-2026-van-han-text.pdf'
        with desktop.expect_download(timeout=90000) as selected_text_info:
            desktop.locator('#print-button').click()
        selected_text_info.value.save_as(selected_text_pdf)
        selected_text = subprocess.check_output(['pdftotext', str(selected_text_pdf), '-'], text=True)
        assert 'Đại vận' in selected_text
        assert 'Tiểu vận' in selected_text
        assert 'Vận hạn 2026' in selected_text
        assert 'Lưu nguyệt tháng 4' in selected_text
        assert 'Lưu nhật ngày 15' in selected_text
        assert 'Lưu thời giờ 7' in selected_text
        with desktop.expect_download(timeout=90000) as selected_info:
            desktop.locator('#pdf-button').click()
        selected_pdf = ROOT / 'sample/MXiao-Tu-Vi-2026-van-han.pdf'
        selected_info.value.save_as(selected_pdf)
        selected_data = selected_pdf.read_bytes()
        selected_count_match = re.search(rb'/Count (\d+)\b', selected_data)
        assert selected_count_match
        selected_page_count = int(selected_count_match.group(1))
        assert 4 <= selected_page_count <= 16
        desktop.locator('[data-pdf-preset="full"]').click()
        assert desktop.locator('[data-pdf-section]:checked').count() == 16

        desktop.locator('#timezoneSearch').fill('New York')
        assert desktop.locator('#timezone option[value="America/New_York"]').count() == 1
        desktop.locator('#timezone').select_option('America/New_York')
        desktop.locator('#birth-form button[type="submit"]').click()
        assert 'America/New_York' in desktop.locator('#result-meta').inner_text()

        desktop.locator('#calendar-lunar').click()
        desktop.locator('#lunarDay').fill('1')
        desktop.locator('#lunarMonth').fill('1')
        desktop.locator('#lunarYear').fill('2024')
        desktop.locator('#birth-form button[type="submit"]').click()
        desktop.wait_for_timeout(250)
        assert '9/2/2024' in desktop.locator('#result-meta').inner_text() or '10/2/2024' in desktop.locator('#result-meta').inner_text()

        desktop.locator('#demo-button').click()
        desktop.locator('#time-branch').click()
        desktop.locator('#birthHourBranch').select_option('5')
        desktop.locator('#viewMonth').select_option('7')
        desktop.locator('#birth-form button[type="submit"]').click()
        assert 'Giờ Thìn' in desktop.locator('#result-meta').inner_text()
        assert desktop.locator('[data-topic="Lưu nguyệt tháng 7"]').count() == 1
        assert desktop.locator('.monthly-fortune').count() >= 1
        desktop.locator('#demo-button').click()
        desktop.locator('#compare-hours-button').click()
        assert desktop.locator('#compare-hours-panel').is_visible()
        desktop.locator('#compareHourA').select_option('5')
        desktop.locator('#compareHourB').select_option('6')
        desktop.locator('#run-hour-comparison').click()
        assert desktop.locator('.comparison-row.changed').count() >= 1
        assert desktop.locator('[data-pdf-section]').count() == 17
        assert desktop.locator('[data-pdf-section="so_sanh_gio"]').is_checked()
        desktop.locator('[data-pdf-preset="full"]').click()
        assert desktop.locator('[data-pdf-section]:checked').count() == 17
        desktop.screenshot(path=ROOT / 'screenshots/desktop-v2.png', full_page=True)
        with desktop.expect_download(timeout=90000) as info:
            desktop.locator('#pdf-button').click()
        download = info.value
        pdf = ROOT / 'sample/MXiao-Tu-Vi-2026-final.pdf'
        pdf.parent.mkdir(exist_ok=True)
        download.save_as(pdf)
        data = pdf.read_bytes()
        assert data.startswith(b'%PDF-1.7')
        assert pdf.stat().st_size > 500000
        count_match = re.search(rb'/Count (\d+)\b', data)
        assert count_match
        page_count = int(count_match.group(1))
        assert 8 <= page_count <= 30
        assert b'/MediaBox [0 0 595.28 841.89]' in data
        assert b'/MediaBox [0 0 841.89 595.28]' in data
        assert f'{page_count} trang A4' in desktop.locator('#toolbar-status').inner_text()
        assert 10 <= page_count <= 30
        text_pdf = ROOT / 'sample/MXiao-Tu-Vi-2026-text-final.pdf'
        with desktop.expect_download(timeout=90000) as text_info:
            desktop.locator('#print-button').click()
        text_info.value.save_as(text_pdf)
        text_data = subprocess.check_output(['pdftotext', str(text_pdf), '-'], text=True)
        normalized_text = ' '.join(text_data.split())
        assert 'LÁ SỐ TỬ VI VÀ LUẬN GIẢI CHI TIẾT' in normalized_text
        assert 'Lưu nguyệt tháng 4' in text_data
        assert 'Lưu nhật ngày 15' in text_data
        assert 'Lưu thời giờ 7' in text_data
        assert 'So sánh hai khung giờ sinh' in text_data
        assert 'Nguyễn Minh An' in text_data
        pdf_info = subprocess.check_output(['pdfinfo', str(text_pdf)], text=True)
        text_pages = int(pdf_info.split('Pages:')[1].splitlines()[0].strip())
        assert 10 <= text_pages <= 48
        assert 'Title:' in pdf_info and 'Lá số Tử Vi và luận giải chi tiết' in pdf_info
        assert 'Author:' in pdf_info and 'MXiao Tử Vi' in pdf_info
        text_raw = text_pdf.read_bytes()
        assert b'/Outlines' in text_raw
        assert b'/PageMode /UseOutlines' in text_raw
        assert b'/Lang' in text_raw
        assert b'/Tabs /S' in text_raw
        assert b'/StructTreeRoot' in text_raw
        assert text_raw.startswith(b'%PDF-1.7')
        assert b'/Type /Metadata /Subtype /XML' in text_raw
        assert b'pdfuaid:part' in text_raw
        assert b'/Metadata' in text_raw
        assert b'/S /H1' in text_raw
        assert b'/S /H2' in text_raw
        assert b'/S /H3' in text_raw
        assert b'/S /P' in text_raw
        assert b'/S /Figure' in text_raw
        assert b'/Artifact BMC' in text_raw
        visible_text = desktop.locator('body').inner_text().lower()
        for phrase in ['rule trace', 'source id', 'mã quy tắc', 'gợi ý thực hành', 'json', 'codex', 'dataset', 'tọa độ', 'địa điểm sinh', 'giờ mặt trời']:
            assert phrase not in visible_text
        assert not external, external
        assert not errors, errors

        mobile = browser.new_page(viewport={'width': 390, 'height': 844})
        mobile_errors = []
        mobile.on('pageerror', lambda exc: mobile_errors.append(str(exc)))
        mobile.on('console', lambda msg: mobile_errors.append(f'console {msg.type}: {msg.text}') if msg.type == 'error' else None)
        open_app(mobile, f'{base_url}/index.html', mode)
        assert mobile.locator('.palace').count() == 12
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        assert mobile.locator('.chart-panel').evaluate('e => e.scrollWidth > e.clientWidth')
        mobile.locator('#pdf-options-button').click()
        assert mobile.locator('#pdf-options-panel').is_visible()
        assert mobile.locator('[data-pdf-section]').count() == 16
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        mobile.screenshot(path=ROOT / 'screenshots/mobile-v2.png', full_page=True)
        assert not mobile_errors, mobile_errors
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()

print(f'Browser E2E passed: mode={mode}, timezone-only input, exact or branch time, annual, leap-month, monthly, daily and hourly fortune, responsive UI, direct PDF and searchable text PDF with metadata and bookmarks.')
