from pathlib import Path
import re
import subprocess
import sys
from collections import Counter
from pypdf import PdfReader
from pypdf.generic import IndirectObject, ArrayObject, DictionaryObject

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'sample' / 'MXiao-Tu-Vi-2026-text-final.pdf'
EXPECTED_TITLE = sys.argv[2] if len(sys.argv) > 2 else 'Lá số Tử Vi và luận giải chi tiết'
EXPECTED_AUTHOR = sys.argv[3] if len(sys.argv) > 3 else 'MXiao Tử Vi'
EXPECTED_HEADING = sys.argv[4] if len(sys.argv) > 4 else 'LÁ SỐ TỬ VI VÀ LUẬN GIẢI CHI TIẾT'
MIN_TEXT_LENGTH = int(sys.argv[5]) if len(sys.argv) > 5 else 50000
assert PDF.exists(), f'Missing {PDF}'
data = PDF.read_bytes()
assert data.startswith(b'%PDF-1.7')
reader = PdfReader(str(PDF))
assert not reader.is_encrypted
root = reader.trailer['/Root']

# Catalog and document metadata required by the product's PDF/UA-1 preflight.
assert root.get('/Lang') == 'vi-VN'
assert bool(root.get('/MarkInfo', {}).get('/Marked')) is True
assert '/StructTreeRoot' in root
assert '/Metadata' in root
assert bool(root.get('/ViewerPreferences', {}).get('/DisplayDocTitle')) is True
assert '/Outlines' in root
assert '/OpenAction' not in root
assert '/AA' not in root
assert '/AcroForm' not in root
info = reader.metadata
assert info and info.title == EXPECTED_TITLE
assert info.author == EXPECTED_AUTHOR

metadata = root['/Metadata'].get_object().get_data()
assert b'pdfuaid:part' in metadata and re.search(rb'<pdfuaid:part>\s*1\s*</pdfuaid:part>', metadata)
assert b'<dc:language>' in metadata and b'vi-VN' in metadata
assert EXPECTED_TITLE.encode('utf-8') in metadata

# Page geometry, tab order, structural parent keys, and absence of untagged annotations.
A4_P = (595.28, 841.89)
A4_L = (841.89, 595.28)
struct_parent_keys = []
for page in reader.pages:
    assert page.get('/Tabs') == '/S'
    assert '/StructParents' in page
    struct_parent_keys.append(int(page['/StructParents']))
    width = round(float(page.mediabox.width), 2)
    height = round(float(page.mediabox.height), 2)
    assert (width, height) in (A4_P, A4_L), (width, height)
    assert not page.get('/Annots'), 'PDF không được có annotation chưa gắn cấu trúc.'
assert len(set(struct_parent_keys)) == len(reader.pages)

# Validate structure tree, parent tree, MCR references and MCID coverage.
struct_root = root['/StructTreeRoot'].get_object()
assert struct_root.get('/Type') == '/StructTreeRoot'
assert '/ParentTree' in struct_root
assert int(struct_root.get('/ParentTreeNextKey')) == len(reader.pages)
sections = struct_root.get('/K')
assert isinstance(sections, ArrayObject) and len(sections) == len(reader.pages)

parent_nums = struct_root['/ParentTree'].get_object().get('/Nums')
assert isinstance(parent_nums, ArrayObject) and len(parent_nums) % 2 == 0
parent_tree = {int(parent_nums[i]): parent_nums[i + 1].get_object() for i in range(0, len(parent_nums), 2)}
assert set(parent_tree) == set(struct_parent_keys)

page_ref_ids = {page.indirect_reference.idnum: index for index, page in enumerate(reader.pages)}
role_counts = Counter()
page_roles = [[] for _ in reader.pages]
leaf_by_page_mcid = {}
figure_alt_count = 0

def ref_id(value):
    return value.idnum if isinstance(value, IndirectObject) else None

def mcrs_from_k(value):
    if isinstance(value, ArrayObject):
        return [item for item in value if isinstance(item, DictionaryObject) and item.get('/Type') == '/MCR']
    if isinstance(value, DictionaryObject) and value.get('/Type') == '/MCR':
        return [value]
    return []

