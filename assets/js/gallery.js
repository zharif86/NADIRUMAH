(function () {
  const grid = document.querySelector("#gallery-grid");
  const empty = document.querySelector("#gallery-empty");
  const note = document.querySelector("#gallery-note");
  const pick = document.querySelector("#gallery-pick");
  const input = document.querySelector("#gallery-file");
  const frameBtn = document.querySelector("#frame-now");
  const frame = document.querySelector("#frame");
  const stage = document.querySelector("#frame-stage");
  const who = document.querySelector("#frame-who");
  const clock = document.querySelector("#frame-clock");
  if (!grid || !frame) return;

  const items = [];
  const urls = new Map();
  let frameTimer = 0;
  let frameIndex = 0;
  let idleTimer = 0;
  let framing = false;
  const idleMs = 60000;

  function owner() {
    const name = sessionStorage.getItem("nr_name") || "Keluarga";
    const admin = sessionStorage.getItem("nr_role") === "admin";
    if (!admin) return name;
    return name.toLowerCase() === "admin" ? "Pentadbir" : "Pentadbir · " + name;
  }

  function say(message) {
    if (!note) return;
    note.hidden = !message;
    note.textContent = message || "";
  }

  const houses = window.NR_HOUSES || [];
  const house = houses.find((item) => item.id === sessionStorage.getItem("nr_house")) || houses[0];
  const houseId = house ? house.id : "aminah";

  function db() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("nadirumah-" + houseId, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("gallery", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function remember(record) {
    const url = URL.createObjectURL(record.blob);
    urls.set(record.id, url);
    items.push({ id: record.id, type: record.type, by: record.by, url: url });
  }

  function paint() {
    grid.replaceChildren();
    items.forEach((item) => {
      const tile = document.createElement("figure");
      tile.className = "gallery-tile";
      const media = document.createElement(item.type.indexOf("video") === 0 ? "video" : "img");
      media.src = item.url;
      if (media.tagName === "VIDEO") {
        media.muted = true;
        media.controls = true;
      }
      if (media.tagName === "IMG") media.alt = "Gambar keluarga dimuat naik oleh " + item.by;
      const cap = document.createElement("figcaption");
      const name = document.createElement("span");
      name.textContent = item.by;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Buang";
      remove.addEventListener("click", () => removeItem(item.id));
      cap.append(name, remove);
      tile.append(media, cap);
      grid.append(tile);
    });
    if (empty) empty.hidden = items.length > 0;
  }

  function load() {
    return db().then((database) => new Promise((resolve, reject) => {
      const request = database.transaction("gallery").objectStore("gallery").getAll();
      request.onsuccess = () => {
        items.length = 0;
        urls.forEach((url) => URL.revokeObjectURL(url));
        urls.clear();
        request.result
          .sort((a, b) => a.created - b.created)
          .forEach(remember);
        paint();
        resolve();
      };
      request.onerror = () => reject(request.error);
    }));
  }

  function save(file) {
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      type: file.type || "application/octet-stream",
      by: owner(),
      created: Date.now(),
      blob: file
    };
    return db().then((database) => new Promise((resolve, reject) => {
      const request = database.transaction("gallery", "readwrite").objectStore("gallery").put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  function removeItem(id) {
    return db().then((database) => new Promise((resolve, reject) => {
      const request = database.transaction("gallery", "readwrite").objectStore("gallery").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })).then(load);
  }

  function stamp() {
    if (!clock) return;
    const time = new Intl.DateTimeFormat("ms-MY", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kuala_Lumpur"
    }).format(new Date());
    const temp = document.querySelector("#weather-temp");
    clock.textContent = time + (temp && temp.textContent !== "—" ? " · " + temp.textContent : "");
  }

  function nextFrame() {
    if (!framing || !items.length) return;
    window.clearTimeout(frameTimer);
    frameIndex = (frameIndex + 1) % items.length;
    showFrame();
  }

  function showFrame() {
    const item = items[frameIndex];
    stage.replaceChildren();
    const media = document.createElement(item.type.indexOf("video") === 0 ? "video" : "img");
    media.className = "frame-media";
    media.src = item.url;
    if (media.tagName === "VIDEO") {
      media.muted = true;
      media.autoplay = true;
      media.playsInline = true;
      media.addEventListener("ended", nextFrame);
    } else {
      media.alt = "";
      frameTimer = window.setTimeout(nextFrame, 8000);
    }
    stage.append(media);
    if (who) who.textContent = item.by;
    stamp();
  }

  function openFrame() {
    if (!items.length) {
      say("Muat naik sekurang-kurangnya satu gambar atau video dahulu.");
      return;
    }
    say("");
    framing = true;
    frame.hidden = false;
    frameIndex = 0;
    showFrame();
  }

  function closeFrame() {
    framing = false;
    window.clearTimeout(frameTimer);
    frame.hidden = true;
    stage.replaceChildren();
    bump();
  }

  function bump() {
    window.clearTimeout(idleTimer);
    if (framing || !items.length) return;
    idleTimer = window.setTimeout(openFrame, idleMs);
  }

  const galleryForm = document.querySelector("#gallery-form");
  if (galleryForm) galleryForm.addEventListener("submit", (event) => event.preventDefault());

  if (pick && input) {
    pick.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      const files = [...input.files];
      input.value = "";
      const queue = files.reduce((job, file) => job.then(() => {
        if (file.size > 80 * 1024 * 1024) {
          say("Fail lebih 80MB tidak dimuat naik.");
          return null;
        }
        return save(file);
      }), Promise.resolve());
      queue.then(load).then(() => {
        if (items.length) say("");
        bump();
      }).catch(() => say("Galeri tidak dapat menyimpan fail ini pada pelayar."));
    });
  }
  if (frameBtn) frameBtn.addEventListener("click", openFrame);
  frame.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    closeFrame();
  });
  ["pointerdown", "keydown"].forEach((type) => {
    document.addEventListener(type, (event) => {
      if (event.target.closest && event.target.closest("#frame")) return;
      bump();
    });
  });

  function seedAlbums() {
    const albums = house && house.albums ? house.albums : [];
    const flag = "nr_gallery_seeded_" + houseId;
    if (!albums.length || localStorage.getItem(flag) === "1") return Promise.resolve();
    const jobs = albums.map((title) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f7f3ec";
      ctx.fillRect(0, 0, 1280, 800);
      ctx.fillStyle = "#3e5a42";
      ctx.fillRect(90, 90, 1100, 620);
      ctx.fillStyle = "#f7f3ec";
      ctx.font = "48px Georgia, serif";
      ctx.fillText(title, 150, 400);
      ctx.font = "24px Georgia, serif";
      ctx.fillText(house.label, 150, 460);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.86);
      }).then((blob) => (blob ? save(blob) : null));
    });
    return Promise.all(jobs).then(() => {
      localStorage.setItem(flag, "1");
    });
  }

  load()
    .then(() => (items.length ? null : seedAlbums()))
    .then(() => (items.length ? null : load()))
    .then(bump)
    .catch(() => say("Galeri tidak dapat dibuka pada pelayar ini."));
  window.setInterval(stamp, 30000);
})();
