/* ===========================================================================
   ContractorAI — Shared Tools
   PDF Estimate Export + Payment Schedule Generator
   Loaded by mason.html, commercial.html, residential.html, and index.html
   =========================================================================== */

// ── PDF EXPORT ──────────────────────────────────────────────────────────────
// Builds a clean branded PDF from an estimate data object.
// Uses jsPDF (loaded via CDN in each page).

function generateEstimatePDF(d, opts) {
  opts = opts || {};
  const companyName = opts.companyName || 'ContractorAI';
  const client      = opts.client      || 'Client';
  const location    = opts.location    || '';
  const trade       = opts.trade       || '';
  const jobType     = opts.jobType     || '';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 0;

  // Header band
  doc.setFillColor(30, 64, 175); // --blue
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(companyName, margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254); // light blue
  doc.text('Professional Estimate', margin, 60);
  doc.setFontSize(9);
  doc.text(d.date || '', margin, 74);

  // Estimate number top right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(d.estimate_number || '', pageW - margin, 42, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);
  doc.text(`Valid ${d.valid_days || 30} days`, pageW - margin, 60, { align: 'right' });

  y = 120;

  // Client info block
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Prepared For', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(client, margin, y + 16);
  if (location) doc.text(location, margin, y + 31);

  // Project info right side
  doc.setFont('helvetica', 'bold');
  doc.text('Project', pageW - margin - 180, y);
  doc.setFont('helvetica', 'normal');
  const projLabel = jobType || trade || 'Construction Project';
  doc.text(projLabel, pageW - margin - 180, y + 16, { maxWidth: 180 });

  y += 60;

  // Line items table header
  doc.setFillColor(239, 246, 255); // --blue4
  doc.rect(margin, y, pageW - margin * 2, 24, 'F');
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIPTION', margin + 8, y + 16);
  doc.text('QTY', pageW - margin - 200, y + 16);
  doc.text('UNIT', pageW - margin - 130, y + 16);
  doc.text('TOTAL', pageW - margin - 8, y + 16, { align: 'right' });
  y += 24;

  // Line items
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let lastCategory = '';
  (d.line_items || []).forEach(item => {
    // Category subheader
    if (item.category && item.category !== lastCategory) {
      lastCategory = item.category;
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(8);
      doc.text(item.category.toUpperCase(), margin + 8, y + 8);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
    }

    // Page break check
    if (y > 680) { doc.addPage(); y = 60; }

    const desc = doc.splitTextToSize(item.description || '', pageW - margin * 2 - 230);
    doc.text(desc, margin + 8, y + 10);
    doc.text(String(item.qty || ''), pageW - margin - 200, y + 10);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`$${Number(item.unit_price || 0).toFixed(2)}`, pageW - margin - 130, y + 10);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${Number(item.total || 0).toLocaleString()}`, pageW - margin - 8, y + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += Math.max(18, desc.length * 11);

    // Row divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageW - margin, y);
  });

  y += 16;
  if (y > 640) { doc.addPage(); y = 60; }

  // Totals
  const totalsX = pageW - margin - 200;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const totalRow = (label, val, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, totalsX, y);
    doc.text(`$${Number(val || 0).toLocaleString()}`, pageW - margin - 8, y, { align: 'right' });
    y += 16;
  };
  totalRow('Subtotal', d.subtotal);
  if (d.overhead_amt) totalRow(`Overhead (${d.overhead_pct}%)`, d.overhead_amt);
  if (d.profit_amt)   totalRow(`Profit (${d.profit_pct}%)`, d.profit_amt);

  // Grand total band
  y += 6;
  doc.setFillColor(30, 64, 175);
  doc.rect(totalsX - 12, y - 4, pageW - margin - (totalsX - 12) + 4, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TOTAL', totalsX, y + 16);
  doc.text(`$${Number(d.total || 0).toLocaleString()}`, pageW - margin - 8, y + 16, { align: 'right' });
  y += 50;

  // Notes
  if (d.notes) {
    if (y > 680) { doc.addPage(); y = 60; }
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(d.notes, pageW - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12 + 10;
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 760, pageW - margin, 760);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${companyName} · Estimate ${d.estimate_number || ''}`, margin, 774);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 774, { align: 'right' });
  }

  return doc;
}

