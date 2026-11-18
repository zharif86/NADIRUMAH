(function () {
  const houses = window.NR_HOUSES || [];
  const house = houses.find((item) => item.id === sessionStorage.getItem("nr_house")) || houses[0];
  const key = "nr_books_" + (house ? house.id : "aminah");
  const seed = (house && house.books) || {
    ahli: [
      { title: "Aminah", detail: "Ibu" },
      { title: "Hassan", detail: "Bapa" },
      { title: "Aisyah", detail: "Anak" },
      { title: "Adam", detail: "Anak" }
    ],
    logistik: [
      { title: "Shopee · lampin & sabun", detail: "Hari ini" },
      { title: "Pos Laju · buku latihan Adam", detail: "Esok" }
    ],
    selenggara: [
      { title: "Penghawa dingin bilik tidur berbunyi", detail: "Terbuka" },
      { title: "Lampu koridor kelip", detail: "Dijadualkan" },
      { title: "Paip singki dapur", detail: "Selesai" }
    ],
    tugasan: [
      { title: "Aisyah · lipat baju", detail: "20 mata · menunggu" },
      { title: "Adam · siram tanaman", detail: "15 mata · selesai" }
    ],
    dapur: [
      { title: "Beras", detail: "2 hari" },
      { title: "Susu segar", detail: "Hampir habis" },
      { title: "Telur", detail: "Cukup" }
    ],
    kesihatan: [
      { title: "Alahan Adam", detail: "Udang · epipen di laci dapur" },
      { title: "Klinik keluarga", detail: "Klinik Kelana, 03-0000 2211" },
      { title: "Latihan Aisyah", detail: "Khamis 17:30" }
    ],
    kewangan: [
      { title: "TNB", detail: "RM186 · 12 haribulan" },
      { title: "Air", detail: "RM42 · 18 haribulan" },
      { title: "Cukai tanah", detail: "Mac · belum dijana" }
    ],
    ai: [
      { title: "Stok beras menyusut lebih cepat minggu ini. Cadangan: 5kg, bukan 10kg.", detail: "Ramalan" },
      { title: "Servis penghawa dingin Sabtu 10:00 bertindih dengan latihan.", detail: "Jadual" },
      { title: "Cukai tanah tahun lepas dibayar 3 hari lewat.", detail: "Cukai" }
    ]
  };

  let books = null;
  try {
    books = JSON.parse(localStorage.getItem(key) || "null");
  } catch (err) {
    books = null;
  }
  if (!books || typeof books !== "object") books = JSON.parse(JSON.stringify(seed));

  function save() {
    localStorage.setItem(key, JSON.stringify(books));
  }

  function rowLine(title, detail, onRemove) {
    const line = document.createElement("div");
    line.className = "rowline";
    const label = document.createElement("span");
    label.textContent = title;
    const value = document.createElement("b");
    value.textContent = detail;
    line.append(label, value);
    if (onRemove) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "row-x";
      remove.textContent = "Buang";
      remove.addEventListener("click", onRemove);
      line.append(remove);
    }
    return line;
  }

  function paint(name) {
    const box = document.querySelector('[data-list="' + name + '"]');
    if (!box) return;
    const rows = books[name] || [];
    box.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Belum ada rekod. Isi borang di atas, kemudian tekan Simpan.";
      box.append(empty);
      if (name === "tugasan" || name === "ahli") paintRank();
      if (name === "dapur") paintRecipes();
      return;
    }
    rows.forEach((row, index) => {
      const line = rowLine(row.title, row.detail, () => {
        rows.splice(index, 1);
        save();
        paint(name);
        refreshHome();
      });
      if (name === "tugasan") {
        const done = /selesai/i.test(row.detail);
        const mark = document.createElement("button");
        mark.type = "button";
        mark.className = "row-done";
        mark.textContent = done ? "Buka semula" : "Selesai";
        mark.addEventListener("click", () => {
          if (done) row.detail = row.detail.replace(/selesai/i, "menunggu");
          else if (/menunggu/i.test(row.detail)) row.detail = row.detail.replace(/menunggu/i, "selesai");
          else row.detail = row.detail + " · selesai";
          save();
          paint(name);
          refreshHome();
        });
        line.insertBefore(mark, line.lastChild);
      }
      if (name === "kewangan") {
        const paid = /sudah bayar/i.test(row.detail);
        const amount = line.querySelector("b");
        if (amount) {
          amount.textContent = row.detail.replace(/\s*·\s*(sudah|belum) bayar/i, "").trim();
        }
        const mark = document.createElement("button");
        mark.type = "button";
        mark.className = "row-pay";
        mark.setAttribute("aria-pressed", paid ? "true" : "false");
        mark.textContent = paid ? "Sudah bayar" : "Belum bayar";
        mark.addEventListener("click", () => {
          const base = row.detail.replace(/\s*·\s*(sudah|belum) bayar/i, "").trim();
          row.detail = paid ? base : base + " · Sudah bayar";
          save();
          paint(name);
          refreshHome();
        });
        line.insertBefore(mark, line.lastChild);
      }
      box.append(line);
    });
    if (name === "tugasan" || name === "ahli") paintRank();
    if (name === "dapur") paintRecipes();
  }

  const recipeBook = [
    { name: "Nasi goreng ayam", needs: ["beras", "telur", "ayam"], video: "ieJMY4df85k", by: "Malina Lina Pg" },
    { name: "Nasi goreng telur", needs: ["beras", "telur"], video: "ieJMY4df85k", by: "Malina Lina Pg" },
    { name: "Ayam masak kicap", needs: ["ayam"], video: "toVB5rSOS-k", by: "Tiga Beradik Geelicious" },
    { name: "Bubur ayam", needs: ["beras", "ayam"], video: "RWdVv4pc91E" },
    { name: "Bubur nasi", needs: ["beras"], video: "aXT66cGGrbI" },
    { name: "Telur dadar", needs: ["telur"], video: "bSjOsbVxcCs", by: "Mendadak Masak" },
    { name: "Sayur tumis telur", needs: ["sayur", "telur"], search: "resepi sayur tumis telur" },
    { name: "Ikan goreng", needs: ["ikan"], search: "resepi ikan goreng rangup" },
    { name: "Mee goreng", needs: ["mi", "telur"], search: "resepi mee goreng telur" },
    { name: "Roti telur", needs: ["roti", "telur"], search: "resepi roti telur malaysia" }
  ];

  const pantryWords = {
    beras: ["beras", "nasi"],
    telur: ["telur"],
    ayam: ["ayam"],
    sayur: ["sayur", "sawi", "bayam", "kangkung"],
    ikan: ["ikan"],
    roti: ["roti"],
    mi: ["mi", "mee", "maggi"]
  };

  function pantryKey(title) {
    const text = String(title).toLowerCase();
    const found = Object.keys(pantryWords).find((key) => pantryWords[key].some((word) => text.includes(word)));
    return found || "";
  }

  function paintRecipes() {
    const board = document.querySelector("#recipe-board");
    if (!board) return;
    const stock = new Map();
    (books.dapur || []).forEach((row) => {
      const key = pantryKey(row.title);
      if (!key) return;
      const low = lowStock(row.detail);
      const prev = stock.get(key);
      if (!prev || (prev.low && !low)) {
        stock.set(key, { title: row.title, detail: row.detail, low: low });
      }
    });
    const matches = recipeBook.filter((recipe) => recipe.needs.every((key) => stock.has(key))).map((recipe) => {
      const urgent = recipe.needs.filter((key) => stock.get(key).low).length;
      return { recipe: recipe, urgent: urgent };
    }).sort((a, b) => b.urgent - a.urgent || b.recipe.needs.length - a.recipe.needs.length);
    board.replaceChildren();
    const title = document.createElement("h3");
    title.textContent = "Cadangan resepi";
    board.append(title);
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Tambah beras, telur, ayam atau sayur untuk mendapat cadangan masakan.";
      board.append(empty);
      return;
    }
    const seen = new Set();
    const picked = [];
    matches.forEach((item) => {
      const id = item.recipe.video || item.recipe.name;
      if (seen.has(id) || picked.length === 3) return;
      seen.add(id);
      picked.push(item);
    });
    picked.forEach((item) => {
      const used = item.recipe.needs.map((key) => stock.get(key).title).join(", ");
      const hurry = item.recipe.needs.filter((key) => stock.get(key).low).map((key) => stock.get(key).title);
      const link = document.createElement("a");
      link.className = "recipe";
      link.target = "_blank";
      link.rel = "noopener";
      link.href = item.recipe.video
        ? "https://www.youtube.com/watch?v=" + item.recipe.video
        : "https://www.youtube.com/results?search_query=" + encodeURIComponent(item.recipe.search);
      if (item.recipe.video) {
        const img = document.createElement("img");
        img.src = "https://i.ytimg.com/vi/" + item.recipe.video + "/mqdefault.jpg";
        img.alt = "";
        link.append(img);
      }
      const copy = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = item.recipe.name;
      const note = document.createElement("small");
      note.textContent = "Guna " + used + (hurry.length ? " · " + hurry.join(", ") + " perlu dimasak dulu" : "") + (item.recipe.by ? " · " + item.recipe.by : "");
      copy.append(name, note);
      const go = document.createElement("span");
      go.className = "recipe-go";
      go.textContent = "YouTube";
      link.append(copy, go);
      board.append(link);
    });
  }

  function taskPoints(detail) {
    const match = String(detail).match(/(\d+)\s*mata/i);
    return match ? Number(match[1]) : 0;
  }

  function paintRank() {
    const board = document.querySelector("#task-rank");
    if (!board) return;
    const scores = new Map();
    (books.ahli || []).forEach((row) => {
      const person = String(row.title).split("·")[0].trim();
      if (person && !scores.has(person)) scores.set(person, { name: person, done: 0, wait: 0 });
    });
    (books.tugasan || []).forEach((row) => {
      const person = String(row.title).split("·")[0].trim() || "Keluarga";
      if (!scores.has(person)) scores.set(person, { name: person, done: 0, wait: 0 });
      const entry = scores.get(person);
      const points = taskPoints(row.detail);
      if (/selesai/i.test(row.detail)) entry.done += points;
      else entry.wait += points;
    });
    const ranked = [...scores.values()].sort((a, b) => b.done - a.done || b.wait - a.wait || a.name.localeCompare(b.name, "ms"));
    board.replaceChildren();
    const head = document.createElement("div");
    head.className = "rank-head";
    const title = document.createElement("h3");
    title.textContent = "Ranking langsung";
    const live = document.createElement("span");
    live.className = "live";
    const pulse = document.createElement("i");
    pulse.className = "pulse";
    pulse.setAttribute("aria-hidden", "true");
    live.append(pulse, document.createTextNode("Mata selesai"));
    head.append(title, live);
    board.append(head);
    if (!ranked.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Belum ada ahli atau tugasan untuk disusun.";
      board.append(empty);
      return;
    }
    const max = ranked.reduce((top, entry) => Math.max(top, entry.done), 0);
    const list = document.createElement("div");
    list.className = "rank-list";
    ranked.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "rank-row";
      const place = document.createElement("span");
      place.className = "rank-place";
      place.textContent = String(index + 1);
      const copy = document.createElement("div");
      const name = document.createElement("b");
      name.textContent = entry.name;
      const note = document.createElement("small");
      note.textContent = entry.wait ? entry.wait + " mata menunggu" : "Tiada tugasan menunggu";
      const bar = document.createElement("div");
      bar.className = "rank-bar";
      const fill = document.createElement("i");
      bar.append(fill);
      copy.append(name, note, bar);
      const score = document.createElement("span");
      score.className = "rank-score";
      score.textContent = entry.done + " mata";
      row.append(place, copy, score);
      list.append(row);
      window.requestAnimationFrame(() => {
        fill.style.width = (max ? Math.round((entry.done / max) * 100) : 0) + "%";
      });
    });
    board.append(list);
  }

  function setLive(name, text) {
    const el = document.querySelector('[data-live="' + name + '"]');
    if (el) el.textContent = text;
  }

  function lowStock(detail) {
    return /habis|rendah|hari/i.test(detail) && !/cukup/i.test(detail);
  }

  function billAmount(detail) {
    const match = String(detail).match(/RM\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  function refreshHome() {
    const people = (books.ahli || []).length;
    const parcels = (books.logistik || []).length;
    const stock = books.dapur || [];
    const low = stock.filter((row) => lowStock(row.detail)).length;
    const pct = stock.length ? Math.round(((stock.length - low) / stock.length) * 100) : 0;
    const bills = (books.kewangan || []).reduce((sum, row) => {
      if (/sudah bayar/i.test(row.detail)) return sum;
      return sum + billAmount(row.detail);
    }, 0);
    setLive("people", String(people));
    setLive("parcels", String(parcels));
    setLive("stock", pct + "%");
    setLive("bills", "RM" + bills);

    const today = document.querySelector("#today-list");
    if (!today) return;
    const picks = [];
    (books.tugasan || []).slice(0, 1).forEach((row) => picks.push(row));
    (books.logistik || []).slice(0, 1).forEach((row) => picks.push(row));
    stock.filter((row) => lowStock(row.detail)).slice(0, 1).forEach((row) => picks.push(row));
    today.replaceChildren();
    if (!picks.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Tiada perkara mendesak. Rekod baharu akan muncul di sini.";
      today.append(empty);
      return;
    }
    picks.forEach((row) => today.append(rowLine(row.title, row.detail)));
  }

  document.querySelectorAll("form.entry[data-book]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const title = String(data.get("title") || "").trim();
      const detail = String(data.get("detail") || "").trim();
      if (!title || !detail) return;
      const name = form.dataset.book;
      books[name] = books[name] || [];
      books[name].unshift({ title: title, detail: detail });
      form.reset();
      save();
      paint(name);
      refreshHome();
    });
  });

  const aiNote = document.querySelector(".card-ai .lede");
  if (aiNote && books.ai && books.ai[0]) aiNote.textContent = books.ai[0].title;

  Object.keys(seed).forEach(paint);
  refreshHome();
})();
