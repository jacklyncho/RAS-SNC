const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
const deltas = document.querySelectorAll('.delta');
const exportBtn = document.getElementById('exportBtn');

inputs.forEach(i => i.addEventListener('change', update));
if (exportBtn) exportBtn.addEventListener('click', exportToXlsx);

/* ---------- CORE SCORING ---------- */

function sumChecked(name) {
  const boxes = Array.from(document.querySelectorAll(`input[name="${name}"][type="checkbox"]`));
  const checked = boxes.filter(b => b.checked);

  // "Not required (0)" logic
  const none = checked.find(el => el.dataset.none === "true");
  if (none) {
    boxes.forEach(el => { if (el !== none) el.checked = false; });
    return 0;
  }

  const noneBox = boxes.find(el => el.dataset.none === "true");
  if (noneBox) noneBox.checked = false;

  return checked.reduce((acc, el) => acc + Number(el.value || 0), 0);
}

function getValue(name) {
  const anyCheckbox = document.querySelector(`input[name="${name}"][type="checkbox"]`);
  if (anyCheckbox) return sumChecked(name);

  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? Number(selected.value) : 0;
}

function getSelectedText(name) {
  const anyCheckbox = document.querySelector(`input[name="${name}"][type="checkbox"]`);
  if (anyCheckbox) {
    const boxes = Array.from(document.querySelectorAll(`input[name="${name}"][type="checkbox"]`));
    const checked = boxes.filter(b => b.checked);

    // If none selected OR "none" selected
    if (checked.length === 0) return 'Not selected';
    if (checked.some(b => b.dataset.none === "true")) return 'Not required (0)';

    return checked
      .map(b => (b.closest('tr')?.children?.[0]?.textContent || '').trim())
      .filter(Boolean)
      .join(' + ');
  }

  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected
    ? (selected.closest('tr')?.children?.[0]?.textContent || 'Selected').trim()
    : 'Not selected';
}

function update() {
  let proposedTotal = 0;
  let completedTotal = 0;

  deltas.forEach(d => {
    const p = getValue(d.dataset.p);
    const c = getValue(d.dataset.c);

    proposedTotal += p;
    completedTotal += c;

    d.textContent = p - c; // Proposed − Completed
  });

  document.getElementById('totalProposed').textContent = proposedTotal;
  document.getElementById('totalCompleted').textContent = completedTotal;
  document.getElementById('totalChange').textContent = proposedTotal - completedTotal;
}

/* ---------- XLSX EXPORT (REAL EXCEL FILE) ---------- */

function exportToXlsx() {
  if (typeof XLSX === 'undefined') {
    alert('XLSX export library failed to load. Check the SheetJS <script> tag in index.html.');
    return;
  }

  // Build an array-of-arrays (AOA) = rows/columns
  const aoa = [];
  aoa.push([
    'Group Heading',
    'Section',
    'Proposed',
    'Completed',
    'Proposed Score',
    'Completed Score',
    'Change'
  ]);

  // We’ll walk through each delta cell and derive:
  // - closest heading rows above it
  // - section title (the section header just above this block)
  deltas.forEach(d => {
    const pName = d.dataset.p;
    const cName = d.dataset.c;

    const tr = d.closest('tr');

    // Find the nearest section header above this block
    // (the row with class "section" prior to current row)
    let section = '';
    let groupHeading = '';

    let cursor = tr.previousElementSibling;
    while (cursor) {
      if (!section && cursor.classList.contains('section')) {
        section = (cursor.textContent || '').trim();
      }
      if (!groupHeading && cursor.classList.contains('supersection')) {
        groupHeading = (cursor.textContent || '').trim();
        break; // once group heading found, we can stop
      }
      cursor = cursor.previousElementSibling;
    }

    // Category label = first column text of the row that contains the delta
    // Note: delta is in the first row of each section block (rowspan cell)
    const category = (tr.children[0]?.textContent || '').trim();

    const pVal = getValue(pName);
    const cVal = getValue(cName);

    aoa.push([
      groupHeading,
      section,
      getSelectedText(pName),
      getSelectedText(cName),
      pVal,
      cVal,
      pVal - cVal
    ]);
  });

  // Totals row
  aoa.push([]);
  aoa.push([
    'TOTAL',
    '',
    '',
    '',
    Number(document.getElementById('totalProposed').textContent || 0),
    Number(document.getElementById('totalCompleted').textContent || 0),
    Number(document.getElementById('totalChange').textContent || 0)
  ]);

  // Create workbook + worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Make it a little nicer: set column widths
  ws['!cols'] = [
    { wch: 22 }, // Group Heading
    { wch: 18 }, // Section
    { wch: 38 }, // Proposed
    { wch: 38 }, // Completed
    { wch: 14 }, // Proposed Score
    { wch: 15 }, // Completed Score
    { wch: 10 }  // Change
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RAS-SNC');

  // Timestamped filename
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');

  XLSX.writeFile(wb, `RAS-SNC_${stamp}.xlsx`);
}
