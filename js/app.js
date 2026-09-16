/* ======================================================================
   راهِ حفظ — منطق برنامه
   تمام داده‌ها فقط در همین مرورگر/گوشی (localStorage) ذخیره می‌شود.
   ====================================================================== */

/* ================= نورا — کاراکتر همراه (ستاره‌ی نورانی) ================= */
function MASCOT_SVG(size) {
  size = size || 120;
  return `
  <svg class="mascot-svg" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="mascotGlowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E7B84E" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#E7B84E" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="mascotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F6DFA0"/>
        <stop offset="55%" stop-color="#E7B84E"/>
        <stop offset="100%" stop-color="#C9932E"/>
      </linearGradient>
    </defs>
    <g class="mascot-wrap">
      <circle class="mascot-aura" cx="100" cy="100" r="88" fill="url(#mascotGlowGrad)"/>
      <g class="mascot-float">
        <g class="mascot-star-shape">
          <polygon fill="url(#mascotBodyGrad)" stroke="#C9932E" stroke-width="2" stroke-linejoin="round"
            points="100,0 122,40 164,24 160,70 200,86 170,116 188,156 144,148 130,190 100,160 70,190 56,148 12,156 30,116 0,86 40,70 36,24 78,40"/>
        </g>
        <ellipse cx="72" cy="112" rx="9" ry="5" fill="#F08A9B" opacity="0.4"/>
        <ellipse cx="128" cy="112" rx="9" ry="5" fill="#F08A9B" opacity="0.4"/>
        <ellipse class="mascot-eye mascot-eye-l" cx="82" cy="96" rx="6" ry="7" fill="#2A1E08"/>
        <ellipse class="mascot-eye mascot-eye-r" cx="118" cy="96" rx="6" ry="7" fill="#2A1E08"/>
        <path d="M84,116 Q100,128 116,116" stroke="#2A1E08" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </g>
      <g class="mascot-sparkles">
        <circle cx="26" cy="50" r="4" fill="#9AF0E1"/>
        <circle cx="176" cy="66" r="3" fill="#F6DFA0"/>
        <circle cx="150" cy="176" r="3.5" fill="#9AF0E1"/>
      </g>
    </g>
  </svg>`;
}

function MASCOT_3D(size){
  size=size||150;
  return `<div class="mascot-3d" style="--mascot-size:${size}px" aria-label="کاراکتر همراه من"><div class="m3d-aura"></div><div class="m3d-shadow"></div><div class="m3d-body"><div class="m3d-cap">✦</div><div class="m3d-face"><i></i><i></i><b>⌣</b></div><span class="m3d-book">قرآن</span></div><div class="m3d-spark s1">✦</div><div class="m3d-spark s2">•</div></div>`;
}

function mountMascots() {
  const splashEl = document.getElementById("splash-mascot");
  if (splashEl) splashEl.innerHTML = MASCOT_3D(150);
  const menuEl = document.getElementById("menu-mascot");
  if (menuEl) menuEl.innerHTML = MASCOT_3D(68);
}

/* ================= جلوه‌ی موج (ripple) روی دکمه‌ها و کارت‌ها ================= */
document.addEventListener("click", function (e) {
  const el = e.target.closest(".btn, .menu-card, .lesson-card, .chip, .icon-btn");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height) * 1.2;
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
  ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
  const prevPos = getComputedStyle(el).position;
  if (prevPos === "static") el.style.position = "relative";
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

const STORAGE_KEY = "qhifz_state_v1";
const REVIEW_INTERVALS = [1, 3, 7, 16, 35, 90]; // روزهای فاصله‌ی مرور (شبیه یادگیری فاصله‌دار)

const LEVEL_TARGETS = { beginner: 3, intermediate: 8, advanced: 15 };

function defaultState() {
  return {
    name: "",
    fontSize: 22,
    level: "beginner",
    dailyTarget: 5,
    progress: {},      // { [surahId]: {memorizedAyahs, status, reviewStage, nextReview, lastReviewed} }
    activityDates: [],
    lessonsCompleted: [],
    focusSessions: 0,
    achievements: [],
    createdAt: todayStr()
  };
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

/* ---------------- ناوبری بین صفحات ---------------- */
function goTo(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === pageId);
  });
  if (pageId === "dashboard") renderDashboard();
  if (pageId === "surahs") renderSurahList();
  if (pageId === "plan") renderPlan();
  if (pageId === "review") renderReviewList();
  if (pageId === "settings") renderSettings();
}

/* ---------------- کمکی‌های پیشرفت ---------------- */
function getProgress(id) {
  return state.progress[id] || { memorizedAyahs: 0, status: "none", reviewStage: -1, nextReview: null, lastReviewed: null };
}

function totalMemorizedAyahs() {
  let sum = 0;
  for (const s of SURAHS) {
    const p = getProgress(s.id);
    sum += p.status === "done" ? s.ayahs : (p.memorizedAyahs || 0);
  }
  return sum;
}

function countDoneSurahs() {
  return SURAHS.filter(s => getProgress(s.id).status === "done").length;
}

function markActivityToday() {
  const t = todayStr();
  if (!state.activityDates.includes(t)) state.activityDates.push(t);
}

