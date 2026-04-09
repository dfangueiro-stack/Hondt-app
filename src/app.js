const MAX_PARTIES = 20;
const MAX_SEATS = 300;

const state = {
  partyCount: 5,
  seatCount: 10,
  lastResult: null,
};

const setupForm = document.querySelector("#setup-form");
const votesForm = document.querySelector("#votes-form");
const partyFields = document.querySelector("#party-fields");
const scenarioSummary = document.querySelector("#scenario-summary");
const totalVotes = document.querySelector("#total-votes");
const emptyState = document.querySelector("#empty-state");
const resultsContent = document.querySelector("#results-content");
const seatSummary = document.querySelector("#seat-summary");
const summaryBody = document.querySelector("#summary-body");
const allocationBody = document.querySelector("#allocation-body");
const quotientTable = document.querySelector("#quotient-table");
const quotientMeta = document.querySelector("#quotient-meta");
const fillDemoButton = document.querySelector("#fill-demo");
const exportPdfButton = document.querySelector("#export-pdf");

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("pt-PT", options).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScenarioSummary() {
  scenarioSummary.textContent = `${state.partyCount} listas · ${state.seatCount} mandatos`;
}

function buildPartyFields() {
  const cards = [];

  for (let index = 0; index < state.partyCount; index += 1) {
    cards.push(`
      <article class="party-card">
        <div class="party-card-header">
          <div>
            <strong>Lista ${index + 1}</strong>
            <p>Nome e votos validos</p>
          </div>
          <span class="party-index">${index + 1}</span>
        </div>

        <label>
          <span>Nome da lista</span>
          <input
            type="text"
            name="partyName-${index}"
            value="Partido ${index + 1}"
            maxlength="60"
            required
          >
        </label>

        <label>
          <span>Votos</span>
          <input
            type="number"
            name="partyVotes-${index}"
            min="0"
            step="1"
            value="0"
            required
          >
        </label>
      </article>
    `);
  }

  partyFields.innerHTML = cards.join("");
}

function collectParties() {
  const formData = new FormData(votesForm);
  const parties = [];

  for (let index = 0; index < state.partyCount; index += 1) {
    const name = String(formData.get(`partyName-${index}`) ?? "").trim() || `Partido ${index + 1}`;
    const votes = Math.max(0, Number(formData.get(`partyVotes-${index}`) ?? 0));
    parties.push({ id: index + 1, name, votes, seats: 0 });
  }

  return parties;
}

function calculateDHondt(parties, seatCount) {
  const quotients = [];

  parties.forEach((party) => {
    for (let divisor = 1; divisor <= seatCount; divisor += 1) {
      quotients.push({
        partyId: party.id,
        partyName: party.name,
        votes: party.votes,
        divisor,
        quotient: party.votes / divisor,
      });
    }
  });

  quotients.sort((left, right) => {
    if (right.quotient !== left.quotient) {
      return right.quotient - left.quotient;
    }

    if (right.votes !== left.votes) {
      return right.votes - left.votes;
    }

    return left.partyName.localeCompare(right.partyName, "pt");
  });

  const selected = quotients.slice(0, seatCount).map((entry, index) => ({
    ...entry,
    mandateNumber: index + 1,
  }));

  const seatMap = new Map(parties.map((party) => [party.id, 0]));
  selected.forEach((entry) => {
    seatMap.set(entry.partyId, (seatMap.get(entry.partyId) ?? 0) + 1);
  });

  const rankedParties = parties
    .map((party) => ({
      ...party,
      seats: seatMap.get(party.id) ?? 0,
    }))
    .sort((left, right) => {
      if (right.seats !== left.seats) {
        return right.seats - left.seats;
      }

      if (right.votes !== left.votes) {
        return right.votes - left.votes;
      }

      return left.name.localeCompare(right.name, "pt");
    });

  return { rankedParties, selected };
}

