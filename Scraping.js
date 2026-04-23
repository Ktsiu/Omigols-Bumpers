// ============================================
// DISCORD BUMP SCRAPER - AUTO PAGINATOR + SAVE
// ============================================

const allBumps = [];

function extractCurrentPage() {
  const results = document.querySelectorAll('[id^="search-result-"]');
  let count = 0;

  results.forEach(el => {
    const userEl = el.querySelector('.repliedMessage_c19a55 .username_c19a55');
    const username = userEl ? userEl.getAttribute('data-text') || userEl.innerText.trim() : null;

    const timeEl = el.querySelector('time');
    const datetime = timeEl ? timeEl.getAttribute('datetime') : null;
    const displayTime = timeEl ? timeEl.innerText.trim() : null;

    const isBump = el.querySelector('.appLauncherOnboardingCommandName_c19a55');
    if (!isBump || !username) return;

    allBumps.push({ username, datetime, displayTime });
    count++;
  });

  return count;
}

function getCurrentPage() {
  const active = document.querySelector('.activeButton_c15210');
  return active ? parseInt(active.innerText.trim()) : 1;
}

function getLastPage() {
  const buttons = document.querySelectorAll('.roundButton_c15210');
  let max = 1;
  buttons.forEach(b => {
    const n = parseInt(b.innerText.trim());
    if (!isNaN(n) && n > max) max = n;
  });
  return max;
}

function clickNextPage() {
  const nextBtn = document.querySelector('button[rel="next"]:not([disabled])');
  if (nextBtn) { nextBtn.click(); return true; }
  return false;
}

// 💾 Salva JSON como arquivo no PC
function saveJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildOutput() {
  const countByUser = {};
  allBumps.forEach(b => {
    countByUser[b.username] = (countByUser[b.username] || 0) + 1;
  });

  const ranking = Object.entries(countByUser)
    .sort((a, b) => b[1] - a[1])
    .map(([username, total]) => ({ username, total }));

  return { totalBumps: allBumps.length, ranking, bumps: allBumps };
}

function printResults() {
  const output = buildOutput();
  console.log('%c✅ SCRAPING CONCLUÍDO!', 'color: lime; font-size: 16px; font-weight: bold;');
  console.log(JSON.stringify(output, null, 2));
  try { copy(JSON.stringify(output, null, 2)); } catch(e) {}
  saveJSON(output, 'bumps_final.json');
  console.log('%c💾 Arquivo bumps_final.json salvo!', 'color: cyan; font-weight: bold;');
  return output;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeAllPages() {
  const lastPage = getLastPage();
  console.log(`%c🚀 Iniciando scraping — ${lastPage} páginas encontradas`, 'color: orange; font-weight: bold;');

  while (true) {
    const currentPage = getCurrentPage();
    const found = extractCurrentPage();

    console.log(`%c📄 Página ${currentPage}/${lastPage} — ${found} bumps coletados (total: ${allBumps.length})`, 'color: yellow;');

    // 💾 Checkpoint: salva a cada 10 páginas automaticamente
    if (currentPage % 10 === 0) {
      const checkpoint = buildOutput();
      saveJSON(checkpoint, `bumps_checkpoint_pag${currentPage}.json`);
      console.log(`%c💾 Checkpoint salvo! (página ${currentPage})`, 'color: cyan;');
    }

    if (currentPage >= lastPage) break;

    const moved = clickNextPage();
    if (!moved) {
      console.log('%c⚠️ Não encontrou botão Next, salvando o que tem...', 'color: red;');
      break;
    }

    // Espera 3 segundos para carregar
    await sleep(3000);
  }

  // Salva arquivo final completo
  printResults();
}

// 🔥 INICIAR
scrapeAllPages();
