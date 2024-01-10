const maxDelay = 100;
let Delay = maxDelay+0;
let isActive = true;

if(!window.localStorage.hat){window.localStorage.hat = "Gold"};document.getElementById("wreath").value = window.localStorage.hat;
if(window.localStorage.nick){document.getElementById("nick").value = window.localStorage.nick}
const outline = document.getElementById('outline');
if(localStorage.outline == 'false'){outline.checked = false;}
const sandbox = document.getElementById('sandbox');
if(localStorage.sandbox == 'false'){sandbox.checked = false;}
const timer = document.getElementById("timer");
if(localStorage.timer == 'true'){timer.checked = true;}
const tilesOption = document.getElementById("tiles");
if(localStorage.tiles == 'false'){tilesOption.checked = false;}
const dev = document.getElementById("dev");
if(localStorage.dev == 'true'){dev.checked = true;}
const deathcd = document.getElementById("deathcd")
if(localStorage.deathcd == 'true'){deathcd.checked = true;}
const no_points = document.getElementById("no_points");
if(localStorage.no_points == 'true'){no_points.checked = true;}
const mouse_toggle = document.getElementById("mouse_toggle")
if(localStorage.mouse_toggle == 'false'){mouse_toggle.checked = false;}
  
window.onresize = function() {
  var winw = window.innerWidth;
  var winh = window.innerHeight;
  var xvalue = winw / width;
  var yvalue = winh / height;
  scale = xvalue;
  if (yvalue < xvalue) {
    scale = yvalue
  }
  canvas.style.transform = "scale(" + scale + ")";
  canvas.style.left = (winw - width) / 2 + "px";
  canvas.style.top = (winh - height) / 2 + "px";
};
window.onload = function() {
  var winw = window.innerWidth;
  var winh = window.innerHeight;
  var xvalue = winw / width;
  var yvalue = winh / height;
  scale = xvalue;
  if (yvalue < xvalue) {
    scale = yvalue
  }
  canvas.style.transform = "scale(" + scale + ")";
  canvas.style.left = (winw - width) / 2 + "px";
  canvas.style.top = (winh - height) / 2 + "px";

  document.getElementById("hero").value = (typeof window.localStorage.hero === 'string') ? window.localStorage.hero : 'Normal';
  document.getElementById("connect").onclick = function() {
    window.localStorage.hero = document.getElementById("hero").value;
    window.localStorage.hat = document.getElementById("wreath").value;
    switch(document.getElementById("wreath").value){
      case"Gold":hat.src="texture/gold-wreath.png";
      break;
      case"Spring":hat.src = "texture/spring-wreath.png";
      break;
      case"Autumn":hat.src = "texture/autumn-wreath.png";
      break;
      case"Winter":hat.src = "texture/winter-wreath.png";
      break;
      case"Summer":hat.src = "texture/summer-wreath.png";
      break;
      case"Halo":hat.src = "texture/halo.png";
      break;
      case"Santa Hat":hat.src = "texture/santa-hat.png";
      break;
      case"Blue Santa Hat":hat.src = "texture/blue-santa-hat.png";
      break;
      case"Gold Crown":hat.src = "texture/gold-crown.png";
      break;
      case"Silver Crown":hat.src = "texture/silver-crown.png";
      break;
      case"Bronze Crown":hat.src = "texture/bronze-crown.png";
      break;
      case"Stars":hat.src = "texture/stars.png";
      break;
      case"Flames":hat.src = "texture/flames.png";
      break;
      case"Blue Flames":hat.src = "texture/blue-flames.png";
      break;
      case"Orbit Ring":hat.src = "texture/orbit-ring.png";
      break;
      case"Sticky Coat":hat.src = "texture/sticky-coat.png";
      break;
      case"Toxic Coat":hat.src = "texture/toxic-coat.png";
      break;
      case"Legacy Hat":hat.src = "texture/legacy-hat.png";
      break;
    }
    localStorage.sandbox = settings.sandbox = sandbox.checked;
    localStorage.outline = settings.outline = outline.checked;
    localStorage.deathcd = settings.deathcd = deathcd.checked;
    localStorage.timer = settings.timer = timer.checked;
    localStorage.tiles = settings.tiles = tilesOption.checked;
    localStorage.dev = settings.dev = dev.checked;
    localStorage.no_points = settings.no_points = no_points.checked;
    localStorage.mouse_toggle = settings.mouse_toggle = mouse_toggle.checked;

    menu.style.display = "none";
    gamed.style.display = "inline-block";
    inMenu = false;
    var world = document.getElementById("world");
    var hero = document.getElementById("hero");
    if (world.selectedIndex == 0) {
      loadMain();
    }
    if (world.selectedIndex == 1) {
      loadHard()
    }
    if (world.selectedIndex == 2) {
      loadSecondary()
    }

    if(settings.sandbox)Delay = 0;

    const player = new [Basic,Magmax,Rime,Morfe,Aurora,Necro,Brute,Shade,Chrono,Reaper,Rameses,Cent,Jotunn,Candy,Mirage,Clown,Burst,Lantern,Pole,Polygon,Poop][hero.selectedIndex](new Vector(Math.random() * 7 + 2.5, Math.random() * 10 + 2.5),5);
    game.players.push(player);
    
    loadImages(game.players[0].className);
    game.worlds[0].areas[0].load();
    startAnimation()
  }
  document.addEventListener("mousemove", Pos, false);
}
document.addEventListener("keydown", keydown, false);
document.addEventListener("keyup", keyup, false);

function keydown(e) {
  const player = game.players[0];
  setTimeout(()=>{
  keys[e.keyCode] = true;
  if (e.keyCode == 84) {
    player.hasCheated = true;
    player.area++
    if (player.area>=game.worlds[player.world].areas.length-1) {
      player.area=game.worlds[player.world].areas.length-1
    }
    game.worlds[player.world].areas[player.area].load();
    canv = null;
  }
  if (e.keyCode == 82) {
    player.hasCheated = true;
    player.area = Number(player.area) + 10;
    if (player.area>=game.worlds[player.world].areas.length-1) {
      player.area=game.worlds[player.world].areas.length-1
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
    settings.timerClear = !settings.timerClear;
  }
  if (e.keyCode == 66) {
    player.hasCheated = true;
    settings.cooldown = !settings.cooldown;
  }},Delay)
  
}

function keyup(e) {
  setTimeout(()=>{
  delete keys[e.keyCode];
  },Delay);
}
window.onblur = function() {
  keys = [];
};

function Pos(p) {
  setTimeout(()=>{var t = canvas.getBoundingClientRect();
  mousePos = new Vector((p.pageX - t.left) / scale, (p.pageY - t.top) / scale);},Delay)
}
document.onmousedown = function(e) {
  if (e.buttons == 1) {
    if (!inMenu) {
      setTimeout(()=>{mouse = !mouse},Delay);
    }
  }
};

document.onmouseup = function(e) {
  setTimeout(()=>{if (!settings.mouse_toggle&&!inMenu)mouse = !mouse;},Delay);
};
var inputElement = document.getElementById("load");
inputElement.addEventListener("change", handleFiles, false);

function handleFiles() {
  loaded = true;
  var fileList = this.files[0]; 
  var reader = new FileReader();
  reader.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
      game = new Game()
      var world = new World(new Vector(0, 0), 0, jsyaml.load(evt.target.result));
      game.worlds[0] = world
      document.getElementById("world").selectedIndex = 3
    }
  };
  reader.readAsBinaryString(fileList);
}

window.onblur = function () {
  isActive = false;
}
window.onfocus = function () {
  isActive = true;
}