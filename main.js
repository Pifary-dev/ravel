const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
let width = canvas.width,
  height = canvas.height;
const staticWidth = width, 
  staticHeight = height;
const game = new Game();
const inputArray = [];
let mousePos = new Vector(0, 0);
let mouse = false;
var loaded = false;
let lastRender = 0;
let fov = 32;

function loadMain() {
  game.worlds.push(new World(new Vector(0, 0), 0, centralCore),
                   new World(new Vector(0, 80), 1, hauntedHalls),
                   new World(new Vector(0, 160), 2, peculiarPyramid),
                   new World(new Vector(0, 525), 3, wackyWonderland),
                   new World(new Vector(0, 570), 4, glacialGorge),
                   new World(new Vector(0, 615), 5, viciousValley),
                   new World(new Vector(0, 660), 6, humongousHollow),
                   new World(new Vector(0, 705), 7, eliteExpanse),
                   new World(new Vector(0, 750), 8, centralCoreHard),
                   new World(new Vector(0, 795), 9, dangerousDistrict),
                   new World(new Vector(0, 840), 10, quietQuarry),
                   new World(new Vector(0, 885), 11, monumentalMigration),
                   new World(new Vector(0, 930), 12, ominousOccult),
                   new World(new Vector(0, 970), 13, viciousValleyHard),
                   new World(new Vector(0, 1015), 14, frozenFjord),
                   new World(new Vector(-61, 1465), 15, restlessRidge),
                   new World(new Vector(-61, 1365), 16, toxicTerritory),
                   new World(new Vector(-61, 1400), 17, magnetic_monopole),
                   new World(new Vector(-61, 1440), 18, assorted_alcove),
                   new World(new Vector(-61, -15), 19, stellarSquare),
                   new World(new Vector(2898.375, 1400), 20, magnetic_monopole_hard))
}

function loadHard(){
  game.worlds.push(new World(new Vector(0, 0), 0, centralCoreFast),
                   new World(new Vector(-61, 1440), 1, assorted_alcoveHard),
                   new World(new Vector(-61, -15), 2, stellarSquareHard))
}

function loadSecondary() {
  game.worlds.push(new World(new Vector(0, 0), 0, transformingTurbidity),
                   new World(new Vector(0, 45), 1, unexploredUtopia),
                   new World(new Vector(0, 90), 2, littleLandscape),
                   new World(new Vector(0, 132), 3, darknessDimension),
                   new World(new Vector(0, 177), 4, crowdedCavern),
                   new World(new Vector(0, 222), 5, centralCoreImpossible),
                   new World(new Vector(0, 267), 6, transformingTurbidityImpossible),
                   new World(new Vector(0, 312), 7, elongatingEscalator),
                   new World(new Vector(0, 357), 8, ballisticBattlefield),
                   new World(new Vector(0, 402), 9, insanityIsle),
                   new World(new Vector(0, 447), 10, naturalNightmare))
}
const tiles = new Image();
const hat = new Image();
const gem = new Image();
const magnetDown = new Image();
const magnetUp = new Image();
const pumpkinOn = new Image();
const pumpkinOff = new Image();
const torch = new Image();
const torchUp = new Image();
const flashlight_item = new Image();
const flashlight = new Image();
const abilityOne = new Image();
const abilityTwo = new Image();
const sweet_tooth_item = new Image();
const vengeance_projectile = new Image();
const gate = new Image();
const lantern = new Image();
const tick_time = 1000 / 60; let tick_speed = 1;
const missing_world = new World(new Vector(0, 0), 0, missingMap);

// calculate fps (dev mode only)
const filterStrength = 50;
let frameTime = 0, lastLoop = new Date, thisLoop;

function animate(time) {
  let progress = tick_time;
  if(settings.sandbox){
    window.requestAnimationFrame(animate);
    progress = time - lastRender;
    if (progress > 1000) {
      progress = 1000;
    }
  }
  if (!inMenu) {
    if(settings.dev) calculateFps();
    updateBackground(context,width,height,'#333');
    const input = {keys:[...keys],mouse:mousePos,isMouse:mouse};
    if(settings.slow_upgrade){
      for (const i in keys){
        if (keys[i] && ![KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN, KEYS.W, KEYS.A, KEYS.S, KEYS.D, KEYS.SHIFT].includes(parseInt(i))){
          keys[i] = false;
        }
      }
    }
    const player = game.players[0];
    if(inputArray.length > settings.tick_delay && !settings.sandbox && settings.tick_delay > 0){
      while(inputArray.length > settings.tick_delay) inputArray.shift();
      game.inputPlayer(0, inputArray[0]);
    } else {
      game.inputPlayer(0, input)
    }
    inputArray.push(input);
    const old = {area:player.area,world:player.world};
    game.update(progress * tick_speed);
    const focus = new Vector(player.pos.x, player.pos.y);
    const world = game.worlds[player.world];
    const area = world.areas[player.area];
    const wasVictory = area.getActiveBoundary().t;
    const strokeColor = (area.title_stroke_color) ? area.title_stroke_color : "#425a6d";
    const areaText = (wasVictory) ? "Victory!" : game.worlds[player.world].areas[player.area].name;
    const areaUpdated = (old.area == player.area && old.world == player.world) ? false : true;
    renderArea(game.getStates(0), game.players, focus, areaUpdated);
    applyScale(context,settings.scale,()=>{
      drawAreaHeader(context,6,strokeColor,areaText,staticWidth,40,world);
      if(settings.timer){
        const style = (player.victoryTimer>0) ? 'yellow' : null;
        const timerTime = secondsFormat(Math.floor(player.timer/1000));
        drawAreaHeader(context,6,strokeColor,timerTime,staticWidth,80,null,30,style)
      }
      const worldSelected = document.getElementById("world");
      if(worldSelected.selectedIndex == 3 && !loaded) area.text = "this is to import a map, top left in the menu";
      if(area.text){
        const text = area.text;
        const size = (world.selectedIndex == 2 && player.area == 0) ? 35 : 25;
        drawAreaHeader(context,5,"#006b2c",text,staticWidth,staticHeight-120,null,size,"#00ff6b")
      }
    })
  }
  lastRender = time;
}

function startAnimation(){
  if (settings.sandbox) {
    requestAnimationFrame(animate);
  } else {
    const gameInterval = new interval(tick_time,animate)
    gameInterval.run();
  }
}