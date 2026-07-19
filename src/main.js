const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (prefersReducedMotion.matches) {
  document.documentElement.classList.add("reduce-motion");
}

const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL || "";
const backendApiBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const leadEndpoint = `${backendApiBaseUrl.replace(/\/$/, "")}/api/leads`;
const trackedPageViewPattern = /^\/imersao-empresa-com-claude-v[2-5]\/$/;
const pageViewEndpoint = `${backendApiBaseUrl.replace(/\/$/, "")}/api/page-views`;
const leadEventEndpoint = `${backendApiBaseUrl.replace(/\/$/, "")}/api/lead-events`;
const sessionStorageKey = "ecc_session_id";
const legacyPageViewSessionStorageKey = "ecc_page_view_session_id";

const countdownTimers = document.querySelectorAll("[data-countdown-midnight], [data-countdown-target]");
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

function getCountdownTarget(timer, now, offsetMs) {
  if (timer.dataset.countdownTarget) {
    const target = new Date(timer.dataset.countdownTarget);
    if (!Number.isNaN(target.getTime())) return target;
  }

  return getNextMidnightForOffset(now, offsetMs);
}

function formatDuration(ms, includeDays = false) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hoursValue = includeDays ? Math.floor((totalSeconds % 86400) / 3600) : Math.floor(totalSeconds / 3600);
  const hours = String(hoursValue).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return { days: String(days).padStart(2, "0"), hours, minutes, seconds, text: includeDays ? `${days}:${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}` };
}

function updateCountdownTimers() {
  if (!countdownTimers.length) return;

  const now = new Date();

  countdownTimers.forEach((timer) => {
    const offsetMs = parseOffsetToMs(timer.dataset.countdownMidnight);
    const target = getCountdownTarget(timer, now, offsetMs);
    const days = timer.querySelector("[data-countdown-days]");
    const duration = formatDuration(target.getTime() - now.getTime(), Boolean(days));
    const hours = timer.querySelector("[data-countdown-hours]");
    const minutes = timer.querySelector("[data-countdown-minutes]");
    const seconds = timer.querySelector("[data-countdown-seconds]");

    if (days) {
      days.textContent = duration.days;
    }

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
  trackLeadEvent("lead_modal_opened");
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

function getClickIds() {
  const params = new URLSearchParams(window.location.search);
  const clickIds = {};

  for (const key of ["fbclid", "gclid"]) {
    const value = params.get(key);
    if (value) clickIds[key] = value;
  }

  return clickIds;
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(sessionStorageKey)
      || window.localStorage.getItem(legacyPageViewSessionStorageKey);
    if (existing) return existing;

    const id = window.crypto?.randomUUID?.()
      || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(sessionStorageKey, id);
    return id;
  } catch {
    return null;
  }
}

function buildTrackingPayload(eventName = null) {
  const utms = getUtms();
  const clickIds = getClickIds();

  return {
    event_name: eventName,
    page_path: window.location.pathname,
    page_url: window.location.href,
    title: document.title,
    referrer: document.referrer || null,
    session_id: getSessionId(),
    source: "landing-page",
    utm_source: utms.utm_source || null,
    utm_medium: utms.utm_medium || null,
    utm_campaign: utms.utm_campaign || null,
    utm_content: utms.utm_content || null,
    utm_term: utms.utm_term || null,
    fbclid: clickIds.fbclid || null,
    gclid: clickIds.gclid || null,
    utms,
    user_agent: navigator.userAgent,
    metadata: {
      href: window.location.href,
      referrer: document.referrer || null,
      reduced_motion: prefersReducedMotion.matches,
      ...clickIds,
    },
  };
}

function sendJsonEvent(endpoint, payload, preferBeacon = false) {
  const body = JSON.stringify(payload);

  if (preferBeacon && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      endpoint,
      new Blob([body], { type: "text/plain" }),
    );
    if (sent) return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {});
}

function trackLeadEvent(eventName) {
  if (!backendApiBaseUrl) return;
  sendJsonEvent(leadEventEndpoint, buildTrackingPayload(eventName));
}

function trackPageView() {
  if (!backendApiBaseUrl || !trackedPageViewPattern.test(window.location.pathname)) return;

  sendJsonEvent(pageViewEndpoint, {
    ...buildTrackingPayload(),
    source: "landing-page-view",
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen?.width || null,
    screen_height: window.screen?.height || null,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
  }, true);
}

function buildPayload(formData) {
  const tracking = buildTrackingPayload();

  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    instagram_handle: String(formData.get("instagram_handle") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    product_slug: "empresa-com-claude",
    source: "landing-page",
    page: window.location.pathname,
    page_path: window.location.pathname,
    page_url: window.location.href,
    checkout_url: checkoutUrl,
    session_id: tracking.session_id,
    referrer: tracking.referrer,
    utm_source: tracking.utm_source,
    utm_medium: tracking.utm_medium,
    utm_campaign: tracking.utm_campaign,
    utm_content: tracking.utm_content,
    utm_term: tracking.utm_term,
    fbclid: tracking.fbclid,
    gclid: tracking.gclid,
    utms: tracking.utms,
    user_agent: navigator.userAgent,
    metadata: {
      ...tracking.metadata,
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
