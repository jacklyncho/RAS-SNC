const radios = document.querySelectorAll('input[type="radio"]');
const deltas = document.querySelectorAll('.delta');

radios.forEach(r => r.addEventListener('change', update));

function getValue(name) {
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

    d.textContent = p - c; // CHANGE DIRECTION FIXED
  });

  document.getElementById('totalProposed').textContent = proposedTotal;
  document.getElementById('totalCompleted').textContent = completedTotal;
  document.getElementById('totalChange').textContent =
    proposedTotal - completedTotal;
}