function renderSeatSummary(parties) {
  seatSummary.innerHTML = parties
    .map((party) => `
      <div class="seat-chip">
        <strong>${escapeHtml(party.name)}</strong>
        <span>${party.seats} mandato(s)</span>
      </div>
    `)
    .join("");
}

function renderSummaryTable(parties) {
  summaryBody.innerHTML = parties
    .map((party) => `
      <tr>
        <td>${escapeHtml(party.name)}</td>
        <td>${formatNumber(party.votes)}</td>
        <td><span class="seat-count-pill">${party.seats}</span></td>
      </tr>
    `)
    .join("");
}

function renderAllocationTable(selected) {
  allocationBody.innerHTML = selected
    .map((entry) => `
      <tr>
        <td>${entry.mandateNumber}</td>
        <td>${escapeHtml(entry.partyName)}</td>
        <td>${entry.divisor}</td>
        <td>${formatNumber(entry.quotient, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
      </tr>
    `)
    .join("");
}

function renderQuotientTable(parties, seatCount) {
  const headerCells = Array.from(
    { length: seatCount },
    (_, index) => `<th scope="col">/${index + 1}</th>`,
  ).join("");

  const rows = parties.map((party) => {
    const cells = Array.from({ length: seatCount }, (_, index) => {
      const quotient = party.votes / (index + 1);
      return `<td>${formatNumber(quotient, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>`;
    }).join("");

    return `
      <tr>
        <th scope="row">${escapeHtml(party.name)}</th>
        ${cells}
      </tr>
    `;
  }).join("");

  quotientTable.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Lista</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;

  quotientMeta.textContent = `${seatCount} colunas`;
}

function renderResults(parties, selected) {
  const total = parties.reduce((sum, party) => sum + party.votes, 0);

  state.lastResult = {
    parties,
    selected,
    totalVotes: total,
    generatedAt: new Date(),
  };

  totalVotes.textContent = `${formatNumber(total)} votos totais`;
  emptyState.classList.add("hidden");
  resultsContent.classList.remove("hidden");
  exportPdfButton.classList.remove("hidden");

  renderSeatSummary(parties);
  renderSummaryTable(parties);
  renderAllocationTable(selected);
  renderQuotientTable(parties, state.seatCount);
}

function populateDemoData() {
  const demoVotes = [
    154320, 120450, 80550, 46220, 19880,
    11240, 8340, 6200, 4800, 3200,
    2400, 1500, 900, 600, 450,
    320, 240, 180, 120, 90,
  ];

  for (let index = 0; index < state.partyCount; index += 1) {
    const nameInput = votesForm.elements.namedItem(`partyName-${index}`);
    const voteInput = votesForm.elements.namedItem(`partyVotes-${index}`);

    if (!(nameInput instanceof HTMLInputElement) || !(voteInput instanceof HTMLInputElement)) {
      continue;
    }

    nameInput.value = `Lista ${String.fromCharCode(65 + (index % 26))}${index >= 26 ? index + 1 : ""}`;
    voteInput.value = String(demoVotes[index] ?? 0);
  }
}

