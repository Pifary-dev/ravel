let isActive = true;
let inMenu = true;
let keys = [];

const settings = {
  outline: 'enabled',
  projectile_outline: true,
  cooldown: true,
  fps_limit: "60",
  timer: true,
  enemies_minimap: false,
  timer_clear: true,
  mouse_toggle: true,
  fading_effects: true,
  tiles: 'tiles',
  pellets: true,
  dev: false,
  death_cooldown: false,
  no_points: false,
  max_abilities: true,
  max_stats: false,
  slow_upgrade: false,
  convert_to_legacy_speed: false,
  nick: 'Sandbox',
  wreath: 'Gold',
  hero: 'Basic',
  diff: 'Easy',
  tick_delay: 0,
  input_delay: 0,
  minimap_scale: 0.5,
  ui_scale: 1,
  scale: 1,
  cheats: true,
  v_sync: false,
  effect_blending: true,
  tournament_mode: false,
  speedrun_mode: false,
  seed: undefined,
  seeded_area_resets: false
}

const ping = {
  mouseTimer: [],
  keysTimer: [],
  mouse: {x:0,y:0},
  mouseArray: [],
  activationTime: 0,
  previous: false,
  keys: [],
  keysArray: [],
  array: [],
}

const HEROES = [
  { name: "Normal", className: "Basic", color: "#FF0000",
    abilities: [] },
  { name: "Magmax", className: "Magmax", color: "#FF0000",
    abilities: [
      { name: "Flow", text: "Gain a 2/3/4/5/6 speed boost. Costs 1.5 energy per sec." },
      { name: "Harden", text: "Gain invulnerability, but also stop movement. 1.25/1/0.75/0.5/0.25 sec cooldown. Costs 12 energy per sec." },
    ] },
  { name: "Rime", className: "Rime", color: "#3333ff",
    abilities: [
      { name: "Warp", text: "Teleport 80/100/120/140/160 range forward. 0.5 sec cooldown. Costs 3 energy." },
      { name: "Paralysis", text: "Freeze enemies within 130/145/160/175/190px range for 2 sec. Frozen enemies can't damage allies. Costs 10 energy." },
    ] },
  { name: "Morfe", className: "Morfe", color: "#00dd00",
    abilities: [
      { name: "Reverse Bullet", text: "Shoot 1/3/5/7/9 projectiles forward with 350px range that reverse enemies' movement. Reversed enemies revive players for 4 sec. 3 sec cooldown. Costs 10 energy." },
      { name: "Minimize Bullet", text: "Shoot 1/3/5/7/9 projectiles forward with 450px range that reduce enemies' size and speed by 75% for 4 sec. 1.5 sec cooldown. Costs 10 energy." },
    ] },
  { name: "Aurora", className: "Aurora", color: "#ff7f00",
    abilities: [
      { name: "Distort", text: "Slow enemies within 180/210/240/270/300px range by 30/35/40/45/50%. Costs 7 energy per sec." },
      { name: "Energize", text: "Grant allies within 200px range a 3 regen boost and 40% faster cooldowns while alive for 3/4/5/6/7 sec. 2 sec cooldown." },
    ] },
  { name: "Necro", className: "Necro", color: "#FF00FF",
    abilities: [
      { name: "Resurrection", text: "Revive. Costs 75 pellets." },
      { name: "Reanimate", text: "Shoot 1/2/3/4/5 projectiles forward with 1280px range that revive players. 14/12/10/8/6 sec cooldown. Costs 30 energy." },
    ] },
  { name: "Brute", className: "Brute", color: "#9b5800",
    abilities: [
      { name: "Stomp", text: "Send enemies within 130/145/160/175/190px range flying back and freeze them for 4 sec. Frozen enemies can't damage allies. 1 sec cooldown. Costs 10 energy." },
      { name: "Vigor (passive)", text: "PASSIVE: Gain 15/30/45/60/75% enemy effects reduction, but also increase size by 14/14/28/28/44%. Gain an extra 25% enemy effects reduction if energy is full." },
    ] },
  { name: "Shade", className: "Shade", color: "#826565",
    abilities: [
      { name: "Night", text: "Become undetected and gain a 0/1.25/2.5/3.75/5 speed boost for 7 sec. If damaged by an enemy during Night, effect ends and that enemy becomes harmless for 2 sec. 7 sec cooldown. Costs 25 energy." },
      { name: "Vengeance", text: "Throw a 40/50/60/70/80px size ball forward with 480 range that returns, slowing enemies hit during departure by 75% and freezing enemies hit during return for 6 sec. Frozen enemies can't damage allies. 3/2.5/2/1.5/1 sec cooldown. Costs 5 energy." },
    ] },
  { name: "Chrono", className: "Chrono", color: "#00b270",
    abilities: [
      { name: "Backtrack", text: "Travel back in time 2.24 sec. Can use while downed. 7.5/7/6.5/6/5.5 sec cooldown. Costs 30 energy." },
      { name: "Rewind", text: "Make enemies within 100/115/130/145/160px range travel back in time 2 sec and make them harmless for 3 sec. 7/6.5/6/5.5/5 sec cooldown. Costs 15 energy." },
    ] },
  { name: "Reaper", className: "Reaper", color: "#424a59",
    abilities: [
      { name: "Atonement", text: "Revive allies within 130/180/230/280/330px range and grant them the Night effect for 0.5 sec, but also get damaged. 6/5.5/5/4.5/4 sec cooldown. Costs 15 energy." },
      { name: "Depart", text: "Gain invulnerability, become undetected, ignore pellets/enemy effects, phase through walls/teleporters and move with 9/9.5/10/10.5/11 speed for 2.7/2.9/3.1/3.3/3.5 sec. After effect ends, get a 5.5 sec cooldown. Costs 25 energy." },
    ] },
  { name: "Rameses", className: "Rameses", color: "#989b4a",
    abilities: [
      { name: "Latch", text: "If bandages are applied, throw a high-tech bandage forward with 1120px range that teleports you to the first ally it hits and grant that ally 1 sec of invulnerability. Prioritizes homing in on downed allies. 8/7.5/7/6.5/6 sec cooldown. Costs 20 energy." },
      { name: "Bandages", text: "Move 50% slower and wrap bandages over 12/11/10/9/8 sec. If damaged while bandages are applied, gain 1 sec of invulnerability and lose bandages. Use ability in a safe zone to wrap 3 times faster. Costs 40 energy." },
    ] },
  { name: "Cent", className: "Cent", color: "#727272",
    abilities: [
      { name: "Fusion", text: "Become a thick paste that can pass through enemies, move 30% slower and gain 0.7 sec of invulnerability. After effect ends, get a 0.5/0.45/0.4/0.35/0.3 sec cooldown." },
      { name: "Mortar", text: "If damaged or ability is used, explode into invulnerable small pieces that come back together in 4 sec. Use Fusion to instantly recombine yourself. After effect ends, get a 14/12/10/8/6 sec cooldown. Costs 40 energy." },
    ] },
  { name: "Jötunn", className: "Jotunn", color: "#5cacff",
    abilities: [
      { name: "Decay (passive)", text: "PASSIVE: Radiate an aura of decay, slowing enemies within 170px range by 0/10/20/30/40%." },
      { name: "Shatter", text: "Shatter decayed enemies into harmless shards that come back together in 4 sec. 9/8/7/6/5 sec cooldown. Costs 30 energy." },
    ] },
  { name: "Candy", className: "Candy", color: "#ff80bd",
    abilities: [
      { name: "Sugar Rush", text: "Gain an aura with 100px range that freezes enemies for 2 sec and lasts for 1.5 sec. Frozen enemies can't damage allies. Gain more aura range the faster you move. After aura disappears, get a 4.5/4/3.5/3/2.5 sec cooldown. Costs 15 energy." },
      { name: "Sweet Tooth", text: "Drop a candy that can be consumed by any player to recover 50% of their max energy and gain a 1/2/3/4/5 speed boost and a 1/2/3/4/5 regen boost for 15 sec. 5 sec cooldown. Costs 5 energy." },
    ] },
  { name: "Mirage", className: "Mirage", color: "#020fa2",
    abilities: [
      { name: "Shift", text: "Teleport to the last safe zone touched. Can use while downed. 26/23/20/17/14 sec cooldown while downed. Costs 5 energy." },
      { name: "Obscure", text: "Shoot a projectile foward with 640px range that teleports you to the first enemy it hits. If it hits, gain 1 sec of invulnerability and pause ability cooldown for 1 sec. 3.5/3/2.5/2/1.5 sec cooldown. Costs 15 energy." },
    ] },
  { name: "Clown", className: "Clown", color: "#ffb8c6",
    abilities: [
      { name: "Heavy Balloon", text: "Inflate a balloon behind you that pops into a lingering trail. Costs 5 energy to start, then 5 energy/sec while inflating. Inflating baloon too much will kill you. Gain 8/7/6/5/4 sec cooldown." },
      { name: "Rejoice (passive)", text: "Permanently boosts your max speed, energy, and regen once unlocked." },
    ] },
  { name: "Burst", className: "Burst", color: "#AA3333",
    abilities: [
      { name: "Dynamite", text: "Throws a dynamite stick that stays live until detonated. Costs 1 energy. 0.25 sec cooldown." },
      { name: "Detonate", text: "Detonates your live dynamite, launching nearby enemies outward. Costs 7 energy. 0.75 sec cooldown." },
    ] },
  { name: "Lantern", className: "Lantern", color: "#008000",
    abilities: [
      { name: "Follower", text: "Hold to spawn auras that shrink enemies on contact. Drains 8/7/6/5/4 energy/sec." },
      { name: "Shrinker", text: "Hold to spawn zones that shrink any player who enters them. Drains 9/8/7/6/5 energy/sec." },
    ] },
  { name: "Pole", className: "Pole", color: "#955CF1",
    abilities: [
      { name: "Gravity Field (passive)", text: "Passively pulls nearby enemies toward you within a 70/90/110/130/150px range." },
      { name: "Mono Pole", text: "Launches a pole that repels enemies away from it for 3 seconds. Costs 30 energy. 10/9/8/7/6 sec cooldown." },
    ] },
  { name: "Polygon", className: "Polygon", color: "#000000",
    abilities: [
      { name: "Morph", text: "Cycle between Normal, Fast, Ghost, and Small forms. 0.3 sec cooldown to switch, and each form's bonus scales with this ability's level: Fast grants 0.5/1/1.75/2.75/4 bonus speed, Small shrinks you 90/80/70/60/50% size, and Normal grants 10/20/30/40/50% effect resistance while active. Ghost makes you undetected - if you touch an enemy while ghosted, that enemy becomes harmless for 2 sec, night ends, and you're forced back to Normal with a 6/5/4/3/2 sec cooldown before you can switch forms again." },
      { name: "Resilience (passive)", text: "Passively increases resistance to all negative effects. Gain 5/15/20/25/30% effect reduction." },
    ] },
  { name: "Idk", className: "Poop", color: "#af7e87",
    abilities: [
      { name: "Shield", text: "Toggle a shield that hovers in front of you and blocks incoming hits." },
    ] },
];