function downloadEstimatePDF(d, opts) {
  const doc = generateEstimatePDF(d, opts);
  const safeClient = (opts && opts.client ? opts.client : 'Estimate').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Estimate_${safeClient}_${d.estimate_number || ''}.pdf`);
}


// ── ROBUST JSON PARSER ──────────────────────────────────────────────────────
// Handles malformed JSON from the model — foot/inch marks, fractions,
// trailing commas, control characters, unescaped quotes in text fields.
function parseEstimateJSON(raw) {
  // Extract outermost JSON object via bracket counting
  const start = raw.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');
  let depth = 0, end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('Incomplete JSON in response');
  const extracted = raw.slice(start, end + 1);

  // Attempt 1 — direct parse
  try { return JSON.parse(extracted); } catch(e) {}

  // Attempt 2 — sanitize then parse
  let s = extracted
    .replace(/[\u2018\u2019]/g, "'")     // curly apostrophes
    .replace(/[\u201C\u201D]/g, '"')     // curly quotes
    .replace(/½/g, '.5').replace(/¼/g, '.25').replace(/¾/g, '.75')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/,(\s*[}\]])/g, '$1');      // trailing commas
  // Clean problem chars inside common string fields
  ['description','notes','issue','mitigation','phase','name'].forEach(key => {
    s = s.replace(new RegExp(`"${key}"\\s*:\\s*"([^"]*?)"`, 'g'), (m, val) =>
      `"${key}":"${val.replace(/[\\]/g,' ').replace(/(\d)"/g,'$1in').replace(/(\d)'/g,'$1ft')}"`);
  });
  try { return JSON.parse(s); } catch(e) {}

  // Attempt 3 — field + array extraction
  const getNum = (k) => { const m = extracted.match(new RegExp(`"${k}"\\s*:\\s*([\\d.]+)`)); return m ? parseFloat(m[1]) : 0; };
  const getStr = (k) => { const m = extracted.match(new RegExp(`"${k}"\\s*:\\s*"([^"]{0,300})"`)); return m ? m[1].replace(/[\\"]/g,' ') : ''; };
  const getArr = (k) => {
    const ki = extracted.indexOf(`"${k}"`); if (ki === -1) return [];
    const as = extracted.indexOf('[', ki); if (as === -1) return [];
    let d2 = 0, ae = as;
    for (let i = as; i < extracted.length; i++) {
      if (extracted[i] === '[') d2++;
      else if (extracted[i] === ']') { d2--; if (d2 === 0) { ae = i; break; } }
    }
    let arrStr = extracted.slice(as, ae + 1).replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(arrStr); } catch(e) { return []; }
  };
  const obj = {
    estimate_number: getStr('estimate_number'),
    date: getStr('date'),
    valid_days: getNum('valid_days') || 30,
    labor_days: getNum('labor_days'),
    project_duration_weeks: getNum('project_duration_weeks'),
    crew_size: getNum('crew_size'),
    line_items: getArr('line_items'),
    subtotal: getNum('subtotal'),
    overhead_pct: getNum('overhead_pct'), overhead_amt: getNum('overhead_amt'),
    profit_pct: getNum('profit_pct'), profit_amt: getNum('profit_amt'),
    total: getNum('total'),
    cost_per_sqft: getNum('cost_per_sqft'),
    risks: getArr('risks'),
    notes: getStr('notes'),
    schedule: getArr('schedule'),
  };
  if (!obj.line_items.length) throw new Error('Could not parse estimate. Please try generating again.');
  return obj;
}

// Generates a deposit / progress / final breakdown from a total and a split.

function buildPaymentSchedule(total, splits) {
  // splits = [{label:'Deposit', pct:50}, {label:'Final', pct:50}]
  return splits.map(s => ({
    label: s.label,
    pct: s.pct,
    amount: Math.round(total * (s.pct / 100))
  }));
}

function paymentScheduleHTML(schedule, total) {
  let rows = schedule.map((s, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:${i===0?'#EFF6FF':'#F8FAFC'};border:1px solid #E2E8F0;border-radius:8px;margin-bottom:8px">
      <div>
        <div style="font-size:14px;font-weight:600;color:#0F172A">${s.label}</div>
        <div style="font-size:11px;color:#94A3B8">${s.pct}% of total</div>
      </div>
      <div style="font-size:18px;font-weight:700;color:#2563EB">$${s.amount.toLocaleString()}</div>
    </div>`).join('');
  const sum = schedule.reduce((a, s) => a + s.amount, 0);
  return `${rows}
    <div style="display:flex;justify-content:space-between;padding:12px;border-top:2px solid #1E40AF;margin-top:4px">
      <div style="font-size:13px;font-weight:600;color:#475569">Total Contract</div>
      <div style="font-size:16px;font-weight:700;color:#0F172A">$${sum.toLocaleString()}</div>
    </div>`;
}

// Common preset splits the contractor can choose from
const PAYMENT_PRESETS = {
  '50-50':      [{label:'Deposit', pct:50}, {label:'Final Payment', pct:50}],
  '33-33-34':   [{label:'Deposit', pct:33}, {label:'Midpoint', pct:33}, {label:'Final Payment', pct:34}],
  '25-50-25':   [{label:'Deposit', pct:25}, {label:'Progress', pct:50}, {label:'Final Payment', pct:25}],
  '10-40-40-10':[{label:'Deposit', pct:10}, {label:'Rough-In', pct:40}, {label:'Substantial', pct:40}, {label:'Final', pct:10}],
};


// ── PRICE BACKUP / RESTORE ──────────────────────────────────────────────────
// Exports all saved prices for a given estimator to a downloadable file,
// and restores them from that file. Guards against browser-storage wipes.
// `prefix` matches the localStorage key prefix each estimator uses.

function backupPrices(prefix, tradeName) {
  var data = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf(prefix) === 0) {
      data[key] = localStorage.getItem(key);
    }
  }
  var payload = {
    _app: 'ContractorAI',
    _type: 'price-backup',
    _trade: tradeName || prefix,
    _date: new Date().toISOString(),
    prices: data
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  var stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = 'ContractorAI_' + (tradeName || 'prices').replace(/\s+/g, '_') + '_prices_' + stamp + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return Object.keys(data).length;
}

function restorePrices(file, prefix, onDone) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var payload = JSON.parse(e.target.result);
      if (!payload.prices) throw new Error('Not a valid price backup file');
      var count = 0;
      Object.keys(payload.prices).forEach(function (key) {
        if (key.indexOf(prefix) === 0) {
          localStorage.setItem(key, payload.prices[key]);
          count++;
        }
      });
      onDone(null, count, payload._trade || '');
    } catch (err) {
      onDone(err);
    }
  };
  reader.onerror = function () { onDone(new Error('Could not read file')); };
  reader.readAsText(file);
}
