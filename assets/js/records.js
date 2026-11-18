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
      return;
    }
    rows.forEach((row, index) => {
      box.append(rowLine(row.title, row.detail, () => {
        rows.splice(index, 1);
        save();
        paint(name);
        refreshHome();
      }));
    });
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
    const bills = (books.kewangan || []).reduce((sum, row) => sum + billAmount(row.detail), 0);
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
