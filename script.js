const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
const deltas = document.querySelectorAll('.delta');

inputs.forEach(i => i.addEventListener('change', update));

function sumChecked(name) {
  const checked = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`));

  // If "Not required (0)" checkbox is checked, treat group as 0
  // (and uncheck all others for cleanliness)
  const none = checked.find(el => el.dataset.none === "true");
  if (none) {
    Array.from(document.querySelectorAll(`input[name="${name}"]`)).forEach(el => {
      if (el !== none) el.checked = false;
    });
    return 0;
  }

  // If any non-zero option is checked, ensure "Not required" is off
  const noneBox = document.querySelector(`input[name="${name}"][data-none="true"]`);
  if (noneBox) noneBox.checked = false;

  return checked.reduce((acc, el) => acc + Number(el.value || 0), 0);
}

function getValue(name) {
  // If this group contains checkboxes, sum them
  const anyCheckbox = document.querySelector(`input[name="${name}"][type="checkbox"]`);
  if (anyCheckbox) return sumChecked(name);

  // Otherwise treat as radio group
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? Number(selected.value) : 0;
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