function computeStreak() {
  const set = new Set(state.activityDates);
  let streak = 0;
  let cursor = 0;
  while (set.has(todayStr(-cursor))) {
    streak++;
    cursor++;
  }
  return streak;
}

function setSurahProgress(id, memorizedAyahs, status) {
  const surah = SURAHS.find(s => s.id === id);
  const prev = getProgress(id);
  const nextCount = Math.max(0, Math.min(memorizedAyahs, surah.ayahs));
  const entry = { memorizedAyahs: nextCount, status, reviewStage: prev.reviewStage, nextReview: prev.nextReview, lastReviewed: prev.lastReviewed, lastActivity: todayStr(), todayAyahs: (prev.lastActivity===todayStr()?Number(prev.todayAyahs||0):0) + Math.max(0, nextCount-Number(prev.memorizedAyahs||0)) };
  if (status === "done" && prev.status !== "done") {
    entry.reviewStage = 0;
    entry.nextReview = todayStr(REVIEW_INTERVALS[0]);
    entry.lastReviewed = todayStr();
    entry.memorizedAyahs = surah.ayahs;
  }
  if (status !== "done") {
    entry.reviewStage = -1;
    entry.nextReview = null;
  }
  state.progress[id] = entry;
  markActivityToday();
  saveState();
}

function advanceReview(id) {
  const p = getProgress(id);
  const nextStage = Math.min(p.reviewStage + 1, REVIEW_INTERVALS.length - 1);
  p.reviewStage = nextStage;
  p.lastReviewed = todayStr();
  p.nextReview = todayStr(REVIEW_INTERVALS[nextStage]);
  state.progress[id] = p;
  markActivityToday();
  saveState();
  renderReviewList();
  renderDashboard();
}

/* ================= داشبورد ================= */
function renderDashboard() {
  const pct = Math.round((totalMemorizedAyahs() / TOTAL_AYAHS) * 100);
  document.getElementById("star-fill").style.setProperty("--pct", pct);
  document.getElementById("dash-pct").textContent = toFa(pct) + "٪";
  document.getElementById("stat-streak").textContent = toFa(computeStreak());
  document.getElementById("stat-memorized").textContent = toFa(totalMemorizedAyahs());
  document.getElementById("stat-surahs").textContent = toFa(countDoneSurahs());

  const target = state.dailyTarget || LEVEL_TARGETS[state.level] || 5;
  document.getElementById("dash-goal-text").textContent =
    `هدف شما: ${toFa(target)} آیه در روز — تا این لحظه ${toFa(totalMemorizedAyahs())} آیه از ${toFa(TOTAL_AYAHS)} آیه‌ی قرآن را حفظ کرده‌اید.`;

  // ادامه‌ی حفظ: اولین سوره‌ی «در حال حفظ»
  const inProgress = SURAHS.find(s => getProgress(s.id).status === "progress");
  const cBody = document.getElementById("dash-continue-body");
  if (inProgress) {
    const p = getProgress(inProgress.id);
    cBody.innerHTML = `
      <div class="surah-item" onclick="openSurahModal(${inProgress.id})" style="border:none;padding:0;">
        <div class="surah-num"><span>${toFa(inProgress.id)}</span></div>
        <div class="surah-info">
          <div class="name-row"><span class="fa-name">${inProgress.fa}</span><span class="ar-name">${inProgress.ar}</span></div>
          <div class="meta">${toFa(p.memorizedAyahs)} از ${toFa(inProgress.ayahs)} آیه</div>
          <div class="progress-track"><div class="progress-fill" style="width:${(p.memorizedAyahs/inProgress.ayahs)*100}%"></div></div>
        </div>
      </div>`;
  } else {
    cBody.innerHTML = `<div class="empty" style="padding:6px 0;"><div class="mascot-wrap">${MASCOT_SVG(44)}</div>هنوز سوره‌ای را شروع نکرده‌اید. از تب «سوره‌ها» شروع کنید.</div>`;
  }

  // مرور امروز
  const due = SURAHS
    .filter(s => getProgress(s.id).status === "done" && getProgress(s.id).nextReview <= todayStr())
    .slice(0, 3);
  const rBody = document.getElementById("dash-review-body");
  if (due.length) {
    rBody.innerHTML = due.map(s => `
      <div class="review-item">
        <div>
          <div class="fa-name" style="font-weight:700;">${s.fa} <span class="ar-name">${s.ar}</span></div>
          <div class="due today">امروز</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="advanceReview(${s.id})">مرور شد</button>
      </div>`).join("");
  } else {
    rBody.innerHTML = `<div class="empty" style="padding:6px 0;">امروز مروری برایتان زمان‌بندی نشده 🌙</div>`;
  }
  renderSmartLayer();
}

