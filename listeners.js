let isActive = true;
let inMenu = true;
let keys = [];

const settings = {
  outline: true,
  projectile_outline: true,
  different_outlines: false,
  cooldown: true,
  fps_limit: "60",
  timer: false,
  timer_clear: true,
  mouse_toggle: true,
  fading_effects: true,
  tiles: true,
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
  tick_delay: 2,
  input_delay: 0,
  ui_scale: 1,
  scale: 1,
  cheats: true,
  v_sync: false,
  effect_blending: false
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
  const localSetting = document.getElementById(i);
  const localStored = localStorage[i];
  if(localSetting){
    const canParse = (localStored && typeof setting != "string" && localStored != 'NaN') ? true : false;
    const previousSetting = (canParse) ? JSON.parse(localStored) : setting;
    if(localStored == 'NaN') console.warn(`Invalid value for ${i}`);
    
    // Handle checkbox inputs
    if(localSetting.type === 'checkbox') {
      if(previousSetting != localSetting.checked){
        localSetting.checked = previousSetting;
      }
    }
    // Handle range and number inputs
    else if(localSetting.type === 'range' || localSetting.type === 'number') {
      const localNumber = Number(localStored);
      const value = (isNaN(localNumber)) ? setting : localNumber;
      localSetting.value = value;
      // Update the display value for range inputs if the element exists
      const valueDisplay = document.getElementById(`${i}_value`);
      if(valueDisplay) {
        valueDisplay.textContent = value.toFixed(1);
      }
    }
    // Handle text and select inputs
    else if(localSetting.type === 'text' || localSetting.type === 'select-one') {
      localSetting.value = localStored || setting;
    }
  }
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
  document.getElementById("hero").value = (typeof window.localStorage.hero === 'string') ? window.localStorage.hero : 'Normal';
  
  // Add event listener for ui_scale range input
  const uiScaleInput = document.getElementById("ui_scale");
  const uiScaleValue = document.getElementById("ui_scale_value");
  if (uiScaleInput && uiScaleValue) {
    uiScaleInput.addEventListener("input", () => {
      uiScaleValue.textContent = Number(uiScaleInput.value).toFixed(1);
    });
  }

  document.getElementById("connect").onclick = () => {
    const hero = document.getElementById("hero");
    const head = document.getElementById("wreath");
    settings.world = document.getElementById("world");
    if(head.value){
      const additionalInfo = (head.selectedIndex <= 5) ? "-wreath" : "";
      const formatHead = head.value.toLowerCase().replaceAll(' ', '-') + additionalInfo;
      images.hat.src = `texture/${formatHead}.png`;
    }

    for(const i in settings){
      const localSetting = document.getElementById(i);
      if(localSetting){
        const finalValue = (localSetting.type == 'number' || localSetting.type == 'range') ?
          Number(localSetting.value) : (localSetting.type == 'select-one' || localSetting.type == 'text') ?
          localSetting.value : localSetting.checked;
        localStorage[i] = settings[i] = finalValue;
      }
    }
    gamed.style.display = "inline-block";
    inMenu = false;
    const world = document.getElementById("world");
    const starting_pos = new Vector(Math.random() * 7 + 2.5, Math.random() * 10 + 2.5);
    if(world.selectedIndex < world.length - 1) [loadMain,loadHard,loadSecondary][world.selectedIndex]();
    const player = new [Basic,Magmax,Rime,Morfe,Aurora,Necro,Brute,Shade,Chrono,Reaper,Rameses,Cent,Jotunn,Candy,Mirage,Clown,Burst,Lantern,Pole,Polygon,Poop][hero.selectedIndex](starting_pos,5);
    player.name = settings.nick;
    game.players.push(player);
    if(settings.max_stats){
      player.upgradeToMaxStats();
    }
    
    loadImages(game.players[0].className);
    if(game.worlds.length == 0) game.worlds.push(missing_world);
    game.worlds[0].areas[0].load();
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
    /*if(settings.dev){
      ping.keysArray.push({inputKeys:getInputKeys(keys),timestamp:new Date().getTime()});
      if(ping.keysArray.length > 100) {
        ping.keysArray.shift();
      }
    }*/
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
      player.pos = new Vector(Math.random() * 7 + 2.5, Math.random() * 10 + 2.5);
      player.area = 0;
      tilesCanvas = undefined;
      player.sweetToothTimer = 0;
      player.flow = false;
      player.rejoicing = false;
      player.timer = 0;
      player.firstAbilityCooldown = 0;
      player.secondAbilityCooldown = 0;
      player.deathCounter = 0;
      if (settings.no_points){
        player.points = 0;
        player.speed = 5;
        player.regen = 1;
        player.maxEnergy = 30;
        player.experience = 0;
        player.previousLevelExperience = 0;
        player.nextLevelExperience = 4;
        player.tempPrevExperience=0;
        player.tempNextExperience=4;
        player.level = 1;
      }
      if (!settings.max_abilities){
        player.ab1L = 0;
        player.ab2L = 0;
      }
      player.energy = player.maxEnergy;
      game.worlds[player.world].areas[player.area].load();
      for(const i in game.worlds[player.world].areas){
        const area = game.worlds[player.world].areas[i];
        area.matched = false;
      }

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