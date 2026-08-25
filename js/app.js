const state = {
  hexagrams: [],
  xici: null,
  view: "home",
  filter: "all",
  query: "",
  currentId: 1,
  tab: "plain",
  flashIndex: 0,
  flashRevealed: false,
};

const app = document.getElementById("app");
const searchInput = document.getElementById("searchInput");

async function loadData() {
  const [hex, xici] = await Promise.all([
    fetch("data/hexagrams.json").then((r) => r.json()),
    fetch("data/xici.json").then((r) => r.json()),
  ]);
  state.hexagrams = hex;
  state.xici = xici;
}

function setNavActive() {
  document.querySelectorAll(".nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === state.view || (state.view === "card" && btn.dataset.nav === "list"));
  });
}

function guaLinesHtml(lines) {
  // display top to bottom (上爻在上)
  const ordered = [...lines].reverse();
  return ordered
    .map((y) => `<span class="${y ? "yang" : "yin"}" title="${y ? "阳爻" : "阴爻"}"></span>`)
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filteredHexagrams() {
  let list = state.hexagrams;
  if (state.filter === "upper") list = list.filter((h) => h.section === "上经");
  if (state.filter === "lower") list = list.filter((h) => h.section === "下经");
  const q = state.query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((h) => {
    const blob = [
      h.name, h.alias, h.pinyin, h.keyword, h.oneLiner, h.guaci,
      h.plain.core, h.plain.recite, ...h.scholars.map((s) => s.name + s.view),
    ].join(" ").toLowerCase();
    return blob.includes(q) || String(h.id) === q;
  });
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <h1 class="hero-brand">周易</h1>
      <p>每一卦做成一张读书卡：原文可背，白话能懂，名家观点可比较。专为想把《周易》读进心里的中学生与初学者。</p>
      <div class="hero-actions">
        <button class="btn" type="button" data-go="list">打开六十四卦</button>
        <button class="btn ghost" type="button" data-go="card" data-id="1">从乾卦开始</button>
        <button class="btn ghost" type="button" data-go="xici">先读系辞精要</button>
      </div>
      <div class="hero-visual" aria-hidden="true">䷀ ䷁ ䷂ ䷃</div>
    </section>
  `;
  app.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const go = el.dataset.go;
      if (go === "card") openCard(Number(el.dataset.id || 1));
      else navigate(go);
    });
  });
}

function renderList() {
  const list = filteredHexagrams();
  app.innerHTML = `
    <h2 class="section-title">六十四卦</h2>
    <p class="section-lead">上经三十卦讲天地开辟与修身根基；下经三十四卦讲人伦日用与始终循环。点进任一卦，即是一张完整读书卡。</p>
    <div class="filter-row">
      <button class="chip ${state.filter === "all" ? "active" : ""}" data-filter="all">全部</button>
      <button class="chip ${state.filter === "upper" ? "active" : ""}" data-filter="upper">上经</button>
      <button class="chip ${state.filter === "lower" ? "active" : ""}" data-filter="lower">下经</button>
    </div>
    <div class="grid">
      ${list.map((h, i) => `
        <button class="hex-tile" type="button" data-id="${h.id}" style="animation-delay:${Math.min(i, 20) * 0.02}s">
          <span class="id">第${h.id}卦 · ${h.section}</span>
          <span class="sym">${h.symbol}</span>
          <span class="nm">${escapeHtml(h.name)}</span>
          <span class="kw">${escapeHtml(h.keyword)}</span>
        </button>
      `).join("") || `<div class="empty">没有匹配的卦，试试别的关键词。</div>`}
    </div>
  `;
  app.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      render();
    });
  });
  app.querySelectorAll(".hex-tile").forEach((btn) => {
    btn.addEventListener("click", () => openCard(Number(btn.dataset.id)));
  });
}

function openCard(id) {
  state.currentId = id;
  state.view = "card";
  state.tab = "plain";
  state.flashIndex = 0;
  state.flashRevealed = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCard() {
  const h = state.hexagrams.find((x) => x.id === state.currentId);
  if (!h) {
    app.innerHTML = `<div class="empty">未找到该卦</div>`;
    return;
  }
  const prev = h.id > 1 ? h.id - 1 : 64;
  const next = h.id < 64 ? h.id + 1 : 1;
  const tabs = [
    ["plain", "通俗讲解"],
    ["classic", "原文彖象"],
    ["yao", "爻辞导读"],
    ["scholars", "名家对比"],
    ["flash", "背诵卡"],
  ];

  app.innerHTML = `
    <div class="card-shell">
      <div class="card-nav">
        <button class="btn ghost" type="button" data-go="list">← 卦目录</button>
        <div class="pager">
          <button class="btn ghost" type="button" data-id="${prev}">上一卦</button>
          <button class="btn ghost" type="button" data-id="${next}">下一卦</button>
        </div>
      </div>
      <article class="reading-card">
        <div class="card-top">
          <div class="gua-figure" aria-label="卦画">${guaLinesHtml(h.lines)}</div>
          <div class="card-head">
            <h1>${h.symbol} ${escapeHtml(h.name)}</h1>
            <p class="meta">第${h.id}卦 · ${escapeHtml(h.alias)} · ${escapeHtml(h.pinyin)} · ${h.lowerSymbol}${escapeHtml(h.lower)}下 ${h.upperSymbol}${escapeHtml(h.upper)}上 · ${h.section}</p>
            <div class="keyword">${escapeHtml(h.keyword)}</div>
            <p class="one-liner">${escapeHtml(h.oneLiner)}</p>
          </div>
        </div>

        <div class="tabs">
          ${tabs.map(([id, label]) => `<button type="button" data-tab="${id}" class="${state.tab === id ? "active" : ""}">${label}</button>`).join("")}
        </div>

        <div class="panel ${state.tab === "plain" ? "active" : ""}" data-panel="plain">
          <div class="block">
            <h3>卦象场景</h3>
            <p class="rich">${escapeHtml(h.plain.scene || "")}</p>
          </div>
          <div class="block">
            <h3>核心深讲</h3>
            <p class="rich">${escapeHtml(h.plain.core)}</p>
          </div>
          <div class="block">
            <h3>卦辞白话</h3>
            <div class="classic">${escapeHtml(h.guaci)}</div>
            <p class="rich">${escapeHtml(h.plain.guaciPlain || "")}</p>
          </div>
          <div class="block">
            <h3>生活故事</h3>
            <p class="rich">${escapeHtml(h.plain.story || h.plain.analogy || "")}</p>
          </div>
          <div class="block">
            <h3>深刻启发</h3>
            <p class="rich">${escapeHtml(h.plain.wisdom || "")}</p>
          </div>
          <div class="block">
            <h3>今日可做</h3>
            <p class="rich practice">${escapeHtml(h.plain.practice || h.plain.life || "")}</p>
          </div>
          <div class="recite-box">
            <strong>背诵提纲</strong>
            <div>${escapeHtml(h.plain.recite)}</div>
          </div>
        </div>

        <div class="panel ${state.tab === "classic" ? "active" : ""}" data-panel="classic">
          <div class="block">
            <h3>卦辞</h3>
            <div class="classic">${escapeHtml(h.guaci)}</div>
          </div>
          <div class="block">
            <h3>彖传</h3>
            <div class="classic">${escapeHtml(h.tuan)}</div>
            <p style="color:var(--ink-soft);font-size:.92rem;margin:.5rem 0 0;">彖传说「为什么这样判断」——把卦德、时位、吉凶理由讲清楚。</p>
          </div>
          <div class="block">
            <h3>大象传</h3>
            <div class="classic">${escapeHtml(h.daxiang)}</div>
            <p style="color:var(--ink-soft);font-size:.92rem;margin:.5rem 0 0;">大象传告诉君子「看见这个象，该怎么做」——最适合做成座右铭。</p>
          </div>
          <p style="color:var(--ink-soft);font-size:.9rem;">说明：每卦的「传」主要是《彖》《象》；《系辞》是总论全书的文章，见「系辞精要」。乾坤另有《文言》，精神已融入通俗讲解。</p>
        </div>

        <div class="panel ${state.tab === "yao" ? "active" : ""}" data-panel="yao">
          <p class="yao-lead">从下往上看，像一部六幕短剧。每一爻先懂原文，再看时位，最后落到「怎么做 / 警惕什么」。</p>
          <div class="yao-list">
            ${h.yaoci.map((y, idx) => `
              <div class="yao-item rich-yao">
                <div class="yao-head">
                  <span class="pos">${escapeHtml(y.pos)}</span>
                  <span class="yao-ord">第${idx + 1}爻</span>
                </div>
                <div class="classic yao-text">${escapeHtml(y.text)}</div>
                <div class="yao-grid">
                  <div><h4>白话拆解</h4><p>${escapeHtml(y.decode || y.tip || "")}</p></div>
                  <div><h4>时位含义</h4><p>${escapeHtml(y.why || "")}</p></div>
                  <div><h4>此时怎么做</h4><p>${escapeHtml(y.do || "")}</p></div>
                  <div><h4>要警惕什么</h4><p>${escapeHtml(y.avoid || "")}</p></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="panel ${state.tab === "scholars" ? "active" : ""}" data-panel="scholars">
          <p style="margin-top:0;color:var(--ink-soft);">下列为各派代表性读法的导读摘要（非原文逐字照录），方便对照思考。</p>
          <div class="scholar-grid">
            ${h.scholars.map((s) => `
              <div class="scholar">
                <div class="who">${escapeHtml(s.name)}</div>
                <div>${escapeHtml(s.view)}</div>
              </div>
            `).join("")}
          </div>
          <div class="contrast">
            <strong>对比小结</strong>
            <p style="margin:.4rem 0 0;">${escapeHtml(h.contrast)}</p>
          </div>
        </div>

        <div class="panel ${state.tab === "flash" ? "active" : ""}" data-panel="flash">
          ${renderFlashInner(h)}
        </div>
      </article>
    </div>
  `;

  app.querySelector('[data-go="list"]').addEventListener("click", () => navigate("list"));
  app.querySelectorAll(".pager [data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openCard(Number(btn.dataset.id)));
  });
  app.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      state.flashRevealed = false;
      renderCard();
    });
  });
  bindFlash(h);
}