/* ================= فهرست سوره‌ها ================= */
function renderSurahList() {
  const q = (document.getElementById("surah-search").value || "").trim();
  const list = document.getElementById("surah-list");
  const filtered = SURAHS.filter(s => !q || s.fa.includes(q) || s.ar.includes(q) || String(s.id).includes(q));
  list.innerHTML = filtered.map((s, idx) => {
    const p = getProgress(s.id);
    const dotClass = p.status === "done" ? "done" : p.status === "progress" ? "progress" : "none";
    const pctW = p.status === "done" ? 100 : Math.round((p.memorizedAyahs / s.ayahs) * 100);
    return `
      <div class="surah-item" style="animation-delay:${Math.min(idx * 30, 400)}ms" onclick="openSurahModal(${s.id})">
        <div class="surah-num"><span>${toFa(s.id)}</span></div>
        <div class="surah-info">
          <div class="name-row">
            <span class="fa-name"><span class="status-dot ${dotClass}" style="display:inline-block;margin-left:6px;"></span>${s.fa}</span>
            <span class="ar-name">${s.ar}</span>
          </div>
          <div class="meta">${toFa(s.ayahs)} آیه · ${s.type}</div>
          <div class="progress-track"><div class="progress-fill" style="width:${pctW}%"></div></div>
        </div>
      </div>`;
  }).join("") || `<div class="empty">سوره‌ای یافت نشد</div>`;
}

function openSurahModal(id) {
  const s = SURAHS.find(x => x.id === id);
  const p = getProgress(id);
  const body = document.getElementById("surah-modal-body");
  body.innerHTML = `
    <h3>${s.fa} <span class="ar-name">${s.ar}</span></h3>
    <p style="font-size:12.5px;color:var(--parchment-dim);margin:-6px 0 16px;">${toFa(s.ayahs)} آیه · ${s.type}</p>
    <div class="field">
      <label>تا آیه‌ی شماره‌ی حفظ‌شده</label>
      <input type="number" id="modal-ayah" min="0" max="${s.ayahs}" value="${p.memorizedAyahs || 0}">
    </div>
    <div class="field">
      <label>وضعیت</label>
      <select id="modal-status">
        <option value="none" ${p.status === "none" ? "selected" : ""}>شروع نشده</option>
        <option value="progress" ${p.status === "progress" ? "selected" : ""}>در حال حفظ</option>
        <option value="done" ${p.status === "done" ? "selected" : ""}>حفظ کامل</option>
      </select>
    </div>
    ${p.status === "done" ? `<p style="font-size:12px;color:var(--gold-soft);">مرور بعدی: ${p.nextReview}</p>` : ""}
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeSurahModal()">انصراف</button>
      <button class="btn btn-primary" onclick="saveSurahModal(${id})">ذخیره</button>
    </div>
    <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px;">
      <button class="btn btn-ghost" id="load-text-btn" onclick="loadAyahText(${id})">📖 نمایش متن و ترجمه‌ی سوره</button>
      <div id="ayah-text-box" style="margin-top:12px;max-height:260px;overflow-y:auto;"></div>
    </div>`;
  document.getElementById("surah-modal").classList.add("active");
}
function closeSurahModal() {
  document.getElementById("surah-modal").classList.remove("active");
}
function saveSurahModal(id) {
  const ayah = parseInt(document.getElementById("modal-ayah").value || "0", 10);
  const status = document.getElementById("modal-status").value;
  setSurahProgress(id, ayah, status);
  closeSurahModal();
  renderSurahList();
  renderDashboard();
}

