// ==================== TRẠNG THÁI TOÀN CỤC (APP STATE) ====================
const appState = {
  currentRoute: "home",
  heroSlide: 0,
  calendarDateId: "12-11-2024",
  detailDateIndex: 0,
  selectedMovie: { ...NCC_DATA.defaultMovieDetail },
  booking: {
    date: "13/11/2024",
    weekday: "Thứ tư",
    time: "18:00",
    room: "Phòng chiếu số 2",
    format: "2D",
    seats: [],
    totalPrice: 0,
  },
  paymentMethod: "vietqr",
  timers: {
    heroInterval: null,
    seatInterval: null,
    toastTimeout: null,
  },
  remainingSeconds: 600,
};

// ==================== TIỆN ÍCH CHUNG ====================
function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function clearTimers() {
  if (appState.timers.heroInterval) {
    clearInterval(appState.timers.heroInterval);
    appState.timers.heroInterval = null;
  }
  if (appState.timers.seatInterval) {
    clearInterval(appState.timers.seatInterval);
    appState.timers.seatInterval = null;
  }
}

function showToast(message) {
  const el = document.getElementById("toastNotice");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(appState.timers.toastTimeout);
  appState.timers.toastTimeout = setTimeout(() => {
    el.classList.add("hidden");
  }, 2600);
}

function showComingSoonNotice(sectionName) {
  showToast(`Trang "${sectionName}" chưa được kích hoạt trong bản demo này.`);
}

function findMovieById(id) {
  const numericId = Number(id);
  const all = [
    ...NCC_DATA.calendarMovies,
    ...NCC_DATA.nowShowingMovies,
    ...NCC_DATA.comingSoonMovies,
  ];
  const found = all.find((m) => m.id === numericId);
  if (!found) return { ...NCC_DATA.defaultMovieDetail };

  return {
    ...NCC_DATA.defaultMovieDetail,
    id: found.id,
    title: found.title,
    genre: found.genre || NCC_DATA.defaultMovieDetail.genre,
    country: found.country || NCC_DATA.defaultMovieDetail.country,
    duration: found.duration || NCC_DATA.defaultMovieDetail.duration,
    date: found.date || NCC_DATA.defaultMovieDetail.date,
    rating: found.rating
      ? found.rating.startsWith("Kiểm duyệt:")
        ? found.rating
        : `Kiểm duyệt: ${found.rating}`
      : NCC_DATA.defaultMovieDetail.rating,
    poster: found.poster || NCC_DATA.defaultMovieDetail.poster,
  };
}

// ==================== MODAL & MENU DÙNG CHUNG ====================
function openAuthModal(mode) {
  const title = document.getElementById("authModalTitle");
  const btn = document.getElementById("authSubmitBtn");
  const nameField = document.getElementById("registerNameField");
  if (mode === "register") {
    title.textContent = "Đăng ký tài khoản";
    btn.textContent = "Đăng ký";
    nameField.classList.remove("hidden");
  } else {
    title.textContent = "Đăng nhập";
    btn.textContent = "Đăng nhập";
    nameField.classList.add("hidden");
  }
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById("mobileMenu").classList.add("hidden");
}

function openContentModal() {
  document.getElementById("fullSynopsisText").textContent =
    appState.selectedMovie.synopsisFull || NCC_DATA.defaultMovieDetail.synopsisFull;
  document.getElementById("contentModal").classList.remove("hidden");
}

function openTrailerModal() {
  document.getElementById("trailerTitle").textContent = `Trailer - ${appState.selectedMovie.title}`;
  document.getElementById("trailerIframe").src =
    appState.selectedMovie.trailerUrl || NCC_DATA.defaultMovieDetail.trailerUrl;
  document.getElementById("trailerModal").classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  if (id === "trailerModal") {
    document.getElementById("trailerIframe").src = "";
  }
}

document.getElementById("mobileMenuBtn").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("hidden");
});

// ==================== ĐIỀU HƯỚNG (SPA ROUTER) ====================
function navigateTo(route) {
  window.location.hash = route;
}

function openMovieDetail(movieId) {
  appState.selectedMovie = findMovieById(movieId);
  appState.detailDateIndex = 0;
  navigateTo("movie-detail");
}

function openChooseTicketFromDetail(time) {
  const d = NCC_DATA.detailScheduleDates[appState.detailDateIndex];
  appState.booking = {
    date: d.fullDate,
    weekday: d.weekday,
    time: time,
    room: "Phòng chiếu số 2",
    format: "2D",
    seats: [],
    totalPrice: 0,
  };
  navigateTo("choose-ticket");
}

function openChooseTicketFromCalendar(movieId, time) {
  appState.selectedMovie = findMovieById(movieId);
  const dateObj =
    NCC_DATA.calendarDates.find((d) => d.id === appState.calendarDateId) ||
    NCC_DATA.calendarDates[0];

  appState.booking = {
    date: dateObj.slashDate,
    weekday: dateObj.weekday,
    time: time,
    room: "Phòng chiếu số 2",
    format: "2D",
    seats: [],
    totalPrice: 0,
  };
  navigateTo("choose-ticket");
}

function updateActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isMatch = link.dataset.route === route;
    link.classList.toggle("text-ncc-red", isMatch);
    link.classList.toggle("font-medium", isMatch);
    link.classList.toggle("text-white", !isMatch);
  });
}

function setBodyTheme(route) {
  document.body.classList.remove("theme-home", "theme-payment", "theme-default");
  if (route === "home") {
    document.body.classList.add("theme-home");
  } else if (route === "payment") {
    document.body.classList.add("theme-payment");
  } else {
    document.body.classList.add("theme-default");
  }
}

