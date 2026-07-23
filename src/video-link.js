import Hls from "hls.js/dist/hls.light.mjs";

const backendApiBaseUrl = window.__ECC_VIDEO_API_BASE__ || import.meta.env.VITE_BACKEND_API_BASE_URL || "";
const apiBase = backendApiBaseUrl.replace(/\/$/, "");
const sessionStorageKey = "ecc_session_id";

const shell = document.querySelector(".video-shell");
const video = document.querySelector("[data-video]");
const playButton = document.querySelector("[data-play-button]");
const finalCta = document.querySelector("[data-final-cta]");
const unavailable = document.querySelector("[data-unavailable]");
const stage = document.querySelector(".video-stage");
const progressBar = document.querySelector("[data-progress-bar]");

const sentEvents = new Set();
let page = null;
let isPlaying = false;
let hls = null;
let embedIframe = null;
let embedPlayer = null;
let embedDuration = null;
let embedCurrentTime = null;

function setState(state) {
  shell?.setAttribute("data-state", state);
}

function getSlug() {
  const pathMatch = window.location.pathname.match(/^\/assistir\/([a-z0-9-]+)\/?$/);
  const querySlug = new URLSearchParams(window.location.search).get("slug");
  return (pathMatch?.[1] || querySlug || "").trim().toLowerCase();
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(sessionStorageKey);
    if (existing) return existing;

    const id = window.crypto?.randomUUID?.()
      || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(sessionStorageKey, id);
    return id;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
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

function buildEventPayload(eventType) {
  const utms = getUtms();
  const duration = Number.isFinite(embedDuration) ? embedDuration : Number.isFinite(video?.duration) ? video.duration : null;
  const currentTime = Number.isFinite(embedCurrentTime) ? embedCurrentTime : Number.isFinite(video?.currentTime) ? video.currentTime : null;
  const progress = duration && currentTime ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : null;

  return {
    slug: page?.slug || getSlug(),
    event_type: eventType,
    session_id: getSessionId(),
    page_url: window.location.href,
    referrer: document.referrer || null,
    utm_source: utms.utm_source || null,
    utm_medium: utms.utm_medium || null,
    utm_campaign: utms.utm_campaign || null,
    utm_content: utms.utm_content || null,
    utm_term: utms.utm_term || null,
    watched_seconds: currentTime,
    video_duration: duration,
    progress_percent: progress,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    user_agent: navigator.userAgent,
    utms,
    metadata: {
      title: document.title,
      href: window.location.href,
      reduced_motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
  };
}

function sendEvent(eventType, options = {}) {
  if (!apiBase || !page?.slug) return;
  if (options.once && sentEvents.has(eventType)) return;
  if (options.once) sentEvents.add(eventType);

  const body = JSON.stringify(buildEventPayload(eventType));
  const endpoint = `${apiBase}/api/video-events`;

  if (options.beacon && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain" }));
    if (sent) return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: Boolean(options.keepalive),
  }).catch(() => {});
}

function showUnavailable(message = "Video nao encontrado") {
  document.title = "Video indisponivel";
  stage.hidden = true;
  unavailable.hidden = false;
  unavailable.querySelector("h1").textContent = message;
  setState("unavailable");
}

async function loadPage() {
  const slug = getSlug();

  if (!slug || !apiBase) {
    showUnavailable(!apiBase ? "Configuracao indisponivel" : "Video nao encontrado");
    return;
  }

  try {
    const response = await getVideoPageResponse(slug);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.page) {
      throw new Error(data.message || "Video nao encontrado");
    }

    page = data.page;
    document.title = `${page.title} | Julia Ferreira`;
    playButton.lastChild.textContent = page.play_button_label || "clique para assistir";
    finalCta.textContent = page.cta_label || "continuar";
    finalCta.href = page.cta_url;
    preloadVideoAssets(page);
    const sourceMode = await setupVideoSource(page);
    video.controls = false;
    video.defaultPlaybackRate = 1;
    video.playbackRate = 1;
    if (sourceMode !== "hls-js") {
      video.load();
    }
    setState("ready");
    playButton.disabled = false;
    sendEvent("page_view", { once: true, beacon: true });
    sendEvent("video_preload_started", { once: true });
  } catch (error) {
    showUnavailable(error instanceof Error ? error.message : "Video nao encontrado");
  }
}

function getVideoPageResponse(slug) {
  if (window.__ECC_VIDEO_PAGE_PROMISE__) {
    const promise = window.__ECC_VIDEO_PAGE_PROMISE__;
    window.__ECC_VIDEO_PAGE_PROMISE__ = null;
    return promise;
  }

  return fetch(`${apiBase}/api/video-pages/${encodeURIComponent(slug)}`, {
    headers: { "Accept": "application/json" },
  });
}

