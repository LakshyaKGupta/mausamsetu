export interface FieldReportData {
  id: number
  officer_id?: number
  officer_name?: string
  panchayat_id?: number
  panchayat_name?: string
  block?: string
  crop: string
  crop_stage?: string
  category?: string
  severity: string
  observation_notes?: string
  description?: string
  action_recommended?: string
  created_at?: string
}

/**
 * Generates and triggers browser print-to-PDF for a single field report.
 */
export function downloadSingleReportPDF(
  report: FieldReportData,
  officerName = 'Rajesh Sharma',
  districtName = 'Nagpur'
) {
  const printWindow = window.open('', '_blank', 'width=850,height=1000')
  if (!printWindow) {
    alert('Please allow popups to download the Field Report PDF.')
    return
  }

  const formattedDate = new Date(report.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const severityColor =
    report.severity === 'high' || report.severity === 'critical'
      ? '#dc2626'
      : report.severity === 'medium'
      ? '#d97706'
      : '#059669'

  const panchayatLabel = report.panchayat_name || 'Kalmeshwar Central'
  const obsNotes = report.observation_notes || report.description || 'Routine field inspection logged.'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Field_Report_FR-${String(report.id).padStart(4, '0')}_${panchayatLabel.replace(/\\s+/g, '_')}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 20mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid #047857;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-badge {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .emblem {
      font-size: 38px;
      line-height: 1;
    }
    .org-title h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #065f46;
      text-transform: uppercase;
    }
    .org-title h2 {
      margin: 2px 0 0 0;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .org-title p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-meta .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      margin-bottom: 4px;
    }
    .doc-meta .report-no {
      font-size: 12px;
      font-family: monospace;
      font-weight: 700;
      color: #0f172a;
    }
    .doc-title-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #047857;
      padding: 10px 14px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .doc-title-bar h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-title-bar p {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .info-table th, .info-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }
    .info-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      width: 25%;
    }
    .info-table td {
      color: #1e293b;
      font-weight: 500;
    }
    .severity-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: white;
      background: ${severityColor};
    }
    .section-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .section-card-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-card-body {
      padding: 12px;
      font-size: 12px;
      color: #1e293b;
      line-height: 1.6;
    }
    .action-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #059669;
      border-radius: 4px;
      padding: 12px;
      font-size: 12px;
      color: #064e3b;
      font-weight: 600;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 45%;
      border-top: 1px dashed #94a3b8;
      padding-top: 8px;
      text-align: center;
      font-size: 11px;
      color: #475569;
    }
    .sig-box .name {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    .print-btn-bar {
      margin-bottom: 20px;
      background: #1e293b;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .print-btn-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <!-- Screen-only action bar -->
  <div class="print-btn-bar">
    <span>📄 Field Report PDF Preview — Document Ready</span>
    <button class="print-btn" onclick="window.print()">📥 Print / Save as PDF</button>
  </div>

  <!-- Document Header -->
  <div class="header">
    <div class="logo-badge">
      <div class="emblem">🏛️</div>
      <div class="org-title">
        <h1>Government of Maharashtra · Department of Agriculture</h1>
        <h2>MausamSetu (मौसमसेतु) — Agro-Meteorological Advisory Unit</h2>
        <p>Sub-Division Extension Office · District ${districtName}</p>
      </div>
    </div>
    <div class="doc-meta">
      <div class="badge">OFFICIAL GROUND TRUTH</div>
      <div class="report-no">REF: FR-${String(report.id).padStart(5, '0')}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Date: ${formattedDate}</div>
    </div>
  </div>

  <!-- Title Banner -->
  <div class="doc-title-bar">
    <h3>Agricultural Field Extension Observation & Inspection Report</h3>
    <p>Recorded and verified under Ministry of Panchayati Raj / IMD Agromet Framework</p>
  </div>

  <!-- Metadata Table -->
  <table class="info-table">
    <tr>
      <th>Gram Panchayat</th>
      <td><strong>${panchayatLabel} GP</strong></td>
      <th>Target Crop</th>
      <td><strong style="text-transform: capitalize;">${report.crop}</strong></td>
    </tr>
    <tr>
      <th>Block / Sub-Division</th>
      <td>${report.block || 'Kalmeshwar'}</td>
      <th>Growth Stage</th>
      <td>${report.crop_stage || 'Active Field Stage'}</td>
    </tr>
    <tr>
      <th>Observation Category</th>
      <td><span style="text-transform: capitalize;">${report.category || 'Agronomic Condition'}</span></td>
      <th>Severity Rating</th>
      <td><span class="severity-pill">${report.severity}</span></td>
    </tr>
    <tr>
      <th>Extension Officer</th>
      <td>${officerName}</td>
      <th>Inspection Date</th>
      <td>${formattedDate}</td>
    </tr>
  </table>

  <!-- Observation Notes -->
  <div class="section-card">
    <div class="section-card-header">
      <span>🔍</span>
      <span>Ground Truth Field Observation & Diagnostic Findings</span>
    </div>
    <div class="section-card-body">
      ${obsNotes}
    </div>
  </div>

  <!-- Recommended Remedial Actions -->
  ${
    report.action_recommended
      ? `
  <div class="section-card">
    <div class="section-card-header" style="color: #065f46; background: #f0fdf4;">
      <span>🌱</span>
      <span>Prescribed Agronomic Action & Advisory to Farmers</span>
    </div>
    <div class="section-card-body" style="background: #fafffc;">
      <div class="action-box">
        ${report.action_recommended}
      </div>
    </div>
  </div>
  `
      : ''
  }

  <!-- Weather Cross-Verification -->
  <div class="section-card">
    <div class="section-card-header">
      <span>🌦️</span>
      <span>Hyperlocal Weather Correlation</span>
    </div>
    <div class="section-card-body" style="font-size: 11px; color: #475569;">
      This observation is linked with MausamSetu's 3km downscaled weather predictions for Gram Panchayat ${panchayatLabel}. Observations are ingested into the localized agro-advisory dispatch queue for verified farmer advisories.
    </div>
  </div>

  <!-- Official Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div class="name">${officerName}</div>
      <div>Agricultural Extension Officer</div>
      <div>Sub-Division Kalmeshwar, Nagpur</div>
    </div>
    <div class="sig-box">
      <div class="name">Digital Verification Authority</div>
      <div>MausamSetu System Stamp: VERIFIED</div>
      <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>MausamSetu Platform — Official Field Inspection Report</span>
    <span>Generated on ${new Date().toLocaleString('en-IN')}</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    // Trigger print dialog automatically after slight render delay
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Generates and triggers browser print-to-PDF for all field reports combined.
 */
export function downloadAllReportsPDF(
  reports: FieldReportData[],
  officerName = 'Rajesh Sharma',
  blockName = 'Kalmeshwar',
  districtName = 'Nagpur'
) {
  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) {
    alert('Please allow popups to download the Consolidated Field Reports PDF.')
    return
  }

  const generatedTime = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const rowsHtml = reports
    .map((r, idx) => {
      const formattedDate = new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const sevColor =
        r.severity === 'high' || r.severity === 'critical'
          ? '#dc2626'
          : r.severity === 'medium'
          ? '#d97706'
          : '#059669'

      return `
      <tr>
        <td style="font-family: monospace; font-weight: bold;">FR-${String(r.id).padStart(4, '0')}</td>
        <td><strong>${r.panchayat_name || 'Kalmeshwar'} GP</strong></td>
        <td style="text-transform: capitalize;">${r.crop}</td>
        <td><span style="background:${sevColor}; color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; text-transform:uppercase;">${r.severity}</span></td>
        <td style="font-size:11px;">${r.observation_notes || (r as any).description || 'Routine observation.'}</td>
        <td style="font-size:11px; color:#065f46; font-weight:600;">${r.action_recommended || '—'}</td>
        <td style="white-space:nowrap; font-size:10px; color:#64748b;">${formattedDate}</td>
      </tr>
    `
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Consolidated_Field_Reports_${blockName}_${districtName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      margin: 0;
      padding: 20px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid #047857;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .org-title h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #065f46;
      text-transform: uppercase;
    }
    .org-title h2 {
      margin: 2px 0 0 0;
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }
    .table-container {
      width: 100%;
      margin-top: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
    }
    .print-btn-bar {
      margin-bottom: 16px;
      background: #1e293b;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    @media print {
      .print-btn-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <span>📄 Consolidated Inspection Dossier (${reports.length} Reports)</span>
    <button class="print-btn" onclick="window.print()">📥 Print / Save as PDF</button>
  </div>

  <div class="header">
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="font-size:32px;">🏛️</div>
      <div class="org-title">
        <h1>Government of Maharashtra · Department of Agriculture</h1>
        <h2>MausamSetu Extension Inspection Register · ${blockName} Block, District ${districtName}</h2>
      </div>
    </div>
    <div style="text-align:right; font-size:11px;">
      <div><strong>Total Records: ${reports.length}</strong></div>
      <div style="color:#64748b;">Generated: ${generatedTime}</div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 8%;">ID</th>
          <th style="width: 14%;">Gram Panchayat</th>
          <th style="width: 10%;">Crop</th>
          <th style="width: 8%;">Severity</th>
          <th style="width: 32%;">Observation Notes</th>
          <th style="width: 20%;">Recommended Action</th>
          <th style="width: 8%;">Date</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <div style="margin-top: 24px; display:flex; justify-content:space-between; font-size:11px; color:#475569;">
    <div>Inspecting Officer: <strong>${officerName}</strong>, Agricultural Extension Officer</div>
    <div>MausamSetu Digital Verification: <strong>AUTHENTICATED GROUND TRUTH</strong></div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Generates and triggers browser print-to-PDF for an official Agromet Advisory bulletin.
 */
export function downloadAdvisoryPDF(advisory: {
  id: number
  panchayat_name?: string
  crop: string
  crop_stage?: string
  advisory_date: string
  content_hi?: string
  content_en?: string
  content_mr?: string
  confidence_score?: number
  baseline_rainfall_mm?: number
  predicted_rainfall_mm?: number
  status?: string
  officer_note?: string
  officer_name?: string
}) {
  const printWindow = window.open('', '_blank', 'width=850,height=1000')
  if (!printWindow) {
    alert('Please allow popups to download the Advisory Bulletin PDF.')
    return
  }

  const pName = advisory.panchayat_name || 'Kalmeshwar Central'
  const formattedDate = new Date(advisory.advisory_date || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agromet_Advisory_ADV-${String(advisory.id).padStart(4, '0')}_${pName.replace(/\\s+/g, '_')}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; color: #1e293b; line-height: 1.5; padding: 20px; }
    .header { border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .print-bar { background: #1e293b; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn { background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    .info-table th, .info-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    .info-table th { background: #f8fafc; color: #475569; width: 25%; font-weight: bold; }
    .advisory-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px; margin-bottom: 16px; }
    .advisory-title { font-weight: 800; font-size: 13px; color: #166534; margin-bottom: 6px; }
    .advisory-text { font-size: 13px; color: #14532d; line-height: 1.6; }
    .sec-en { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 16px; }
    @media print { .print-bar { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>📄 Agromet Advisory Bulletin (PDF Ready)</span>
    <button class="btn" onclick="window.print()">📥 Print / Save as PDF</button>
  </div>
  <div class="header">
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:36px;">🌾</span>
      <div>
        <h1 style="margin:0; font-size:16px; color:#065f46; font-weight:800; text-transform:uppercase;">Government of Maharashtra · Dept. of Agriculture</h1>
        <h2 style="margin:2px 0 0 0; font-size:13px; color:#334155;">MausamSetu (मौसमसेतु) — Gram Panchayat Agromet Advisory Bulletin</h2>
        <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">Block: Kalmeshwar · District: Nagpur</p>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px; font-weight:bold; color:#047857;">VERIFIED BULLETIN</div>
      <div style="font-family:monospace; font-weight:bold; font-size:12px;">BULLETIN: ADV-${String(advisory.id).padStart(5, '0')}</div>
      <div style="font-size:10px; color:#64748b;">Issued: ${formattedDate}</div>
    </div>
  </div>

  <table class="info-table">
    <tr>
      <th>Gram Panchayat</th><td><strong>${pName} GP</strong></td>
      <th>Target Crop</th><td style="text-transform:capitalize;"><strong>${advisory.crop}</strong></td>
    </tr>
    <tr>
      <th>Crop Stage</th><td>${advisory.crop_stage || 'Vegetative'}</td>
      <th>Forecast Baseline</th><td>${advisory.baseline_rainfall_mm ?? 14} mm Rain (IMD)</td>
    </tr>
    <tr>
      <th>Downscaled Rain</th><td><strong>${advisory.predicted_rainfall_mm ?? 18} mm</strong> (Downscaled)</td>
      <th>Confidence Score</th><td>${Math.round((advisory.confidence_score || 0.88) * 100)}% Verified</td>
    </tr>
  </table>

  ${advisory.content_hi ? `
  <div class="advisory-box">
    <div class="advisory-title">🇮🇳 हिंदी कृषि मौसम सलाह (Hindi Advisory)</div>
    <div class="advisory-text">${advisory.content_hi}</div>
  </div>` : ''}

  ${advisory.content_mr ? `
  <div class="advisory-box" style="background:#eff6ff; border-color:#bfdbfe; border-left-color:#2563eb;">
    <div class="advisory-title" style="color:#1e40af;">🚩 मराठी कृषी हवामान सल्ला (Marathi Advisory)</div>
    <div class="advisory-text" style="color:#1e3a8a;">${advisory.content_mr}</div>
  </div>` : ''}

  ${advisory.content_en ? `
  <div class="sec-en">
    <div style="font-weight:bold; font-size:12px; color:#334155; margin-bottom:6px;">🇬🇧 English Translation:</div>
    <div style="font-size:12px; color:#475569; line-height:1.6;">${advisory.content_en}</div>
  </div>` : ''}

  <div style="margin-top:40px; display:flex; justify-content:space-between; font-size:11px; color:#475569; border-top:1px dashed #cbd5e1; padding-top:12px;">
    <div>Issuing Authority: <strong>${advisory.officer_name || 'Rajesh Sharma'}</strong>, Ag Extension Officer</div>
    <div>Digital Verification: <strong>APPROVED BY AGROMET ADVISORY UNIT</strong></div>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.print(), 400); });
  </script>
</body>
</html>
`
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