/* ================= نمایش متن آیات (زنده از اینترنت) ================= */
async function loadAyahText(id) {
  const btn = document.getElementById("load-text-btn");
  const box = document.getElementById("ayah-text-box");
  btn.textContent = "در حال بارگذاری…";
  btn.disabled = true;
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,fa.makarem`);
    if (!res.ok) throw new Error("network");
    const json = await res.json();
    const arabic = json.data[0].ayahs;
    const farsi = json.data[1] ? json.data[1].ayahs : [];
    box.innerHTML = arabic.map((a, i) => `
      <div style="padding:10px 0;border-bottom:1px solid var(--line);">
        <div style="font-family:var(--font-display);font-size:${state.fontSize || 22}px;line-height:2.1;color:var(--parchment);text-align:right;">
          ${a.text} <span style="color:var(--gold-soft);font-size:14px;">(${toFa(a.numberInSurah)})</span>
        </div>
        ${farsi[i] ? `<div style="font-size:13px;color:var(--parchment-dim);margin-top:6px;line-height:1.9;">${farsi[i].text}</div>` : ""}
      </div>`).join("");
    btn.style.display = "none";
  } catch (e) {
    box.innerHTML = `<div class="empty" style="padding:10px 0;">
      متن سوره بارگذاری نشد. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
    </div>`;
    btn.textContent = "📖 تلاش دوباره";
    btn.disabled = false;
  }
}

/* ================= مربی تلاوت هوشمند — Speech Recognition + مقایسه‌ی آیه ================= */
let coachRecognition=null, coachRunning=false, coachTarget="", coachTargetTokens=[], coachFinalTranscript="";
function normalizeArabic(text){
  return String(text||"").toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"")
    .replace(/[إأٱآ]/g,"ا").replace(/ى/g,"ی").replace(/ؤ/g,"و").replace(/ئ/g,"ی")
    .replace(/ة/g,"ه").replace(/ـ/g,"").replace(/[.,!?؛،:"“”«»()\[\]{}]/g," ")
    .replace(/\s+/g," ").trim();
}
function coachTokens(text){return normalizeArabic(text).split(" ").filter(Boolean)}
function initCoach(){
  const sel=document.getElementById("coach-surah");
  if(!sel || sel.dataset.ready)return;
  sel.innerHTML=SURAHS.map(s=>`<option value="${s.id}">${toFa(s.id)}. ${s.fa} — ${s.ar}</option>`).join("");
  sel.dataset.ready="1";
  const last=state.coachLast||{};
  if(last.surahId) sel.value=String(last.surahId);
  if(last.ayah) document.getElementById("coach-ayah").value=last.ayah;
  loadCoachAyah(true);
  setupRecognition();
}
async function loadCoachAyah(silent=false){
  const sid=Number(document.getElementById("coach-surah").value||1);
  const ayah=Math.max(1,Number(document.getElementById("coach-ayah").value||1));
  const surah=SURAHS.find(x=>x.id===sid);
  if(!surah)return;
  if(ayah>surah.ayahs){document.getElementById("coach-ayah").value=surah.ayahs;return loadCoachAyah(silent);}
  const box=document.getElementById("coach-ayah-box"),btn=document.getElementById("coach-load");
  if(!silent)btn.disabled=true;
  box.innerHTML=`<span class="coach-loading">در حال دریافت آیه…</span>`;
  try{
    const res=await fetch(`https://api.alquran.cloud/v1/ayah/${sid}:${ayah}/quran-uthmani`);
    if(!res.ok)throw Error("network");
    const json=await res.json();
    coachTarget=json.data.text||"";
    coachTargetTokens=coachTokens(coachTarget);
    state.coachLast={surahId:sid,ayah}; saveState();
    box.innerHTML=`<div class="coach-ayah-number">آیه ${toFa(ayah)}</div><div class="coach-arabic">${coachTarget}</div>`;
    clearCoach(false);
    document.getElementById("coach-state").textContent="آماده‌ی شروع";
  }catch(e){box.innerHTML=`<span>اتصال برای دریافت متن آیه برقرار نشد. اینترنت را بررسی کنید.</span>`;}
  if(!silent)btn.disabled=false;
}
function setupRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const stateEl=document.getElementById("coach-state");
  if(!SR){if(stateEl)stateEl.textContent="مرورگر شما تشخیص گفتار را پشتیبانی نمی‌کند";document.getElementById("coach-start").disabled=true;return;}
  coachRecognition=new SR();
  coachRecognition.lang="ar-SA"; coachRecognition.continuous=true; coachRecognition.interimResults=true; coachRecognition.maxAlternatives=1;
  coachRecognition.onstart=()=>{coachRunning=true;document.getElementById("coach-start").textContent="⏹ توقف تلاوت";document.getElementById("coach-state").textContent="در حال گوش دادن…";document.getElementById("coach-live-dot").classList.add("on");document.getElementById("mic-ring").classList.add("listening");};
  coachRecognition.onresult=(event)=>{
    let interim="",finalText=coachFinalTranscript;
    for(let i=event.resultIndex;i<event.results.length;i++){const t=event.results[i][0].transcript;if(event.results[i].isFinal)finalText+=(finalText?" ":"")+t;else interim+=t;}
    coachFinalTranscript=finalText; document.getElementById("coach-transcript").textContent=(finalText+" "+interim).trim()||"…";
    const combined=(finalText+" "+interim).trim();
    if(combined) renderCoachResult(combined,false);
  };
  coachRecognition.onerror=(e)=>{if(e.error!=="no-speech")document.getElementById("coach-state").textContent="خطا در دریافت صدا؛ دوباره تلاش کنید.";};
  coachRecognition.onend=()=>{if(coachRunning){try{coachRecognition.start();}catch(e){}}else{document.getElementById("coach-live-dot").classList.remove("on");document.getElementById("mic-ring").classList.remove("listening");document.getElementById("coach-start").textContent="🎙 شروع تلاوت";}};
}
function toggleCoach(){
  if(!coachTarget){document.getElementById("coach-result").innerHTML=`<div class="result-warn">اول آیه را آماده کنید.</div>`;return;}
  if(!coachRecognition){setupRecognition();if(!coachRecognition)return;}
  if(coachRunning){coachRunning=false;try{coachRecognition.stop();}catch(e){}renderCoachResult(coachFinalTranscript,true);document.getElementById("coach-state").textContent="گزارش تلاوت آماده است";}
  else{coachFinalTranscript="";document.getElementById("coach-transcript").textContent="در حال شنیدن…";try{coachRecognition.start();}catch(e){}}
}
function levenshtein(a,b){const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)dp[i][0]=i;for(let j=0;j<=b.length;j++)dp[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return dp[a.length][b.length];}
function compareRecitation(target,spoken){
  const a=coachTokens(target), b=coachTokens(spoken); if(!a.length)return {score:0,html:""};
  const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>Array(m+1).fill(0));
  for(let i=0;i<=n;i++)dp[i][0]=i;for(let j=0;j<=m;j++)dp[0][j]=j;
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  let i=n,j=m,ops=[];
  while(i||j){if(i&&j&&dp[i][j]===dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){ops.push({t:a[i-1],s:b[j-1],type:a[i-1]===b[j-1]?"ok":"diff"});i--;j--;}else if(j&&dp[i][j]===dp[i][j-1]+1){ops.push({t:"",s:b[j-1],type:"extra"});j--;}else{ops.push({t:a[i-1],s:"",type:"miss"});i--;}}
  ops.reverse(); const errors=ops.filter(x=>x.type!=="ok").length; const score=Math.max(0,Math.round(100*(1-errors/Math.max(a.length,b.length))));
  const html=ops.map(o=>o.type==="ok"?`<span class="word-ok">${o.s}</span>`:o.type==="extra"?`<span class="word-extra">${o.s}</span>`:`<span class="word-error" title="متن معیار: ${o.t||"—"}">${o.s||"[افتاده]"}</span>`).join(" ");
  return {score,errors,html};
}
function renderCoachResult(spoken,finalized){
  if(!coachTarget||!spoken)return;
  const r=compareRecitation(coachTarget,spoken), box=document.getElementById("coach-result");
  const tone=r.score>=90?"عالی":r.score>=75?"خوب":r.score>=55?"نیاز به تکرار":"دوباره با آرامش بخوان";
  box.innerHTML=`<div class="result-top"><div class="score-ring"><b>${toFa(r.score)}٪</b><small>شباهت</small></div><div><span class="eyebrow">بازخورد ${finalized?"نهایی":"زنده"}</span><h3>${tone}</h3><p>${r.errors?`حدود ${toFa(r.errors)} مورد مشکوک برای بررسی پیدا شد.` : "واژه‌ها با متن معیار هم‌خوانی دارند."}</p></div></div><div class="word-map">${r.html}</div><div class="legend"><span class="ok-dot"></span> هم‌خوان <span class="err-dot"></span> مشکوک به خطا <span class="extra-dot"></span> اضافه</div>`;
}
function clearCoach(resetTarget=true){coachFinalTranscript="";const t=document.getElementById("coach-transcript");if(t)t.textContent="صدای شما اینجا نمایش داده می‌شود…";const r=document.getElementById("coach-result");if(r)r.innerHTML=`<div class="result-idle">${resetTarget?"آیه را آماده کنید و سپس تلاوت کنید.":"برای شروع تلاوت آماده است."}</div>`;}

