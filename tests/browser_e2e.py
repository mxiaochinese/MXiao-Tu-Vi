from pathlib import Path
import re
import socket
import subprocess
import tempfile
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
    for file in ['assets/calendar.js', 'assets/engine.bundle.js', 'assets/pdf.bundle.js', 'assets/timezones.js', 'assets/app.js', 'assets/astronomy.browser.min.js', 'assets/astrology-engine.bundle.js', 'assets/astrology-locations.js', 'assets/astrology-app.js']:
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


def pdf_page_dark_ratio(pdf_path, page_number):
    with tempfile.TemporaryDirectory() as directory:
        prefix = Path(directory) / 'page'
        subprocess.run([
            'pdftoppm', '-f', str(page_number), '-l', str(page_number), '-singlefile',
            '-r', '24', str(pdf_path), str(prefix)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        data = prefix.with_suffix('.ppm').read_bytes()
    index = 0
    tokens = []
    while len(tokens) < 4:
        while index < len(data) and data[index] in b' \t\r\n':
            index += 1
        if index < len(data) and data[index] == 35:
            while index < len(data) and data[index] not in b'\r\n':
                index += 1
            continue
        start = index
        while index < len(data) and data[index] not in b' \t\r\n':
            index += 1
        tokens.append(data[start:index])
    assert tokens[0] == b'P6' and tokens[3] == b'255'
    while index < len(data) and data[index] in b' \t\r\n':
        index += 1
    pixels = data[index:]
    dark = sum(1 for offset in range(0, len(pixels) - 2, 3) if sum(pixels[offset:offset + 3]) < 96)
    return dark / (len(pixels) // 3)


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
        chromium_candidates = [
            Path('/usr/bin/chromium'),
            Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
            Path('/Applications/Chromium.app/Contents/MacOS/Chromium'),
        ]
        chromium_path = next((path for path in chromium_candidates if path.exists()), None)
        launch_args = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
        if chromium_path:
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
        assert desktop.locator('#viewScope').input_value() == 'natal_overview'
        assert desktop.locator('#view-year-field').is_hidden()
        assert desktop.locator('#view-month-field').is_hidden()
        assert desktop.locator('#viewDay').count() == 0
        assert desktop.locator('#viewHourBranch').count() == 0
        assert desktop.locator('#viewLeap').count() == 0
        assert desktop.locator('#leapFortuneMode').count() == 0
        assert desktop.locator('[data-topic="Tiểu vận"]').count() == 0
        assert desktop.locator('[data-topic="Vận hạn 2026"]').count() == 0
        assert desktop.locator('[data-topic^="Lưu nguyệt"]').count() == 0
        assert desktop.locator('#time-exact').count() == 1
        assert desktop.locator('#time-branch').count() == 1
        assert desktop.locator('.active-decade').count() == 0
        desktop.set_viewport_size({'width': 911, 'height': 900})
        desktop.wait_for_timeout(100)
        chart_overflow = desktop.locator('.chart-center, .palace').evaluate_all(
            '(elements) => elements.filter((element) => element.scrollHeight > element.clientHeight + 1).map((element) => element.className)'
        )
        assert chart_overflow == []
        chart_font_sizes = desktop.locator('.palace-title strong, .major-star, .minor-stars, .center-fortunes span').evaluate_all(
            '(elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize))'
        )
        assert min(chart_font_sizes) >= 12
        desktop.set_viewport_size({'width': 1440, 'height': 1100})
        desktop.locator('#viewScope').select_option('yearly')
        assert desktop.locator('#view-year-field').is_visible()
        assert desktop.locator('#view-month-field').is_hidden()
        desktop.locator('#birth-form button[type="submit"]').click()
        assert desktop.locator('[data-topic="Vận hạn 2026"]').count() == 1
        assert desktop.locator('[data-topic^="Lưu nguyệt"]').count() == 0

        desktop.locator('#viewScope').select_option('single_month')
        assert desktop.locator('#view-year-field').is_visible()
        assert desktop.locator('#view-month-field').is_visible()
        desktop.locator('#viewYear').fill('2025')
        desktop.wait_for_timeout(100)
        assert desktop.locator('#viewMonth option[value="6-leap"]').count() == 1
        desktop.locator('#viewMonth').select_option('6-leap')
        desktop.locator('#birth-form button[type="submit"]').click()
        desktop.wait_for_timeout(250)
        assert desktop.locator('[data-topic="Lưu nguyệt tháng 6 nhuận"]').count() == 1
        assert 'tháng 6 nhuận' in desktop.locator('#result-meta').inner_text().lower()

        desktop.locator('#viewScope').select_option('all_months')
        assert desktop.locator('#view-year-field').is_visible()
        assert desktop.locator('#view-month-field').is_hidden()
        desktop.locator('#birth-form button[type="submit"]').click()
        assert desktop.locator('[data-topic="Lưu nguyệt năm 2025"]').count() == 1
        desktop.locator('[data-topic="Lưu nguyệt năm 2025"]').click()
        assert desktop.locator('#report-root .report-card').count() == 13

        desktop.locator('#demo-button').click()
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
        desktop.locator('#viewScope').select_option('single_month')
        desktop.locator('#viewYear').fill('2026')
        desktop.locator('#viewMonth').select_option('4')
        desktop.locator('#birth-form button[type="submit"]').click()
        assert desktop.locator('#pdf-options-button').count() == 1
        assert desktop.locator('#pdf-options-panel').is_hidden()
        desktop.locator('#pdf-options-button').click()
        assert desktop.locator('#pdf-options-panel').is_visible()
        assert desktop.locator('[data-pdf-section]').count() == 14
        assert desktop.locator('[data-pdf-section]:checked').count() == 14
        assert '14/14' in desktop.locator('#pdf-options-summary').inner_text()
        desktop.locator('[data-pdf-preset="fortune"]').click()
        assert desktop.locator('[data-pdf-section]:checked').count() == 7
        assert desktop.locator('[data-pdf-section="tai_chinh"]').is_checked() is False
        assert desktop.locator('[data-pdf-section="van_han"]').is_checked()
        assert desktop.locator('#print-button').count() == 0
        assert desktop.locator('#print-report').count() == 0
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
        assert desktop.locator('[data-pdf-section]:checked').count() == 14

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
        desktop.locator('#viewScope').select_option('single_month')
        desktop.locator('#viewYear').fill('2026')
        desktop.locator('#viewMonth').select_option('7')
        desktop.locator('#birth-form button[type="submit"]').click()
        assert 'Giờ Thìn' in desktop.locator('#result-meta').inner_text()
        assert desktop.locator('[data-topic="Lưu nguyệt tháng 7"]').count() == 1
        assert desktop.locator('.monthly-fortune').count() >= 1
        desktop.locator('#compare-hours-button').click()
        assert desktop.locator('#compare-hours-panel').is_visible()
        desktop.locator('#compareHourA').select_option('5')
        desktop.locator('#compareHourB').select_option('6')
        desktop.locator('#run-hour-comparison').click()
        assert desktop.locator('.comparison-row.changed').count() >= 1
        assert desktop.locator('[data-pdf-section]').count() == 15
        assert desktop.locator('[data-pdf-section="so_sanh_gio"]').is_checked()
        desktop.locator('[data-pdf-preset="full"]').click()
        assert desktop.locator('[data-pdf-section]:checked').count() == 15
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
        assert 8 <= page_count <= 48
        assert b'/MediaBox [0 0 595.28 841.89]' in data
        assert b'/MediaBox [0 0 841.89 595.28]' in data
        assert b'/Subtype /Image' not in data
        assert b'/StructTreeRoot' in data
        assert data.count(b'12.00 Tf') >= 20
        assert f'{page_count} trang A4' in desktop.locator('#toolbar-status').inner_text()
        assert 10 <= page_count <= 48

        desktop.locator('#demo-button').click()
        desktop.locator('#fullName').fill('Vũ Minh Hiếu')
        desktop.locator('#solarDate').fill('2001-10-20')
        desktop.locator('#time-branch').click()
        desktop.locator('#birthHourBranch').select_option('4')
        desktop.locator('#timezoneSearch').fill('Ho Chi Minh')
        desktop.locator('#timezone').select_option('Asia/Ho_Chi_Minh')
        desktop.locator('#viewScope').select_option('natal_overview')
        desktop.locator('#birth-form button[type="submit"]').click()
        assert 'Vũ Minh Hiếu' in desktop.locator('#result-title').inner_text()
        assert 'Giờ Mão' in desktop.locator('#result-meta').inner_text()
        desktop.locator('[data-pdf-preset="full"]').click()
        regression_pdf = ROOT / 'sample/vu-minh-hieu-la-so-tu-vi-tong-quan.pdf'
        with desktop.expect_download(timeout=90000) as regression_info:
            desktop.locator('#pdf-button').click()
        regression_info.value.save_as(regression_pdf)
        regression_data = regression_pdf.read_bytes()
        regression_text = subprocess.check_output(['pdftotext', str(regression_pdf), '-'], text=True)
        regression_info_text = subprocess.check_output(['pdfinfo', str(regression_pdf)], text=True)
        assert 'Vũ Minh Hiếu' in regression_text
        assert '20/10/2001' in regression_text
        assert 'Đại hạn 24-33 tuổi' in regression_text
        assert 'cam kết, hợp tác lâu dài' in regression_text
        assert 'Tagged:' in regression_info_text and 'yes' in regression_info_text.lower()
        assert b'/Subtype /Image' not in regression_data
        assert b'/StructTreeRoot' in regression_data
        assert regression_data.count(b'12.00 Tf') >= 20
        for phrase in ['nền nâng đỡ rõ hơn phần gây sức ép', 'có nền thuận tương đối rõ', 'không được đọc như một ô độc lập', 'lớp vận này chỉ tăng', 'trục vận hành']:
            assert phrase not in regression_text.lower()
        desktop.locator('#tool-astrology').click()
        assert desktop.locator('#astrology-tool').is_visible()
        assert desktop.locator('#tuvi-tool').is_hidden()
        assert 'tool=ban-do-sao' in desktop.url
        assert desktop.locator('#astro-location-results option').count() >= 12
        desktop.locator('#astrology-form button[type="submit"]').click()
        desktop.wait_for_timeout(500)
        assert desktop.locator('#astro-form-error').is_hidden()
        assert desktop.locator('.natal-wheel').count() == 1
        assert desktop.locator('.astro-quick-card').count() == 4
        assert desktop.locator('#astro-planets tbody tr').count() == 12
        assert desktop.locator('#astro-houses tbody tr').count() == 12
        assert desktop.locator('#astro-aspects tbody tr').count() >= 1
        assert desktop.locator('.astro-narrative-section').count() == 9
        assert desktop.locator('.astro-narrative-section p').count() >= 12
        astrology_font_sizes = desktop.locator(
            '.astro-quick-card span, .astro-table, .astro-disclaimer, .wheel-note'
        ).evaluate_all(
            '(elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize))'
        )
        assert min(astrology_font_sizes) >= 12
        astrology_body_sizes = desktop.locator('.astro-narrative-section p').evaluate_all(
            '(elements) => elements.map((element) => parseFloat(getComputedStyle(element).fontSize))'
        )
        assert min(astrology_body_sizes) >= 16
        assert 'TP. Hồ Chí Minh' in desktop.locator('#astro-result-meta').inner_text()
        desktop.locator('#astro-pdf-options-button').click()
        assert desktop.locator('#astro-pdf-options').is_visible()
        assert desktop.locator('[data-astro-pdf]').count() == 6
        assert desktop.locator('[data-astro-pdf]:checked').count() == 2
        astrology_pdf = ROOT / 'sample/MXiao-Ban-Do-Sao-final.pdf'
        with desktop.expect_download(timeout=90000) as astrology_pdf_info:
            desktop.locator('#astro-pdf-button').click()
        astrology_pdf_info.value.save_as(astrology_pdf)
        astrology_text = subprocess.check_output(['pdftotext', str(astrology_pdf), '-'], text=True)
        astrology_info = subprocess.check_output(['pdfinfo', str(astrology_pdf)], text=True)
        assert 'BẢN ĐỒ SAO CÁ NHÂN' in astrology_text
        assert 'Nguyễn Minh An' in astrology_text
        assert 'Luận giải Bản đồ sao' in astrology_text
        assert 'Tình cảm và sự gắn bó' in astrology_text
        for phrase in ['placement', 'evidence', 'confidence', 'rule id', 'dataset', 'json', 'debug']:
            assert phrase not in astrology_text.lower()
        assert 'Vòng Bản đồ sao' in astrology_text or b'/Subtype /Image' in astrology_pdf.read_bytes()
        assert 'Author:' in astrology_info and 'MXiao Huyền Học' in astrology_info
        assert 'Title:' in astrology_info and 'Bản đồ sao cá nhân' in astrology_info
        assert b'/StructTreeRoot' in astrology_pdf.read_bytes()
        assert pdf_page_dark_ratio(astrology_pdf, 3) < 0.2
        desktop.screenshot(path=ROOT / 'screenshots/astrology-desktop.png', full_page=True)

        desktop.locator('#astro-time-unknown').click()
        desktop.locator('#astrology-form button[type="submit"]').click()
        desktop.wait_for_timeout(1000)
        assert desktop.locator('#astro-limit-badge').is_visible()
        assert desktop.locator('#astro-houses-section').is_hidden()
        assert desktop.locator('.astro-quick-card').count() == 2

        desktop.locator('#astro-time-exact').click()
        desktop.locator('#astro-location-search').fill('Tromsø')
        desktop.locator('#astro-location-results').select_option('no-tromso')
        desktop.locator('#astro-date').fill('2004-02-29')
        desktop.locator('#astro-time').fill('23:45')
        desktop.locator('.advanced-settings summary').click()
        desktop.locator('#astro-house-system').select_option('placidus')
        desktop.locator('#astrology-form button[type="submit"]').click()
        assert 'Placidus không khả dụng' in desktop.locator('#astro-form-error').inner_text()
        desktop.locator('#astro-house-system').select_option('whole_sign')
        desktop.locator('#astrology-form button[type="submit"]').click()
        assert desktop.locator('#astro-form-error').is_hidden()
        assert desktop.locator('#astro-houses tbody tr').count() == 12

        desktop.locator('#tool-tuvi').click()
        assert desktop.locator('#tuvi-tool').is_visible()
        assert desktop.locator('.palace').count() == 12
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
        assert mobile.locator('[data-pdf-section]').count() == 14
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        mobile.screenshot(path=ROOT / 'screenshots/mobile-v2.png', full_page=True)
        mobile.locator('#tool-astrology').click()
        mobile.locator('#astrology-form button[type="submit"]').click()
        mobile.wait_for_timeout(500)
        assert mobile.locator('.natal-wheel').count() == 1
        assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        mobile.screenshot(path=ROOT / 'screenshots/astrology-mobile.png', full_page=True)
        assert not mobile_errors, mobile_errors
        browser.close()
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()

print(f'Browser E2E passed: mode={mode}, four view scopes, conditional leap month, exact or branch birth time, responsive UI, direct PDF downloads with metadata and bookmarks.')