function preloadVideoAssets(videoPage) {
  if (videoPage.video_type === "embed") return;

  const urls = Array.isArray(videoPage.preload_urls) ? videoPage.preload_urls : [];
  const selectedSourceUrl = getSelectedSourceUrl(videoPage);
  const preloadUrls = selectedSourceUrl ? [selectedSourceUrl, ...urls.filter((url) => url !== selectedSourceUrl)] : urls;

  preloadUrls.slice(0, 2).forEach((url) => {
    if (!url) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;
    link.as = url.includes(".m3u8") || url.includes(".ts") ? "fetch" : "video";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
}

function isLikelyMobile() {
  return window.matchMedia("(pointer: coarse)").matches
    || window.matchMedia("(max-width: 820px)").matches
    || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getSelectedSourceUrl(videoPage) {
  const hlsSourceUrl = videoPage.stream_url || videoPage.video_url;
  if (isLikelyMobile() && videoPage.mobile_fallback_url) {
    return videoPage.mobile_fallback_url;
  }

  return hlsSourceUrl;
}

async function setupVideoSource(videoPage) {
  const sourceUrl = getSelectedSourceUrl(videoPage);
  const isEmbed = videoPage.video_type === "embed" || /player\.mediadelivery\.net\/embed\//.test(sourceUrl);
  const isHls = /\.m3u8(?:$|\?)/.test(sourceUrl);

  hls?.destroy?.();
  hls = null;
  embedPlayer = null;
  embedIframe?.remove?.();
  embedIframe = null;
  embedDuration = null;
  embedCurrentTime = null;
  video.removeAttribute("src");
  video.hidden = false;

  if (isEmbed) {
    setupEmbedSource(sourceUrl);
    return "embed";
  }

  if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = sourceUrl;
    return "native-hls";
  }

  if (isHls) {
    if (!Hls.isSupported()) {
      video.src = sourceUrl;
      return "fallback";
    }

    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 30,
      startPosition: 0,
    });
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls?.loadSource(sourceUrl);
    });
    hls.on(Hls.Events.MANIFEST_PARSED, unlockReadyState);
    hls.on(Hls.Events.FRAG_BUFFERED, unlockReadyState);
    hls.attachMedia(video);
    return "hls-js";
  }

  video.src = sourceUrl;
  return "file";
}

function setupEmbedSource(sourceUrl) {
  const uniqueUrl = new URL(sourceUrl);
  uniqueUrl.searchParams.set("preload", "true");
  uniqueUrl.searchParams.set("responsive", "true");
  uniqueUrl.searchParams.set("_ecc", getSessionId());

  video.hidden = true;
  embedIframe = document.createElement("iframe");
  embedIframe.className = "locked-video bunny-embed";
  embedIframe.src = uniqueUrl.toString();
  embedIframe.loading = "eager";
  embedIframe.allow = "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen";
  embedIframe.allowFullscreen = true;
  embedIframe.setAttribute("data-bunny-embed", "");
  embedIframe.setAttribute("title", page?.title || "Video");
  video.insertAdjacentElement("afterend", embedIframe);

  if (!window.playerjs?.Player) {
    unlockReadyState();
    return;
  }

  embedPlayer = new window.playerjs.Player(embedIframe);
  embedPlayer.on("ready", () => {
    embedPlayer?.getDuration?.((duration) => {
      embedDuration = Number(duration);
    });
    unlockReadyState();
  });
  embedPlayer.on("play", () => {
    isPlaying = true;
    setState("playing");
    sendEvent("play_started", { once: true });
  });
  embedPlayer.on("timeupdate", (data) => {
    embedCurrentTime = Number(data?.seconds);
    embedDuration = Number(data?.duration);
    trackProgress();
  });
  embedPlayer.on("ended", completeVideo);
}

function unlockReadyState() {
  if (!page || isPlaying) return;
  setState("ready");
  playButton.disabled = false;
}

async function playVideo() {
  if (!video || !page) return;

  try {
    playButton.disabled = true;
    if (embedPlayer) {
      embedPlayer.play();
      return;
    }
    hls?.startLoad?.(0);
    video.playbackRate = 1;
    await video.play();
    isPlaying = true;
    setState("playing");
    sendEvent("play_started", { once: true });
  } catch {
    playButton.disabled = false;
  }
}

function enforcePlaybackRate() {
  if (!video) return;
  if (video.playbackRate !== 1) {
    video.playbackRate = 1;
  }
}

function trackProgress() {
  const duration = Number.isFinite(embedDuration) ? embedDuration : video?.duration;
  const currentTime = Number.isFinite(embedCurrentTime) ? embedCurrentTime : video?.currentTime;
  if (!duration) return;
  const progress = (currentTime / duration) * 100;
  updateProgressBar(progress);

  if (progress >= 25) sendEvent("progress_25", { once: true });
  if (progress >= 50) sendEvent("progress_50", { once: true });
  if (progress >= 75) sendEvent("progress_75", { once: true });
}

function updateProgressBar(progress) {
  if (!progressBar) return;
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  progressBar.style.width = `${safeProgress}%`;
}

function completeVideo() {
  setState("completed");
  updateProgressBar(100);
  finalCta.hidden = false;
  sendEvent("progress_75", { once: true, keepalive: true });
  sendEvent("video_completed", { once: true, keepalive: true });
  sendEvent("cta_revealed", { once: true, keepalive: true });
}

function handleCtaClick(event) {
  event.preventDefault();
  const href = finalCta.href;
  sendEvent("cta_clicked", { once: true, beacon: true, keepalive: true });
  window.setTimeout(() => {
    window.location.assign(href);
  }, 120);
}

video?.addEventListener("loadeddata", unlockReadyState);
video?.addEventListener("loadedmetadata", unlockReadyState);
video?.addEventListener("canplay", unlockReadyState);
video?.addEventListener("ratechange", enforcePlaybackRate);
video?.addEventListener("timeupdate", trackProgress);
video?.addEventListener("ended", completeVideo);
video?.addEventListener("contextmenu", (event) => event.preventDefault());
playButton?.addEventListener("click", playVideo);
finalCta?.addEventListener("click", handleCtaClick);

loadPage();