function buildPdfDocument() {
  if (!state.lastResult) {
    return "";
  }

  const { parties, selected, totalVotes: sumVotes } = state.lastResult;
  const scenario = `${state.partyCount} listas · ${state.seatCount} mandatos`;
  const generatedLabel = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(state.lastResult.generatedAt);

  const summaryRows = parties.map((party) => `
    <tr>
      <td>${escapeHtml(party.name)}</td>
      <td>${formatNumber(party.votes)}</td>
      <td>${party.seats}</td>
    </tr>
  `).join("");

  const allocationRows = selected.map((entry) => `
    <tr>
      <td>${entry.mandateNumber}</td>
      <td>${escapeHtml(entry.partyName)}</td>
      <td>${entry.divisor}</td>
      <td>${formatNumber(entry.quotient, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resumo de Hondt</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 18px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 6px 0 0; color: #4b5563; }
        .kicker { margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #f97316; }
        .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; min-width: 220px; }
        .metric { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; }
        .metric strong { display: block; font-size: 22px; }
        .metric span { color: #6b7280; font-size: 14px; }
        .block { margin-top: 24px; break-inside: avoid; }
        .block h2 { margin: 0 0 12px; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #d1d5db; padding: 9px 10px; text-align: left; }
        th { background: #f3f4f6; }
        @page { size: A4 portrait; margin: 16mm; }
      </style>
    </head>
    <body>
      <header class="header">
        <div>
          <p class="kicker">Resumo oficial</p>
          <h1>Metodo de Hondt</h1>
          <p>${scenario}</p>
          <p>Gerado em ${generatedLabel}</p>
        </div>
        <div class="metrics">
          <div class="metric">
            <strong>${formatNumber(sumVotes)}</strong>
            <span>Votos totais</span>
          </div>
          <div class="metric">
            <strong>${formatNumber(state.seatCount)}</strong>
            <span>Mandatos</span>
          </div>
        </div>
      </header>

      <section class="block">
        <h2>Distribuicao final</h2>
        <table>
          <thead>
            <tr>
              <th>Lista</th>
              <th>Votos</th>
              <th>Mandatos</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </section>

      <section class="block">
        <h2>Historico de atribuicao</h2>
        <table>
          <thead>
            <tr>
              <th>Mandato</th>
              <th>Lista</th>
              <th>Divisor</th>
              <th>Quociente</th>
            </tr>
          </thead>
          <tbody>${allocationRows}</tbody>
        </table>
      </section>
    </body>
    </html>
  `;
}

function exportPdfSummary() {
  if (!state.lastResult) {
    return;
  }

  const existingFrame = document.querySelector("#print-frame");
  if (existingFrame instanceof HTMLIFrameElement) {
    existingFrame.remove();
  }

  const printFrame = document.createElement("iframe");
  printFrame.id = "print-frame";
  printFrame.title = "Exportacao PDF";
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.style.position = "fixed";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  document.body.appendChild(printFrame);

  const frameDocument = printFrame.contentWindow?.document;
  if (!frameDocument || !printFrame.contentWindow) {
    printFrame.remove();
    window.alert("Nao foi possivel preparar a exportacao em PDF neste browser.");
    return;
  }

  const triggerPrint = () => {
    const frameWindow = printFrame.contentWindow;
    if (!frameWindow) {
      printFrame.remove();
      return;
    }

    frameWindow.focus();
    frameWindow.print();

    window.setTimeout(() => {
      printFrame.remove();
    }, 1000);
  };

  printFrame.addEventListener("load", triggerPrint, { once: true });

  frameDocument.open();
  frameDocument.write(buildPdfDocument());
  frameDocument.close();
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(setupForm);
  const partyCount = Number(formData.get("partyCount"));
  const seatCount = Number(formData.get("seatCount"));

  state.partyCount = clamp(partyCount, 2, MAX_PARTIES);
  state.seatCount = clamp(seatCount, 1, MAX_SEATS);

  const partyCountInput = document.querySelector("#party-count");
  const seatCountInput = document.querySelector("#seat-count");

  if (partyCountInput instanceof HTMLInputElement) {
    partyCountInput.value = String(state.partyCount);
  }

  if (seatCountInput instanceof HTMLInputElement) {
    seatCountInput.value = String(state.seatCount);
  }

  state.lastResult = null;
  totalVotes.textContent = "0 votos totais";
  quotientTable.innerHTML = "";
  quotientMeta.textContent = "0 colunas";
  exportPdfButton.classList.add("hidden");
  resultsContent.classList.add("hidden");
  emptyState.classList.remove("hidden");

  updateScenarioSummary();
  buildPartyFields();
});

votesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const parties = collectParties();
  const { rankedParties, selected } = calculateDHondt(parties, state.seatCount);
  renderResults(rankedParties, selected);
});

fillDemoButton.addEventListener("click", () => {
  populateDemoData();
});

exportPdfButton.addEventListener("click", () => {
  exportPdfSummary();
});

updateScenarioSummary();
buildPartyFields();
