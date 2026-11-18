(function () {
  const list = document.querySelector("#device-list");
  if (!list) return;

  const houses = window.NR_HOUSES || [];
  const house = houses.find((item) => item.id === sessionStorage.getItem("nr_house")) || houses[0];
  const houseId = house ? house.id : "aminah";
  const builtins = (house && house.devices ? house.devices : []).map((device) => ({
    id: device.id,
    name: device.name,
    room: device.room,
    on: !!device.on,
    custom: false
  }));

  let saved = {};
  let extras = [];
  try {
    saved = JSON.parse(localStorage.getItem("nr_devices_" + houseId) || "null") || {};
    extras = JSON.parse(localStorage.getItem("nr_device_extra_" + houseId) || "[]");
  } catch (err) {
    saved = {};
    extras = [];
  }
  if (!Array.isArray(extras)) extras = [];
  builtins.forEach((device) => {
    if (typeof saved[device.id] === "boolean") device.on = saved[device.id];
  });

  const catalog = builtins.concat(extras.map((device) => ({
    id: device.id,
    name: device.name,
    room: device.room,
    on: !!device.on,
    custom: true
  })));

  const countEl = document.querySelector("#wifi-count");
  const nameEl = document.querySelector("#wifi-name");
  const speedEl = document.querySelector("#wifi-speed");

  function persist() {
    const state = {};
    catalog.forEach((device) => {
      state[device.id] = device.on;
    });
    localStorage.setItem("nr_devices_" + houseId, JSON.stringify(state));
    localStorage.setItem("nr_device_extra_" + houseId, JSON.stringify(catalog.filter((device) => device.custom)));
  }

  function refreshCount() {
    if (!countEl) return;
    const on = catalog.filter((device) => device.on).length;
    countEl.textContent = String(4 + on) + " tersambung";
  }

  function paint() {
    list.replaceChildren();
    catalog.forEach((device) => {
      const row = document.createElement("div");
      row.className = "device-row";
      const copy = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = device.name;
      const room = document.createElement("span");
      room.textContent = device.room;
      copy.append(title, room);
      const actions = document.createElement("div");
      actions.className = "device-actions";
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
      actions.append(button);
      if (device.custom) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "row-x";
        remove.textContent = "Buang";
        remove.addEventListener("click", () => {
          const index = catalog.indexOf(device);
          if (index >= 0) catalog.splice(index, 1);
          persist();
          paint();
          refreshCount();
        });
        actions.append(remove);
      }
      row.append(copy, actions);
      list.append(row);
    });
  }

  const wifiForm = document.querySelector("#wifi-form");
  if (wifiForm && nameEl && speedEl) {
    let wifi = house && house.wifi ? { ssid: house.wifi.ssid, speed: house.wifi.speed } : { ssid: "NadiRumah-5G", speed: "186 Mbps" };
    try {
      wifi = Object.assign(wifi, JSON.parse(localStorage.getItem("nr_wifi_" + houseId) || "{}"));
    } catch (err) {
      wifi = house && house.wifi ? { ssid: house.wifi.ssid, speed: house.wifi.speed } : wifi;
    }
    nameEl.textContent = wifi.ssid;
    speedEl.textContent = wifi.speed;
    wifiForm.ssid.value = wifi.ssid;
    wifiForm.speed.value = wifi.speed;
    wifiForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const next = {
        ssid: wifiForm.ssid.value.trim(),
        speed: wifiForm.speed.value.trim()
      };
      if (!next.ssid || !next.speed) return;
      localStorage.setItem("nr_wifi_" + houseId, JSON.stringify(next));
      nameEl.textContent = next.ssid;
      speedEl.textContent = next.speed;
    });
  }

  const deviceForm = document.querySelector("#device-form");
  if (deviceForm) {
    deviceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = deviceForm.name.value.trim();
      const room = deviceForm.room.value.trim();
      if (!name || !room) return;
      catalog.push({
        id: "custom-" + Date.now().toString(36),
        name: name,
        room: room,
        on: false,
        custom: true
      });
      deviceForm.reset();
      persist();
      paint();
      refreshCount();
    });
  }

  paint();
  refreshCount();
})();
