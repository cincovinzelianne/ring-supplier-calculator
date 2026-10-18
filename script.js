const $ = id => document.getElementById(id);
const themeToggle = $("themeToggle");
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light" || savedTheme === "dark") {
  document.documentElement.dataset.theme = savedTheme;
}
const updateThemeToggle = () => {
  const isDark = document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && systemTheme.matches);
  themeToggle.textContent = `Switch to ${isDark ? "light" : "dark"} mode`;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#141a17" : "#f5f4ef";
};
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && systemTheme.matches);
  const theme = isDark ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  updateThemeToggle();
});
systemTheme.addEventListener("change", () => {
  if (!document.documentElement.dataset.theme) updateThemeToggle();
});
updateThemeToggle();
const fm = n => "₱" + Math.round(n).toLocaleString();
const fm2 = n => "₱" + n.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
const P = a => ({s: a[0], 8: a[1], 10: a[2], 12: a[3], 14: a[4], 18: a[5]});
const CATS = [["pet","Ladies Petite"],["lst","Ladies Standard"],["uni","Unisex"],["mst","Men’s Standard"],["mpr","Men’s Premium"]];
const SILVER_STD = "uni"; // silver ring is standardized to Unisex

const D = {
  suarez: {name:"Suarez Brothers", spot:{g:200,s:0}, don:()=>[+$("sg").value||0, +$("ss").value||0], off:false,
    p:{pet:P([2995,null,28225,37625,49310,73850]),lst:P([3210,null,31580,41650,54945,83510]),uni:P([3600,null,38350,51310,66220,95345]),mst:P([5985,null,63635,78760,100790,150045]),mpr:P([6940,null,91935,114100,142310,206675])}},
  rj: {name:"R&J Jewelry", spot:{g:0,s:0}, don:()=>[+$("rg").value||0, +$("rs").value||0], off:false,
    p:{pet:P([2700,17158,22976,28491,34210,48698]),lst:P([3000,19237,24228,34158,40943,53126]),uni:P([3500,23500,29557,42009,48403,57553]),mst:P([4000,31351,37550,48403,55864,70834]),mpr:P([4500,36289,45544,57995,70785,88543])}},
  rnp: {name:"RNP Jewelry", spot:{g:300,s:100}, don:()=>[500,200], off:true,
    p:{pet:P([2250,16750,22450,27950,33650,47650]),lst:P([2450,18650,24150,33650,40450,52150]),uni:P([2950,22950,28950,41450,47850,56450]),mst:P([3450,30800,36950,47850,55250,69750]),mpr:P([3950,35750,44950,57450,70150,87450])}}
};

CATS.forEach(([v,t]) => $("gtype").add(new Option(t, v)));
$("gtype").value = "uni";

let latestResults = [];