/* ================= ماژول «شروع یادگیری» ================= */
function renderLearnList() {
  const done = state.lessonsCompleted || [];
  const pctDone = Math.round((done.length / LESSONS.length) * 100);
  document.getElementById("learn-progress-fill").style.width = pctDone + "%";
  document.getElementById("learn-progress-text").textContent = `${toFa(done.length)} از ${toFa(LESSONS.length)} درس کامل شد`;

  const list = document.getElementById("lesson-list");
  list.innerHTML = LESSONS.map((lesson, idx) => {
    const isDone = done.includes(lesson.id);
    const prevDone = idx === 0 || done.includes(LESSONS[idx - 1].id);
    const locked = !prevDone && !isDone;
    return `
      <div class="lesson-card ${locked ? "locked" : ""}" onclick="${locked ? "" : `openLesson(${lesson.id})`}">
        <div class="l-icon">${locked ? "🔒" : lesson.icon}</div>
        <div style="flex:1;">
          <div class="l-title">${toFa(lesson.id)}. ${lesson.title}</div>
          <div class="l-status">${isDone ? "تکمیل‌شده ✓" : locked ? "قفل — ابتدا درس قبلی را تمام کنید" : "آماده‌ی شروع"}</div>
        </div>
        ${isDone ? '<div class="l-check">✓</div>' : ""}
      </div>`;
  }).join("");
}

let currentLessonAnswers = {};

function openLesson(id) {
  const lesson = LESSONS.find(l => l.id === id);
  currentLessonAnswers = {};
  document.getElementById("lesson-view-title").textContent = `درس ${toFa(id)}`;
  const body = document.getElementById("lesson-view-body");
  body.innerHTML = `
    <div class="card">
      <h2>${lesson.title}</h2>
      ${lesson.content}
      <div class="quiz-block">
        <p class="eyebrow">تمرین کوتاه</p>
        ${lesson.quiz.map((q, qi) => `
          <div class="quiz-q">
            <p>${qi + 1}. ${q.q}</p>
            ${q.options.map((opt, oi) => `
              <button class="quiz-opt" onclick="selectQuizOption(${id},${qi},${oi})" id="opt-${id}-${qi}-${oi}">${opt}</button>
            `).join("")}
          </div>`).join("")}
        <div id="quiz-feedback-${id}"></div>
        <button class="btn btn-primary" onclick="checkQuiz(${id})" style="margin-top:6px;">بررسی پاسخ‌ها</button>
      </div>
    </div>`;
  showScreen("learn-lesson");
}

function selectQuizOption(lessonId, qIndex, oIndex) {
  currentLessonAnswers[qIndex] = oIndex;
  const lesson = LESSONS.find(l => l.id === lessonId);
  lesson.quiz[qIndex].options.forEach((_, oi) => {
    document.getElementById(`opt-${lessonId}-${qIndex}-${oi}`).classList.toggle("selected", oi === oIndex);
  });
}