for page_index, section_ref in enumerate(sections):
    section = section_ref.get_object()
    assert section.get('/Type') == '/StructElem'
    assert section.get('/S') == '/Sect'
    assert ref_id(section.get('/P')) == struct_root.indirect_reference.idnum if getattr(struct_root, 'indirect_reference', None) else True
    assert ref_id(section.get('/Pg')) in page_ref_ids
    assert page_ref_ids[ref_id(section.get('/Pg'))] == page_index
    children = section.get('/K')
    assert isinstance(children, ArrayObject) and children, f'Trang {page_index + 1} không có cấu trúc đọc.'
    for child_ref in children:
        child = child_ref.get_object()
        role = str(child.get('/S'))
        assert role in {'/H1', '/H2', '/H3', '/P', '/Figure'}, role
        role_counts[role] += 1
        page_roles[page_index].append(role)
        assert child.get('/Type') == '/StructElem'
        assert ref_id(child.get('/P')) == section_ref.idnum
        assert ref_id(child.get('/Pg')) in page_ref_ids
        assert page_ref_ids[ref_id(child.get('/Pg'))] == page_index
        if role == '/Figure':
            alt = child.get('/Alt')
            assert alt and str(alt).strip(), 'Figure phải có Alt text.'
            figure_alt_count += 1
        mcrs = mcrs_from_k(child.get('/K'))
        assert mcrs, f'{role} không có marked-content reference.'
        for mcr in mcrs:
            mcid = int(mcr['/MCID'])
            assert ref_id(mcr.get('/Pg')) in page_ref_ids
            assert page_ref_ids[ref_id(mcr.get('/Pg'))] == page_index
            key = (page_index, mcid)
            assert key not in leaf_by_page_mcid, f'MCID trùng {key}'
            leaf_by_page_mcid[key] = child_ref.idnum

assert role_counts['/H1'] == 1, role_counts
assert role_counts['/H2'] >= 1
assert role_counts['/H3'] >= 1
assert role_counts['/P'] >= 1
assert role_counts['/Figure'] == 1 and figure_alt_count == 1
# The first semantic item in the document must be the main title, not branding/decorative text.
assert page_roles[0][0] == '/H1', page_roles[0][:5]

# Compare each page's actual tagged MCIDs with its ParentTree mapping.
mcid_pattern = re.compile(rb'/[A-Za-z0-9]+\s*<</MCID\s+(\d+)>>\s*BDC')
for page_index, page in enumerate(reader.pages):
    content = page.get_contents().get_data()
    mcids = [int(item) for item in mcid_pattern.findall(content)]
    assert mcids, f'Trang {page_index + 1} không có MCID.'
    assert sorted(mcids) == list(range(max(mcids) + 1)), f'MCID không liên tục ở trang {page_index + 1}: {mcids}'
    parent_array = parent_tree[int(page['/StructParents'])]
    assert len(parent_array) == max(mcids) + 1
    for mcid in mcids:
        expected_ref = leaf_by_page_mcid[(page_index, mcid)]
        actual = parent_array[mcid]
        assert isinstance(actual, IndirectObject)
        assert actual.idnum == expected_ref, (page_index, mcid, actual.idnum, expected_ref)

# Binary syntax and renderer checks.
for marker in [b'/S /H1', b'/S /H2', b'/S /H3', b'/S /P', b'/S /Figure', b'/Alt', b'/Artifact BMC']:
    assert marker in data, marker
subprocess.run(['gs', '-q', '-dNOPAUSE', '-dBATCH', '-dPDFSTOPONERROR', '-sDEVICE=nullpage', str(PDF)], check=True)
info_text = subprocess.check_output(['pdfinfo', str(PDF)], text=True)
assert 'Tagged:          yes' in info_text
assert 'Suspects:        no' in info_text
assert 'Metadata Stream: yes' in info_text
assert 'PDF version:     1.7' in info_text
fonts = subprocess.check_output(['pdffonts', str(PDF)], text=True)
font_lines = [line for line in fonts.splitlines() if line.startswith('F400') or line.startswith('F700')]
assert len(font_lines) == 2
for line in font_lines:
    columns = line.split()
    # Both fonts must be embedded and expose a ToUnicode mapping.
    assert columns[-5] == 'yes', line
    assert columns[-3] == 'yes', line
text = subprocess.check_output(['pdftotext', str(PDF), '-'], text=True)
assert len(text) > MIN_TEXT_LENGTH
assert '\ufffd' not in text
normalized_text = re.sub(r'\s+', ' ', text)
assert EXPECTED_HEADING in normalized_text

print(
    'PDF accessibility integrity preflight passed: '
    f'{len(reader.pages)} pages, roles={dict(role_counts)}, '
    f'{len(leaf_by_page_mcid)} tagged MCIDs, parent-tree consistent, '
    'PDF 1.7, XMP PDF/UA-1 identifier, embedded Unicode fonts'
)