function calc() {
  const G = +$("gold").value || 0, S = +$("silver").value || 0, K = $("karat").value;
  const np = +$("np").value || 0, nw = +$("nw").value || 0, nm = +$("nm").value || 0;
  const out = Object.entries(D).map(([id, d]) => {
    const gp = d.p[$("gtype").value][K], sp = d.p[SILVER_STD].s;
    if (gp == null && G > 0) return {d, na: true};
    const goldTotal = gp == null ? 0 : G * gp, silverTotal = S * sp;
    const gross = goldTotal + silverTotal;
    const disc = G * d.spot.g + S * d.spot.s;
    const [dg, ds] = d.don(), don = G * dg + S * ds;
    const off = d.off ? np * d.p.mpr.s + nw * d.p.pet.s + nm * d.p.mst.s : 0;
    const ben = disc + don + off;
    return {d, gp, sp, goldTotal, silverTotal, gross, disc, don, off, ben, net: gross - ben};
  });
  latestResults = out;
  const ok = out.filter(o => !o.na).sort((a, b) => a.net - b.net);
  const best = ok[0], worst = ok[ok.length - 1];
  const maxB = Math.max(...ok.map(o => o.ben), 1);

  $("res").innerHTML = out.map(o => o.na
    ? `<article class="card sc"><div class="supplier-heading"><h3>${o.d.name}</h3></div><p class="note">Walay ${K}K option.</p></article>`
    : `<article class="card sc ${o === best ? "best" : ""}" ${o === best ? 'aria-label="' + o.d.name + ', lowest estimated net cost"' : ""}>
    <div class="supplier-heading"><h3>${o.d.name}</h3>${o === best ? '<span class="badge">Pinaka Lamang</span>' : ""}</div>
    <div class="cost-label">Estimated net cost</div><div class="big">${fm(o.net)}</div>
    <div class="row calc"><span>Gold ring / student</span>
      <span class="eq">${o.gp == null ? "N/A" : fm2(o.gp)} × ${G} students availed = <b>${fm2(o.goldTotal)}</b></span></div>
    <div class="row calc"><span>Silver ring / student (Unisex)</span>
      <span class="eq">${fm2(o.sp)} × ${S} students availed = <b>${fm2(o.silverTotal)}</b></span></div>
    <div class="row total-row"><span><b>Gross total</b></span><b>${fm2(o.gross)}</b></div>
    <div class="row"><span>Spot cash discount</span><b class="pos">−${fm(o.disc)}</b></div>
    <div class="row"><span>Donation sa BSC</span><b class="pos">−${fm(o.don)}</b></div>
    <div class="row"><span>Libre nga officer rings</span><b class="pos">−${fm(o.off)}</b></div>
    <div class="row total-row"><span><b>Total benefits</b></span><b class="pos">${fm(o.ben)}</b></div>
    <div class="bar" role="img" aria-label="${o.d.name}: ${Math.round(o.ben / maxB * 100)}% of the highest total benefits"><i style="width:${o.ben / maxB * 100}%"></i></div></article>`).join("");

  $("msg").textContent = ok.length > 1
    ? `${best.d.name} ang pinaka-barato: mas ubos og ${fm(worst.net - best.net)} kumpara sa ${worst.d.name}. Ang officer perks (libre nga silver rings) naa lang sa RNP sa mga sheets nga gihatag.`
    : "";
}

let tab = "g";
[["g","Gold (gipili nga karat)"],["s","Silver"]].forEach(([v, t]) => {
  const b = document.createElement("button");
  b.textContent = t; b.dataset.v = v;
  b.setAttribute("aria-pressed", String(v === tab));
  b.onclick = () => { tab = v; drawT(); };
  $("tabs").append(b);
});
$("tabs").setAttribute("role", "group");

function drawT() {
  [...$("tabs").children].forEach(b => {
    const selected = b.dataset.v === tab;
    b.classList.toggle("on", selected);
    b.setAttribute("aria-pressed", String(selected));
  });
  const key = tab == "g" ? $("karat").value : "s";
  $("pt").innerHTML = `<thead><tr><th scope="col">Ring type</th>${Object.values(D).map(d => `<th scope="col">${d.name}</th>`).join("")}</tr></thead><tbody>` +
    CATS.map(([c, t]) => {
      const v = Object.values(D).map(d => d.p[c][key]);
      const m = Math.min(...v.filter(x => x != null));
      return `<tr><th scope="row">${t}</th>${v.map(x => `<td class="${x === m ? "best-price" : ""}">${x == null ? "N/A" : fm(x)}</td>`).join("")}</tr>`;
    }).join("") + "</tbody>";
}

