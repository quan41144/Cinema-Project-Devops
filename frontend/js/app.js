// ==================== CẤU HÌNH API GATEWAY ====================
const API_BASE_URL =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:8080"
        : "";

// ==================== TRẠNG THÁI TOÀN CỤC ====================
const appState = {
  currentRoute: "home",
  authMode: "login",
  token: localStorage.getItem("cb_token") || null,
  customer: JSON.parse(localStorage.getItem("cb_customer") || "null"),
  heroSlide: 0,
  movies: [],
  showtimes: [],
  priceRules: [],
  calendarDate: null,
  selectedMovie: null,
  movieShowtimes: [],
  detailDate: null,
  seatMap: null,
  selectedSeats: [], // [{ seatCode, seatType, price }]
  lastResult: null,
  timers: { heroInterval: null, seatInterval: null, toastTimeout: null },
  remainingSeconds: 600,
};

// ==================== TIỆN ÍCH CHUNG ====================
function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

function formatDateSlash(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).split("-");
  return `${d}/${m}/${y}`;
}

function formatDateDash(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).split("-");
  return `${d}-${m}-${y}`;
}

function formatTimeShort(t) {
  return String(t || "").slice(0, 5);
}

function getWeekdayVi(isoDate) {
  const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const d = new Date(isoDate + "T00:00:00");
  return Number.isNaN(d.getTime()) ? "" : days[d.getDay()];
}

function clearTimers() {
  if (appState.timers.heroInterval) { clearInterval(appState.timers.heroInterval); appState.timers.heroInterval = null; }
  if (appState.timers.seatInterval) { clearInterval(appState.timers.seatInterval); appState.timers.seatInterval = null; }
}