function checkQuiz(lessonId) {
  const lesson = LESSONS.find(l => l.id === lessonId);
  let allCorrect = true;
  lesson.quiz.forEach((q, qi) => {
    const chosen = currentLessonAnswers[qi];
    q.options.forEach((_, oi) => {
      const el = document.getElementById(`opt-${lessonId}-${qi}-${oi}`);
      el.classList.remove("correct", "wrong");
      if (oi === q.correct) el.classList.add("correct");
      else if (oi === chosen) el.classList.add("wrong");
    });
    if (chosen !== q.correct) allCorrect = false;
  });
  const feedback = document.getElementById(`quiz-feedback-${lessonId}`);
  if (allCorrect) {
    feedback.innerHTML = `<div class="quiz-feedback ok">آفرین! همه‌ی پاسخ‌ها درست بود 🎉</div>
      <button class="btn btn-primary" style="margin-top:10px;" onclick="completeLesson(${lessonId})">تکمیل درس و ادامه</button>`;
  } else {
    feedback.innerHTML = `<div class="quiz-feedback bad">یکی از پاسخ‌ها اشتباه بود؛ گزینه‌های درست با رنگ طلایی مشخص شدند. دوباره تلاش کنید.</div>`;
  }
}

function completeLesson(lessonId) {
  if (!state.lessonsCompleted.includes(lessonId)) {
    state.lessonsCompleted.push(lessonId);
    saveState();
  }
  const next = LESSONS.find(l => l.id === lessonId + 1);
  if (next) {
    openLesson(next.id);
  } else {
    showScreen("learn-list");
  }
}

/* ================= کمک به مدارس دینی ================= */
function copyCardNumber() {
  const raw = document.getElementById("card-number").textContent.replace(/-/g, "");
  const btn = document.getElementById("copy-card-btn");
  navigator.clipboard.writeText(raw).then(() => {
    btn.textContent = "✓ کپی شد";
    setTimeout(() => (btn.textContent = "📋 کپی شماره کارت"), 1800);
  }).catch(() => {
    btn.textContent = "کپی نشد — دستی کپی کنید";
  });
}

/* ================= مودال ثبت سریع (از داشبورد) ================= */
function openLogModal() {
  const sel = document.getElementById("log-surah-select");
  sel.innerHTML = SURAHS.map(s => `<option value="${s.id}">${toFa(s.id)}. ${s.fa} (${s.ar})</option>`).join("");
  document.getElementById("log-ayah-input").value = "";
  document.getElementById("log-modal").classList.add("active");
}
function closeLogModal() {
  document.getElementById("log-modal").classList.remove("active");
}
function confirmLog() {
  const id = parseInt(document.getElementById("log-surah-select").value, 10);
  const ayah = parseInt(document.getElementById("log-ayah-input").value || "0", 10);
  const status = document.getElementById("log-status-select").value;
  setSurahProgress(id, ayah, status);
  closeLogModal();
  renderDashboard();
}

/* ================= برنامه‌ی حفظ ================= */
function renderPlan() {
  document.querySelectorAll("#level-chips .chip").forEach(c => {
    c.classList.toggle("active", c.dataset.level === state.level);
    c.onclick = () => {
      state.level = c.dataset.level;
      renderPlan();
    };
  });
  document.getElementById("daily-target").value = state.dailyTarget || LEVEL_TARGETS[state.level] || 5;
  renderForecast();
}

function savePlan() {
  const target = parseInt(document.getElementById("daily-target").value || "0", 10);
  state.dailyTarget = target > 0 ? target : LEVEL_TARGETS[state.level] || 5;
  saveState();
  renderForecast();
  renderDashboard();
}

function renderForecast() {
  const remaining = TOTAL_AYAHS - totalMemorizedAyahs();
  const target = state.dailyTarget || LEVEL_TARGETS[state.level] || 5;
  const days = Math.max(1, Math.ceil(remaining / target));
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = days % 30;
  let text = "";
  if (years > 0) text += `${toFa(years)} سال `;
  if (months > 0) text += `${toFa(months)} ماه `;
  if (years === 0) text += `${toFa(remDays)} روز`;
  document.getElementById("plan-forecast-body").innerHTML = `
    با هدف روزانه‌ی <b style="color:var(--gold-soft)">${toFa(target)} آیه</b>،
    حدود <b style="color:var(--gold-soft)">${text}</b> دیگر تا حفظ کامل قرآن باقی مانده
    (${toFa(remaining)} آیه از ${toFa(TOTAL_AYAHS)} آیه).`;
}

/* ================= مرور فاصله‌دار ================= */
function renderReviewList() {
  const doneSurahs = SURAHS
    .map(s => ({ s, p: getProgress(s.id) }))
    .filter(x => x.p.status === "done")
    .sort((a, b) => (a.p.nextReview || "").localeCompare(b.p.nextReview || ""));

  const list = document.getElementById("review-list");
  if (!doneSurahs.length) {
    list.innerHTML = `<div class="empty"><div class="mascot-wrap">${MASCOT_SVG(56)}</div>هنوز سوره‌ای را «حفظ کامل» علامت نزده‌اید.<br>وقتی سوره‌ای را کامل حفظ کنید، اینجا برای مرور دوره‌ای زمان‌بندی می‌شود.</div>`;
    return;
  }
  const today = todayStr();
  list.innerHTML = doneSurahs.map(({ s, p }) => {
    const isDue = p.nextReview <= today;
    const dueLabel = isDue
      ? (p.nextReview < today ? "دیرشده" : "امروز")
      : `${toFa(daysBetween(today, p.nextReview))} روز دیگر`;
    return `
      <div class="review-item">
        <div>
          <div style="font-weight:700;">${s.fa} <span class="ar-name">${s.ar}</span></div>
          <div class="due ${isDue ? (p.nextReview < today ? "overdue" : "today") : ""}">${dueLabel}</div>
        </div>
        ${isDue ? `<button class="btn btn-primary btn-sm" onclick="advanceReview(${s.id})">مرور شد</button>`
                : `<span style="font-size:11px;color:var(--parchment-dim);">مرحله ${toFa(p.reviewStage + 1)}</span>`}
      </div>`;
  }).join("");
}

