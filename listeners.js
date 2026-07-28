let isActive = true;
let inMenu = true;
let keys = [];

const settings = {
  outline: true,
  projectile_outline: true,
  different_outlines: false,
  cooldown: true,
  fps_limit: "60",
  timer: true,
  timer_clear: true,
  mouse_toggle: true,
  fading_effects: true,
  tiles: true,
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
  
  // Add event listener for ui_scale range input
  const uiScaleInput = document.getElementById("ui_scale");
  const uiScaleValue = document.getElementById("ui_scale_value");
  if (uiScaleInput && uiScaleValue) {
    uiScaleInput.addEventListener("input", () => {
      console.log(uiScaleInput.value)
      uiScaleValue.textContent = Number(uiScaleInput.value).toFixed(2);
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
    const player = new [Basic,Magmax,Rime,Morfe,Aurora,Necro,Brute,Shade,Chrono,Reaper,Rameses,Cent,Jotunn,Candy,Mirage,Clown,Burst,Lantern,Pole,Polygon,Poop][hero.selectedIndex](starting_pos,5);
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
    if (e.keyCode == 188) {
      player.overlay = !player.overlay;
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