function flashItems(h) {
  return [
    { front: `${h.name} · 关键词`, back: h.keyword },
    { front: `${h.name} · 卦辞`, back: h.guaci },
    { front: `${h.name} · 大象`, back: h.daxiang },
    { front: `${h.name} · 核心深讲`, back: h.plain.core },
    { front: `${h.name} · 背诵提纲`, back: h.plain.recite },
    ...h.yaoci.slice(0, 6).map((y) => ({
      front: `${h.name} · ${y.pos} · ${y.text}`,
      back: `${y.decode || y.tip || ""}\n怎么做：${y.do || ""}\n警惕：${y.avoid || ""}`,
    })),
  ];
}

function renderFlashInner(h) {
  const items = flashItems(h);
  const i = ((state.flashIndex % items.length) + items.length) % items.length;
  const item = items[i];
  return `
    <div class="flash-controls">
      <button class="btn ghost" type="button" data-flash="prev">上一张</button>
      <button class="btn ghost" type="button" data-flash="next">下一张</button>
      <button class="btn" type="button" data-flash="toggle">${state.flashRevealed ? "隐藏答案" : "显示答案"}</button>
      <span style="color:var(--ink-soft);align-self:center;">${i + 1} / ${items.length}</span>
    </div>
    <div class="flash-face" data-flash="toggle" role="button" tabindex="0">
      <div>
        <div class="big">${escapeHtml(state.flashRevealed ? item.back : item.front)}</div>
        <div class="small">${state.flashRevealed ? "点击继续背下一张，或按「隐藏答案」" : "先回想，再点击翻面"}</div>
      </div>
    </div>
  `;
}