function renderCurrentRoute() {
  clearTimers();
  document.getElementById("mobileMenu").classList.add("hidden");

  const rawHash = (window.location.hash || "#home").replace("#", "").split("?")[0];
  const validRoutes = [
    "home",
    "calendar",
    "ticket-price",
    "movie-detail",
    "choose-ticket",
    "payment",
    "payment-success",
  ];
  const route = validRoutes.includes(rawHash) ? rawHash : "home";
  appState.currentRoute = route;

  setBodyTheme(route);
  updateActiveNav(route);

  const appEl = document.getElementById("app");
  switch (route) {
    case "home":
      document.title = "Trang chủ - Trung tâm Chiếu phim Quốc gia";
      appEl.innerHTML = buildHomeView();
      initHomeView();
      break;
    case "calendar":
      document.title = "Lịch chiếu - Trung tâm Chiếu phim Quốc gia";
      appEl.innerHTML = buildCalendarView();
      renderCalendarDates();
      renderCalendarMovies();
      break;
    case "ticket-price":
      document.title = "Giá vé - Trung tâm Chiếu phim Quốc gia";
      appEl.innerHTML = buildTicketPriceView();
      break;
    case "movie-detail":
      document.title = `${appState.selectedMovie.title} - NCC`;
      appEl.innerHTML = buildMovieDetailView();
      renderDetailDateTabs();
      renderDetailShowtimes();
      break;
    case "choose-ticket":
      document.title = `Chọn ghế - ${appState.selectedMovie.title}`;
      appEl.innerHTML = buildChooseTicketView();
      initChooseTicketView();
      break;
    case "payment":
      document.title = "Thanh toán - Trung tâm Chiếu phim Quốc gia";
      appEl.innerHTML = buildPaymentView();
      renderPaymentMethods();
      break;
    case "payment-success":
      document.title = "Đặt vé thành công - Trung tâm Chiếu phim Quốc gia";
      appEl.innerHTML = buildPaymentSuccessView();
      break;
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

// =========================================================================
// VIEW 1: HOMEPAGE
// =========================================================================
function buildMovieCardHTML(movie) {
  const hasLongGenre = movie.genre.length > 22;
  const metaHtml = hasLongGenre
    ? `<div class="flex flex-col gap-0.5 text-sm font-normal leading-5 text-ncc-gray">
         <span>${movie.genre}</span>
         <span>${movie.date}</span>
       </div>`
    : `<div class="flex flex-wrap items-center gap-x-5 gap-y-0.5 text-sm font-normal leading-5 text-ncc-gray">
         ${movie.genre ? `<span>${movie.genre}</span>` : ""}
         <span>${movie.date}</span>
       </div>`;

  return `
    <article
      onclick="openMovieDetail(${movie.id})"
      class="movie-card group flex flex-col gap-3 cursor-pointer"
    >
      <div class="w-full aspect-[229/290] bg-white/5 rounded-xl overflow-hidden shadow-lg shadow-black/30">
        <img
          src="${movie.poster}"
          alt="${movie.title}"
          loading="lazy"
          class="movie-poster w-full h-full object-cover rounded-xl transition-transform duration-300 ease-out"
        />
      </div>
      <div class="flex flex-col gap-2">
        ${metaHtml}
        <h3 class="text-white text-base font-bold leading-6 group-hover:text-ncc-red transition-colors">
          ${movie.title}
        </h3>
      </div>
    </article>
  `;
}

function buildHomeView() {
  return `
    <!-- HERO BANNER -->
    <section class="relative w-full mt-16 lg:mt-20 h-[280px] sm:h-[420px] lg:h-[640px] overflow-hidden bg-zinc-950">
      <div id="heroSlides" class="relative w-full h-full"></div>
      <div class="pointer-events-none absolute inset-0 bg-black/30"></div>
      <div class="pointer-events-none absolute inset-0 hero-overlay-gradient"></div>

      <button
        onclick="stepHeroSlide(-1)"
        aria-label="Banner trước"
        class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-[6px] flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onclick="stepHeroSlide(1)"
        aria-label="Banner tiếp theo"
        class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-[6px] flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div id="heroDots" class="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"></div>
    </section>

    <!-- MAIN CONTENT -->
    <div class="max-w-[1440px] mx-auto px-4 md:px-10 xl:px-[80px] pt-[60px] pb-[88px]">
      <div class="flex flex-col xl:flex-row items-start gap-10 xl:gap-6">

        <!-- CỘT TRÁI (1000px Desktop) -->
        <div class="w-full xl:w-[1000px] flex-shrink-0 space-y-16">
          <section>
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-ncc-red inline-block flex-shrink-0"></span>
                <h2 class="text-xl font-bold leading-7 text-white">Phim đang chiếu</h2>
              </div>
              <a href="#calendar" class="text-base font-normal leading-6 text-white underline hover:text-ncc-red transition-colors">
                Xem tất cả
              </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 xl:gap-x-[28px] gap-y-8">
              ${NCC_DATA.nowShowingMovies.map(buildMovieCardHTML).join("")}
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-ncc-red inline-block flex-shrink-0"></span>
                <h2 class="text-xl font-bold leading-7 text-white">Phim sắp chiếu</h2>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-6 xl:gap-x-[28px] gap-y-8">
              ${NCC_DATA.comingSoonMovies.map(buildMovieCardHTML).join("")}
            </div>
          </section>
        </div>

        <!-- CỘT PHẢI SIDEBAR (256px Desktop) -->
        <aside class="w-full xl:w-[256px] flex-shrink-0 space-y-12">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold leading-7 text-white">Khuyến mãi</h3>
              <button onclick="showComingSoonNotice('Khuyến mãi')" class="text-base font-normal leading-6 text-white underline hover:text-ncc-red transition-colors">
                Xem tất cả
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-[24px]">
              <img src="https://placehold.co/256x120/1b202c/ffffff?text=Khuyen+mai+1" alt="Khuyến mãi 1" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
              <img src="https://placehold.co/256x120/261b2e/ffffff?text=Khuyen+mai+2" alt="Khuyến mãi 2" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
              <img src="https://placehold.co/256x120/2e1b1f/ffffff?text=Khuyen+mai+3" alt="Khuyến mãi 3" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
            </div>
            <div class="flex justify-center items-center gap-2 mt-4">
              <span class="w-2 h-2 rounded-sm bg-white/20"></span>
              <span class="w-2 h-2 rounded-sm bg-white/20"></span>
              <span class="w-2 h-2 rounded-sm bg-ncc-red"></span>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold leading-7 text-white">Sự kiện</h3>
              <button onclick="showComingSoonNotice('Sự kiện')" class="text-base font-normal leading-6 text-white underline hover:text-ncc-red transition-colors">
                Xem tất cả
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-[24px]">
              <img src="https://placehold.co/256x120/172330/ffffff?text=Su+kien+1" alt="Sự kiện 1" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
              <img src="https://placehold.co/256x120/2b2118/ffffff?text=Su+kien+2" alt="Sự kiện 2" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
              <img src="https://placehold.co/256x120/182b24/ffffff?text=Su+kien+3" alt="Sự kiện 3" class="w-full h-[120px] object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition" />
            </div>
            <div class="flex justify-center items-center gap-2 mt-4">
              <span class="w-2 h-2 rounded-sm bg-white/20"></span>
              <span class="w-2 h-2 rounded-sm bg-white/20"></span>
              <span class="w-2 h-2 rounded-sm bg-ncc-red"></span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6 pt-2">
            <img src="https://placehold.co/256x112/1e293b/ffffff?text=Banner+256x112" alt="Banner phụ 1" class="w-full h-[112px] object-cover rounded-lg" />
            <img src="https://placehold.co/256x256/1e293b/ffffff?text=Banner+256x256" alt="Banner phụ 2" class="w-full aspect-square max-h-[256px] object-cover rounded-lg" />
          </div>
        </aside>

      </div>
    </div>
  `;
}

function renderHeroCarousel() {
  const slidesEl = document.getElementById("heroSlides");
  const dotsEl = document.getElementById("heroDots");
  if (!slidesEl || !dotsEl) return;

  slidesEl.innerHTML = NCC_DATA.heroBanners
    .map(
      (slide, idx) => `
      <div class="absolute inset-0 transition-opacity duration-700 ${
        idx === appState.heroSlide ? "opacity-100 z-10" : "opacity-0 z-0"
      }">
        <img src="${slide.image}" alt="${slide.title}" class="w-full h-full object-cover" />
      </div>
    `
    )
    .join("");

  dotsEl.innerHTML = NCC_DATA.heroBanners
    .map(
      (_, idx) => `
      <button
        onclick="goToHeroSlide(${idx})"
        aria-label="Slide ${idx + 1}"
        class="h-2 rounded-full transition-all ${
          idx === appState.heroSlide ? "w-6 bg-ncc-red" : "w-2 bg-white/40 hover:bg-white/70"
        }"
      ></button>
    `
    )
    .join("");
}

function stepHeroSlide(delta) {
  const total = NCC_DATA.heroBanners.length;
  appState.heroSlide = (appState.heroSlide + delta + total) % total;
  renderHeroCarousel();
}

function goToHeroSlide(idx) {
  appState.heroSlide = idx;
  renderHeroCarousel();
}

function initHomeView() {
  renderHeroCarousel();
  appState.timers.heroInterval = setInterval(() => stepHeroSlide(1), 5000);
}

// =========================================================================
// VIEW 2: CALENDAR (LỊCH CHIẾU)
// =========================================================================
function buildCalendarView() {
  return `
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 xl:px-[80px] pt-[88px] md:pt-[96px] lg:pt-[128px] pb-16 lg:pb-[76px]">
      <div class="flex justify-center items-center gap-2 mb-4 md:mb-5">
        <span class="w-4 h-4 rounded-full bg-ncc-red inline-block flex-shrink-0"></span>
        <h1 class="text-white text-base md:text-xl font-bold leading-6 md:leading-7">Phim đang chiếu</h1>
      </div>

      <div id="calendarDateFilters" class="max-w-[360px] md:max-w-none mx-auto flex flex-wrap justify-center items-center gap-2.5 md:gap-4 mb-4 md:mb-5"></div>

      <p class="text-center text-ncc-orange text-sm leading-5 max-w-[910px] mx-auto mb-7 md:mb-10 px-1">
        <span class="font-bold">Lưu ý:</span> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước 22h và Khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc trước 23h.
      </p>

      <div id="calendarMoviesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 xl:gap-6"></div>
    </div>
  `;
}

function renderCalendarDates() {
  const container = document.getElementById("calendarDateFilters");
  if (!container) return;

  container.innerHTML = NCC_DATA.calendarDates
    .map((d) => {
      const isActive = d.id === appState.calendarDateId;
      return `
        <button
          onclick="selectCalendarDate('${d.id}')"
          class="h-9 px-3 py-2 rounded-md text-sm font-medium leading-5 flex items-center justify-center transition-all ${
            isActive
              ? "btn-date-active text-red-50 shadow-md shadow-red-600/20"
              : "border border-slate-800 text-white hover:bg-white/5"
          }"
        >
          ${d.label}
        </button>
      `;
    })
    .join("");
}

function selectCalendarDate(dateId) {
  appState.calendarDateId = dateId;
  renderCalendarDates();
  renderCalendarMovies();
}

function renderCalendarMovies() {
  const container = document.getElementById("calendarMoviesGrid");
  if (!container) return;

  container.innerHTML = NCC_DATA.calendarMovies
    .map((movie) => {
      const showtimeButtons = movie.showtimes
        .map(
          (time) => `
          <button
            type="button"
            onclick="openChooseTicketFromCalendar(${movie.id}, '${time}')"
            class="h-7 px-1.5 xl:h-9 xl:px-3 rounded-md border border-white text-white text-xs xl:text-sm font-medium leading-5 flex items-center justify-center hover:bg-ncc-red hover:border-ncc-red transition-colors"
          >
            ${time}
          </button>
        `
        )
        .join("");

      return `
        <article class="w-full rounded-xl border border-ncc-border-gray overflow-hidden flex items-stretch bg-[#10141B] hover:border-gray-500 transition-colors">
          <div
            onclick="openMovieDetail(${movie.id})"
            class="w-[144px] xl:w-[220px] flex-shrink-0 bg-white/5 overflow-hidden cursor-pointer group"
          >
            <img
              src="${movie.poster}"
              alt="${movie.title}"
              loading="lazy"
              class="w-full h-full min-h-[200px] xl:min-h-[290px] object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div class="flex-1 min-w-0 relative p-4 pt-5 xl:p-6 flex flex-col justify-between gap-3">
            <span class="absolute top-2 right-2 px-2 py-[3px] xl:py-[5px] rounded-md border border-gray-600 text-gray-300 text-sm xl:text-base font-semibold leading-6 select-none">
              ${movie.format}
            </span>

            <div class="flex flex-col gap-1">
              <div class="hidden md:flex flex-col xl:flex-row xl:items-center xl:gap-5 pr-12 mb-1 text-slate-500 text-sm font-normal leading-5">
                ${movie.genre ? `<span>${movie.genre}</span>` : ""}
                <span>${movie.duration}</span>
              </div>

              <h2
                onclick="openMovieDetail(${movie.id})"
                class="pr-11 text-white text-sm font-bold leading-5 cursor-pointer hover:text-ncc-red transition-colors"
              >
                ${movie.title}
              </h2>

              <p class="text-white text-sm font-normal leading-5">Xuất xứ: ${movie.country}</p>
              <p class="hidden md:block text-white text-sm font-normal leading-5">Khởi chiếu: ${movie.date}</p>
              <p class="text-ncc-red text-xs md:text-sm font-normal leading-4 md:leading-5 line-clamp-2">${movie.rating}</p>
            </div>

            <div class="flex flex-col gap-2 pt-1">
              <span class="hidden md:block text-white text-sm font-semibold leading-5">Lịch chiếu</span>
              <div class="flex flex-wrap items-center gap-2">${showtimeButtons}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

// =========================================================================
// VIEW 3: TICKET PRICE (GIÁ VÉ)
// =========================================================================
function buildPriceTableHTML(rows, isBoldFirstCol) {
  return `
    <table class="w-full min-w-[736px] border-collapse text-sm leading-5">
      <thead>
        <tr class="border-b border-ncc-border">
          <th class="w-[140px] lg:w-[26%] bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red"></th>
          <th colspan="3" class="px-4 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-muted font-bold">
            Từ thứ 2 đến thứ 5<br />From Monday to Thursday
          </th>
          <th colspan="3" class="px-4 py-2.5 bg-ncc-dark lg:bg-ncc-bg text-center text-ncc-muted font-bold">
            Thứ 6, 7, CN và ngày Lễ<br />Friday, Saturday, Sunday &amp; public holiday
          </th>
        </tr>
        <tr class="border-b border-ncc-border lg:border-ncc-red">
          <th class="px-4 py-3 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-left text-ncc-muted font-medium">Thời gian</th>
          <th class="px-3 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-muted font-semibold">Ghế thường<br />Standard</th>
          <th class="px-3 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-yellow font-semibold">Ghế VIP<br />VIP</th>
          <th class="px-3 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-red font-semibold">Ghế đôi<br />Sweetbox</th>
          <th class="px-3 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-muted font-semibold">Ghế thường<br />Standard</th>
          <th class="px-3 py-2.5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-yellow font-semibold">Ghế VIP<br />VIP</th>
          <th class="px-3 py-2.5 bg-ncc-dark text-center text-ncc-red font-semibold">Ghế đôi<br />Sweetbox</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r, idx) => `
          <tr class="${idx < rows.length - 1 ? "border-b border-ncc-border lg:border-ncc-red" : ""}">
            <td class="px-4 py-4 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-white ${isBoldFirstCol ? "font-normal lg:font-medium" : "font-normal"}">
              ${r.labelVi}<br />${r.labelEn}
            </td>
            <td class="px-3 py-5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-white font-normal">${r.wdStd}</td>
            <td class="px-3 py-5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-yellow font-medium">${r.wdVip}</td>
            <td class="px-3 py-5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-red font-medium">${r.wdBox}</td>
            <td class="px-3 py-5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-white font-normal">${r.weStd}</td>
            <td class="px-3 py-5 bg-ncc-dark lg:bg-ncc-bg border-r border-gray-800 lg:border-ncc-red text-center text-ncc-yellow font-medium">${r.weVip}</td>
            <td class="px-3 py-5 ${idx === rows.length - 1 ? "bg-ncc-dark lg:bg-ncc-bg" : "bg-ncc-dark"} text-center text-ncc-red font-medium">${r.weBox}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function buildTicketPriceView() {
  return `
    <div class="max-w-[1440px] mx-auto px-4 xl:px-[80px] pt-[96px] lg:pt-[128px] pb-16 lg:pb-[76px]">
      <div class="text-center mb-8 lg:mb-10">
        <h1 class="text-white md:text-ncc-red lg:text-white text-2xl md:text-xl lg:text-2xl font-bold leading-8">Giá vé</h1>
        <p class="text-white md:text-ncc-muted lg:text-white text-base font-normal leading-6 mt-1.5">(Áp dụng từ ngày 01/06/2023)</p>
      </div>

      <!-- 1. GIÁ VÉ 2D -->
      <section class="mb-10 lg:mb-12 lg:p-6 lg:bg-ncc-dark lg:rounded-2xl lg:border lg:border-ncc-red lg:price-card-shadow">
        <h2 class="text-white md:text-ncc-red text-lg font-semibold leading-7 mb-4">1. GIÁ VÉ XEM PHIM 2D</h2>
        <div class="w-full overflow-x-auto rounded-xl border border-gray-800 md:border-ncc-red bg-ncc-dark table-tablet-glow">
          ${buildPriceTableHTML(NCC_DATA.ticketPrices2D, true)}
        </div>
        <p class="mt-4 text-ncc-muted md:text-ncc-red text-sm font-normal leading-5">
          * Đối với phim có thời lượng từ 150 phút trở lên: phụ thu 10.000 VNĐ / vé
        </p>
      </section>

      <!-- 2. GIÁ VÉ 3D -->
      <section class="mb-10 lg:mb-12 lg:p-6 lg:bg-ncc-dark lg:rounded-2xl lg:border lg:border-ncc-red lg:price-card-shadow">
        <h2 class="text-white md:text-ncc-red text-lg font-semibold leading-7 mb-4">2. GIÁ VÉ XEM PHIM 3D</h2>
        <div class="w-full overflow-x-auto rounded-xl border border-ncc-border md:border-ncc-red bg-ncc-dark table-tablet-glow">
          ${buildPriceTableHTML(NCC_DATA.ticketPrices3D, false)}
        </div>
        <p class="mt-4 text-ncc-muted md:text-ncc-red text-sm font-normal leading-5">
          * Đối với phim có thời lượng từ 150 phút trở lên: phụ thu 10.000 VNĐ / vé
        </p>
      </section>

      <!-- QUY ĐỊNH TIẾNG VIỆT -->
      <section class="space-y-5 text-base leading-6 mb-10">
        <div class="space-y-2">
          <h3 class="text-white md:text-ncc-red font-bold">* Giá vé đối với các đối tượng khán giả ưu tiên (khi trực tiếp sử dụng dịch vụ xem phim tại rạp chiếu phim):</h3>
          <div class="text-white font-normal space-y-1">
            <p>Giảm 20% giá vé theo qui định đối với: Trẻ em (người dưới 16 tuổi), người cao tuổi (công dân Việt Nam từ đủ 60 tuổi trở lên), người có công với cách mạng, người có hoàn cảnh đặc biệt khó khăn.</p>
            <p>Giảm 50% giá vé theo qui định đối với: Người khuyết tật nặng.</p>
            <p>Giảm giá vé 100% đối với: Người khuyết tật đặc biệt nặng, trẻ em dưới 0.7m đi kèm với người lớn.</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <h4 class="text-white md:text-ncc-red font-bold">Điều kiện:</h4>
          <p class="text-white font-normal">Chỉ áp dụng khi mua vé tại quầy (không áp dụng khi mua online).</p>
          <p class="text-white font-normal">Các đối tượng khán giả trên phải xuất trình giấy tờ chứng minh khi mua vé xem phim và trước khi vào phòng chiếu. Cụ thể:</p>
          <div class="pl-4 md:pl-6 text-white font-normal space-y-1 pt-1">
            <p>- Trẻ em (trường hợp trẻ em từ 14-16 tuổi), người cao tuổi: xuất trình "Căn cước công dân".</p>
            <p>- Người có công với cách mạng: xuất trình giấy xác nhận theo quy định.</p>
            <p>- Người có hoàn cảnh đặc biệt khó khăn: xuất trình "Giấy chứng nhận hộ nghèo".</p>
            <p>- Người khuyết tật: xuất trình "Giấy xác nhận khuyết tật".</p>
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-white md:text-ncc-red font-bold">* Ưu đãi cho học sinh, sinh viên từ 22 tuổi trở xuống: Đồng giá 55.000đ /vé 2D cho tất cả các suất chiếu phim từ Thứ 2 đến Thứ 6 (chỉ áp dụng cho hình thức mua vé trực tiếp tại quầy, không áp dụng với ghế đôi; Mỗi thẻ được mua 1 vé/ngày và vui lòng xuất trình thẻ U22 kèm thẻ HSSV khi mua vé)</p>
          <p class="text-white md:text-ncc-red font-bold">* Khán giả nghiêm túc thực hiện xem phim đúng độ tuổi theo phân loại phim: P, K, T13, T16, T18, C. (Trường hợp vi phạm sẽ xử phạt theo Quy định tại Nghị định 128/2022/NĐ-CP ngày 30/12/2022).</p>
          <p class="text-white md:text-ncc-red font-bold">* Không bán vé cho trẻ em dưới 13 tuổi đối với các suất chiếu phim kết thúc sau 22h00 và không bán vé cho trẻ em dưới 16 tuổi đối với các suất chiếu phim kết thúc sau 23h00.</p>
        </div>

        <div class="space-y-1">
          <h3 class="text-white md:text-ncc-red font-bold">* Áp dụng giá vé ngày Lễ, Tết cho các ngày:</h3>
          <div class="text-white font-normal space-y-1">
            <p>Các ngày nghỉ Lễ, Tết theo quy định của nhà nước: Tết Nguyên Đán, Tết Dương Lịch, ngày Giỗ Tổ Hùng Vương 10/3 AL, ngày 30/4, 1/5, 2/9.</p>
            <p>Các ngày: 14/2, 8/3, 24/12.</p>
            <p>Các ngày: Nghỉ bù do nghỉ Lễ, Tết trùng vào thứ 7, Chủ Nhật.</p>
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-white md:text-ncc-red font-bold">* Không áp dụng các chế độ ưu đãi, các chương trình khuyến mại khác vào các ngày 20/10, 20/11, Halloween 31/10, các ngày Lễ, Tết, suất chiếu sớm và suất chiếu đặc biệt.</p>
          <p class="text-white md:text-ncc-red font-bold">* Mua vé xem phim tập thẻ, hợp đồng khoán gọn: Phòng chiếu phim - <a href="tel:02435148647" class="hover:underline">(024) 35148647</a>.</p>
          <p class="text-white md:text-ncc-red font-bold">* Thuê phòng tổ chức Hội nghị, làm văn phòng, quảng cáo và các dịch vụ khác: Phòng Dịch vụ - <a href="tel:02435142856" class="hover:underline">(024) 35142856</a></p>
        </div>

        <div class="space-y-4 pt-1 text-white md:text-ncc-red lg:text-white font-normal">
          <p>ĐỀ NGHỊ QUÝ KHÁN GIẢ LƯU Ý KHI MUA VÉ XEM PHIM (ĐẶC BIỆT KHI MUA VÉ ONLINE). TTCPQG KHÔNG CHẤP NHẬN HOÀN TIỀN HOẶC ĐỔI VÉ ĐÃ THANH TOÁN THÀNH CÔNG KHI MUA VÉ ONLINE VÀ VÉ MUA SAI QUY ĐỊNH TẠI QUẦY VÉ.</p>
          <p>Rất mong Quý khán giả phối hợp thực hiện.<br />Xin trân trọng cảm ơn!</p>
        </div>
      </section>

      <!-- QUY ĐỊNH TIẾNG ANH -->
      <section class="space-y-5 text-base leading-6 mb-8">
        <div class="space-y-1.5">
          <h3 class="text-white md:text-ncc-red font-bold">* Ticket pricing policy for priority audiences watching movies at the cinema:</h3>
          <div class="text-white font-normal space-y-1">
            <p>Discount 20% on ticket price for: Children and teenagers (under 16 years old), elderly people (Vietnamese citizens aged from 60 years old), revolutionary contributors, people with difficult living conditions.</p>
            <p>Discount 50% on ticket price as regulations for: People with severe disabilities.</p>
            <p>Discount 100% on ticket price for: People with particularly severe disabilities; Children under 0.7m accompanied by adults.</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <h4 class="text-white md:text-ncc-red font-bold">Condition:</h4>
          <p class="text-white font-normal">
            Only applicable when buying tickets at the counter (not applicable for online tickets).<br />
            The above-mentioned audiences must present Identification Documents when buying movie tickets and before entering the screening room. Particularly:
          </p>
          <div class="pl-4 md:pl-6 text-white font-normal space-y-1 pt-1">
            <p>- Teenagers (14-16 years old), elderly people: must present "ID card".</p>
            <p>- Revolutionary contributors: must present a certificate as prescribed.</p>
            <p>- People with difficult living conditions: must present "Certificate of Poor Household".</p>
            <p>- People with disabilities: must present "Certificate of Disability".</p>
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-white md:text-ncc-red font-bold">* Special promotion for student who is 22 years old and under: From Monday to Friday 55.000đ/2D ticket for all slot times (only apply for direct purchase at the ticket stall, one student card can buy one ticket/day, student should show their U22 and student cards to get this priority).</p>
          <p class="text-white md:text-ncc-red font-bold">* Strict implementation of audience classification according to their ages: P, K, T13, T16, T18, C. (Violation will be sanctioned according to the provisions of Decree 128/2022/ND-CP dated on December 30, 2022).</p>
          <p class="text-white md:text-ncc-red font-bold">* Tickets for movies ending after 22:00 are not sold to teenagers under 13 years old and tickets for movies ending after 23:00 are not sold to teenagers under 16 years old.</p>
        </div>

        <div class="space-y-1">
          <h3 class="text-white md:text-ncc-red font-bold">* Holiday price is applied on:</h3>
          <div class="text-white font-normal space-y-1">
            <p>The public holidays as prescribed by state: New year, Lunar new year, Hung's King festival (March 10th - lunar calender), April 30th, May 1st, September 2nd.</p>
            <p>Days: Valentine, Women's Day, Noel.</p>
            <p>Compensatory days off due to holidays coinciding with Saturday and Sunday.</p>
          </div>
        </div>

        <div class="space-y-4">
          <p class="text-white md:text-ncc-red font-bold">* Do not apply preferential programs and different promotional ones in the day 20/10, 20/11, Halloween 31/10, holidays, sneak show and special show.</p>
          <p class="text-white md:text-ncc-red lg:text-white font-normal">VALUED AUDIENCES PLEASE TAKE INTO CONSIDERATION WHEN BUYING MOVIE TICKETS (ESPECIALLY FOR ONLINE TICKETS). THE NATIONAL CINEMA CENTER DOES NOT ACCEPT REFUNDS OR EXCHANGES OF SUCCESSFULLY PAID TICKETS (ONLINE TICKETS AND INCORRECTLY PURCHASED TICKETS AT THE COUNTER)</p>
          <p class="text-white md:text-ncc-red lg:text-white font-normal">Thank you for your valued cooperation.<br />Best Regards!</p>
        </div>
      </section>

      <div class="text-white md:text-ncc-red text-base font-normal leading-6 overflow-hidden whitespace-nowrap mb-6 select-none">
        ----------------------------------------------------------
      </div>

      <!-- KHỐI LIÊN HỆ -->
      <section class="w-full lg:p-6 lg:bg-ncc-dark lg:rounded-2xl lg:border lg:border-ncc-red lg:price-card-shadow flex flex-col gap-6 text-base leading-6">
        <div class="flex flex-col gap-1">
          <p class="text-white md:text-ncc-red lg:text-white font-normal">- &nbsp;Mua vé xem phim tập thể, hợp đồng khoán gọn:</p>
          <a href="tel:02435148647" class="text-white md:text-ncc-red font-bold hover:underline w-fit">Phòng Chiếu phim - (024) 35148647</a>
        </div>
        <div class="flex flex-col gap-0.5">
          <p class="text-white md:text-ncc-red lg:text-white font-normal">- &nbsp;Thuê phòng tổ chức Hội nghị, làm văn phòng, quảng cáo và các dịch vụ khác:</p>
          <a href="tel:02435142856" class="text-white md:text-ncc-red font-bold hover:underline w-fit">Phòng Dịch vụ - (024) 35142856</a>
        </div>
        <p class="text-white md:text-ncc-red font-bold">.TTCPQG</p>
      </section>
    </div>
  `;
}

// =========================================================================
// VIEW 4: MOVIE DETAIL (CHI TIẾT PHIM)
// =========================================================================
function buildMobileMovieHeroHTML(m) {
  return `
    <section class="lg:hidden w-full">
      <div class="relative w-full h-[250px] md:h-[300px]">
        <img src="${m.backdrop}" alt="Backdrop phim" class="w-full h-full object-cover" />
        <div class="absolute inset-0 backdrop-gradient-right"></div>
        <div class="absolute inset-0 bg-[#10141B]/60"></div>

        <div class="absolute left-4 md:left-6 right-4 md:right-6 -bottom-[80px] md:-bottom-[66px] z-10 flex items-end gap-4 md:gap-6">
          <img
            src="${m.poster}"
            alt="${m.title}"
            class="w-[150px] h-[200px] md:w-[200px] md:h-[250px] object-cover rounded-xl shadow-lg flex-shrink-0"
          />
          <div class="pb-1 md:pb-16 flex-1 min-w-0">
            <div class="flex items-start md:items-center gap-2 mb-1.5">
              <h1 class="text-white text-base md:text-xl font-bold leading-6 md:leading-7">${m.title}</h1>
              <span class="px-1.5 py-0.5 rounded-md border border-white text-white text-xs md:text-base font-bold leading-5 flex-shrink-0">2D</span>
            </div>
            <p class="text-white text-sm md:text-base font-normal leading-5 md:leading-6">
              ${m.genre} - ${m.country} - ${m.duration}
            </p>
          </div>
        </div>
      </div>

      <div class="px-4 md:px-6 pt-[96px] md:pt-[82px] pb-8 space-y-3">
        <div class="space-y-1 text-white text-sm leading-5">
          <p class="md:text-base md:leading-6">Đạo diễn: ${m.director}</p>
          <p>Diễn viên: ${m.cast}</p>
          <p>Khởi chiếu: ${m.date}</p>
        </div>
        <p class="text-white text-sm font-normal leading-5 line-clamp-4">${m.synopsisFull}</p>
        <p class="text-ncc-red text-sm font-normal leading-5">${m.rating}</p>
        <div class="pt-3 flex items-center justify-center md:justify-start gap-6">
          <button onclick="openContentModal()" class="text-white text-sm font-normal underline leading-5 hover:text-ncc-red transition-colors">
            Chi tiết nội dung
          </button>
          <button onclick="openTrailerModal()" class="px-10 py-2 rounded-full border border-ncc-yellow text-ncc-yellow text-sm font-normal leading-5 hover:bg-ncc-yellow/10 transition">
            Xem trailer
          </button>
        </div>
      </div>
    </section>
  `;
}

function buildMovieDetailView() {
  const m = appState.selectedMovie;
  return `
    <!-- DESKTOP HERO -->
    <section class="hidden lg:block relative w-full min-h-[473px] overflow-hidden">
      <img src="${m.backdrop}" alt="Backdrop phim" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 backdrop-gradient-right"></div>
      <div class="absolute inset-0 bg-[#10141B]/60"></div>

      <div class="relative z-10 max-w-[896px] mx-auto pt-[96px] pb-[44px] flex items-start gap-[40px]">
        <img src="${m.poster}" alt="${m.title}" class="w-[238px] h-[333px] object-cover rounded-xl flex-shrink-0 shadow-xl" />

        <div class="flex-1 pt-2">
          <div class="flex items-center flex-wrap gap-3 mb-3">
            <h1 class="text-white text-2xl font-bold leading-8">${m.title}</h1>
            <span class="px-2 py-1 rounded-xl border border-white text-white text-sm font-bold leading-5">2D</span>
          </div>

          <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-white text-sm font-normal leading-5 mb-2">
            <span>${m.genre}</span>
            <span>${m.country}</span>
            <span>${m.duration}</span>
            <span>Đạo diễn: ${m.director}</span>
          </div>

          <div class="text-white text-sm font-normal leading-5 space-y-1 mb-5">
            <p>Diễn viên: ${m.cast}</p>
            <p>Khởi chiếu: ${m.date}</p>
          </div>

          <p class="text-white text-sm font-normal leading-5 mb-5 line-clamp-4">${m.synopsisShort}</p>
          <p class="text-ncc-red text-sm font-normal leading-5 mb-6">${m.rating}</p>

          <div class="flex items-center gap-6">
            <button onclick="openContentModal()" class="text-white text-sm font-normal underline leading-5 hover:text-ncc-red transition-colors">
              Chi tiết nội dung
            </button>
            <button onclick="openTrailerModal()" class="px-10 py-2 rounded-full border border-ncc-yellow text-ncc-yellow text-sm font-normal leading-5 hover:bg-ncc-yellow/10 transition">
              Xem trailer
            </button>
          </div>
        </div>
      </div>
    </section>

    ${buildMobileMovieHeroHTML(m)}

    <!-- THANH CHỌN NGÀY -->
    <section class="w-full h-24 bg-ncc-surface flex justify-center items-stretch">
      <div id="detailDateTabs" class="flex items-stretch"></div>
    </section>

    <!-- LƯU Ý & GIỜ CHIẾU -->
    <section class="max-w-[960px] mx-auto px-4 md:px-6 pt-3 pb-16 lg:pb-[76px]">
      <p class="text-center text-ncc-orange text-sm leading-5 mb-6 max-w-[910px] mx-auto">
        <span class="font-semibold">Lưu ý</span>: Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước 22h và Khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc trước 23h.
      </p>
      <div id="detailShowtimeGrid" class="max-w-[896px] mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 md:gap-4"></div>
    </section>
  `;
}

function renderDetailDateTabs() {
  const el = document.getElementById("detailDateTabs");
  if (!el) return;
  el.innerHTML = NCC_DATA.detailScheduleDates
    .map((item, idx) => {
      const isActive = idx === appState.detailDateIndex;
      return `
        <button
          onclick="selectDetailDate(${idx})"
          class="w-[72px] px-2 pt-3.5 pb-4 flex flex-col justify-center items-center gap-[1px] transition-colors ${
            isActive ? "bg-ncc-red-dark text-white" : "bg-transparent hover:bg-white/5 text-gray-300"
          }"
        >
          <span class="text-xs font-normal leading-4">${item.month}</span>
          <span class="text-xl font-bold leading-7 text-white">${item.day}</span>
          <span class="text-xs font-normal leading-4">${item.weekday}</span>
        </button>
      `;
    })
    .join("");
}

function renderDetailShowtimes() {
  const el = document.getElementById("detailShowtimeGrid");
  if (!el) return;
  const times = NCC_DATA.detailScheduleDates[appState.detailDateIndex].showtimes;

  el.innerHTML = times
    .map(
      (time, idx) => `
      <button
        onclick="openChooseTicketFromDetail('${time}')"
        class="h-10 w-full rounded-full border border-ncc-border text-sm font-bold leading-5 flex items-center justify-center transition-colors ${
          idx === 0 ? "bg-gray-800/80 text-slate-50 hover:bg-gray-700" : "bg-transparent text-white hover:bg-gray-800"
        }"
      >
        ${time}
      </button>
    `
    )
    .join("");
}

function selectDetailDate(idx) {
  appState.detailDateIndex = idx;
  renderDetailDateTabs();
  renderDetailShowtimes();
}

// =========================================================================
// VIEW 5: CHOOSE TICKET (CHỌN GHẾ)
// =========================================================================
function buildChooseTicketView() {
  const m = appState.selectedMovie;
  return `
    <!-- DESKTOP HERO -->
    <section class="hidden lg:block relative w-full min-h-[500px] overflow-hidden">
      <img src="${m.backdrop}" alt="Backdrop phim" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 backdrop-gradient-right"></div>
      <div class="absolute inset-y-0 left-0 w-[500px] backdrop-gradient-left"></div>
      <div class="absolute inset-0 bg-[#10141B]/45"></div>

      <div class="relative z-10 max-w-[896px] mx-auto pt-[100px] pb-[44px] flex items-start gap-8">
        <img
          src="${m.poster}"
          alt="${m.title}"
          class="w-[200px] h-[295px] object-cover rounded-2xl shadow-[0px_8px_32px_-4px_rgba(0,0,0,0.40)] flex-shrink-0"
        />

        <div class="flex-1 flex flex-col items-start gap-3">
          <div class="flex items-center flex-wrap gap-3">
            <h1 class="text-white text-3xl font-bold leading-9">${m.title}</h1>
            <span class="px-2.5 py-[5px] rounded-md border border-white text-white text-sm font-bold leading-4">2D</span>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2.5 py-1 bg-white/10 rounded-[20px] text-white text-xs font-normal leading-5">${m.genre}</span>
            <span class="text-white/25 text-xs">·</span>
            <span class="px-2.5 py-1 bg-white/10 rounded-[20px] text-white text-xs font-normal leading-5">${m.country}</span>
            <span class="text-white/25 text-xs">·</span>
            <span class="px-2.5 py-1 bg-white/10 rounded-[20px] text-white text-xs font-normal leading-5">${m.duration}</span>
          </div>

          <div class="flex flex-col gap-1 text-zinc-400 text-xs font-normal leading-5">
            <p>Đạo diễn: ${m.director}</p>
            <p class="max-w-[586px]">Diễn viên: ${m.cast}</p>
            <p>Khởi chiếu: ${m.date}</p>
          </div>

          <p class="max-w-[620px] text-gray-400 text-xs font-normal leading-5 line-clamp-3">${m.synopsisShort}</p>

          <div class="px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500">
            <p class="text-red-500 text-xs font-semibold leading-4">${m.rating}</p>
          </div>

          <div class="flex items-center gap-4 pt-1">
            <button onclick="openTrailerModal()" class="px-10 py-2 rounded-full border border-ncc-yellow text-ncc-yellow text-sm font-normal leading-5 hover:bg-ncc-yellow/10 transition">
              Xem trailer
            </button>
            <button onclick="openContentModal()" class="text-gray-300 text-sm font-normal underline leading-5 hover:text-white transition-colors">
              Chi tiết nội dung
            </button>
          </div>
        </div>
      </div>
    </section>

    ${buildMobileMovieHeroHTML(m)}

    <!-- THANH CHỌN NGÀY -->
    <section class="w-full h-24 lg:h-20 bg-zinc-900 flex justify-center items-stretch">
      <div id="seatDateTabs" class="flex items-stretch gap-1"></div>
    </section>

    <!-- LƯU Ý -->
    <div class="w-full lg:bg-orange-500/5 py-3 lg:py-2.5 px-4 mt-1 lg:mt-2.5">
      <p class="text-center text-ncc-orange text-sm lg:text-xs leading-5 max-w-[910px] mx-auto">
        <span class="font-bold">Lưu ý:</span> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết thúc trước 22h và Khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc trước 23h.
      </p>
    </div>

    <!-- GIỜ CHIẾU -->
    <section class="max-w-[928px] mx-auto px-4 pt-3 pb-7 lg:pt-5 lg:pb-8">
      <div id="seatShowtimeGrid" class="max-w-[896px] mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4"></div>
    </section>

    <!-- KHU VỰC CHỌN GHẾ -->
    <section class="max-w-[928px] mx-auto px-4 pb-8 lg:pb-12">
      <!-- Bar Desktop -->
      <div class="hidden lg:flex max-w-[896px] mx-auto px-5 py-3 bg-zinc-900 rounded-xl border border-white/10 justify-between items-center mb-4">
        <div class="text-base font-bold leading-5">
          <span class="text-white">Giờ chiếu: </span>
          <span id="desktopSelectedTime" class="text-ncc-red">${appState.booking.time}</span>
        </div>
        <div class="px-4 py-1.5 rounded-[20px] border border-ncc-red text-slate-50 text-base font-normal leading-6">
          Thời gian chọn ghế: <span id="desktopCountdown" class="font-semibold tabular-nums">10:00</span>
        </div>
      </div>

      <!-- Bar Mobile/Tablet -->
      <div class="flex lg:hidden justify-between items-center mb-5 px-0 md:px-2 text-sm font-bold leading-5">
        <span class="text-white">Giờ chiếu: <span id="mobileSelectedTime">${appState.booking.time}</span></span>
        <span id="mobileCountdown" class="text-white tabular-nums">10:00</span>
      </div>

      <!-- Màn hình chiếu cong -->
      <div class="max-w-[898px] mx-auto mb-2 lg:mb-3 select-none">
        <svg viewBox="0 0 900 100" class="w-full h-auto overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="screenGlow" x1="450" y1="14" x2="450" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#F97316" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#F97316" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="screenStroke" x1="40" y1="30" x2="860" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#EA580C" stop-opacity="0.2" />
              <stop offset="50%" stop-color="#FB923C" stop-opacity="1" />
              <stop offset="100%" stop-color="#EA580C" stop-opacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M35 38 Q450 -10 865 38 L835 95 Q450 58 65 95 Z" fill="url(#screenGlow)" />
          <path d="M35 38 Q450 -10 865 38" stroke="url(#screenStroke)" stroke-width="6" stroke-linecap="round" />
        </svg>
      </div>

      <div class="flex justify-center items-center gap-3 mb-5 lg:mb-7">
        <span class="hidden lg:inline-block w-20 h-0.5 bg-ncc-red-dark rounded-[1px]"></span>
        <h2 class="text-center text-white text-sm md:text-xl lg:text-base font-bold leading-5 md:leading-7 lg:leading-6">
          ${appState.booking.room}
        </h2>
        <span class="hidden lg:inline-block w-20 h-0.5 bg-ncc-red-dark rounded-[1px]"></span>
      </div>

      <!-- Sơ đồ ghế -->
      <div class="w-full overflow-x-auto pb-2">
        <div id="seatMapContainer" class="flex flex-col items-center gap-1.5 md:gap-2 lg:gap-3 min-w-fit mx-auto"></div>
      </div>

      <!-- Legend -->
      <div class="mt-7 lg:mt-9 flex justify-center">
        <div class="lg:px-8 lg:py-4 lg:bg-zinc-900 lg:rounded-xl lg:border lg:border-white/5 flex flex-wrap justify-center items-center gap-x-5 gap-y-3 md:gap-x-8 lg:gap-6">
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-sm bg-seat-regular flex items-center justify-center text-slate-500 text-[9px] md:text-xs font-medium">X</span>
            <span class="text-white lg:text-gray-400 text-sm lg:text-xs leading-5">Đã đặt</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-sm bg-seat-selected inline-block"></span>
            <span class="text-white lg:text-gray-400 text-sm lg:text-xs leading-5">Ghế bạn chọn</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-sm bg-seat-regular inline-block"></span>
            <span class="text-white lg:text-gray-400 text-sm lg:text-xs leading-5">Ghế thường</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-sm bg-seat-vip inline-block"></span>
            <span class="text-white lg:text-gray-400 text-sm lg:text-xs leading-5">Ghế VIP</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-sm bg-seat-couple inline-block"></span>
            <span class="text-white lg:text-gray-400 text-sm lg:text-xs leading-5">Ghế đôi</span>
          </div>
        </div>
      </div>
    </section>

    <!-- THANH TỔNG KẾT & THANH TOÁN -->
    <section class="w-full lg:bg-zinc-900 lg:border-t lg:border-white/10 py-5 px-4 md:px-6 mb-8 lg:mb-10">
      <div class="max-w-[928px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div class="flex flex-col gap-1">
          <div class="text-white lg:text-gray-400 text-sm md:text-base lg:text-xs leading-5 md:leading-6">
            Ghế đã chọn: <span id="selectedSeatsText" class="text-white font-semibold ml-1">—</span>
          </div>
          <div class="text-sm md:text-base lg:text-lg leading-5 md:leading-6">
            <span class="text-white font-normal">Tổng tiền: </span>
            <span id="totalPriceText" class="text-white lg:text-ncc-red font-bold">0đ</span>
          </div>
        </div>

        <div class="w-full md:w-auto flex items-center gap-4">
          <button
            onclick="navigateTo('movie-detail')"
            class="flex-1 md:flex-none h-10 px-8 py-2.5 rounded-full border border-white text-white text-sm font-medium leading-5 flex items-center justify-center hover:bg-white/10 transition"
          >
            Quay lại
          </button>
          <button
            onclick="proceedToPayment()"
            class="flex-1 md:flex-none h-10 px-8 py-2.5 btn-login-gradient rounded-full text-red-50 text-sm font-medium leading-5 flex items-center justify-center transition shadow-lg shadow-red-600/20"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </section>
  `;
}

function getSeatType(row, col) {
  if (NCC_DATA.seatConfig.vipRows.includes(row) && col >= 3 && col <= 12) return "vip";
  return "regular";
}

function renderSeatDateTabs() {
  const el = document.getElementById("seatDateTabs");
  if (!el) return;
  el.innerHTML = NCC_DATA.detailScheduleDates
    .map((d, idx) => {
      const isActive = idx === appState.detailDateIndex;
      return `
        <button
          onclick="changeSeatDate(${idx})"
          class="w-[72px] px-3 py-3 flex flex-col justify-center items-center gap-0.5 transition-colors ${
            isActive ? "bg-ncc-red-dark text-white" : "bg-transparent text-gray-400 hover:bg-white/5"
          }"
        >
          <span class="text-xs ${isActive ? "font-medium text-white" : "font-normal text-gray-400"} leading-4">${d.month}</span>
          <span class="text-xl font-bold ${isActive ? "text-white" : "text-gray-300"} leading-7">${d.day}</span>
          <span class="text-xs ${isActive ? "font-medium text-white" : "font-normal text-gray-400"} leading-4">${d.weekday}</span>
        </button>
      `;
    })
    .join("");
}

function renderSeatShowtimes() {
  const el = document.getElementById("seatShowtimeGrid");
  if (!el) return;
  const times = NCC_DATA.detailScheduleDates[appState.detailDateIndex].showtimes;

  el.innerHTML = times
    .map((t) => {
      const isActive = t === appState.booking.time;
      return `
        <button
          onclick="changeSeatShowtime('${t}')"
          class="h-10 w-full rounded-full border border-ncc-border text-sm font-bold leading-5 flex items-center justify-center transition-colors ${
            isActive ? "bg-gray-800 text-slate-50 border-gray-700" : "bg-transparent text-white hover:bg-gray-800/60"
          }"
        >
          ${t}
        </button>
      `;
    })
    .join("");

  const dt = document.getElementById("desktopSelectedTime");
  const mt = document.getElementById("mobileSelectedTime");
  if (dt) dt.textContent = appState.booking.time;
  if (mt) mt.textContent = appState.booking.time;
}

function changeSeatDate(idx) {
  appState.detailDateIndex = idx;
  appState.booking.date = NCC_DATA.detailScheduleDates[idx].fullDate;
  appState.booking.weekday = NCC_DATA.detailScheduleDates[idx].weekday;
  appState.booking.seats = [];
  renderSeatDateTabs();
  renderSeatShowtimes();
  renderSeatMap();
  updateSeatSummary();
}

function changeSeatShowtime(time) {
  appState.booking.time = time;
  appState.booking.seats = [];
  renderSeatShowtimes();
  renderSeatMap();
  updateSeatSummary();
}

function renderSeatMap() {
  const container = document.getElementById("seatMapContainer");
  if (!container) return;

  const { rows, cols, bookedSeats } = NCC_DATA.seatConfig;
  const bookedSet = new Set(bookedSeats);

  container.innerHTML = rows
    .map((row) => {
      const seatsHtml = Array.from({ length: cols }, (_, i) => {
        const col = i + 1;
        const code = `${row}${col}`;
        const type = getSeatType(row, col);
        const isBooked = bookedSet.has(code);
        const isSelected = appState.booking.seats.includes(code);

        let bgClass = "bg-seat-regular text-white hover:brightness-125";
        if (isBooked) {
          bgClass = "bg-seat-regular text-slate-500 cursor-not-allowed";
        } else if (isSelected) {
          bgClass = "bg-seat-selected text-white ring-2 ring-blue-300/60";
        } else if (type === "vip") {
          bgClass = "bg-seat-vip text-white hover:brightness-110";
        }

        return `
          <button
            type="button"
            ${isBooked ? "disabled" : `onclick="toggleSeat('${code}')"`}
            title="${isBooked ? `Ghế ${code} (Đã đặt)` : `Ghế ${code} (${type === "vip" ? "VIP - 85.000đ" : "Thường - 75.000đ"})`}"
            class="w-[18px] h-[18px] sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-10 lg:h-10 rounded-sm flex items-center justify-center transition-all select-none ${bgClass}"
          >
            ${
              isBooked
                ? `<span class="text-[9px] md:text-xs lg:text-base font-normal leading-none">X</span>`
                : `<span class="hidden lg:inline text-sm font-normal leading-none">${code}</span>`
            }
          </button>
        `;
      }).join("");

      return `
        <div class="flex items-center gap-2 md:gap-3 lg:gap-2">
          <span class="lg:hidden w-4 text-center text-white text-xs md:text-sm font-normal leading-4">${row}</span>
          <div class="flex items-center gap-1 md:gap-2">${seatsHtml}</div>
          <span class="lg:hidden w-4 text-center text-white text-xs md:text-sm font-normal leading-4">${row}</span>
        </div>
      `;
    })
    .join("");
}

function toggleSeat(code) {
  const idx = appState.booking.seats.indexOf(code);
  if (idx > -1) {
    appState.booking.seats.splice(idx, 1);
  } else {
    if (appState.booking.seats.length >= 8) {
      showToast("Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt.");
      return;
    }
    appState.booking.seats.push(code);
  }

  appState.booking.seats.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
  });

  renderSeatMap();
  updateSeatSummary();
}

function updateSeatSummary() {
  const total = appState.booking.seats.reduce((sum, code) => {
    const type = getSeatType(code[0], parseInt(code.slice(1), 10));
    return sum + NCC_DATA.seatConfig.prices[type];
  }, 0);
  appState.booking.totalPrice = total;

  const seatsEl = document.getElementById("selectedSeatsText");
  const totalEl = document.getElementById("totalPriceText");
  if (seatsEl) seatsEl.textContent = appState.booking.seats.length ? appState.booking.seats.join(", ") : "—";
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function startSeatCountdown() {
  appState.remainingSeconds = 10 * 60;
  const updateDisplay = () => {
    const mins = String(Math.floor(appState.remainingSeconds / 60)).padStart(2, "0");
    const secs = String(appState.remainingSeconds % 60).padStart(2, "0");
    const text = `${mins}:${secs}`;
    const dEl = document.getElementById("desktopCountdown");
    const mEl = document.getElementById("mobileCountdown");
    if (dEl) dEl.textContent = text;
    if (mEl) mEl.textContent = text;
  };
  updateDisplay();

  appState.timers.seatInterval = setInterval(() => {
    appState.remainingSeconds--;
    if (appState.remainingSeconds <= 0) {
      showToast("Đã hết thời gian giữ ghế. Vui lòng chọn lại!");
      appState.booking.seats = [];
      appState.remainingSeconds = 10 * 60;
      renderSeatMap();
      updateSeatSummary();
    }
    updateDisplay();
  }, 1000);
}

function initChooseTicketView() {
  renderSeatDateTabs();
  renderSeatShowtimes();
  renderSeatMap();
  updateSeatSummary();
  startSeatCountdown();
}

function proceedToPayment() {
  if (appState.booking.seats.length === 0) {
    showToast("Vui lòng chọn ít nhất 1 ghế trước khi thanh toán.");
    return;
  }
  navigateTo("payment");
}

// =========================================================================
// VIEW 6: PAYMENT (THANH TOÁN)
// =========================================================================
function buildPaymentView() {
  const hasSelected = appState.booking.seats.length > 0;
  const seatsList = hasSelected ? appState.booking.seats : ["B1", "B2"];
  const totalPrice = hasSelected ? appState.booking.totalPrice : 160000;
  const cleanRoom = String(appState.booking.room || "12").replace(/^Phòng chiếu số\s*/i, "");
  const formattedTotal = formatCurrency(totalPrice);

  return `
    <div class="max-w-[1440px] mx-auto px-4 md:px-6 xl:px-[80px] pt-[88px] md:pt-[96px] lg:pt-[120px] pb-16 lg:pb-[88px]">
      <div class="flex flex-col lg:flex-row items-start gap-4 md:gap-6 lg:gap-8">

        <!-- CỘT TRÁI -->
        <div class="w-full lg:flex-1 flex flex-col gap-4 md:gap-6">
          <section class="w-full p-5 md:p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 flex flex-col gap-5">
            <h2 class="text-white text-lg font-bold">Thông tin phim</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-5">
              <div class="flex flex-col gap-2 order-1">
                <span class="text-ncc-muted text-sm font-normal">Phim</span>
                <span class="text-white text-base font-semibold">${appState.selectedMovie.title}</span>
              </div>

              <div class="flex flex-col gap-2 order-2">
                <span class="text-ncc-muted text-sm font-normal">Ngày giờ chiếu</span>
                <div class="text-base font-semibold">
                  <span class="text-ncc-red">${appState.booking.time}</span>
                  <span class="text-white"> - ${appState.booking.date}</span>
                </div>
              </div>

              <div class="flex flex-col gap-2 order-3 lg:order-5">
                <span class="text-ncc-muted text-sm font-normal">Ghế</span>
                <span class="text-white text-base font-semibold">${seatsList.join(", ")}</span>
              </div>

              <div class="flex flex-col gap-2 order-4 lg:order-3">
                <span class="text-ncc-muted text-sm font-normal">Định dạng</span>
                <span class="text-white text-base font-semibold">${appState.booking.format}</span>
              </div>

              <div class="flex flex-col gap-2 order-5 lg:order-4">
                <span class="text-ncc-muted text-sm font-normal">Phòng chiếu</span>
                <span class="text-white text-base font-semibold">${cleanRoom}</span>
              </div>
            </div>
          </section>

          <section class="w-full p-5 md:p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 flex flex-col gap-4">
            <h2 class="text-white text-lg font-bold">Thông tin thanh toán</h2>
            <div class="flex flex-col gap-1">
              <div class="w-full px-4 py-3 bg-white/5 rounded-xl grid grid-cols-3 items-center text-white text-sm font-medium">
                <div class="text-left">Danh mục</div>
                <div class="text-center">Số lượng</div>
                <div class="text-right">Tổng tiền</div>
              </div>
              <div class="w-full px-4 py-3 rounded-xl grid grid-cols-3 items-center text-white text-sm">
                <div class="text-left font-medium">Ghế (${seatsList.join(",")})</div>
                <div class="text-center font-medium">${seatsList.length}</div>
                <div class="text-right font-semibold">${formattedTotal}</div>
              </div>
            </div>
          </section>
        </div>

        <!-- CỘT PHẢI -->
        <aside class="w-full lg:w-[396px] flex-shrink-0">
          <section class="w-full p-5 md:p-6 bg-ncc-card rounded-[20px] ncc-card-shadow border border-white/10 flex flex-col gap-5">
            <h2 class="text-white text-lg font-bold">Phương thức thanh toán</h2>
            <div id="paymentMethodsList" class="flex flex-col gap-3"></div>

            <div class="flex flex-col gap-3 pt-1">
              <h3 class="text-white text-sm font-bold">Chi phí</h3>
              <div class="w-full px-4 py-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                <span class="text-white font-medium">Thanh toán</span>
                <span class="text-white font-semibold">${formattedTotal}</span>
              </div>
              <div class="w-full px-4 py-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                <span class="text-white font-medium">Phí</span>
                <span class="text-white font-semibold">0đ</span>
              </div>
              <div class="w-full px-4 py-3 bg-red-500/10 rounded-xl flex justify-between items-center text-sm">
                <span class="text-white font-bold">Tổng cộng</span>
                <span class="text-ncc-red font-bold">${formattedTotal}</span>
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-1">
              <button
                id="confirmPayBtn"
                onclick="submitPayment()"
                class="w-full h-10 px-8 py-2.5 btn-login-gradient rounded-full text-red-50 text-sm font-medium leading-5 flex items-center justify-center transition shadow-lg shadow-red-600/20"
              >
                Thanh toán
              </button>
              <button
                onclick="navigateTo('choose-ticket')"
                class="w-full h-10 rounded-full text-white text-sm font-medium leading-5 flex items-center justify-center hover:bg-white/5 transition"
              >
                Quay lại
              </button>
            </div>

            <p class="text-center text-ncc-orange text-xs leading-4">
              <span class="font-bold">Lưu ý:</span> Không mua vé cho trẻ em dưới 13 tuổi đối với các suất chiếu phim kết thúc sau 22h00 và không mua vé cho trẻ em dưới 16 tuổi đối với các suất chiếu phim kết thúc sau 23h00.
            </p>
          </section>
        </aside>

      </div>
    </div>
  `;
}

function renderPaymentMethods() {
  const container = document.getElementById("paymentMethodsList");
  if (!container) return;

  container.innerHTML = NCC_DATA.paymentMethods
    .map((method) => {
      const isSelected = method.id === appState.paymentMethod;
      return `
        <button
          type="button"
          onclick="selectPaymentMethod('${method.id}')"
          class="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all ${
            isSelected
              ? "bg-red-500/10 border border-red-500"
              : "bg-transparent border border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
          }"
        >
          <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isSelected ? "bg-red-500/10 border border-red-500" : "border border-white/20"
          }">
            ${
              isSelected
                ? `<div class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                     <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                     </svg>
                   </div>`
                : ""
            }
          </div>
          <div class="flex items-center gap-3">
            ${method.logoHtml}
            <span class="text-white text-sm font-bold">${method.name}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function selectPaymentMethod(id) {
  appState.paymentMethod = id;
  renderPaymentMethods();
}

