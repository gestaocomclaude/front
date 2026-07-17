const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (prefersReducedMotion.matches) {
  document.documentElement.classList.add("reduce-motion");
}

const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL || "";
const backendApiBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const leadEndpoint = `${backendApiBaseUrl.replace(/\/$/, "")}/api/leads`;
const trackedPageViewPath = "/imersao-empresa-com-claude-v1/";
const pageViewEndpoint = `${backendApiBaseUrl.replace(/\/$/, "")}/api/page-views`;
const pageViewSessionStorageKey = "ecc_page_view_session_id";

const countdownTimers = document.querySelectorAll("[data-countdown-midnight]");
const modal = document.querySelector("#lead-modal");
const form = document.querySelector("#lead-form");
const message = form?.querySelector(".lead-form__message");
const submitButton = form?.querySelector(".lead-form__submit");
const leadTriggers = document.querySelectorAll(".js-lead-trigger");
let lastFocusedElement = null;

function parseOffsetToMs(offset) {
  const match = String(offset || "-03:00").match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return -3 * 60 * 60 * 1000;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * ((hours * 60 + minutes) * 60 * 1000);
}

function getNextMidnightForOffset(now, offsetMs) {
  const shifted = new Date(now.getTime() + offsetMs);
  const nextLocalMidnightUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
  );

  return new Date(nextLocalMidnightUtc - offsetMs);
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { hours, minutes, seconds, text: `${hours}:${minutes}:${seconds}` };
}

function updateCountdownTimers() {
  if (!countdownTimers.length) return;

  const now = new Date();

  countdownTimers.forEach((timer) => {
    const offsetMs = parseOffsetToMs(timer.dataset.countdownMidnight);
    const target = getNextMidnightForOffset(now, offsetMs);
    const duration = formatDuration(target.getTime() - now.getTime());
    const hours = timer.querySelector("[data-countdown-hours]");
    const minutes = timer.querySelector("[data-countdown-minutes]");
    const seconds = timer.querySelector("[data-countdown-seconds]");

    if (hours && minutes && seconds) {
      hours.textContent = duration.hours;
      minutes.textContent = duration.minutes;
      seconds.textContent = duration.seconds;
    } else {
      timer.textContent = duration.text;
    }
  });
}

function setMessage(text, type = "info") {
  if (!message) return;
  message.textContent = text;
  message.dataset.type = type;
}

function openModal(event) {
  event.preventDefault();
  if (!modal || !form || !checkoutUrl || !backendApiBaseUrl) {
    if (!checkoutUrl) return;
    window.location.assign(checkoutUrl);
    return;
  }

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  setMessage("");
  form.querySelector("input")?.focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  setMessage("");
  lastFocusedElement?.focus?.();
}

function getUtms() {
  const params = new URLSearchParams(window.location.search);
  const utms = {};

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) utms[key] = value;
  }

  return utms;
}

function getPageViewSessionId() {
  try {
    const existing = window.localStorage.getItem(pageViewSessionStorageKey);
    if (existing) return existing;

    const id = window.crypto?.randomUUID?.()
      || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(pageViewSessionStorageKey, id);
    return id;
  } catch {
    return null;
  }
}

function sendPageView(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      pageViewEndpoint,
      new Blob([body], { type: "text/plain" }),
    );
    if (sent) return;
  }

  fetch(pageViewEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {});
}

function trackPageView() {
  if (!backendApiBaseUrl || window.location.pathname !== trackedPageViewPath) return;

  const utms = getUtms();

  sendPageView({
    page_path: trackedPageViewPath,
    page_url: window.location.href,
    title: document.title,
    referrer: document.referrer || null,
    session_id: getPageViewSessionId(),
    source: "landing-page-view",
    utm_source: utms.utm_source || null,
    utm_medium: utms.utm_medium || null,
    utm_campaign: utms.utm_campaign || null,
    utm_content: utms.utm_content || null,
    utm_term: utms.utm_term || null,
    utms,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen?.width || null,
    screen_height: window.screen?.height || null,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    user_agent: navigator.userAgent,
    metadata: {
      href: window.location.href,
      reduced_motion: prefersReducedMotion.matches,
    },
  });
}

function buildPayload(formData) {
  const utms = getUtms();

  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    product_slug: "empresa-com-claude",
    source: "landing-page",
    page: window.location.pathname,
    page_path: window.location.pathname,
    checkout_url: checkoutUrl,
    utm_source: utms.utm_source || null,
    utm_medium: utms.utm_medium || null,
    utm_campaign: utms.utm_campaign || null,
    utm_content: utms.utm_content || null,
    utm_term: utms.utm_term || null,
    utms,
    user_agent: navigator.userAgent,
    metadata: {
      title: document.title,
      referrer: document.referrer || null,
      href: window.location.href,
    },
  };
}

async function submitLead(event) {
  event.preventDefault();
  if (!form || !submitButton) return;

  if (!form.reportValidity()) return;
  if (!checkoutUrl || !backendApiBaseUrl) {
    setMessage("Configuracao de checkout indisponivel. Tente novamente em instantes.", "error");
    return;
  }

  const payload = buildPayload(new FormData(form));
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "enviando...";
  setMessage("Enviando seus dados com segurança.");

  try {
    const response = await fetch(leadEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data.message || "Nao foi possivel enviar seus dados.");
    }

    window.location.assign(data.checkout_url || checkoutUrl);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Nao foi possivel enviar seus dados. Tente novamente.",
      "error",
    );
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

leadTriggers.forEach((trigger) => {
  trigger.addEventListener("click", openModal);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

form?.addEventListener("submit", submitLead);
trackPageView();

if (countdownTimers.length) {
  updateCountdownTimers();
  window.setInterval(updateCountdownTimers, 1000);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }
});