function showToast(message) {
  const el = document.getElementById("toastNotice");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(appState.timers.toastTimeout);
  appState.timers.toastTimeout = setTimeout(() => el.classList.add("hidden"), 3000);
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (appState.token) {
    headers["Authorization"] = `Bearer ${appState.token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const traceId = res.headers.get("X-Trace-Id");
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }

  if (!res.ok) {
    if (res.status === 401 && appState.token) {
      logout(false);
    }
    const err = new Error(data?.message || `Lỗi máy chủ (HTTP ${res.status})`);
    err.status = res.status;
    err.traceId = traceId || data?.traceId;
    throw err;
  }
  return { data, traceId };
}

// ==================== XÁC THỰC & VÍ KHÁN GIẢ ====================
function saveSession(token, customer) {
  appState.token = token;
  appState.customer = customer;
  localStorage.setItem("cb_token", token);
  localStorage.setItem("cb_customer", JSON.stringify(customer));
  renderHeaderAuth();
}

function logout(notify = true) {
  appState.token = null;
  appState.customer = null;
  localStorage.removeItem("cb_token");
  localStorage.removeItem("cb_customer");
  renderHeaderAuth();
  if (notify) showToast("Đã đăng xuất.");
}

async function refreshWallet() {
  if (!appState.token || !appState.customer?.id) return;
  try {
    const { data } = await apiFetch(`/api/v1/customers/${appState.customer.id}`);
    appState.customer = data;
    localStorage.setItem("cb_customer", JSON.stringify(data));
    renderHeaderAuth();
  } catch { /* Phiên hết hạn sẽ tự logout trong apiFetch */ }
}

function renderHeaderAuth() {
  const desk = document.getElementById("desktopAuthArea");
  const mob = document.getElementById("mobileAuthArea");
  if (!desk || !mob) return;

  if (appState.token && appState.customer) {
    const bal = formatCurrency(appState.customer.walletBalance);
    desk.innerHTML = `
      <div class="h-10 px-4 rounded-full bg-ncc-card border border-white/10 flex items-center gap-2.5 text-sm">
        <span class="font-semibold text-white max-w-[140px] truncate">${appState.customer.fullName}</span>
        <span class="text-white/20">|</span>
        <span class="text-ncc-muted text-xs">Ví:</span>
        <span class="text-ncc-yellow font-bold tabular-nums">${bal}</span>
      </div>
      <button onclick="logout()"
        class="h-10 px-5 rounded-full border border-white/20 text-xs font-medium text-gray-300 hover:bg-white/10 transition">
        Đăng xuất
      </button>`;
    mob.innerHTML = `
      <div class="px-4 py-2.5 rounded-xl bg-ncc-card border border-white/10 flex items-center justify-between text-sm">
        <span class="font-semibold">${appState.customer.fullName}</span>
        <span class="text-ncc-yellow font-bold">${bal}</span>
      </div>
      <button onclick="logout()" class="h-10 rounded-full border border-white/20 text-sm">Đăng xuất</button>`;
  } else {
    desk.innerHTML = `
      <button onclick="openAuthModal('register')"
        class="h-10 px-7 rounded-full border border-white text-white text-sm font-medium hover:bg-white/10 transition">
        Đăng ký
      </button>
      <button onclick="openAuthModal('login')"
        class="h-10 px-7 btn-login-gradient rounded-full text-red-50 text-sm font-medium shadow-lg shadow-red-600/20">
        Đăng nhập
      </button>`;
    mob.innerHTML = `
      <div class="flex gap-3">
        <button onclick="openAuthModal('register')" class="flex-1 h-10 rounded-full border border-white text-sm font-medium">Đăng ký</button>
        <button onclick="openAuthModal('login')" class="flex-1 h-10 btn-login-gradient rounded-full text-sm font-medium">Đăng nhập</button>
      </div>`;
  }
}

function openAuthModal(mode) {
  appState.authMode = mode;
  const isReg = mode === "register";
  document.getElementById("authModalTitle").textContent = isReg ? "Đăng ký tài khoản" : "Đăng nhập";
  document.getElementById("authModalHint").textContent = isReg
      ? "Tài khoản mới tự động được tặng 500.000đ trong Ví khán giả để đặt vé."
      : "Đăng nhập để đặt vé và thanh toán bằng Ví khán giả.";
  document.getElementById("authSubmitBtn").textContent = isReg ? "Đăng ký" : "Đăng nhập";
  document.getElementById("registerFields").classList.toggle("hidden", !isReg);
  document.getElementById("authFullName").required = isReg;
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById("mobileMenu").classList.add("hidden");
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("authSubmitBtn");
  btn.disabled = true;
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  try {
    const isReg = appState.authMode === "register";
    const body = isReg
        ? {
          fullName: document.getElementById("authFullName").value.trim(),
          phone: document.getElementById("authPhone").value.trim(),
          email,
          password,
        }
        : { email, password };

    const { data } = await apiFetch(isReg ? "/api/v1/auth/register" : "/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    saveSession(data.accessToken, data.customer);
    closeModal("authModal");
    document.getElementById("authForm").reset();
    showToast(isReg ? `Đăng ký thành công! Số dư ví: ${formatCurrency(data.customer.walletBalance)}` : `Chào mừng ${data.customer.fullName}!`);
    if (appState.currentRoute === "payment") renderCurrentRoute();
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ==================== MODAL CHUNG ====================
async function openHistoryModal() {
  document.getElementById("mobileMenu").classList.add("hidden");
  if (!appState.token || !appState.customer) {
    showToast("Vui lòng đăng nhập để xem lịch sử đặt vé.");
    openAuthModal("login");
    return;
  }
  const container = document.getElementById("historyListContainer");
  container.innerHTML = `<p class="text-sm text-ncc-muted">Đang tải từ order-service...</p>`;
  document.getElementById("historyModal").classList.remove("hidden");

  try {
    const { data: orders } = await apiFetch(`/api/v1/orders?customerId=${appState.customer.id}`);
    if (!orders.length) {
      container.innerHTML = `<p class="text-sm text-ncc-muted text-center py-6">Bạn chưa có đơn đặt vé nào.</p>`;
      return;
    }
    container.innerHTML = orders
        .map((o) => {
          const ok = o.status === "CONFIRMED";
          return `
          <div class="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-sm">
            <div class="flex items-center justify-between gap-2">
              <strong class="text-white">#${o.orderId} (${o.orderCode}) — ${o.movieTitle || "Suất chiếu"}</strong>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}">${o.status}</span>
            </div>
            <div class="text-xs text-ncc-muted flex flex-wrap gap-x-4 gap-y-1">
              <span>Ghế: <strong class="text-white">${(o.seatCodes || []).join(", ")}</strong></span>
              <span>Tổng: <strong class="text-ncc-yellow">${formatCurrency(o.totalAmount)}</strong></span>
              ${ok ? `<span>Mã vé: <strong class="text-green-400">${o.ticketCode}</strong></span>` : `<span class="text-red-400">Lý do: ${o.cancelReason || "-"}</span>`}
            </div>
            ${o.traceId ? `<div class="text-xs text-sky-400 font-mono break-all">trace.id: ${o.traceId}</div>` : ""}
          </div>`;
        })
        .join("");
  } catch (err) {
    container.innerHTML = `<p class="text-sm text-red-400">${err.message}</p>`;
  }
}

function openContentModal() {
  document.getElementById("fullSynopsisText").textContent = appState.selectedMovie?.synopsisFull || "Chưa có mô tả chi tiết.";
  document.getElementById("contentModal").classList.remove("hidden");
}

function openTrailerModal() {
  document.getElementById("trailerTitle").textContent = `Trailer - ${appState.selectedMovie?.title || ""}`;
  document.getElementById("trailerIframe").src = appState.selectedMovie?.trailerUrl || "";
  document.getElementById("trailerModal").classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  if (id === "trailerModal") document.getElementById("trailerIframe").src = "";
}

document.getElementById("mobileMenuBtn").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("hidden");
});

// ==================== ĐIỀU HƯỚNG (SPA ROUTER) ====================
function navigateTo(route) {
  window.location.hash = route;
}

async function openMovieDetail(movieId) {
  try {
    const [{ data: movie }, { data: slots }] = await Promise.all([
      apiFetch(`/api/v1/movies/${movieId}`),
      apiFetch(`/api/v1/showtimes?movieId=${movieId}`),
    ]);
    appState.selectedMovie = movie;
    appState.movieShowtimes = slots;
    appState.detailDate = slots[0]?.showDate || null;
    navigateTo("movie-detail");
  } catch (err) {
    showToast("Không tải được chi tiết phim: " + err.message);
  }
}

async function openChooseTicket(showtimeId, movieId = null) {
  try {
    const { data: seatMap } = await apiFetch(`/api/v1/showtimes/${showtimeId}/seats`);

    const targetMovieId = movieId || seatMap.movieId;
    if (!appState.selectedMovie || appState.selectedMovie.id !== targetMovieId) {
      const [{ data: movie }, { data: slots }] = await Promise.all([
        apiFetch(`/api/v1/movies/${targetMovieId}`),
        apiFetch(`/api/v1/showtimes?movieId=${targetMovieId}`),
      ]);
      appState.selectedMovie = movie;
      appState.movieShowtimes = slots;
    }

    appState.seatMap = seatMap;
    appState.detailDate = seatMap.showDate;
    appState.selectedSeats = [];

    if (appState.currentRoute === "choose-ticket") renderCurrentRoute();
    else navigateTo("choose-ticket");
  } catch (err) {
    showToast("Không tải được sơ đồ ghế: " + err.message);
  }
}

function updateActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isMatch = link.dataset.route === route;
    link.classList.toggle("text-ncc-red", isMatch);
    link.classList.toggle("font-semibold", isMatch);
    link.classList.toggle("text-white", !isMatch);
  });
}

function setBodyTheme(route) {
  document.body.classList.remove("theme-home", "theme-payment", "theme-default");
  if (route === "home") document.body.classList.add("theme-home");
  else if (route === "payment") document.body.classList.add("theme-payment");
  else document.body.classList.add("theme-default");
}

async function renderCurrentRoute() {
  clearTimers();
  document.getElementById("mobileMenu").classList.add("hidden");

  const rawHash = (window.location.hash || "#home").replace("#", "").split("?")[0];
  const validRoutes = ["home", "calendar", "ticket-price", "movie-detail", "choose-ticket", "payment", "payment-success"];
  const route = validRoutes.includes(rawHash) ? rawHash : "home";
  appState.currentRoute = route;

  setBodyTheme(route);
  updateActiveNav(route);

  const appEl = document.getElementById("app");
  switch (route) {
    case "home":
      document.title = "Trang chủ — CinemaBox";
      appEl.innerHTML = buildLoadingHTML("Đang tải danh sách phim từ cinema-service...");
      await loadHomeData();
      appEl.innerHTML = buildHomeView();
      initHomeView();
      break;
    case "calendar":
      document.title = "Lịch chiếu — CinemaBox";
      appEl.innerHTML = buildLoadingHTML("Đang tải lịch chiếu...");
      await loadCalendarData();
      appEl.innerHTML = buildCalendarView();
      renderCalendarDates();
      renderCalendarMovies();
      break;
    case "ticket-price":
      document.title = "Giá vé — CinemaBox";
      appEl.innerHTML = buildLoadingHTML("Đang tải bảng giá vé 2D & 3D...");
      await loadPriceData();
      appEl.innerHTML = buildTicketPriceView();
      break;
    case "movie-detail":
      if (!appState.selectedMovie) { navigateTo("home"); return; }
      document.title = `${appState.selectedMovie.title} — CinemaBox`;
      appEl.innerHTML = buildMovieDetailView();
      renderDetailDateTabs();
      renderDetailShowtimes();
      break;
    case "choose-ticket":
      if (!appState.seatMap || !appState.selectedMovie) { navigateTo("calendar"); return; }
      document.title = `Chọn ghế — ${appState.selectedMovie.title}`;
      appEl.innerHTML = buildChooseTicketView();
      initChooseTicketView();
      break;
    case "payment":
      if (!appState.seatMap || !appState.selectedSeats.length) { navigateTo("calendar"); return; }
      document.title = "Thanh toán ví — CinemaBox";
      await refreshWallet();
      appEl.innerHTML = buildPaymentView();
      break;
    case "payment-success":
      if (!appState.lastResult) { navigateTo("home"); return; }
      document.title = "Kết quả đặt vé — CinemaBox";
      appEl.innerHTML = buildPaymentSuccessView();
      break;
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

function buildLoadingHTML(text) {
  return `<div class="pt-40 pb-24 text-center text-ncc-muted text-sm">${text}</div>`;
}

// =========================================================================
// VIEW 1: HOMEPAGE (GET /api/v1/movies)
// =========================================================================
async function loadHomeData() {
  try {
    const { data } = await apiFetch("/api/v1/movies");
    appState.movies = data || [];
  } catch (err) {
    appState.movies = [];
    showToast("Lỗi tải phim từ API Gateway: " + err.message);
  }
}

function buildMovieCardHTML(movie) {
  const genre = (movie.categories || []).join(", ");
  return `
    <article onclick="openMovieDetail(${movie.id})" class="movie-card group flex flex-col gap-3 cursor-pointer">
      <div class="w-full aspect-[229/290] bg-white/5 rounded-xl overflow-hidden shadow-lg shadow-black/30">
        <img src="${movie.posterUrl}" alt="${movie.title}" loading="lazy"
          class="movie-poster w-full h-full object-cover rounded-xl transition-transform duration-300 ease-out" />
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-ncc-gray">
          ${genre ? `<span>${genre}</span>` : ""}
          <span>${formatDateSlash(movie.releaseDate)}</span>
        </div>
        <h3 class="text-white text-base font-bold leading-6 group-hover:text-ncc-red transition-colors">${movie.title}</h3>
      </div>
    </article>`;
}

function buildHomeView() {
  const nowShowing = appState.movies.filter((m) => m.status === "NOW_SHOWING");
  const comingSoon = appState.movies.filter((m) => m.status === "COMING_SOON");

  return `
    <section class="relative w-full mt-16 lg:mt-20 h-[280px] sm:h-[420px] lg:h-[560px] overflow-hidden bg-zinc-950">
      <div id="heroSlides" class="relative w-full h-full"></div>
      <div class="pointer-events-none absolute inset-0 bg-black/35"></div>
      <div class="pointer-events-none absolute inset-0 hero-overlay-gradient"></div>

      <button onclick="stepHeroSlide(-1)" aria-label="Banner trước"
        class="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-[6px] flex items-center justify-center text-white hover:bg-white/20 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onclick="stepHeroSlide(1)" aria-label="Banner tiếp theo"
        class="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-[6px] flex items-center justify-center text-white hover:bg-white/20 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
      <div id="heroDots" class="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"></div>
    </section>

    <div class="max-w-[1440px] mx-auto px-4 md:px-10 xl:px-[80px] pt-14 pb-20 space-y-16">
      <section>
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 rounded-full bg-ncc-red inline-block"></span>
            <h2 class="text-xl font-bold text-white">Phim đang chiếu</h2>
          </div>
          <a href="#calendar" class="text-base text-white underline hover:text-ncc-red">Xem tất cả</a>
        </div>
        ${
      nowShowing.length
          ? `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 xl:gap-x-7 gap-y-8">${nowShowing.map(buildMovieCardHTML).join("")}</div>`
          : `<p class="text-sm text-ncc-muted">Chưa có phim đang chiếu (hãy chạy file <code>deploy/seed-data.sql</code>).</p>`
  }
      </section>

      ${
      comingSoon.length
          ? `<section>
               <div class="flex items-center gap-2.5 mb-6">
                 <span class="w-4 h-4 rounded-full bg-ncc-red inline-block"></span>
                 <h2 class="text-xl font-bold text-white">Phim sắp chiếu</h2>
               </div>
               <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 xl:gap-x-7 gap-y-8">${comingSoon.map(buildMovieCardHTML).join("")}</div>
             </section>`
          : ""
  }
    </div>`;
}

function getHeroSlides() {
  const list = appState.movies.filter((m) => m.status === "NOW_SHOWING").slice(0, 3);
  return list.length ? list : [{ id: null, title: "CINEMABOX — ĐẶT VÉ XEM PHIM", posterUrl: "https://placehold.co/1440x560/161b26/ffffff?text=CINEMABOX" }];
}

function renderHeroCarousel() {
  const slidesEl = document.getElementById("heroSlides");
  const dotsEl = document.getElementById("heroDots");
  if (!slidesEl || !dotsEl) return;
  const slides = getHeroSlides();
  if (appState.heroSlide >= slides.length) appState.heroSlide = 0;

  slidesEl.innerHTML = slides
      .map(
          (s, idx) => `
      <div class="absolute inset-0 transition-opacity duration-700 ${idx === appState.heroSlide ? "opacity-100 z-10" : "opacity-0 z-0"}">
        <img src="https://placehold.co/1440x560/161b26/ffffff?text=${encodeURIComponent(s.title)}" alt="${s.title}" class="w-full h-full object-cover" />
        <div class="absolute inset-x-0 bottom-14 z-20 max-w-[1440px] mx-auto px-6 lg:px-[80px]">
          <h1 class="text-2xl sm:text-4xl font-extrabold text-white drop-shadow mb-4">${s.title}</h1>
          ${s.id ? `<button onclick="openMovieDetail(${s.id})" class="h-10 px-7 btn-login-gradient rounded-full text-sm font-semibold text-white shadow-lg shadow-red-600/30">Đặt vé ngay</button>` : ""}
        </div>
      </div>`
      )
      .join("");

  dotsEl.innerHTML = slides
      .map((_, idx) => `<button onclick="goToHeroSlide(${idx})" class="h-2 rounded-full transition-all ${idx === appState.heroSlide ? "w-6 bg-ncc-red" : "w-2 bg-white/40"}"></button>`)
      .join("");
}

function stepHeroSlide(delta) {
  const total = getHeroSlides().length;
  appState.heroSlide = (appState.heroSlide + delta + total) % total;
  renderHeroCarousel();
}
function goToHeroSlide(idx) { appState.heroSlide = idx; renderHeroCarousel(); }
function initHomeView() { renderHeroCarousel(); appState.timers.heroInterval = setInterval(() => stepHeroSlide(1), 5000); }

// =========================================================================
// VIEW 2: CALENDAR (GET /api/v1/showtimes)
// =========================================================================
async function loadCalendarData() {
  try {
    const { data } = await apiFetch("/api/v1/showtimes");
    appState.showtimes = data || [];
    const dates = [...new Set(appState.showtimes.map((s) => s.showDate))].sort();
    if (!appState.calendarDate || !dates.includes(appState.calendarDate)) {
      appState.calendarDate = dates[0] || null;
    }
  } catch (err) {
    appState.showtimes = [];
    showToast("Lỗi tải lịch chiếu: " + err.message);
  }
}

function buildCalendarView() {
  return `
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 xl:px-[80px] pt-[96px] lg:pt-[124px] pb-16">
      <div class="flex justify-center items-center gap-2 mb-5">
        <span class="w-4 h-4 rounded-full bg-ncc-red inline-block"></span>
        <h1 class="text-white text-xl font-bold">Phim đang chiếu</h1>
      </div>
      <div id="calendarDateFilters" class="flex flex-wrap justify-center items-center gap-3 mb-5"></div>
      <p class="text-center text-ncc-orange text-sm max-w-[910px] mx-auto mb-9">
        <span class="font-bold">Lưu ý:</span> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước 22h và Khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc trước 23h.
      </p>
      <div id="calendarMoviesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6"></div>
    </div>`;
}

function renderCalendarDates() {
  const container = document.getElementById("calendarDateFilters");
  if (!container) return;
  const dates = [...new Set(appState.showtimes.map((s) => s.showDate))].sort();
  container.innerHTML = dates
      .map((d) => {
        const active = d === appState.calendarDate;
        return `<button onclick="selectCalendarDate('${d}')"
        class="h-9 px-4 rounded-md text-sm font-medium transition-all ${active ? "btn-date-active text-red-50 shadow-md shadow-red-600/20" : "border border-slate-800 text-white hover:bg-white/5"}">
        ${formatDateDash(d)} (${getWeekdayVi(d)})
      </button>`;
      })
      .join("");
}

function selectCalendarDate(date) {
  appState.calendarDate = date;
  renderCalendarDates();
  renderCalendarMovies();
}

function renderCalendarMovies() {
  const container = document.getElementById("calendarMoviesGrid");
  if (!container) return;
  const daySlots = appState.showtimes.filter((s) => s.showDate === appState.calendarDate);
  if (!daySlots.length) {
    container.innerHTML = `<p class="md:col-span-2 text-center text-ncc-muted text-sm py-8">Không có suất chiếu trong ngày này.</p>`;
    return;
  }

  const grouped = new Map();
  daySlots.forEach((s) => {
    if (!grouped.has(s.movieId)) grouped.set(s.movieId, { info: s, slots: [] });
    grouped.get(s.movieId).slots.push(s);
  });

  container.innerHTML = [...grouped.values()]
      .map(({ info, slots }) => `
      <article class="w-full rounded-xl border border-ncc-border-gray overflow-hidden flex items-stretch bg-[#10141B] hover:border-gray-500 transition-colors">
        <div onclick="openMovieDetail(${info.movieId})" class="w-[144px] xl:w-[210px] flex-shrink-0 bg-white/5 overflow-hidden cursor-pointer group">
          <img src="${info.posterUrl}" alt="${info.movieTitle}" loading="lazy"
            class="w-full h-full min-h-[210px] xl:min-h-[280px] object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div class="flex-1 min-w-0 relative p-4 pt-5 xl:p-6 flex flex-col justify-between gap-3">
          <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md border border-gray-600 text-gray-300 text-xs font-semibold">${info.format}</span>
          <div class="flex flex-col gap-1.5">
            <div class="text-slate-400 text-xs md:text-sm pr-10">${info.durationMinutes} phút • Phân loại ${info.ageRating}</div>
            <h2 onclick="openMovieDetail(${info.movieId})" class="pr-10 text-white text-sm md:text-base font-bold cursor-pointer hover:text-ncc-red">${info.movieTitle}</h2>
            <p class="text-ncc-muted text-xs md:text-sm">Giá ghế thường từ: <span class="text-ncc-yellow font-semibold">${formatCurrency(info.standardPrice)}</span></p>
          </div>
          <div class="flex flex-col gap-2 pt-1">
            <span class="text-white text-xs md:text-sm font-semibold">Lịch chiếu</span>
            <div class="flex flex-wrap items-center gap-2">
              ${slots.map((sl) => `
                <button type="button" onclick="openChooseTicket(${sl.id}, ${info.movieId})"
                  class="h-8 xl:h-9 px-3 rounded-md border border-white text-white text-xs xl:text-sm font-medium hover:bg-ncc-red hover:border-ncc-red transition-colors">
                  ${formatTimeShort(sl.startTime)}
                </button>`).join("")}
            </div>
          </div>
        </div>
      </article>`)
      .join("");
}

// =========================================================================
// VIEW 3: TICKET PRICE (GET /api/v1/prices — Bảng giá thật từ PostgreSQL)
// =========================================================================
async function loadPriceData() {
  try {
    const { data } = await apiFetch("/api/v1/prices");
    appState.priceRules = data || [];
  } catch (err) {
    appState.priceRules = [];
    showToast("Lỗi tải bảng giá: " + err.message);
  }
}

function buildPriceTableFromApi(format) {
  const slots = [
    { key: "BEFORE_12", vi: "Trước 12h", en: "Before 12PM" },
    { key: "12_TO_17", vi: "Từ 12:00 đến trước 17:00", en: "From 12PM to before 5PM" },
    { key: "17_TO_23", vi: "Từ 17:00 đến trước 23:00", en: "From 5PM to before 11PM" },
    { key: "AFTER_23", vi: "Từ 23:00", en: "From 11PM" },
  ];
  const findPrice = (dayType, slotKey, seatType) => {
    const r = appState.priceRules.find((x) => x.format === format && x.dayType === dayType && x.timeSlot === slotKey && x.seatType === seatType);
    return r ? formatCurrency(r.basePrice) : "—";
  };

  return `
    <table class="w-full min-w-[736px] border-collapse text-sm leading-5">
      <thead>
        <tr class="border-b border-ncc-border">
          <th class="w-[26%] bg-ncc-dark border-r border-ncc-red"></th>
          <th colspan="3" class="px-4 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-muted font-bold">Từ thứ 2 đến thứ 5<br/>From Monday to Thursday</th>
          <th colspan="3" class="px-4 py-2.5 bg-ncc-dark text-center text-ncc-muted font-bold">Thứ 6, 7, CN và ngày Lễ<br/>Friday, Saturday, Sunday &amp; holiday</th>
        </tr>
        <tr class="border-b border-ncc-red">
          <th class="px-4 py-3 bg-ncc-dark border-r border-ncc-red text-left text-ncc-muted font-medium">Thời gian</th>
          <th class="px-3 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-muted font-semibold">Ghế thường</th>
          <th class="px-3 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-yellow font-semibold">Ghế VIP</th>
          <th class="px-3 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-red font-semibold">Ghế đôi</th>
          <th class="px-3 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-muted font-semibold">Ghế thường</th>
          <th class="px-3 py-2.5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-yellow font-semibold">Ghế VIP</th>
          <th class="px-3 py-2.5 bg-ncc-dark text-center text-ncc-red font-semibold">Ghế đôi</th>
        </tr>
      </thead>
      <tbody>
        ${slots.map((s, idx) => `
          <tr class="${idx < slots.length - 1 ? "border-b border-ncc-red" : ""}">
            <td class="px-4 py-4 bg-ncc-dark border-r border-ncc-red text-white font-medium">${s.vi}<br/><span class="text-xs text-ncc-muted">${s.en}</span></td>
            <td class="px-3 py-5 bg-ncc-dark border-r border-ncc-red text-center">${findPrice("WEEKDAY", s.key, "STANDARD")}</td>
            <td class="px-3 py-5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-yellow font-medium">${findPrice("WEEKDAY", s.key, "VIP")}</td>
            <td class="px-3 py-5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-red font-medium">${findPrice("WEEKDAY", s.key, "COUPLE")}</td>
            <td class="px-3 py-5 bg-ncc-dark border-r border-ncc-red text-center">${findPrice("WEEKEND_HOLIDAY", s.key, "STANDARD")}</td>
            <td class="px-3 py-5 bg-ncc-dark border-r border-ncc-red text-center text-ncc-yellow font-medium">${findPrice("WEEKEND_HOLIDAY", s.key, "VIP")}</td>
            <td class="px-3 py-5 bg-ncc-dark text-center text-ncc-red font-medium">${findPrice("WEEKEND_HOLIDAY", s.key, "COUPLE")}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function buildTicketPriceView() {
  return `
    <div class="max-w-[1440px] mx-auto px-4 xl:px-[80px] pt-[104px] lg:pt-[128px] pb-16">
      <div class="text-center mb-10">
        <h1 class="text-white text-2xl font-bold">Giá vé</h1>
      </div>
      <section class="mb-10 lg:p-6 lg:bg-ncc-dark lg:rounded-2xl lg:border lg:border-ncc-red lg:price-card-shadow">
        <h2 class="text-white text-lg font-semibold mb-4">1. GIÁ VÉ XEM PHIM 2D</h2>
        <div class="w-full overflow-x-auto rounded-xl border border-ncc-red bg-ncc-dark">${buildPriceTableFromApi("2D")}</div>
        <p class="mt-4 text-ncc-muted text-sm">* Đối với phim có thời lượng từ 150 phút trở lên: tự động phụ thu 10.000đ / vé.</p>
      </section>
      <section class="lg:p-6 lg:bg-ncc-dark lg:rounded-2xl lg:border lg:border-ncc-red lg:price-card-shadow">
        <h2 class="text-white text-lg font-semibold mb-4">2. GIÁ VÉ XEM PHIM 3D</h2>
        <div class="w-full overflow-x-auto rounded-xl border border-ncc-red bg-ncc-dark">${buildPriceTableFromApi("3D")}</div>
        <p class="mt-4 text-ncc-muted text-sm">* Đối với phim có thời lượng từ 150 phút trở lên: tự động phụ thu 10.000đ / vé.</p>
      </section>
    </div>`;
}

// =========================================================================
// VIEW 4: MOVIE DETAIL (GET /api/v1/movies/{id})
// =========================================================================
function buildMovieHeroSection(m) {
  const genre = (m.categories || []).join(", ") || "Điện ảnh";
  return `
    <section class="relative w-full min-h-[430px] overflow-hidden">
      <img src="${m.backdropUrl || m.posterUrl}" alt="Backdrop" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 backdrop-gradient-right"></div>
      <div class="absolute inset-0 bg-[#10141B]/65"></div>

      <div class="relative z-10 max-w-[928px] mx-auto px-4 pt-[100px] pb-10 flex flex-col sm:flex-row items-center sm:items-start gap-7 lg:gap-10">
        <img src="${m.posterUrl}" alt="${m.title}" class="w-[180px] h-[255px] lg:w-[230px] lg:h-[325px] object-cover rounded-xl flex-shrink-0 shadow-2xl" />
        <div class="flex-1 pt-1 text-center sm:text-left">
          <div class="flex items-center justify-center sm:justify-start flex-wrap gap-3 mb-3">
            <h1 class="text-white text-2xl lg:text-3xl font-bold">${m.title}</h1>
            <span class="px-2 py-0.5 rounded-lg border border-white text-white text-xs font-bold">2D</span>
          </div>
          <div class="flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-1 text-white text-sm mb-2">
            <span>${genre}</span>
            ${m.country ? `<span>${m.country}</span>` : ""}
            <span>${m.durationMinutes} phút</span>
            ${m.director ? `<span>Đạo diễn: ${m.director}</span>` : ""}
          </div>
          <div class="text-zinc-300 text-sm space-y-1 mb-4">
            ${m.castList ? `<p>Diễn viên: ${m.castList}</p>` : ""}
            <p>Khởi chiếu: ${formatDateSlash(m.releaseDate)}</p>
          </div>
          <p class="text-gray-200 text-sm mb-4 line-clamp-3">${m.synopsisShort || ""}</p>
          <p class="text-ncc-red text-sm font-medium mb-5">${m.ratingDescription || `Kiểm duyệt: ${m.ageRating}`}</p>
          <div class="flex items-center justify-center sm:justify-start gap-6">
            <button onclick="openContentModal()" class="text-white text-sm underline hover:text-ncc-red">Chi tiết nội dung</button>
            ${m.trailerUrl ? `<button onclick="openTrailerModal()" class="px-8 py-2 rounded-full border border-ncc-yellow text-ncc-yellow text-sm hover:bg-ncc-yellow/10 transition">Xem trailer</button>` : ""}
          </div>
        </div>
      </div>
    </section>`;
}

function buildMovieDetailView() {
  return `
    ${buildMovieHeroSection(appState.selectedMovie)}
    <section class="w-full h-24 bg-ncc-surface flex justify-center items-stretch">
      <div id="detailDateTabs" class="flex items-stretch"></div>
    </section>
    <section class="max-w-[960px] mx-auto px-4 pt-5 pb-16">
      <p class="text-center text-ncc-orange text-sm mb-6">
        <span class="font-semibold">Lưu ý:</span> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước 22h và dưới 16 tuổi kết thúc trước 23h.
      </p>
      <div id="detailShowtimeGrid" class="max-w-[896px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"></div>
    </section>`;
}

function renderDetailDateTabs() {
  const el = document.getElementById("detailDateTabs");
  if (!el) return;
  const dates = [...new Set(appState.movieShowtimes.map((s) => s.showDate))].sort();
  if (!dates.length) {
    el.innerHTML = `<div class="flex items-center text-sm text-ncc-muted">Phim sắp chiếu — chưa có lịch chiếu.</div>`;
    return;
  }
  if (!dates.includes(appState.detailDate)) appState.detailDate = dates[0];

  el.innerHTML = dates
      .map((d) => {
        const [, m, day] = d.split("-");
        const active = d === appState.detailDate;
        return `
        <button onclick="selectDetailDate('${d}')"
          class="w-[78px] px-2 pt-3 pb-3 flex flex-col justify-center items-center transition-colors ${active ? "bg-ncc-red-dark text-white" : "hover:bg-white/5 text-gray-300"}">
          <span class="text-xs">Th. ${parseInt(m, 10)}</span>
          <span class="text-xl font-bold text-white">${day}</span>
          <span class="text-xs">${getWeekdayVi(d)}</span>
        </button>`;
      })
      .join("");
}

function renderDetailShowtimes() {
  const el = document.getElementById("detailShowtimeGrid");
  if (!el) return;
  const slots = appState.movieShowtimes.filter((s) => s.showDate === appState.detailDate);
  if (!slots.length) { el.innerHTML = ""; return; }

  el.innerHTML = slots
      .map((s) => `
      <button onclick="openChooseTicket(${s.id}, ${s.movieId})"
        class="h-12 w-full rounded-full border border-ncc-border bg-gray-800/60 hover:bg-ncc-red hover:border-ncc-red text-white text-sm font-bold flex flex-col items-center justify-center transition-colors">
        <span>${formatTimeShort(s.startTime)}</span>
        <span class="text-[11px] font-normal text-gray-300">${s.roomName}</span>
      </button>`)
      .join("");
}

function selectDetailDate(date) {
  appState.detailDate = date;
  renderDetailDateTabs();
  renderDetailShowtimes();
}

// =========================================================================
// VIEW 5: CHOOSE TICKET (SƠ ĐỒ GHẾ THẬT + CÔNG TẮC KHOÁ SUẤT CHIẾU)
// =========================================================================
function buildChooseTicketView() {
  const sm = appState.seatMap;
  return `
    ${buildMovieHeroSection(appState.selectedMovie)}

    <section class="w-full h-20 bg-zinc-900 flex justify-center items-stretch">
      <div id="seatDateTabs" class="flex items-stretch gap-1"></div>
    </section>

    <section class="max-w-[928px] mx-auto px-4 pt-5 pb-4">
      <div id="seatShowtimeGrid" class="max-w-[896px] mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 md:gap-4"></div>
    </section>

    <section class="max-w-[928px] mx-auto px-4 pb-8 lg:pb-12">
      <div class="flex max-w-[896px] mx-auto px-5 py-3 bg-zinc-900 rounded-xl border border-white/10 justify-between items-center mb-4 text-sm md:text-base font-bold">
        <div>Giờ chiếu: <span class="text-ncc-red">${formatTimeShort(sm.startTime)}</span> <span class="text-ncc-muted font-normal text-xs ml-1">(${formatDateSlash(sm.showDate)})</span></div>
        <div class="px-3.5 py-1 rounded-full border border-ncc-red text-xs md:text-sm font-normal">
          Thời gian chọn ghế: <span id="seatCountdown" class="font-semibold tabular-nums">10:00</span>
        </div>
      </div>

      <div class="max-w-[898px] mx-auto mb-3 select-none">
        <svg viewBox="0 0 900 100" class="w-full h-auto overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="screenGlow" x1="450" y1="14" x2="450" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#F97316" stop-opacity="0.35" /><stop offset="100%" stop-color="#F97316" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="screenStroke" x1="40" y1="30" x2="860" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#EA580C" stop-opacity="0.2" /><stop offset="50%" stop-color="#FB923C" stop-opacity="1" /><stop offset="100%" stop-color="#EA580C" stop-opacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M35 38 Q450 -10 865 38 L835 95 Q450 58 65 95 Z" fill="url(#screenGlow)" />
          <path d="M35 38 Q450 -10 865 38" stroke="url(#screenStroke)" stroke-width="6" stroke-linecap="round" />
        </svg>
      </div>

      <div class="flex justify-center items-center gap-3 mb-6">
        <span class="hidden lg:inline-block w-20 h-0.5 bg-ncc-red-dark"></span>
        <h2 class="text-white text-base md:text-lg font-bold">${sm.roomName} <span class="text-xs font-normal text-ncc-muted">(Còn ${sm.availableSeats} ghế trống)</span></h2>
        <span class="hidden lg:inline-block w-20 h-0.5 bg-ncc-red-dark"></span>
      </div>

      <div class="w-full overflow-x-auto pb-2">
        <div id="seatMapContainer" class="flex flex-col items-center gap-1.5 md:gap-2 lg:gap-2.5 min-w-fit mx-auto"></div>
      </div>

      <div class="mt-8 flex justify-center">
        <div class="lg:px-8 lg:py-4 lg:bg-zinc-900 lg:rounded-xl lg:border lg:border-white/5 flex flex-wrap justify-center items-center gap-5">
          <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-sm bg-seat-regular flex items-center justify-center text-slate-500 text-xs">X</span><span class="text-gray-300 text-xs">Đã đặt</span></div>
          <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-sm bg-seat-selected inline-block"></span><span class="text-gray-300 text-xs">Ghế bạn chọn</span></div>
          <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-sm bg-seat-regular inline-block"></span><span class="text-gray-300 text-xs">Ghế thường</span></div>
          <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-sm bg-seat-vip inline-block"></span><span class="text-gray-300 text-xs">Ghế VIP</span></div>
          <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-sm bg-seat-couple inline-block"></span><span class="text-gray-300 text-xs">Ghế đôi</span></div>
        </div>
      </div>
    </section>

    <section class="w-full lg:bg-zinc-900 lg:border-t lg:border-white/10 py-5 px-4 md:px-6 mb-8">
      <div class="max-w-[928px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div class="flex flex-col gap-1">
          <div class="text-gray-400 text-sm">Ghế đã chọn: <span id="selectedSeatsText" class="text-white font-semibold ml-1">—</span></div>
          <div class="text-base lg:text-lg"><span>Tổng tiền: </span><span id="totalPriceText" class="text-ncc-red font-bold">0đ</span></div>
        </div>
        <div class="w-full md:w-auto flex items-center gap-4">
          <button onclick="navigateTo('movie-detail')" class="flex-1 md:flex-none h-10 px-8 rounded-full border border-white text-white text-sm font-medium hover:bg-white/10 transition">Quay lại</button>
          <button onclick="proceedToPayment()" class="flex-1 md:flex-none h-10 px-8 btn-login-gradient rounded-full text-red-50 text-sm font-medium shadow-lg shadow-red-600/20">Thanh toán</button>
        </div>
      </div>
    </section>`;
}

function initChooseTicketView() {
  const dates = [...new Set(appState.movieShowtimes.map((s) => s.showDate))].sort();
  document.getElementById("seatDateTabs").innerHTML = dates
      .map((d) => {
        const [, m, day] = d.split("-");
        const active = d === appState.seatMap.showDate;
        return `<button onclick="changeSeatDate('${d}')" class="w-[74px] px-2 py-2 flex flex-col items-center justify-center ${active ? "bg-ncc-red-dark text-white" : "text-gray-400 hover:bg-white/5"}">
        <span class="text-xs">Th. ${parseInt(m, 10)}</span><span class="text-lg font-bold text-white">${day}</span><span class="text-[11px]">${getWeekdayVi(d)}</span>
      </button>`;
      })
      .join("");

  const daySlots = appState.movieShowtimes.filter((s) => s.showDate === appState.seatMap.showDate);
  document.getElementById("seatShowtimeGrid").innerHTML = daySlots
      .map((s) => `<button onclick="openChooseTicket(${s.id}, ${s.movieId})" class="h-10 rounded-full border text-sm font-bold ${s.id === appState.seatMap.showtimeId ? "bg-gray-800 border-ncc-red text-white" : "border-ncc-border text-white hover:bg-gray-800/60"}">${formatTimeShort(s.startTime)}</button>`)
      .join("");

  renderSeatMap();
  updateSeatSummary();
  startSeatCountdown();
}

function changeSeatDate(date) {
  const first = appState.movieShowtimes.find((s) => s.showDate === date);
  if (first) openChooseTicket(first.id, first.movieId);
}

function renderSeatMap() {
  const container = document.getElementById("seatMapContainer");
  if (!container) return;

  const byRow = new Map();
  (appState.seatMap.seats || []).forEach((s) => {
    const match = s.seatCode.match(/^([A-Z]+)(\d+)$/);
    const row = match ? match[1] : s.seatCode[0];
    const col = match ? parseInt(match[2], 10) : 0;
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row).push({ ...s, col });
  });

  const sortedRows = [...byRow.keys()].sort();
  container.innerHTML = sortedRows
      .map((row) => {
        const rowSeats = byRow.get(row).sort((a, b) => a.col - b.col);
        const html = rowSeats
            .map((s) => {
              const isUnavailable = s.status !== "AVAILABLE";
              const isSelected = appState.selectedSeats.some((x) => x.seatCode === s.seatCode);
              let cls = "bg-seat-regular text-white hover:brightness-125";
              if (isUnavailable) cls = "bg-seat-regular text-slate-500 cursor-not-allowed";
              else if (isSelected) cls = "bg-seat-selected text-white ring-2 ring-blue-300/60";
              else if (s.seatType === "VIP") cls = "bg-seat-vip text-white hover:brightness-110";
              else if (s.seatType === "COUPLE") cls = "bg-seat-couple text-white hover:brightness-110";

              return `
            <button type="button" ${isUnavailable ? "disabled" : `onclick="toggleSeat('${s.seatCode}')"`}
              title="${isUnavailable ? `Ghế ${s.seatCode} (${s.status})` : `Ghế ${s.seatCode} (${s.seatType} - ${formatCurrency(s.price)})`}"
              class="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-10 lg:h-10 rounded-sm flex items-center justify-center transition-all select-none ${cls}">
              ${isUnavailable ? `<span class="text-[9px] md:text-xs lg:text-base">X</span>` : `<span class="hidden lg:inline text-xs font-medium">${s.seatCode}</span>`}
            </button>`;
            })
            .join("");

        return `
        <div class="flex items-center gap-2 md:gap-3 lg:gap-2">
          <span class="lg:hidden w-4 text-center text-white text-xs">${row}</span>
          <div class="flex items-center gap-1 md:gap-2">${html}</div>
          <span class="lg:hidden w-4 text-center text-white text-xs">${row}</span>
        </div>`;
      })
      .join("");
}

function toggleSeat(code) {
  const idx = appState.selectedSeats.findIndex((s) => s.seatCode === code);
  if (idx > -1) {
    appState.selectedSeats.splice(idx, 1);
  } else {
    if (appState.selectedSeats.length >= 8) { showToast("Chọn tối đa 8 ghế mỗi lần đặt."); return; }
    const found = appState.seatMap.seats.find((s) => s.seatCode === code);
    if (found) appState.selectedSeats.push({ seatCode: found.seatCode, seatType: found.seatType, price: Number(found.price) });
  }
  renderSeatMap();
  updateSeatSummary();
}

function updateSeatSummary() {
  const total = appState.selectedSeats.reduce((sum, s) => sum + s.price, 0);
  document.getElementById("selectedSeatsText").textContent = appState.selectedSeats.length ? appState.selectedSeats.map((s) => s.seatCode).join(", ") : "—";
  document.getElementById("totalPriceText").textContent = formatCurrency(total);
}

function startSeatCountdown() {
  appState.remainingSeconds = 600;
  const paint = () => {
    const el = document.getElementById("seatCountdown");
    if (el) el.textContent = `${String(Math.floor(appState.remainingSeconds / 60)).padStart(2, "0")}:${String(appState.remainingSeconds % 60).padStart(2, "0")}`;
  };
  paint();
  appState.timers.seatInterval = setInterval(() => {
    if (appState.remainingSeconds > 0) appState.remainingSeconds--;
    paint();
  }, 1000);
}

function proceedToPayment() {
  if (!appState.selectedSeats.length) { showToast("Vui lòng chọn ít nhất 1 ghế."); return; }
  if (!appState.token || !appState.customer) {
    showToast("Vui lòng đăng nhập hoặc đăng ký để thanh toán bằng Ví khán giả.");
    openAuthModal("login");
    return;
  }
  navigateTo("payment");
}

// =========================================================================
// VIEW 6: PAYMENT (THANH TOÁN BẰNG VÍ -> POST /api/v1/orders)
// =========================================================================
function buildPaymentView() {
  const sm = appState.seatMap;
  const seatsStr = appState.selectedSeats.map((s) => s.seatCode).join(", ");
  const total = appState.selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const balance = Number(appState.customer?.walletBalance || 0);
  const lowBalance = balance < total;

  return `
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 xl:px-[80px] pt-[96px] lg:pt-[120px] pb-16">
      <div class="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        <div class="w-full lg:flex-1 flex flex-col gap-6">
          <section class="w-full p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 space-y-5">
            <h2 class="text-white text-lg font-bold">Thông tin phim</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span class="text-ncc-muted text-sm block">Phim</span><strong class="text-base">${sm.movieTitle}</strong></div>
              <div><span class="text-ncc-muted text-sm block">Ngày giờ chiếu</span><strong class="text-base"><span class="text-ncc-red">${formatTimeShort(sm.startTime)}</span> - ${formatDateSlash(sm.showDate)}</strong></div>
              <div><span class="text-ncc-muted text-sm block">Ghế</span><strong class="text-base">${seatsStr}</strong></div>
              <div><span class="text-ncc-muted text-sm block">Phòng chiếu &amp; Định dạng</span><strong class="text-base">${sm.roomName} (${sm.format})</strong></div>
            </div>
          </section>

          <section class="w-full p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 space-y-4">
            <h2 class="text-white text-lg font-bold">Chi tiết ghế đã chọn</h2>
            <div class="space-y-1">
              <div class="px-4 py-3 bg-white/5 rounded-xl grid grid-cols-3 text-sm font-medium">
                <div>Ghế</div><div class="text-center">Loại ghế</div><div class="text-right">Đơn giá</div>
              </div>
              ${appState.selectedSeats.map((s) => `
                <div class="px-4 py-2.5 grid grid-cols-3 text-sm border-b border-white/5">
                  <div class="font-semibold">${s.seatCode}</div>
                  <div class="text-center text-ncc-muted">${s.seatType}</div>
                  <div class="text-right font-semibold">${formatCurrency(s.price)}</div>
                </div>`).join("")}
            </div>
          </section>
        </div>

        <aside class="w-full lg:w-[410px] flex-shrink-0">
          <section class="w-full p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 space-y-5">
            <h2 class="text-white text-lg font-bold">Phương thức thanh toán</h2>

            <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500 flex items-center gap-4">
              <div class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div class="text-sm font-bold text-white">Ví khán giả (customer-service)</div>
                <div class="text-xs text-ncc-muted mt-0.5">${appState.customer.fullName} • Số dư: <strong class="${lowBalance ? "text-red-400" : "text-ncc-yellow"}">${formatCurrency(balance)}</strong></div>
              </div>
            </div>

            ${lowBalance ? `<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-300">Số dư ví không đủ để thanh toán đơn này.</div>` : ""}

            <div class="space-y-2.5 pt-1">
              <div class="px-4 py-3 bg-white/5 rounded-xl flex justify-between text-sm"><span>Thanh toán</span><strong>${formatCurrency(total)}</strong></div>
              <div class="px-4 py-3 bg-white/5 rounded-xl flex justify-between text-sm"><span>Phí</span><strong>0đ</strong></div>
              <div class="px-4 py-3 bg-red-500/10 rounded-xl flex justify-between text-sm"><span class="font-bold">Tổng cộng</span><strong class="text-ncc-red">${formatCurrency(total)}</strong></div>
            </div>

            <div class="space-y-3">
              <button id="confirmPayBtn" onclick="submitPayment()" ${lowBalance ? "disabled" : ""}
                class="w-full h-10 btn-login-gradient rounded-full text-red-50 text-sm font-medium shadow-lg shadow-red-600/20 disabled:opacity-40">
                Thanh toán bằng ví
              </button>
              <button onclick="navigateTo('choose-ticket')" class="w-full h-10 rounded-full text-white text-sm hover:bg-white/5 transition">Quay lại</button>
            </div>
          </section>
        </aside>
      </div>
    </div>`;
}

async function submitPayment() {
  const btn = document.getElementById("confirmPayBtn");
  btn.disabled = true;
  btn.textContent = "Đang điều phối Saga 6 bước...";

  const walletBefore = Number(appState.customer.walletBalance || 0);
  try {
    const { data, traceId } = await apiFetch("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify({
        customerId: appState.customer.id,
        showtimeId: appState.seatMap.showtimeId,
        seatCodes: appState.selectedSeats.map((s) => s.seatCode),
      }),
    });

    await refreshWallet();
    appState.lastResult = {
      ...data,
      traceId: data.traceId || traceId || "-",
      walletBefore,
      walletAfter: Number(appState.customer.walletBalance || 0),
    };
    navigateTo("payment-success");
  } catch (err) {
    showToast("Lỗi đặt vé: " + err.message);
    btn.disabled = false;
    btn.textContent = "Thanh toán bằng ví";
  }
}

// =========================================================================
// VIEW 7: KẾT QUẢ ĐẶT VÉ (CONFIRMED / CANCELLED + TRACE.ID CHO KIBANA)
// =========================================================================
function buildPaymentSuccessView() {
  const r = appState.lastResult;
  const ok = r.status === "CONFIRMED";

  const icon = ok
      ? `<svg viewBox="0 0 96 96" class="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M15 3L17.4 8.6L23 11L17.4 13.4L15 19L12.6 13.4L7 11L12.6 8.6L15 3Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6"/>
         <path d="M81 3L83.4 8.6L89 11L83.4 13.4L81 19L78.6 13.4L73 11L78.6 8.6L81 3Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6"/>
         <path d="M48 14L57.5 33.4L79 36.5L63.5 51.6L67.2 73L48 62.9L28.8 73L32.5 51.6L17 36.5L38.5 33.4L48 14Z" fill="#FBE88C" stroke="#94A3B8" stroke-width="2.4" stroke-linejoin="round"/>
       </svg>`
      : `<div class="w-20 h-20 rounded-full bg-red-500/15 border-2 border-ncc-red flex items-center justify-center text-ncc-red">
         <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
       </div>`;

  return `
    <div class="flex flex-col items-center justify-center px-4 pt-[112px] lg:pt-[136px] pb-20">
      <div class="animate-pop w-full max-w-[540px] p-7 bg-ncc-card rounded-[20px] border border-white/10 ncc-card-shadow flex flex-col items-center text-center">
        <div class="mb-4">${icon}</div>
        <h1 class="text-slate-50 text-2xl font-bold mb-2">${ok ? "Đặt vé thành công!" : "Đặt vé bị huỷ (CANCELLED)"}</h1>
        <p class="${ok ? "text-ncc-orange" : "text-red-300"} text-xs md:text-sm mb-6">
          ${ok ? "Lưu ý: Hãy đến đúng giờ của suất chiếu và tận hưởng bộ phim." : "Xuất vé bị từ chối có kiểm soát — Saga đã hoàn lại toàn bộ tiền về Ví khán giả."}
        </p>

        <div class="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left text-sm space-y-2.5 mb-5">
          <div class="flex justify-between gap-2"><span class="text-ncc-muted">Mã đơn hàng</span><strong>#${r.orderId} (${r.orderCode})</strong></div>
          <div class="flex justify-between gap-2"><span class="text-ncc-muted">Trạng thái</span><strong class="${ok ? "text-green-400" : "text-red-400"}">${r.status}</strong></div>
          ${ok
      ? `<div class="flex justify-between gap-2"><span class="text-ncc-muted">Mã vé (Ticket Code)</span><strong class="text-ncc-yellow">${r.ticketCode}</strong></div>`
      : `<div class="flex justify-between gap-2"><span class="text-ncc-muted">Lý do huỷ</span><strong class="text-red-400 text-right">${r.cancelReason || "-"}</strong></div>`}
          <div class="flex justify-between gap-2"><span class="text-ncc-muted">Ghế</span><strong>${(r.seatCodes || []).join(", ")}</strong></div>
          <div class="flex justify-between gap-2 pt-2 border-t border-white/10">
            <span class="text-ncc-muted">Ví khán giả (trước → sau)</span>
            <strong class="text-ncc-yellow">${formatCurrency(r.walletBefore)} → ${formatCurrency(r.walletAfter)}</strong>
          </div>
        </div>

        <div class="w-full p-4 rounded-xl bg-[#0A0D12] border border-dashed border-sky-500/40 text-left mb-6">
          <div class="text-xs text-ncc-muted mb-2">Mã truy vết <code>trace.id</code> (dùng để lọc chuỗi log xuyên 4 service trên Kibana):</div>
          <div class="flex items-center justify-between gap-3">
            <code id="resTraceId" class="text-xs md:text-sm font-mono text-sky-400 break-all">${r.traceId}</code>
            <button type="button" onclick="copyTraceId()" class="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold flex-shrink-0">Sao chép</button>
          </div>
        </div>

        <button onclick="finishAndGoHome()" class="w-full max-w-[340px] h-10 btn-login-gradient rounded-full text-red-50 text-sm font-medium shadow-lg shadow-red-600/25">
          Về trang chủ
        </button>
      </div>
    </div>`;
}

function copyTraceId() {
  navigator.clipboard.writeText(document.getElementById("resTraceId")?.textContent || "");
  showToast("Đã sao chép trace.id!");
}

function finishAndGoHome() {
  appState.selectedSeats = [];
  navigateTo("home");
}

// ==================== KHỞI CHẠY ====================
window.addEventListener("hashchange", renderCurrentRoute);
window.addEventListener("DOMContentLoaded", async () => {
  renderHeaderAuth();
  await refreshWallet();
  renderCurrentRoute();
});