function submitPayment() {
  const btn = document.getElementById("confirmPayBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Đang xử lý thanh toán...";
  }
  setTimeout(() => {
    navigateTo("payment-success");
  }, 500);
}

// =========================================================================
// VIEW 7: PAYMENT SUCCESS (ĐẶT VÉ THÀNH CÔNG)
// =========================================================================
function buildPaymentSuccessView() {
  return `
    <div class="flex flex-col items-center justify-center px-4 pt-[112px] md:pt-[120px] lg:pt-[196px] pb-[72px] md:pb-[92px] lg:pb-[104px]">
      <div class="animate-pop w-full max-w-[420px] flex flex-col items-center text-center">
        <div class="w-24 h-24 mb-5 lg:mb-6 flex items-center justify-center">
          <svg viewBox="0 0 96 96" class="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3L17.4 8.6L23 11L17.4 13.4L15 19L12.6 13.4L7 11L12.6 8.6L15 3Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M81 3L83.4 8.6L89 11L83.4 13.4L81 19L78.6 13.4L73 11L78.6 8.6L81 3Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M15 77L17.4 82.6L23 85L17.4 87.4L15 93L12.6 87.4L7 85L12.6 82.6L15 77Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M81 77L83.4 82.6L89 85L83.4 87.4L81 93L78.6 87.4L73 85L78.6 82.6L81 77Z" fill="#F8D448" stroke="#94A3B8" stroke-width="1.6" stroke-linejoin="round" />
            <circle cx="5.5" cy="49" r="3.5" fill="#FBE88C" stroke="#94A3B8" stroke-width="1.6" />
            <circle cx="90.5" cy="49" r="3.5" fill="#FBE88C" stroke="#94A3B8" stroke-width="1.6" />
            <line x1="34" y1="6" x2="36" y2="12" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="62" y1="6" x2="60" y2="12" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="9" y1="25" x2="15" y2="28" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="87" y1="25" x2="81" y2="28" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="9" y1="68" x2="14" y2="65" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="87" y1="68" x2="82" y2="65" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="35" y1="88" x2="38" y2="82" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <line x1="61" y1="88" x2="58" y2="82" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" />
            <path d="M48 14L57.5 33.4L79 36.5L63.5 51.6L67.2 73L48 62.9L28.8 73L32.5 51.6L17 36.5L38.5 33.4L48 14Z" fill="#FBE88C" stroke="#94A3B8" stroke-width="2.4" stroke-linejoin="round" />
            <path d="M48 14L57.5 33.4L79 36.5L63.5 51.6L67.2 73L48 62.9V14Z" fill="#F8D448" fill-opacity="0.45" />
          </svg>
        </div>

        <h1 class="text-slate-50 text-2xl font-bold leading-8 mb-3 lg:mb-4">Đặt vé thành công!</h1>
        <p class="text-ncc-orange text-xs leading-4 mb-9 lg:mb-7 px-2">
          <span class="font-bold">Lưu ý:</span> Hãy đến đúng giờ của suất chiếu và tận hưởng bộ phim
        </p>

        <button
          onclick="finishAndGoHome()"
          class="w-full max-w-[360px] h-10 px-8 py-2.5 btn-login-gradient rounded-full text-red-50 text-sm font-medium leading-5 flex items-center justify-center transition shadow-lg shadow-red-600/25"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  `;
}

function finishAndGoHome() {
  appState.booking.seats = [];
  appState.booking.totalPrice = 0;
  navigateTo("home");
}

// ==================== KHỞI CHẠY ỨNG DỤNG ====================
window.addEventListener("hashchange", renderCurrentRoute);
window.addEventListener("DOMContentLoaded", renderCurrentRoute);