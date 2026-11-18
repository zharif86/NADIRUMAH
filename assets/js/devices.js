(function () {
  const list = document.querySelector("#device-list");
  if (!list) return;

  const catalog = [
    { id: "aircond", name: "Penghawa dingin", room: "Ruang tamu", on: true },
    { id: "lampu-tamu", name: "Lampu", room: "Ruang tamu", on: true },
    { id: "lampu-dapur", name: "Lampu", room: "Dapur", on: false },
    { id: "basuh", name: "Mesin basuh", room: "Bilik basuh", on: false },
    { id: "peti", name: "Peti ais", room: "Dapur", on: true },
    { id: "pemanas", name: "Pemanas air", room: "Bilik air", on: false },
    { id: "kipas", name: "Kipas siling", room: "Bilik tidur", on: false },
    { id: "tv", name: "Televisyen", room: "Ruang tamu", on: false }
  ];

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("nr_devices") || "{}");
  } catch (err) {
    saved = {};
  }
  catalog.forEach((device) => {
    if (typeof saved[device.id] === "boolean") device.on = saved[device.id];
  });

  const countEl = document.querySelector("#wifi-count");

  function persist() {
    const state = {};
    catalog.forEach((device) => {
      state[device.id] = device.on;
    });
    localStorage.setItem("nr_devices", JSON.stringify(state));
  }

  function refreshCount() {
    if (!countEl) return;
    const on = catalog.filter((device) => device.on).length;
    countEl.textContent = String(4 + on) + " tersambung";
  }

  catalog.forEach((device) => {
    const row = document.createElement("div");
    row.className = "device-row";
    const copy = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = device.name;
    const room = document.createElement("span");
    room.textContent = device.room;
    copy.append(title, room);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "switch";
    button.setAttribute("aria-pressed", device.on ? "true" : "false");
    button.setAttribute("aria-label", device.name + " " + device.room);
    const knob = document.createElement("i");
    knob.setAttribute("aria-hidden", "true");
    button.append(knob);
    button.addEventListener("click", () => {
      device.on = !device.on;
      button.setAttribute("aria-pressed", device.on ? "true" : "false");
      persist();
      refreshCount();
    });
    row.append(copy, button);
    list.append(row);
  });

  refreshCount();
})();
