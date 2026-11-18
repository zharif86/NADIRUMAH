(function () {
  const role = sessionStorage.getItem("nr_role");
  const houses = window.NR_HOUSES || [];
  if (!sessionStorage.getItem("nr_house") && houses[0]) {
    sessionStorage.setItem("nr_house", houses[0].id);
  }
  const active = houses.find((item) => item.id === sessionStorage.getItem("nr_house")) || houses[0];
  const name = (active && role !== "admin" ? active.name : sessionStorage.getItem("nr_name")) || "Aminah";
  document.querySelectorAll("[data-name]").forEach((el) => {
    el.textContent = name;
  });
  if (active) {
    document.querySelectorAll("[data-house]").forEach((el) => {
      el.textContent = role === "admin" ? "Pentadbir · " + active.label : active.label;
    });
  }
  const houseSwitch = document.querySelector("#house-switch");
  const housePick = document.querySelector("#house-pick");
  if (role === "admin" && houseSwitch && housePick && houses.length) {
    houseSwitch.hidden = false;
    houses.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      if (active && item.id === active.id) option.selected = true;
      housePick.append(option);
    });
    housePick.addEventListener("change", () => {
      sessionStorage.setItem("nr_house", housePick.value);
      window.location.reload();
    });
  }

  document.querySelectorAll("[data-logout]").forEach((el) => {
    el.addEventListener("click", () => {
      sessionStorage.removeItem("nr_role");
      sessionStorage.removeItem("nr_name");
      sessionStorage.removeItem("nr_email");
      sessionStorage.removeItem("nr_house");
    });
  });

  const buttons = document.querySelectorAll(".side button[data-tab]");
  const panels = document.querySelectorAll(".panel");
  function openTab(id) {
    buttons.forEach((b) => b.classList.toggle("on", b.dataset.tab === id));
    panels.forEach((p) => {
      p.classList.remove("on");
      if (p.id === id) {
        void p.offsetWidth;
        p.classList.add("on");
      }
    });
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => openTab(btn.dataset.tab));
  });
  document.querySelectorAll("[data-open-tab]").forEach((el) => {
    el.addEventListener("click", () => openTab(el.getAttribute("data-open-tab")));
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduce || !Number.isFinite(target)) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  const canvas = document.querySelector("#dust");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    const stage = canvas.parentElement;
    let dots = [];
    function size() {
      canvas.width = stage.clientWidth;
      canvas.height = stage.clientHeight;
      const count = Math.round((canvas.width * canvas.height) / 28000);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.4,
        v: Math.random() * 0.28 + 0.04,
        gold: Math.random() > 0.7
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.y -= d.v;
        if (d.y < -4) d.y = canvas.height + 4;
        ctx.beginPath();
        ctx.fillStyle = d.gold ? "rgba(196,160,106,0.55)" : "rgba(62,90,66,0.22)";
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    size();
    frame();
    window.addEventListener("resize", size);
  }

  const tracks = [
    { name: "Piano cerah", bpm: 72, drone: [146.83, 220], notes: [71, 69, 67, -1, 69, 67, 66, -1, 74, 73, 71, 69], air: 0 },
    { name: "Piano mendung", bpm: 66, drone: [146.83, 196], notes: [74, 78, 76, 74, 73, 74, 76, 78, 79, 78, 76, 74], air: 0 },
    { name: "Piano hujan", bpm: 60, drone: [110, 164.81], notes: [76, 74, 72, 71, 69, 67, 69, 71, 72, 74, 72, 69], air: 0.04 },
    { name: "Dodoi malam", bpm: 56, drone: [98, 146.83], notes: [67, 67, 71, 67, 74, 74, 72, 71, 69, 67, 66, 67], air: 0 }
  ];

  const pad = document.querySelector(".soundpad");
  const toggle = document.querySelector(".sound-toggle");
  const panel = document.querySelector("#sound-panel");
  const nowEl = document.querySelector("#sound-now");
  const playBtn = document.querySelector("[data-music='toggle']");
  const volInput = document.querySelector("#sound-vol");
  const trackButtons = [...document.querySelectorAll("[data-track]")];
  let ctx;
  let musicGain;
  let airGain;
  let drones = [];
  let playing = false;
  let paused = false;
  let index = 0;
  let step = 0;
  let nextTime = 0;
  let clock = 0;
  let followWeather = sessionStorage.getItem("nr_music_follow") !== "0";
  let weatherTrack = 0;
  const followBtn = document.querySelector("[data-weather-music]");
  const savedVol = sessionStorage.getItem("nr_music_vol");
  let volume = savedVol === null ? 0.45 : Number(savedVol) / 100;
  if (volInput && savedVol !== null) volInput.value = savedVol;

  function midiFreqNote(freq, when, dur) {
    const osc = ctx.createOscillator();
    const warm = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    warm.type = "triangle";
    osc.frequency.setValueAtTime(freq, when);
    warm.frequency.setValueAtTime(freq * 1.005, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.07, when + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    warm.connect(gain);
    gain.connect(musicGain);
    osc.start(when);
    warm.start(when);
    osc.stop(when + dur + 0.05);
    warm.stop(when + dur + 0.05);
  }

  function applyTrack(next) {
    index = next;
    step = 0;
    const track = tracks[index];
    if (nowEl) nowEl.textContent = track.name;
    trackButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.track === String(index) ? "true" : "false");
    });
    if (!ctx) return;
    drones.forEach((voice, i) => {
      const freq = track.drone[i] || track.drone[0];
      voice.a.frequency.setTargetAtTime(freq, ctx.currentTime, 0.4);
      voice.b.frequency.setTargetAtTime(freq * 1.004, ctx.currentTime, 0.4);
    });
    if (airGain) airGain.gain.setTargetAtTime(track.air, ctx.currentTime, 0.6);
    if (followBtn) followBtn.setAttribute("aria-pressed", followWeather ? "true" : "false");
  }

  function musicLevel() {
    return playing ? Math.max(0.0001, volume * 0.22) : 0.0001;
  }

  function buildAudio() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0001;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.4;
    musicGain.connect(filter);
    filter.connect(ctx.destination);
    drones = tracks[0].drone.map((freq) => {
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      const gain = ctx.createGain();
      a.type = "sine";
      b.type = "sine";
      a.frequency.value = freq;
      b.frequency.value = freq * 1.004;
      gain.gain.value = 0.045;
      a.connect(gain);
      b.connect(gain);
      gain.connect(musicGain);
      a.start();
      b.start();
      return { a, b, gain };
    });
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "lowpass";
    band.frequency.value = 900;
    airGain = ctx.createGain();
    airGain.gain.value = 0;
    noise.connect(band);
    band.connect(airGain);
    airGain.connect(musicGain);
    noise.start();
    applyTrack(index);
  }

  function playClick() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  function schedule() {
    if (!playing || !ctx) return;
    const beat = 60 / tracks[index].bpm;
    while (nextTime < ctx.currentTime + 0.45) {
      const midi = tracks[index].notes[step % tracks[index].notes.length];
      if (midi >= 0) {
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        midiFreqNote(freq, nextTime, beat * 1.6);
      }
      nextTime += beat;
      step += 1;
    }
  }

  function startMusic() {
    buildAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    paused = false;
    nextTime = ctx.currentTime + 0.08;
    musicGain.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.4);
    if (playBtn) playBtn.textContent = "Jeda";
    if (toggle) toggle.classList.add("is-on");
    if (!clock) clock = window.setInterval(schedule, 120);
    schedule();
  }

  function pauseMusic() {
    playing = false;
    paused = true;
    if (ctx && musicGain) musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    if (playBtn) playBtn.textContent = "Main";
    if (toggle) toggle.classList.remove("is-on");
  }

  function setPanel(open) {
    if (!panel || !toggle) return;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (toggle && panel) {
    toggle.addEventListener("click", () => setPanel(panel.hidden));
  }
  const minBtn = document.querySelector(".sound-min");
  if (minBtn) minBtn.addEventListener("click", () => setPanel(false));
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      buildAudio();
      if (ctx && ctx.state === "suspended") ctx.resume();
      if (playing) pauseMusic();
      else startMusic();
    });
  }
  trackButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      followWeather = false;
      sessionStorage.setItem("nr_music_follow", "0");
      applyTrack(Number(btn.dataset.track));
    });
  });
  if (followBtn) {
    followBtn.addEventListener("click", () => {
      followWeather = true;
      sessionStorage.setItem("nr_music_follow", "1");
      applyTrack(weatherTrack);
    });
  }
  if (volInput) {
    volInput.addEventListener("input", () => {
      volume = Number(volInput.value) / 100;
      sessionStorage.setItem("nr_music_vol", volInput.value);
      if (ctx && musicGain && playing) musicGain.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.08);
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".dash, .soundpad")) return;
    buildAudio();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (event.target.closest("button")) playClick();
    if (!playing && !paused && !event.target.closest(".soundpad")) startMusic();
  }, true);

  function skyFor(code, isDay) {
    if ([95, 96, 99].includes(code)) return "rain";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
    if (!isDay) return "night";
    if (code === 0 || code === 1) return "sun";
    return "cloud";
  }

  function labelFor(code) {
    const names = {
      0: "Cerah",
      1: "Cerah sedikit",
      2: "Separuh mendung",
      3: "Mendung",
      45: "Kabus",
      48: "Kabus",
      51: "Hujan renyai",
      53: "Hujan renyai",
      55: "Hujan renyai",
      61: "Hujan",
      63: "Hujan",
      65: "Hujan lebat",
      80: "Hujan renyai",
      81: "Hujan",
      82: "Hujan lebat",
      95: "Ribut petir",
      96: "Ribut petir",
      99: "Ribut petir"
    };
    return names[code] || "Cuaca semasa";
  }

  function trackForWeather(code, isDay) {
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return 2;
    if (!isDay || code === 45 || code === 48) return 3;
    if (code === 0 || code === 1) return 0;
    return 1;
  }

  function showWeather(place, current) {
    const temp = document.querySelector("#weather-temp");
    const label = document.querySelector("#weather-label");
    const sky = document.querySelector(".weather-sky");
    const code = current.weather_code;
    const isDay = current.is_day === 1;
    if (temp) temp.textContent = Math.round(current.temperature_2m) + "°";
    if (label) label.textContent = place + " · " + labelFor(code);
    if (sky) sky.dataset.sky = skyFor(code, isDay);
    weatherTrack = trackForWeather(code, isDay);
    if (followWeather) applyTrack(weatherTrack);
  }

  function loadWeather(lat, lon, place) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,weather_code,is_day&timezone=Asia%2FKuala_Lumpur";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) showWeather(place, data.current);
      })
      .catch(() => {
        const label = document.querySelector("#weather-label");
        if (label) label.textContent = "Cuaca tidak tersedia";
      });
  }

  function placeName(lat, lon) {
    const url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=ms";
    return fetch(url)
      .then((res) => res.json())
      .then((data) => data.city || data.locality || "Di sini")
      .catch(() => "Di sini");
  }

  const here = { lat: 3.0738, lon: 101.5183, place: "Shah Alam" };
  function refreshWeather() {
    loadWeather(here.lat, here.lon, here.place);
  }
  refreshWeather();
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        here.lat = pos.coords.latitude;
        here.lon = pos.coords.longitude;
        placeName(here.lat, here.lon).then((place) => {
          here.place = place;
          refreshWeather();
        });
      },
      refreshWeather,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    );
  }
  window.setInterval(refreshWeather, 600000);
})();
