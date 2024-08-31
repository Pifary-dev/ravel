let isActive = true;
let inMenu = true;
let keys = [];

const settings = {
  outline:true,
  cooldown:true,
  sandbox:true,
  timer: false,
  timer_clear:true,
  mouse_toggle:true,
  tiles: true,
  dev: false,
  death_cooldown: false,
  no_points: false,
  nick: 'Ravelfett',
  wreath: 'Gold',
  hero: 'Basic',
  tick_delay: 2,
  input_delay: 0,
  scale: 1
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
    if(previousSetting != localSetting.checked){
      localSetting.checked = previousSetting;
    }
    if(localStored){
      if(typeof setting == "string"){
        localSetting.value = localStored;
      } else if (typeof setting == "number") {
        const localNumber = Number(localStored);
        localSetting.value = (isNaN(localNumber)) ? setting : localNumber;
      }
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
  document.getElementById("connect").onclick = () => {
    const hero = document.getElementById("hero");
    const head = document.getElementById("wreath");
    if(head.value){
      const additionalInfo = (head.selectedIndex <= 5) ? "-wreath" : "";
      const formatHead = head.value.toLowerCase().replaceAll(' ', '-') + additionalInfo;
      hat.src = `texture/${formatHead}.png`;
    }

    for(const i in settings){
      const localSetting = document.getElementById(i);
      if(localSetting){
        const finalValue = (localSetting.type == 'number') ?
          localSetting.valueAsNumber : (localSetting.type == 'select-one' || localSetting.type == 'text') ?
          localSetting.value : localSetting.checked;
        localStorage[i] = settings[i] = finalValue;
      }
    }

    menu.style.display = "none";
    gamed.style.display = "inline-block";
    inMenu = false;
    const world = document.getElementById("world");
    if(world.selectedIndex < world.length - 1) [loadMain,loadHard,loadSecondary][world.selectedIndex]();
    const player = new [Basic,Magmax,Rime,Morfe,Aurora,Necro,Brute,Shade,Chrono,Reaper,Rameses,Cent,Jotunn,Candy,Mirage,Clown,Burst,Lantern,Pole,Polygon,Poop][hero.selectedIndex](new Vector(Math.random() * 7 + 2.5, Math.random() * 10 + 2.5),5);
    game.players.push(player);
    
    loadImages(game.players[0].className);
    if(game.worlds.length == 0) game.worlds.push(missing_world);
    if(game.worlds[0].name.startsWith("Endless Echo")){
        game.echoManagers[game.worlds[0].name.endsWith("Hard")?"hard":"normal"].create_areas([],player.area);
        // Generate random enemies on load
        new RandomEnemyGenerator(game.worlds[0].areas[0],game.worlds[0].name.endsWith("Hard")).generate_random_enemies(player.area);
    }
    game.worlds[0].areas[0].load();
    startAnimation();

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
    keys[e.keyCode] = true;
    /*if(settings.dev){
      ping.keysArray.push({inputKeys:getInputKeys(keys),timestamp:new Date().getTime()});
      if(ping.keysArray.length > 100) {
        ping.keysArray.shift();
      }
    }*/
    var isEndless=game.worlds[player.world].name.startsWith("Endless Echo");
    if (e.keyCode == 84) {
      player.hasCheated = true;
      player.area++
      if (player.area>=game.worlds[player.world].areas.length-1 && !isEndless) {
        player.area=game.worlds[player.world].areas.length-1
      }else if(isEndless){
        game.echoManagers[game.worlds[player.world].name.endsWith("Hard")?"hard":"normal"].create_areas([],player.area);
        // Generate random enemies on load
        new RandomEnemyGenerator(game.worlds[player.world].areas[player.area],game.worlds[player.world].name.endsWith("Hard")).generate_random_enemies(player.area);
      }
      game.worlds[player.world].areas[player.area].load();
      canv = null;
    }
    if (e.keyCode == 82) {
      player.hasCheated = true;
      player.area = Number(player.area) + 10;
      if (player.area>=game.worlds[player.world].areas.length-1 && !isEndless) {
        player.area=game.worlds[player.world].areas.length-1
      }else if(isEndless){
        game.echoManagers[game.worlds[player.world].name.endsWith("Hard")?"hard":"normal"].create_areas([],player.area);
        // Generate random enemies on load
        new RandomEnemyGenerator(game.worlds[player.world].areas[player.area],game.worlds[player.world].name.endsWith("Hard")).generate_random_enemies(player.area);
      }
      game.worlds[player.world].areas[player.area].load();
      canv = null;
    }
    if (e.keyCode == 69) {
      player.hasCheated = true;
      player.area = Number(player.area) - 1;
      if (player.area<0) {
        player.area=0;
      }
      game.worlds[player.world].areas[player.area].load();
      canv = null;
    }
    if (e.keyCode == 86) {
      player.hasCheated = true;
      player.god = !player.god;
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
    if (e.keyCode == 78) {
      player.hasCheated = true;
      player.wallGod = !player.wallGod;
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
      canv = null;
    }
    if (e.keyCode == 79 && settings.dev) {
      player.timer = 0;
      player.victoryTimer = 0;
    }
    if (e.keyCode == 80 && settings.dev) {
      settings.timer_clear = !settings.timer_clear;
    }
    if (e.keyCode == 66) {
      player.hasCheated = true;
      settings.cooldown = !settings.cooldown;
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