function bindFlash(h) {
  const items = flashItems(h);
  app.querySelectorAll("[data-flash]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.flash;
      if (act === "prev") {
        state.flashIndex = (state.flashIndex - 1 + items.length) % items.length;
        state.flashRevealed = false;
      } else if (act === "next") {
        state.flashIndex = (state.flashIndex + 1) % items.length;
        state.flashRevealed = false;
      } else if (act === "toggle") {
        state.flashRevealed = !state.flashRevealed;
      }
      renderCard();
    });
  });
}

function renderXici() {
  const x = state.xici;
  app.innerHTML = `
    <h2 class="section-title">${escapeHtml(x.title)}</h2>
    <p class="section-lead">${escapeHtml(x.note)}</p>
    <div class="xici-grid">
      ${x.cards.map((c, i) => `
        <article class="xici-card" style="animation-delay:${i * 0.03}s">
          <h3>${escapeHtml(c.title)}</h3>
          <div class="classic">${escapeHtml(c.classic)}</div>
          <p>${escapeHtml(c.plain)}</p>
          <div class="recite-box"><strong>背一句</strong>${escapeHtml(c.recite)}</div>
        </article>
      `).join("")}
    </div>
    <div class="contrast" style="margin-top:1.5rem;">
      <strong>名家如何看《系辞》</strong>
      <p style="margin:.4rem 0 0;">${escapeHtml(x.scholarNote)}</p>
    </div>
  `;
}