function populateHeroSelect() {
  const select = document.getElementById('hero');
  select.innerHTML = '';
  HEROES.forEach(h => {
    const option = document.createElement('option');
    option.value = h.name;
    option.textContent = h.name;
    select.appendChild(option);
  });
}
populateHeroSelect();

function renderHeroPicker() {
  const select = document.getElementById('hero');
  const grid = document.getElementById('hero-grid');
  const previewAvatar = document.getElementById('hero-preview-avatar');
  const previewName = document.getElementById('hero-preview-name');
  if (!select || !grid) return;

  function syncPreview() {
    const h = HEROES[select.selectedIndex] || HEROES[0];
    previewAvatar.style.setProperty('--hero-color', h.color);
    previewAvatar.style.backgroundColor = h.color;
    previewName.textContent = h.name;
    [...grid.children].forEach((card, i) => {
      card.classList.toggle('selected', i === select.selectedIndex);
    });
  }

  grid.innerHTML = '';
  HEROES.forEach((h, i) => {
    const locked = typeof h.isUnlocked === 'function' && !h.isUnlocked();
    const card = document.createElement('div');
    card.className = 'hero-card' + (locked ? ' locked' : '');
    card.style.setProperty('--hero-color', h.color);
    card.tabIndex = locked ? -1 : 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', h.name);
    card.innerHTML = `
      <div class="hero-avatar"></div>
      <div class="hero-name">${h.name}</div>
      ${locked && h.requirement ? `<div class="hero-requirement">${h.requirement}</div><div class="lock-badge">&#128274;</div>` : ''}
      ${h.abilities.length ? `<button type="button" class="hero-info-btn" aria-label="${h.name} abilities">?</button>` : ''}
    `;
    if (!locked) {
      const select_hero = () => {
        select.selectedIndex = i;
        syncPreview();
        document.getElementById('hero-modal').hidden = true;
      };
      card.addEventListener('click', select_hero);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select_hero(); }
      });
    }
    const infoButton = card.querySelector('.hero-info-btn');
    if (infoButton) {
      const showTooltip = () => {
        const tooltip = document.getElementById('hero-tooltip');
        tooltip.style.setProperty('--hero-color', h.color);
        tooltip.innerHTML = h.abilities.map(a =>
          `<div class="ability-name">${a.name}</div><div class="ability-text">${a.text}</div>`
        ).join('');
        const rect = infoButton.getBoundingClientRect();
        tooltip.hidden = false;
        const tooltipWidth = tooltip.offsetWidth;
        const left = Math.min(rect.left, window.innerWidth - tooltipWidth - 12);
        tooltip.style.left = `${Math.max(12, left)}px`;
        tooltip.style.top = `${rect.bottom + 6}px`;
      };
      const hideTooltip = () => { document.getElementById('hero-tooltip').hidden = true; };
      infoButton.addEventListener('mouseenter', showTooltip);
      infoButton.addEventListener('mouseleave', hideTooltip);
      infoButton.addEventListener('focus', showTooltip);
      infoButton.addEventListener('blur', hideTooltip);
      infoButton.addEventListener('click', (e) => e.stopPropagation());
    }
    grid.appendChild(card);
  });

  syncPreview();

  const previewButton = document.getElementById('hero-preview');
  const modal = document.getElementById('hero-modal');
  const closeButton = document.getElementById('hero-modal-close');
  const tooltip = document.getElementById('hero-tooltip');
  previewButton.addEventListener('click', () => { modal.hidden = false; });
  closeButton.addEventListener('click', () => { modal.hidden = true; tooltip.hidden = true; });
  modal.addEventListener('click', (e) => { if (e.target === modal) { modal.hidden = true; tooltip.hidden = true; } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { modal.hidden = true; tooltip.hidden = true; } });
  renderHeroPicker.syncPreview = syncPreview;
}
renderHeroPicker();

for(const i in settings){
  const setting = settings[i];
  if (i === 'seed') continue;
  const localSetting = document.getElementById(i);
  const localStored = localStorage[i];
  if(localSetting){
    const canParse = (localStored && typeof setting != "string" && localStored != 'NaN') ? true : false;
    const previousSetting = (canParse) ? JSON.parse(localStored) : setting;
    if(localStored == 'NaN') console.warn(`Invalid value for ${i}`);
    
    if(localSetting.type === 'checkbox') {
      if(previousSetting != localSetting.checked){
        localSetting.checked = previousSetting;
      }
    }
    else if(localSetting.type === 'range' || localSetting.type === 'number') {
      const localNumber = Number(localStored);
      const value = (isNaN(localNumber)) ? setting : localNumber;
      localSetting.value = value;
      const valueDisplay = document.getElementById(`${i}_value`);
      if(valueDisplay) {
        valueDisplay.textContent = value.toFixed(2);
      }
    }
    else if(localSetting.type === 'text' || localSetting.type === 'select-one') {
      localSetting.value = localStored || setting;
    }
  }
}

// Preset Modes (Tournament / Speedrun)
const modeOverrides = {
  tournament_mode: {
    diff: 'Easy',
    cheats: false,
    v_sync: true,
    dev: false,
    fps_limit: "60",
    no_points: true,
    max_abilities: false,
    max_stats: false,
    slow_upgrade: true,
    timer: true,
    seeded_area_resets: true,
    death_cooldown: true
  },
  speedrun_mode: {
    diff: 'Hard',
    cheats: false,
    v_sync: true,
    dev: false,
    seed: '',
    fps_limit: "60",
    timer: true,
    no_points: true,
    max_abilities: true,
    max_stats: true,
    slow_upgrade: true,
    death_cooldown: false,
  },
};

// True if `id` is currently forced by any active mode (optionally
// ignoring one mode, e.g. while that mode is in the middle of unlocking).
function isSettingLocked(id, excludeMode) {
  for (const modeId in modeOverrides) {
    if (modeId === excludeMode) continue;
    const checkbox = document.getElementById(modeId);
    if (checkbox && checkbox.checked && modeOverrides[modeId].hasOwnProperty(id)) {
      return true;
    }
  }
  return false;
}

function applyModeLock(modeId, enabled) {
  const overrides = modeOverrides[modeId];
  for (const id in overrides) {
    const el = document.getElementById(id);
    if (!el) continue;
    const label = document.querySelector(`label[for="${id}"]`);

    if (enabled) {
      if (el.type === 'checkbox') {
        el.checked = overrides[id];
      } else {
        el.value = overrides[id];
      }
      el.disabled = true;
      el.classList.add('locked-setting');
      if (label) label.classList.add('locked-setting');
    } else if (!isSettingLocked(id, modeId)) {
      // Not held locked by another active mode either - restore whatever
      // the user actually had saved (or the coded default).
      const stored = localStorage[id];
      if (el.type === 'checkbox') {
        el.checked = stored !== undefined ? JSON.parse(stored) : settings[id];
      } else {
        const fallback = settings[id] === undefined ? '' : settings[id];
        el.value = stored !== undefined ? stored : fallback;
      }
      el.disabled = false;
      el.classList.remove('locked-setting');
      if (label) label.classList.remove('locked-setting');
    }
  }
}

// Preset modes are mutually exclusive: turning one on turns any other
// active one off first (and unlocks whatever only that other mode was
// forcing), before the newly-enabled mode applies its own overrides.
function disableOtherModes(activeModeId) {
  for (const modeId in modeOverrides) {
    if (modeId === activeModeId) continue;
    const checkbox = document.getElementById(modeId);
    if (checkbox && checkbox.checked) {
      checkbox.checked = false;
      applyModeLock(modeId, false);
    }
  }
}

for (const modeId in modeOverrides) {
  const modeCheckbox = document.getElementById(modeId);
  if (!modeCheckbox) continue;
  if (modeCheckbox.checked) disableOtherModes(modeId);
  applyModeLock(modeId, modeCheckbox.checked);
  modeCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) disableOtherModes(modeId);
    applyModeLock(modeId, e.target.checked);
  });
}

window.onresize = () => {
  const winw = window.innerWidth;
  const winh = window.innerHeight;
  const xvalue = winw / width;
  const yvalue = winh / height;
  scale = xvalue;
  if (yvalue < xvalue) {
    scale = yvalue
  }
  canvas.style.transform = `scale(${scale})`;
  canvas.style.left = `${(winw - width) / 2}px`;
  canvas.style.top = `${(winh - height) / 2}px`;
}

window.onload = () => {
  window.onresize();
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.getElementById("hero").value = (typeof window.localStorage.hero === 'string') ? window.localStorage.hero : 'Normal';
  if (renderHeroPicker.syncPreview) renderHeroPicker.syncPreview();
  
  const uiScaleInput = document.getElementById("ui_scale");
  const uiScaleValue = document.getElementById("ui_scale_value");
  if (uiScaleInput && uiScaleValue) {
    uiScaleInput.addEventListener("input", () => {
      console.log(uiScaleInput.value)
      uiScaleValue.textContent = Number(uiScaleInput.value).toFixed(2);
    });
  }

  const minimapScaleInput = document.getElementById("minimap_scale");
  const minimapScaleValue = document.getElementById("minimap_scale_value");
  if (minimapScaleInput && minimapScaleValue) {
    minimapScaleInput.addEventListener("input", () => {
      minimapScaleValue.textContent = Number(minimapScaleInput.value).toFixed(2);
    });
  }

  // Restore seed input separately since empty means undefined, not 0
  const seedInput = document.getElementById("seed");
  if (seedInput) {
    const stored = localStorage.seed;
    if (stored !== undefined && stored !== '' && stored !== 'undefined') {
      const n = Number(stored);
      if (!isNaN(n)) seedInput.value = n;
    }
  }

  document.getElementById("connect").onclick = () => {
    const hero = document.getElementById("hero");
    const head = document.getElementById("wreath");
    settings.world = document.getElementById("world");
    if(head.value){
      const additionalInfo = (head.selectedIndex <= 5) ? "-wreath" : "";
      const formatHead = head.value.toLowerCase().replaceAll(' ', '-') + additionalInfo;
      if(formatHead != "none") images.hat.src = `texture/${formatHead}.png`;
    }

    for(const i in settings){
      if (i === 'seed') continue; // handled separately below
      const localSetting = document.getElementById(i);
      if(localSetting){
        const finalValue = (localSetting.type == 'number' || localSetting.type == 'range') ?
          Number(localSetting.value) : (localSetting.type == 'select-one' || localSetting.type == 'text') ?
          localSetting.value : localSetting.checked;
        settings[i] = finalValue;
        if (!isSettingLocked(i)) {
          localStorage[i] = finalValue;
        }
      }
    }

    // Seed is a special case: empty field means no seed (undefined), not 0
    const seedInput = document.getElementById("seed");
    if (seedInput) {
      const raw = seedInput.value.trim();
      settings.seed = raw === '' ? undefined : Number(raw);
      if (!isSettingLocked('seed')) {
        localStorage.seed = raw;
      }
    }
    gamed.style.display = "inline-block";
    document.body.style.backgroundColor = "#222";
    document.body.style.backgroundImage = "none";
    document.documentElement.style.backgroundColor = "#222";
    document.documentElement.style.backgroundImage = "none";
    inMenu = false;
    const world = document.getElementById("world");
    if(world.selectedIndex < world.length - 1) [loadMain,loadHard,loadSecondary][world.selectedIndex]();
    const customWorldIndex = 3;
    const loadedFileName = inputElement.loadedFileName || '';
    const isLegacy = loadedFileName.includes('.legacy') || loadedFileName.includes('(legacy)');
    if (world.selectedIndex != customWorldIndex || isLegacy) {
      settings.convert_to_legacy_speed = false;
    } else if (loadedFileName.includes('(60FPS)')) {
      settings.convert_to_legacy_speed = true;
    }
    
    const starting_pos = new Vector(Math.random() * 7 + 2.5, Math.random() * 10 + 2.5);
    const heroClassLookup = {Basic,Magmax,Rime,Morfe,Aurora,Necro,Brute,Shade,Chrono,Reaper,Rameses,Cent,Jotunn,Candy,Mirage,Clown,Burst,Lantern,Pole,Polygon,Poop};
    const heroData = HEROES[hero.selectedIndex] || HEROES[0];
    const HeroClass = heroClassLookup[heroData.className];
    const player = new HeroClass(starting_pos,5);
    if(game.worlds.length == 0) game.worlds.push(missing_world);
    game.worlds[0].areas[0].load();

    player.resetPosition();
    player.name = settings.nick;
    game.players.push(player);
    if(settings.max_stats){
      player.upgradeToMaxStats();
    } else if (settings.tournament_mode){
      player.speed = player.maxSpeed;
      player.calculateTimeLimit();
      player.invincible = true;
      player.invincible_time = 1500;
    }
    
    loadImages(player.className);
    startAnimation();
    menu.remove();

    document.addEventListener("mousemove", Pos, false);
    document.addEventListener("keydown", keydownKeys, false);
    document.addEventListener("keyup", keyupKeys, false);
    document.onmousedown = (e) => {
      applyInputDelay(settings.input_delay,()=>{
        if (e.buttons == 1 && !inMenu) {
          mouse = !mouse;
        }
      });
    };
    
    document.onmouseup = (e) => {
      applyInputDelay(settings.input_delay,()=> {if (!settings.mouse_toggle && !inMenu) mouse = !mouse;})
    };
  }
}
function keydownKeys(e) {
  const player = game.players[0];
  if(e.code == 'KeyD' && settings.dev){
    ping.activationTime = new Date().getTime();
  }
  applyInputDelay(settings.input_delay,()=>{
    const code = e.keyCode;
    if(keys[code] !== false) keys[e.keyCode] = true;
    if(settings.cheats){
      if (e.keyCode == 84) {
        player.hasCheated = true;
        player.area++
        if (player.area>=game.worlds[player.world].areas.length-1) {
          player.area=game.worlds[player.world].areas.length-1
        }
        game.worlds[player.world].areas[player.area].load();
        tilesCanvas = null;
      }
      if (e.keyCode == 82) {
        player.hasCheated = true;
        player.area = Number(player.area) + 10;
        if (player.area>=game.worlds[player.world].areas.length-1) {
          player.area=game.worlds[player.world].areas.length-1
        }
        game.worlds[player.world].areas[player.area].load();
        tilesCanvas = null;
      }
      if (e.keyCode == 69) {
        player.hasCheated = true;
        player.area = Number(player.area) - 1;
        if (player.area<0) {
          player.area=0;
        }
        game.worlds[player.world].areas[player.area].load();
        tilesCanvas = null;
      }
      if (e.keyCode == 86) {
        player.hasCheated = true;
        player.god = !player.god;
      }
      if (e.keyCode == 78) {
        player.hasCheated = true;
        player.ghost = !player.ghost;
      }
      if (e.keyCode == 66) {
        player.hasCheated = true;
        settings.cooldown = !settings.cooldown;
      }
    }
    if (e.keyCode == 72) {
      player.herocard = !player.herocard;
    }
    if (e.keyCode == 77) {
      player.minimap = !player.minimap;
    }
    if (e.keyCode == 71) {
      player.enemies_minimap = !player.enemies_minimap;
    }
    if (e.keyCode == 188) {
      player.overlay = !player.overlay;
    }
    if (e.keyCode == 85) {
      player.title = !player.title;
    }
    if (e.keyCode == 35) {
      player.reset();
    }
    if (e.keyCode == 219 && settings.dev) {
      player.safePoint = {world:player.world,area:player.area,pos:{x:player.pos.x,y:player.pos.y}};
      player.safeAmount++;
    }
    if (e.keyCode == 221 && settings.dev) {
      player.safePoint = undefined;
    }
    if (e.keyCode == 220 && settings.dev && player.safePoint) {
      returnToSafePoint(player);
      player.lives = 3;
      player.victoryTimer = 0;
      tilesCanvas = null;
    }
    if (e.keyCode == 79 && settings.dev) {
      player.timer = 0;
      player.victoryTimer = 0;
    }
    if (e.keyCode == 80 && settings.dev) {
      settings.timer_clear = !settings.timer_clear;
    }
  })
}

function keyupKeys(e) {
  applyInputDelay(settings.input_delay,()=>delete keys[e.keyCode]);
}

function Pos(p) {
  const t = canvas.getBoundingClientRect();
  const mouse_position = new Vector((p.pageX - t.left) / scale,(p.pageY - t.top) / scale);
  applyInputDelay(settings.input_delay,()=>mousePos = mouse_position);
  if(settings.dev){
    ping.mouseArray.push(mouse_position);
    ping.mouseTimer.push(new Date().getTime());
    if(ping.mouseArray.length > settings.tick_delay*20 + settings.input_delay/2) {
      ping.mouseArray.shift();
      ping.mouseTimer.shift();
    }
  }
}

const inputElement = document.getElementById("load");
inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
  loaded = true;
  const fileList = this.files[0];
  inputElement.loadedFileName = fileList.name;
  const reader = new FileReader();
  reader.onloadend = (evt) => {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
      const world = new World(new Vector(0, 0), 0, jsyaml.load(evt.target.result));
      game.worlds[0] = world;
      document.getElementById("world").selectedIndex = 3;
    }
  };
  reader.readAsBinaryString(fileList);
}

window.onblur = () => {
  isActive = false;
  keys = [];
}
window.onfocus = () => {
  isActive = true;
}