const Y = '<span class="y">✓</span>', N = '<span class="n">✗</span>', U = '<span class="u">?</span>';
const rows = [
  ["Spot cash discount","Gold ₱200",N,"Gold ₱300 / Silver ₱100"],
  ["Donation sa BSC / org",U,U,"₱500 gold / ₱200 silver (cashback 1 week before Ring Hop)"],
  ["Libre nga silver rings sa officers",U,U,Y+" Presidents=Premium, Women=Petite, Men=Standard + Tiffany/UTag"],
  ["Lifetime warranty",N+" (repair sa deformed lang)",Y,Y+" (card; repair, cleaning, oxidation)"],
  ["Free engraving",Y,Y,Y],
  ["Big ring para sa Ring Hop",Y,U,Y+" (free delivery)"],
  ["No quota",N+" (quota: 60 students)",U,Y],
  ["Free ring service (loaner rings)",U,U,Y+" (return all; BSC liable sa damage)"],
  ["Free delivery sa school",Y,Y,Y],
  ["Freebies (gold)","Crystal box, silver necklace, keychain","U-tag + name pendant, jewelry box","Tiffany ring, UTag, jewelry box"],
  ["Freebies (silver)","Ring pouch, dog tag","U-tag, pouch","Tiffany ring, UTag, crystal case"],
  ["Libre kung mupalit og gold + silver",U,U,Y+" 1 Tiffany ring + box/dog tag"],
  ["Birthstone / school logo choice",Y,Y,Y],
  ["Pawn / appraisal",Y+" (10K minimum lang)",U,Y+" (all karats)"],
  ["No storage fee",U,U,Y],
  ["Down payment (gold / silver)","₱2,000 / ₱1,000","₱1,500 / ₱1,000","50% / ₱1,000"],
  ["Delivery (gold / silver)","30–45 days","45–60 / 30–45 days","45–60 / 30–45 days"]
];
$("bm").innerHTML = `<thead><tr><th scope="col">Benefit</th>${Object.values(D).map(d => `<th scope="col">${d.name}</th>`).join("")}</tr></thead><tbody>` +
  rows.map(r => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("") + "</tbody>";

document.querySelectorAll("input,select").forEach(e => e.addEventListener("input", () => { calc(); drawT(); }));
calc(); drawT();

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

function buildReport() {
  const goldCount = +$("gold").value || 0;
  const silverCount = +$("silver").value || 0;
  const karat = $("karat").value;
  const selectedCategory = CATS.find(([value]) => value === $("gtype").value) || ["", "Unspecified"];
  const ringType = selectedCategory[1];
  const presidents = +$("np").value || 0;
  const women = +$("nw").value || 0;
  const men = +$("nm").value || 0;
  const ranked = latestResults.filter(result => !result.na).sort((a, b) => a.net - b.net);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const reportDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "long", day: "numeric"
  }).format(new Date());
  const reportTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric", minute: "2-digit"
  }).format(new Date());
  const supplierHeaders = Object.values(D).map(supplier => `<th>${escapeHtml(supplier.name)}</th>`).join("");
  const totalsRow = result => result.na ? ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"] : [
    fm2(result.gross), fm2(result.disc), fm2(result.don), fm2(result.off), fm2(result.ben), fm2(result.net)
  ];
  const comparisonRows = latestResults.map(result =>
    `<tr class="${result === best ? "report-best" : ""}"><th>${escapeHtml(result.d.name)}</th>${totalsRow(result).map(value => `<td class="report-number">${value}</td>`).join("")}</tr>`
  ).join("");
  const selectedGoldPrices = Object.values(D).map(supplier => supplier.p[selectedCategory[0]][karat]);
  const lowestGoldPrice = Math.min(...selectedGoldPrices.filter(price => price != null));
  const silverPrices = Object.values(D).map(supplier => supplier.p[SILVER_STD].s);
  const lowestSilverPrice = Math.min(...silverPrices);
  const selectedPrices = [
    {label: `Gold ${karat}K · ${ringType}`, values: selectedGoldPrices, lowest: lowestGoldPrice},
    {label: "Silver · Unisex (standard)", values: silverPrices, lowest: lowestSilverPrice}
  ].map(({label, values, lowest}) =>
    `<tr><th>${escapeHtml(label)}</th>${values.map(price => `<td class="report-number ${price === lowest ? "report-best" : ""}">${price == null ? "N/A" : fm2(price)}</td>`).join("")}</tr>`
  ).join("");
  const benefitRows = rows.map(row =>
    `<tr><th>${escapeHtml(row[0])}</th>${row.slice(1).map(value => `<td>${value}</td>`).join("")}</tr>`
  ).join("");
  const winnerSummary = best
    ? `<h2>${escapeHtml(best.d.name)}</h2><p>Lowest estimated net cost at <strong>${fm2(best.net)}</strong>${worst && worst !== best ? ` — ${fm2(worst.net - best.net)} less than ${escapeHtml(worst.d.name)}.` : "."}</p>`
    : "<h2>No comparable supplier totals</h2><p>Check the selected ring options and quantities.</p>";
  const savings = best && worst && worst !== best ? fm2(worst.net - best.net) : "—";
  const report = $("printReport");
  report.innerHTML = `
    <header class="report-header">
      <div><div class="report-brand">Supplier comparison · Class rings</div><h1>Supplier Cost Report</h1><p class="report-subtitle">A side-by-side estimate of group costs, ring prices, and supplier benefits.</p></div>
      <div class="report-stamp">Prepared ${escapeHtml(reportDate)} · ${escapeHtml(reportTime)}</div>
    </header>
    <section class="report-summary"><div class="report-kicker">Cost recommendation</div>${winnerSummary}</section>
    <div class="report-kpis">
      <div class="report-kpi"><span>Lowest estimated total</span><strong>${best ? fm2(best.net) : "N/A"}</strong></div>
      <div class="report-kpi"><span>Difference vs. highest</span><strong>${savings}</strong></div>
      <div class="report-kpi"><span>Student ring orders</span><strong>${(goldCount + silverCount).toLocaleString()}</strong></div>
    </div>
    <section class="report-section"><h2>Group configuration</h2>
      <div class="report-config">
        <div><span>Gold student orders</span><strong>${goldCount.toLocaleString()}</strong></div>
        <div><span>Silver student orders</span><strong>${silverCount.toLocaleString()}</strong></div>
        <div><span>Gold karat &amp; style</span><strong>${escapeHtml(karat)}K · ${escapeHtml(ringType)}</strong></div>
        <div><span>Silver ring style</span><strong>Unisex (standard)</strong></div>
        <div><span>Presidents · premium</span><strong>${presidents.toLocaleString()}</strong></div>
        <div><span>Women officers</span><strong>${women.toLocaleString()}</strong></div>
        <div><span>Men officers</span><strong>${men.toLocaleString()}</strong></div>
        <div><span>Total officer rings</span><strong>${(presidents + women + men).toLocaleString()}</strong></div>
      </div>
    </section>
    <section class="report-section"><h2>Supplier cost comparison</h2>
      <table class="report-table"><thead><tr><th>Supplier</th><th class="report-number">Gross total</th><th class="report-number">Cash discount</th><th class="report-number">Donation</th><th class="report-number">Officer rings</th><th class="report-number">Total benefits</th><th class="report-number">Net cost</th></tr></thead><tbody>${comparisonRows}</tbody></table>
      <p class="report-note">Net cost = gross ring cost − cash discounts − donations − stated officer ring benefits. Suppliers without the selected gold karat are marked N/A.</p>
    </section>
    <section class="report-section"><h2>Selected ring price comparison</h2>
      <table class="report-table"><thead><tr><th>Ring style and type</th>${supplierHeaders}</tr></thead><tbody>${selectedPrices}</tbody></table>
      <p class="report-note">Lowest unit price per style is highlighted. Gold prices use the selected ${escapeHtml(karat)}K karat; silver prices are standardized to Unisex.</p>
    </section>
    <section class="report-section report-benefits"><h2>Benefits &amp; supplier policies</h2>
      <table class="report-table"><thead><tr><th>Benefit / policy</th>${supplierHeaders}</tr></thead><tbody>${benefitRows}</tbody></table>
      <p class="report-note">✓ Included · ✗ Not included · ? Not stated in supplier materials.</p>
    </section>
    <p class="report-note">Donation assumptions per ring — Suarez: gold ${fm2(+$("sg").value || 0)}, silver ${fm2(+$("ss").value || 0)}; R&amp;J: gold ${fm2(+$("rg").value || 0)}, silver ${fm2(+$("rs").value || 0)}. RNP donation assumptions are included in the calculator estimate.</p>
    <footer class="report-footer">Prepared with the Class Ring Supplier Calculator. Estimates use the supplier details and assumptions currently entered; supplier prices and terms may change.</footer>`;
  return report;
}

$("exportReport").addEventListener("click", () => {
  const report = buildReport();
  report.removeAttribute("aria-hidden");
  window.addEventListener("afterprint", () => report.setAttribute("aria-hidden", "true"), {once: true});
  window.print();
});
