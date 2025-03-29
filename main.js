const staticWidth = width, 
  staticHeight = height;
const game = new Game();
const inputArray = [];
let mousePos = new Vector(0, 0);
let mouse = false;
let loaded = false;
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
const images = {
  tiles: new Image(),
  hat: new Image(),
  gem: new Image(),
  magnetDown: new Image(),
  magnetUp: new Image(),
  pumpkinOn: new Image(),
  pumpkinOff: new Image(),
  lotusOn: new Image(),
  lotusOff: new Image(),
  torch: new Image(),
  torchUp: new Image(),
  flashlight_item: new Image(),
  flashlight: new Image(),
  abilityOne: new Image(),
  abilityTwo: new Image(),
  sweet_tooth_item: new Image(),
  vengeance_projectile: new Image(),
  ninja_star_sniper_projectile: new Image(),
  gate: new Image(),
  lantern: new Image()
};
let tick_time, tick_speed = 1;
const missing_world = new World(new Vector(0, 0), 0, missingMap);

// calculate fps (dev mode only)
const filterStrength = 25;
let frameTime = 0, lastLoop = new Date, thisLoop;

function animate(time) {
  const progress = settings.fps_limit === "unlimited" ? Math.min(time - lastRender, 1000) : tick_time;
  
  if (settings.fps_limit === "unlimited") {
    window.requestAnimationFrame(animate);
  }
  
  if (!inMenu) {
    if (settings.dev) calculateFps();
    updateBackground(context, width, height, '#333');
    
    const input = { keys: [...keys], mouse: mousePos, isMouse: mouse };
    
    if (settings.slow_upgrade) {
      const allowedKeys = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN, KEYS.W, KEYS.A, KEYS.S, KEYS.D, KEYS.SHIFT];
      Object.keys(keys).forEach(key => {
        if (keys[key] && !allowedKeys.includes(parseInt(key))) {
          keys[key] = false;
        }
      });
    }
    
    const player = game.players[0];
    
    if (inputArray.length > settings.tick_delay && settings.fps_limit !== "unlimited" && settings.tick_delay > 0) {
      inputArray.splice(0, inputArray.length - settings.tick_delay);
      game.inputPlayer(0, inputArray[0]);
    } else {
      game.inputPlayer(0, input);
    }
    inputArray.push(input);
    
    const oldArea = player.area;
    const oldWorld = player.world;
    
    game.update(progress * tick_speed);
    
    const world = game.worlds[player.world];
    const area = world.areas[player.area];
    const wasVictory = area.getActiveBoundary().t;
    const strokeColor = area.title_stroke_color || "#425a6d";
    const areaText = wasVictory ? "Victory!" : area.name;
    const areaUpdated = oldArea !== player.area || oldWorld !== player.world;
    
    renderArea(game.getStates(0), game.players, player.pos, areaUpdated);
    
    applyScale(context, settings.scale, () => {
      drawAreaHeader(context, 6, strokeColor, areaText, staticWidth, 40, world);
      
      if (settings.timer) {
        const style = player.victoryTimer > 0 ? 'yellow' : null;
        const timerTime = secondsFormat(Math.floor(player.timer / 1000));
        drawAreaHeader(context, 6, strokeColor, timerTime, staticWidth, 80, null, 30, style);
      }
      
      if (settings.world.selectedIndex === 3 && !loaded) {
        area.text = "this is to import a map, top left in the menu";
      }
      
      if (area.text) {
        const size = world.selectedIndex === 2 && player.area === 0 ? 35 : 25;
        drawAreaHeader(context, 5, "#006b2c", area.text, staticWidth, staticHeight - 120, null, size, "#00ff6b");
      }
    });
  }
  
  lastRender = time;
}

function startAnimation() {
  const fpsLimit = settings.fps_limit;
  
  if (fpsLimit === "unlimited") {
    requestAnimationFrame(animate);
  } else {
    tick_time = 1000 / parseInt(fpsLimit);
    
    if (!settings.v_sync) {
      const gameInterval = new interval(tick_time, animate);
      gameInterval.run();
    } else {
      let lastTime = 0;
      
      function animateRAF(currentTime) {
        if (currentTime - lastTime >= tick_time) {
          animate(currentTime);
          lastTime = currentTime - ((currentTime - lastTime) % tick_time);
        }
        requestAnimationFrame(animateRAF);
      }
      
      requestAnimationFrame(animateRAF);
    }
  }
}