function renderMethod() {
  app.innerHTML = `
    <section class="method">
      <h2 class="section-title">怎么用这套读书卡</h2>
      <p class="section-lead">目标不是算命，而是学会用「象—辞—时位」理解变化，并把句子真正背进心里。</p>
      <ol>
        <li><strong>先看卦画与关键词</strong>：上下经卦象是谁，一句话主题是什么。</li>
        <li><strong>读卦辞 + 大象</strong>：大象几乎都能当座右铭（如「自强不息」「厚德载物」）。</li>
        <li><strong>用「通俗讲解」把文言变成故事</strong>：核心、比方、落到自己。</li>
        <li><strong>扫一遍爻辞导读</strong>：从下往上，像看一部六幕短剧。</li>
        <li><strong>对照名家</strong>：不必站队，看出「同一卦可以有义理 / 考证 / 人生」多层读法。</li>
        <li><strong>打开背诵卡</strong>：遮住答案，先背关键词、大象、提纲，再背卦爻辞。</li>
      </ol>
      <div class="recite-box">
        <strong>建议节奏</strong>
        每天 1 卦：上午读原文与讲解，晚上只用背诵卡自测 5 分钟。一周复习上经/下经各一次。
      </div>
      <div class="hero-actions">
        <button class="btn" type="button" data-go="list">开始选卦</button>
        <button class="btn ghost" type="button" data-go="card" data-id="1">从乾卦背起</button>
      </div>
    </section>
  `;
  app.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.go === "card") openCard(Number(el.dataset.id || 1));
      else navigate(el.dataset.go);
    });
  });
}

function navigate(view) {
  state.view = view;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  setNavActive();
  if (state.view === "home") renderHome();
  else if (state.view === "list") renderList();
  else if (state.view === "card") renderCard();
  else if (state.view === "xici") renderXici();
  else if (state.view === "method") renderMethod();
}

function bindChrome() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });
  let t = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.query = searchInput.value;
      if (state.view !== "list" && state.query) state.view = "list";
      render();
    }, 150);
  });
}

async function main() {
  await loadData();
  bindChrome();
  render();
}

main().catch((err) => {
  app.innerHTML = `<div class="empty">加载失败：${escapeHtml(err.message)}。请用本地静态服务器打开本目录。</div>`;
  console.error(err);
});