function daysBetween(a, b) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

/* ================= قابلیت‌های APEX ================= */
const ACHIEVEMENTS=[
{id:'first',icon:'🌱',title:'اولین قدم',desc:'اولین آیه را ثبت کن',test:()=>totalMemorizedAyahs()>=1},
{id:'fire',icon:'🔥',title:'هفته‌ی طلایی',desc:'۷ روز پیوسته فعال باش',test:()=>computeStreak()>=7},
{id:'hundred',icon:'💎',title:'صد آیه',desc:'۱۰۰ آیه حفظ‌شده',test:()=>totalMemorizedAyahs()>=100},
{id:'surah',icon:'🌙',title:'اولین سوره',desc:'یک سوره را کامل کن',test:()=>countDoneSurahs()>=1},
{id:'five',icon:'🏆',title:'پنج قله',desc:'۵ سوره را کامل کن',test:()=>countDoneSurahs()>=5},
{id:'thousand',icon:'⚡',title:'هزار آیه',desc:'۱۰۰۰ آیه حفظ‌شده',test:()=>totalMemorizedAyahs()>=1000},
{id:'focus',icon:'🧠',title:'ذهن متمرکز',desc:'۵ جلسه تمرکز',test:()=>Number(state.focusSessions||0)>=5},
{id:'lesson',icon:'📚',title:'شاگرد پرتلاش',desc:'همه‌ی درس‌های پایه',test:()=>((state.lessonsCompleted||[]).length>=LESSONS.length)}];
function getXP(){return Math.min(999999,totalMemorizedAyahs()*2+countDoneSurahs()*80+(state.lessonsCompleted||[]).length*35+computeStreak()*12+Number(state.focusSessions||0)*25)}
function getLevel(xp=getXP()){return Math.max(1,Math.floor(xp/250)+1)}
function syncAchievements(){const a=state.achievements||[];ACHIEVEMENTS.forEach(x=>{if(!a.includes(x.id)&&x.test())a.push(x.id)});state.achievements=a;saveState()}
function weeklyActivity(){const set=new Set(state.activityDates||[]);return Array.from({length:7},(_,i)=>{const d=todayStr(i-6);return{d,active:set.has(d)}})}
function getTodayAyahs(){let sum=0;for(const p of Object.values(state.progress||{})){if(p.lastActivity===todayStr())sum+=Number(p.todayAyahs||0)}return sum}
function renderWeekChart(){const box=document.getElementById('week-chart');if(!box)return;const labs=['ش','ی','د','س','چ','پ','ج'],v=weeklyActivity();box.innerHTML=v.map((x,i)=>`<div class="week-col"><div class="week-bar ${x.active?'active':''}" style="height:${x.active?56:18}px"></div><small>${labs[(new Date(x.d+'T12:00:00').getDay()+1)%7]}</small></div>`).join('');const s=document.getElementById('week-summary');if(s)s.textContent=v.filter(x=>x.active).length?`${toFa(v.filter(x=>x.active).length)} روز فعال`:'شروع یک هفته‌ی تازه'}
function renderMission(){const f=document.getElementById('mission-fill');if(!f)return;const target=state.dailyTarget||5,progress=Math.min(target,getTodayAyahs()),pct=Math.min(100,Math.round(progress/target*100));document.getElementById('mission-title').textContent=pct>=100?'ماموریت کامل شد 🎉':'ماموریت امروز';document.getElementById('mission-desc').textContent=pct>=100?'امروز سهم خودت را انجام دادی؛ اگر انرژی داری، مرور کن.':'فقط '+toFa(Math.max(0,target-progress))+' آیه‌ی دیگر تا هدف امروز.';document.getElementById('mission-progress-label').textContent=`${toFa(progress)} / ${toFa(target)} آیه`;document.getElementById('mission-percent').textContent=toFa(pct)+'٪';f.style.width=pct+'%'}
function renderSmartLayer(){syncAchievements();const xp=getXP(),level=getLevel(xp),pct=Math.min(100,Math.round(((xp-(level-1)*250)/250)*100)),e=id=>document.getElementById(id);if(e('menu-level-badge'))e('menu-level-badge').textContent='LV '+toFa(level);if(e('menu-xp'))e('menu-xp').textContent=toFa(xp)+' XP';if(e('menu-xp-next'))e('menu-xp-next').textContent=toFa(Math.max(0,level*250-xp))+' XP تا سطح بعدی';if(e('menu-xp-fill'))e('menu-xp-fill').style.width=pct+'%';if(e('menu-week-days'))e('menu-week-days').textContent=toFa(weeklyActivity().filter(x=>x.active).length);if(e('menu-achievements'))e('menu-achievements').textContent=toFa(state.achievements.length);if(e('menu-focus'))e('menu-focus').textContent=toFa(state.focusSessions||0);renderMission();renderWeekChart()}
function openAchievements(){syncAchievements();document.getElementById('achievement-grid').innerHTML=ACHIEVEMENTS.map(a=>{const ok=state.achievements.includes(a.id);return`<div class="achievement ${ok?'unlocked':''}"><div class="achievement-icon">${a.icon}</div><b>${a.title}</b><small>${a.desc}</small><span>${ok?'باز شد ✓':'قفل'}</span></div>`}).join('');document.getElementById('achievements-modal').classList.add('active')}
function closeAchievements(){document.getElementById('achievements-modal').classList.remove('active')}
let focusSeconds=900,focusTimer=null,focusRunning=false;
function openFocusModal(){document.getElementById('focus-modal').classList.add('active');setFocus(15)}
function closeFocusModal(){if(focusTimer)clearInterval(focusTimer);focusTimer=null;focusRunning=false;document.getElementById('focus-modal').classList.remove('active')}
function setFocus(min){if(focusTimer)clearInterval(focusTimer);focusRunning=false;focusSeconds=min*60;updateFocusUI();document.querySelectorAll('.focus-presets button').forEach(b=>b.classList.toggle('active',b.textContent.startsWith(String(min))));document.getElementById('focus-start').textContent='شروع تمرکز'}
function updateFocusUI(){const m=Math.floor(focusSeconds/60),s=focusSeconds%60;document.getElementById('focus-time').textContent=toFa(String(m).padStart(2,'0'))+':'+toFa(String(s).padStart(2,'0'))}
function toggleFocus(){if(focusRunning){clearInterval(focusTimer);focusTimer=null;focusRunning=false;document.getElementById('focus-start').textContent='ادامه';return}focusRunning=true;document.getElementById('focus-start').textContent='مکث';focusTimer=setInterval(()=>{focusSeconds--;updateFocusUI();if(focusSeconds<=0){clearInterval(focusTimer);focusTimer=null;focusRunning=false;state.focusSessions=(state.focusSessions||0)+1;markActivityToday();saveState();syncAchievements();renderSmartLayer();document.getElementById('focus-start').textContent='جلسه کامل شد ✓';document.getElementById('focus-message').textContent='آفرین! یک جلسه‌ی کامل تمرکز ثبت شد.'}},1000)}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hamrah-man-backup-'+todayStr()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importData(ev){const file=ev.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const incoming=JSON.parse(r.result);if(!incoming.progress)throw Error();state=Object.assign(defaultState(),incoming);saveState();renderDashboard();renderSmartLayer();alert('پشتیبان با موفقیت بازیابی شد.')}catch(e){alert('فایل پشتیبان معتبر نیست.')}};r.readAsText(file);ev.target.value=''}

