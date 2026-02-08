const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
const deltas = document.querySelectorAll('.delta');
const exportBtn = document.getElementById('exportBtn');

inputs.forEach(i => i.addEventListener('change', update));
exportBtn.addEventListener('click', exportToExcel);

/* ---------- CORE SCORING ---------- */

function sumChecked(name) {
  const checked = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`));

  const none = checked.find(el => el.dataset.none === "true");
  if (none) {
    Array.from(document.querySelectorAll(`input[name="${name}"]`)).forEach(el => {
      if (el !== none) el.checked = false;
    });
    return 0;
  }

  const noneBox = document.querySelector(`input[name="${name}"][data-none="true"]`);
  if (noneBox) noneBox.checked = false;

  return checked.reduce((acc, el) => acc + Number(el.value || 0), 0);
}

function getValue(name) {
  const anyCheckbox = document.querySelector(`input[name="${name}"][type="checkbox"]`);
  if (anyCheckbox) return sumChecked(name);

  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? Number(selected.value) : 0;
}

function getLabel(name) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  const checkboxes = document.querySelectorAll(`input[name="${name}"][type="checkbox"]`);

  if (checkboxes.length) {
    const checked = Array.from(checkboxes).filter(c => c.checked && !c.dataset.none);
    return checked.length
      ? checked.map(c => c.closest('tr').children[0].textContent).join(' + ')
      : 'Not required';
  }

  const selected = Array.from(radios).find(r => r.checked);
  return selected
    ? selected.closest('tr').children[0].textContent
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

    d.textContent = p - c;
  });

  document.getElementById('totalProposed').textContent = proposedTotal;
  document.getElementById('totalCompleted').textContent = completedTotal;
  document.getElementById('totalChange').textContent =
    proposedTotal - completedTotal;
}

/* ---------- EXCEL EXPORT ---------- */

function exportToExcel() {
  const rows = [];
  rows.push([
    'Section',
    'Category',
    'Proposed',
    'Completed',
    'Proposed Score',
    'Completed Score',
    'Change'
  ]);

  deltas.forEach(d => {
    const pName = d.dataset.p;
    const cName = d.dataset.c;

    const section = d.closest('tbody')
      .querySelector('tr.supersection:last-of-type td')?.textContent || '';

    const category = d.closest('tr').previousElementSibling
      ? d.closest('tr').previousElementSibling.children[0].textContent
      : '';

    const pVal = getValue(pName);
    const cVal = getValue(cName);

    rows.push([
      section,
      category,
      getLabel(pName),
      getLabel(cName),
      pVal,
      cVal,
      pVal - cVal
    ]);
  });

  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    document.getElementById('totalProposed').textContent,
    document.getElementById('totalCompleted').textContent,
    document.getElementById('totalChange').textContent
  ]);

  downloadExcel(rows);
}

function downloadExcel(data) {
  const worksheet = data.map(r => r.join('\t')).join('\n');
  const blob = new Blob([worksheet], {
    type: 'application/vnd.ms-excel'
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'RAS-SNC_Score.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
