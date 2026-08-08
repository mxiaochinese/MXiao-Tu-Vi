from pathlib import Path
import sys
import xml.etree.ElementTree as ET

if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 tests/verify_verapdf_report.py <veraPDF-report.xml>')

report_path = Path(sys.argv[1])
if not report_path.exists():
    raise SystemExit(f'Missing veraPDF report: {report_path}')

root = ET.parse(report_path).getroot()

def local_name(tag):
    return tag.rsplit('}', 1)[-1]

validation_reports = [node for node in root.iter() if local_name(node.tag) == 'validationReport']
if not validation_reports:
    raise AssertionError('veraPDF report contains no validationReport element')

non_compliant = [node for node in validation_reports if node.attrib.get('isCompliant', '').lower() != 'true']
if non_compliant:
    failed = []
    for report in non_compliant:
        details = [
            node for node in report.iter()
            if local_name(node.tag) in {'rule', 'test'}
            and node.attrib.get('status', '').lower() in {'failed', 'false'}
        ]
        failed.extend(details[:10])
    summary = ', '.join(
        f"{local_name(node.tag)}:{node.attrib.get('specification', node.attrib.get('clause', 'unknown'))}"
        for node in failed
    ) or 'see veraPDF XML report'
    raise AssertionError(f'veraPDF PDF/UA-1 validation failed: {summary}')

batch_summaries = [node for node in root.iter() if local_name(node.tag) == 'batchSummary']
for summary in batch_summaries:
    for attribute in ('failedToParse', 'encrypted', 'outOfMemory', 'veraExceptions'):
        if int(summary.attrib.get(attribute, '0')) != 0:
            raise AssertionError(f'veraPDF batch summary reports {attribute}={summary.attrib[attribute]}')

print(f'veraPDF report passed: {len(validation_reports)} PDF/UA-1 validation report(s) compliant')