/* ================= تنظیمات ================= */
function renderSettings() {
  document.getElementById("setting-name").value = state.name || "";
  document.querySelectorAll("#font-chips .chip").forEach(c => {
    c.classList.toggle("active", parseInt(c.dataset.size, 10) === state.fontSize);
    c.onclick = () => {
      state.fontSize = parseInt(c.dataset.size, 10);
      renderSettings();
    };
  });
}
function saveSettings() {
  state.name = document.getElementById("setting-name").value.trim();
  saveState();
  goTo("dashboard");
}
function resetData() {
  if (confirm("آیا مطمئن هستید؟ تمام پیشرفت شما پاک خواهد شد.")) {
    state = defaultState();
    saveState();
    goTo("dashboard");
  }
}

/* ================= ابزار: تبدیل اعداد به فارسی ================= */
function toFa(n) {
  const map = { "0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹" };
  return String(n).replace(/[0-9]/g, d => map[d]);
}

/* ================= شروع برنامه ================= */
document.addEventListener("DOMContentLoaded", () => {
  mountMascots();
  renderDashboard();
  renderSmartLayer();
  // ثبت سرویس‌ورکر برای نصب‌پذیری به‌عنوان اپ (PWA) در صورت پشتیبانی مرورگر
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // --- صفحه‌ی ورود سینمایی ---
  const name = state.name ? `${state.name} عزیز` : "";
  const menuName = document.getElementById("menu-profile-name");
  if (menuName) menuName.textContent = name ? `مسیر ${name}` : "شروع مسیر حفظ";
  document.getElementById("splash-status").textContent = "در حال آماده‌سازی مسیر شما…";
  setTimeout(() => {
    document.getElementById("splash-status").textContent = name ? `خوش آمدید، ${name} ✦` : "خوش آمدید ✦";
  }, 1050);
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    splash.classList.add("fade-out");
    showScreen("menu");
    setTimeout(() => splash.remove(), 650);
  }, 3000);
});

/* ================= ناوبری بین صفحات اصلی (منو / یادگیری / حفظ / کمک / سازنده) ================= */
function showScreen(name) {
  document.querySelectorAll(".top-screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
  if (name === "learn-list") renderLearnList();
  if (name === "recite") initCoach();
}
