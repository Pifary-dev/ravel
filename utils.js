const entityTypes = [
  "unknown", // this is used if enemy type is not known
  "normal",
  "wall",
  "dasher",
  "homing",
  "slowing",
  "draining",
  "oscillating",
  "turning",
  "liquid",
  "sizing",
  "switch",
  "freezing",
  "sniper",
  "teleporting",
  "immune",
  "ice_sniper",
  "disabling",
  "icicle",
  "spiral",
  "gravity",
  "repelling",
  "wavy",
  "zigzag",
  "zoning",
  "radiating_bullets",
  "frost_giant",
  "tree",
  "pumpkin",
  "fake_pumpkin",
  "speed_sniper",
  "regen_sniper",
  "snowman",
  "slippery",
  "toxic",
  "corrosive",
  "corrosive_sniper",
  "poison_sniper",
  "magnetic_reduction",
  "magnetic_nullification",
  "positive_magnetic_sniper",
  "negative_magnetic_sniper",
  "positive_magnetic_ghost",
  "negative_magnetic_ghost",
  "fire_trail",
  "wind_ghost",
  "ice_ghost",
  "lava",
  "poison_ghost",
  "star",
  "grass",
  "glowy",
  "firefly",
  "mist",
  "lunging",
  "barrier",
  "quicksand",
  "radar",
  "wind_sniper",
  "disabling_ghost",
  "experience_drain",
  "sand",
  "sandrock",
  "crumbling",
  "flower",
  "seedling",
  "cactus",
  "regen_ghost",
  "speed_ghost",
  "charging",
  "lead_sniper",
  "reducing",
  "blocking",
  "blind",
  "lotus_flower",
  "withering",
  "void_crawler",
  "ninja_star_sniper",
  "summoner",
  "slasher",
  "wavering",
  "cursed",
  "expander",
  "silence",
  "void_drain",
  "void_sniper",
  "void_swarm",
  "confectioner",
  "static",
  "thunderbolt",
  "superstar",
  // Bosses
  "aibot",
  "eabot",
  "wabot",
  "fibot",
  "cybot",
  // Not in evades
  "custom_boss",
  "global_spawner",
  "wind", //use wind_ghost instead
  "web",
  "cobweb",
  "defender",
  "burning",
  "sticky_sniper",
  "aegis_sniper",

  // og evades
  "vary",
  "invisible",
  "halfwall"

  /* Those cannot be spawned by area spawner
  "reverse_projectile",
  "minimize_projectile"
  
  custom:
  "clown_trail",
  "sticky_trail"
  */
];

function pointInRectangle(pos, rectpos, rectsize) {
  return (pos.x >= rectpos.x && pos.x <= rectpos.x + rectsize.x && pos.y >= rectpos.y && pos.y <= rectpos.y + rectsize.y);
}

function closestPointToRectangle(pos, rectpos, rectsize) {
  let xpos = pos.x;
  let ypos = pos.y;
  if (xpos < rectpos.x) {
    xpos = rectpos.x
  }
  if (xpos > rectpos.x + rectsize.x) {
    xpos = rectpos.x + rectsize.x;
  }
  if (ypos < rectpos.y) {
    ypos = rectpos.y
  }
  if (ypos > rectpos.y + rectsize.y) {
    ypos = rectpos.y + rectsize.y;
  }
  return new Vector(xpos, ypos);
}

function distance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function isSpawned(boundary, entity) {
  if (!entity.isSpawned) return;

  const { pos, radius, vel } = entity;
  const { x, y, w, h } = boundary;

  let collisionAxis = null;
  let penetration = 0;

  // Check horizontal collisions
  if (pos.y + radius > y && pos.y - radius < y + h) {
    const rightPenetration = pos.x + radius - x;
    const leftPenetration = x + w - (pos.x - radius);
    
    if (rightPenetration > 0 && rightPenetration < leftPenetration) {
      collisionAxis = 'left';
      penetration = rightPenetration;
    } else if (leftPenetration > 0 && leftPenetration < rightPenetration) {
      collisionAxis = 'right';
      penetration = leftPenetration;
    }
  }

  // Check vertical collisions
  if (pos.x + radius > x && pos.x - radius < x + w) {
    const bottomPenetration = pos.y + radius - y;
    const topPenetration = y + h - (pos.y - radius);
    
    if (bottomPenetration > 0 && bottomPenetration < topPenetration && (!collisionAxis || bottomPenetration < penetration)) {
      collisionAxis = 'top';
      penetration = bottomPenetration;
    } else if (topPenetration > 0 && topPenetration < bottomPenetration && (!collisionAxis || topPenetration < penetration)) {
      collisionAxis = 'bottom';
      penetration = topPenetration;
    }
  }

  // Handle collision if any
  if (collisionAxis) {
    entity.wallHit = true;
    entity.isSpawned = false;

    switch (collisionAxis) {
      case 'left':
        pos.x = x - radius;
        vel.x = -Math.abs(vel.x);
        break;
      case 'right':
        pos.x = x + w + radius;
        vel.x = Math.abs(vel.x);
        break;
      case 'top':
        pos.y = y - radius;
        vel.y = -Math.abs(vel.y);
        break;
      case 'bottom':
        pos.y = y + h + radius;
        vel.y = Math.abs(vel.y);
        break;
    }
  }
}

function sectorInRect(ctx, x, y, width, height, angle) {
  // Normalize angle to 0-360 range
  angle = (angle + 360) % 360;

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.sqrt(2) * Math.max(width, height) / 2;

  // Convert angles to radians
  const startAngle = 270 * Math.PI / 180;
  const endAngle = angle * Math.PI / 180;

  // Calculate corner points
  const topLeft = { x, y };
  const topRight = { x: x + width, y };
  const bottomRight = { x: x + width, y: y + height };
  const bottomLeft = { x, y: y + height };

  // Calculate arc end points
  const arcStartX = centerX + radius * Math.cos(startAngle);
  const arcEndX = centerX + radius * Math.cos(endAngle);
  const arcEndY = centerY + radius * Math.sin(endAngle);

  // Determine sector points based on angle
  let sectorPoints;
  if (angle > 315 || angle < 45) {
    sectorPoints = [{ x: arcStartX, y }, topLeft, bottomLeft, bottomRight, topRight, { x: x + width, y: arcEndY }];
  } else if (angle <= 135) {
    sectorPoints = [{ x: arcStartX, y }, topLeft, bottomLeft, { x: arcEndX, y: y + height }];
  } else if (angle <= 225) {
    sectorPoints = [{ x: arcStartX, y }, topLeft, { x, y: arcEndY }];
  } else {
    sectorPoints = arcStartX < arcEndX
      ? [{ x: arcStartX, y }, topLeft, bottomLeft, bottomRight, topRight, { x: arcEndX, y }]
      : [{ x: arcEndX, y }, { x: arcStartX, y }];
  }

  // Draw the sector
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  sectorPoints.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.lineTo(centerX, centerY);
  ctx.closePath();
  ctx.fill();
}

function greaterMax(player){
  const max = Math.max(Math.abs(player.d_x),Math.abs(player.d_y));
  if(max == Math.abs(player.d_x)){
    return player.d_x.toFixed(2);
  }
  return player.d_y.toFixed(2);
}

function combineSpeed(player){
  return parseFloat(((player.d_x**2 + player.d_y**2)**0.5).toFixed(2));
}

function returnToSafePoint (player, should_clear_timer = true){
  if(settings.timer_clear && should_clear_timer){player.timer = 0}
  const safeP = {world:player.safePoint.world,area:player.safePoint.area,pos:{x:player.safePoint.pos.x,y:player.safePoint.pos.y}};
  player.pos = safeP.pos;
  player.world = safeP.world;
  player.area = safeP.area;
}

function death(player,enemy){
  if(player.className == "Morfe" && !player.isDead){
    const entities = game.worlds[player.world].areas[player.area].entities;
    let longestHealingEffect = 0;
    for(let i in entities){
      const entityType = entities[i];
      if(entityType == "Pellet") continue;
      for(let j in entityType){
        const entity = entityType[j];
        if(entity.healing && entity.healing>longestHealingEffect){
          longestHealingEffect = entity.healing;
        }
      }
    }
    player.deathTimer = longestHealingEffect+100;
    player.isDead = true;
  } else if (player.className == "Necro" && !player.isDead && player.resurrectAvailable){
    player.deathTimer = 60000;
    player.isDead = true;
  } else if (player.className == "Chrono" && !player.isDead && player.energy+player.regen*2.5 >= 28 && player.firstAbilityCooldown < 3000){
    player.deathTimer = 60000;
    player.isDead = true;
  } else if(player.isDead && player.deathTimer <= 0 ){
    player.isDead = false;
  }
  if(player.isDead){
    player.distance_moved_previously = [0,0];
    return;
  }
  if(enemy){
    if(enemy.radius===0){
      return;
    }
  }
  kill(player)
}

function kill(player){
  const diff = settings.diff;
  player.deathCounter++;
  player.reducingPower = 0;
  player.isDead = false;
  if(!settings.death_cooldown){
    player.firstAbilityCooldown = 0; 
    player.secondAbilityCooldown = 0;
    player.onDeath();
  }

  if(diff == "Easy" || (diff == "Medium" && player.lives-1>=0)){
    player.pos = new Vector(player.dyingPos.x, player.dyingPos.y);
    if(diff == "Medium") player.lives--;
  } else {
    player.reset();
    if(diff == "Medium") player.lives = player.maxLives;
  }
  if(settings.dev && player.safePoint){
    if(settings.seed !== undefined && settings.seeded_area_resets) game.worlds[player.world].areas.forEach(area => area.loadCount = 0);
    returnToSafePoint(player);
  }
}

const secondsFormat = (time) => {
  let minutes = 0, seconds = 0;
  while (time>=60){
      time-=60; minutes++;
  }
  seconds = time;
  return `${minutes}m ${seconds}s`
}

function collides(enemy,enemy2,offset){
  const dx = enemy.pos.x - (enemy2.pos.x + offset.x);
  const dy = enemy.pos.y - (enemy2.pos.y + offset.y);
  const radius_sum = enemy.radius + enemy2.radius;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < radius_sum) {
      return true;
  } else {return false}
}

function collisionEnemy(enemy,boundary,vel,pos,radius,returnCollision){
  let collision = false;
  if(enemy.no_collide) return
  if(enemy.area_collide && !boundary.wall)boundary=game.worlds[game.players[0].world].areas[game.players[0].area].getBoundary();
  if(enemy.dasher) enemy.angle = enemy.oldAngle;
  if (!boundary.wall) {
    const dx = pos.x - boundary.x;
    const dy = pos.y - boundary.y;
    const collideX = dx < radius || dx > boundary.w - radius;
    const collideY = dy < radius || dy > boundary.h - radius;

    if (collideX || collideY) {
      collision = true;
      if(!enemy.disabled_collision_angle_changes){
        if (collideX) vel.x = -vel.x;
        if (collideY) vel.y = -vel.y;
        enemy.velToAngle();
      }
    }
  } else {
    isSpawned(boundary,enemy);
      const circle = {x:enemy.pos.x,y:enemy.pos.y,r:radius,angle:enemy.angle,vel:vel}
    if(enemy.isEnemy||enemy.weak){
      const intersect = intersects(circle,boundary);
      if(intersect.collision) collision = true;
      if(intersect.collision&&enemy.weak){enemy.toRemove = true}
      else if (intersect.collision && !enemy.disabled_collision_angle_changes){
        const halfWidth = boundary.w/2;
        const halfHeight = boundary.h/2;
        const center_x = boundary.x+halfWidth;
        const center_y = boundary.y+halfHeight;
        const relative_x = (circle.x - center_x) / halfWidth;
        const relative_y = (circle.y - center_y) / halfHeight;
        const newAngle = Math.atan2(intersect.y,intersect.x);
        if (Math.abs(relative_x) > Math.abs(relative_y)) {
          if (relative_x > 0) {
            if(relative_y*halfHeight > halfHeight){
              circle.x = center_x + halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y + halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else if (relative_y*halfHeight < -halfHeight){
              circle.x = center_x + halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y - halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else {
              circle.x = center_x + halfWidth + circle.r;
              vel.x=Math.abs(vel.x);
              enemy.velToAngle();
            }
          } else {
            if(relative_y*halfHeight > halfHeight){
              circle.x = center_x - halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y + halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else if (relative_y*halfHeight < -halfHeight){
              circle.x = center_x - halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y - halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else {
              circle.x = center_x - halfWidth - circle.r;
              vel.x=-Math.abs(vel.x);
              enemy.velToAngle();
            }
          }
        } else {
          if (relative_y > 0) {
            if(relative_x*halfWidth > halfWidth){
              circle.x = center_x + halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y + halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else if (relative_x*halfWidth < -halfWidth){
              circle.x = center_x - halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y + halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else {
              circle.y = center_y + halfHeight + circle.r;
              vel.y=Math.abs(vel.y);
              enemy.velToAngle();
            }
          } else {
            if (relative_x*halfWidth > halfWidth){
              circle.x = center_x + halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y - halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else if (relative_x*halfWidth < -halfWidth){
              circle.x = center_x - halfWidth + circle.r*Math.cos(newAngle);
              circle.y = center_y - halfHeight + circle.r*Math.sin(newAngle);
              enemy.angle=newAngle;
              enemy.angleToVel();
            } else {
              circle.y = center_y - halfHeight - circle.r;
              vel.y=-Math.abs(vel.y);
              enemy.velToAngle();
            }
          }
        }
        enemy.pos.x = circle.x;
        enemy.pos.y = circle.y;
      }
    }
  }
  enemy.isSpawned = false;
  if(!returnCollision){return;}
  
  if(enemy.useRealVel){
    enemy.realVel = new Vector(vel.x,vel.y);
  }

  if(enemy.dasher) enemy.oldAngle = enemy.angle;

  if(collision){
    if(enemy.color == "#7e7cd6"&&!enemy.precise_movement){
      enemy.velToAngle();
    } else if(enemy.homing){
      enemy.targetAngle = enemy.angle;
    } else if(enemy.turning){
      enemy.dir = -enemy.dir;
    } else if(enemy.wall){
      enemy.direction = enemy.rotate(enemy.direction,enemy.move_clockwise);
    }
  }
  return {col:collision};
}
function interactionWithEnemy(player, enemy, offset, barrierInvulnerable, corrosive, immune, harmless, killInSafeZone = false) {
  const hasCollision = collides(player, enemy, offset);
  const isPlayerSafe = player.safeZone && killInSafeZone;
  let isHarmless = harmless !== undefined ? harmless : enemy.isHarmless();
  const protectedByBarrier = (barrierInvulnerable && player.inBarrier && !(corrosive && !isHarmless)) || player.inEnemyBarrier;

  if (!hasCollision || isPlayerSafe) return { dead: false, inDistance: false };
  if (enemy.healing > 0) player.isDead = false;

  if (player.god || protectedByBarrier) return { dead: false, inDistance: true };

  if (!isHarmless && !enemy.disabled && enemy.able_to_kill && player.aegisShieldPoints > 0) {
    player.aegisShieldPoints -= 1;
    enemy.HarmlessEffect = 1500;
    enemy.Harmless = true
    isHarmless = true;
  }

  const collisionResult = player.onEnemyCollide(enemy, immune);
  if (collisionResult && collisionResult.forceHarmless) isHarmless = true;


  const enemyCannotKill = enemy.texture === "pumpkinOff" || enemy.radius <= 0 || isHarmless || enemy.shatterTime > 0;
  let dead = !enemyCannotKill;

  if (dead && enemy.able_to_kill) player.onFatalBlow(corrosive);
  if ((player.invincible && !corrosive) || isHarmless || !enemy.able_to_kill) dead = false;

  if (dead && !player.isDead) death(player);

  return { dead, inDistance: true };
}

const toRGBArray = rgbStr => {
  const match = rgbStr.match(/\d+(?:\.\d+)?(?:e[-+]\d+)?/g);
  return match.map(Number);
};
const arrayToInt32=(s)=>s[0]<<24|s[1]<<16|s[2]<<8|s[3]<<0
const arrayToRGBStr = array => `rgb(${array[0]},${array[1]},${array[2]})`;
function mixColors(e,a){
  const t = e[3] / 255
		  , r = a[3] / 255
		  , c = []
		  , o = 1 - (1 - r) * (1 - t);
		return c[0] = Math.round(a[0] * r / o + e[0] * t * (1 - r) / o),
		c[1] = Math.round(a[1] * r / o + e[1] * t * (1 - r) / o),
		c[2] = Math.round(a[2] * r / o + e[2] * t * (1 - r) / o),
		c[3] = o,
		c
}
function roundTo(t,e){
  return Math.round(t/e)*e;
}

function createOffscreenCanvas (width,height){
  const canvas = document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  return canvas;
}

/**
 * Mulberry32 seeded PRNG — returns a function that produces [0, 1) floats.
 * @param {number} seed - 32-bit integer seed
 */
function seededRandom(seed) {
  let s = seed >>> 0;
  return function() {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Cheap string hash to fold an enemy type name into a seed contribution.
 * @param {string} str
 */
function hashString(str) {
  if (!str) return 0;
  let h = 0x811C9DC5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function random (number) {
  return Math.floor(Math.random()*(number+1))
}

function min_max(min,max) {
  return Math.floor(Math.random()*(max-min+1))+min
}

function random_between(array){
  return array[random((array.length-1))]
}

function convert_to_legacy_speed(value){
  return value / (settings.convert_to_legacy_speed ? 30 : 1);
}

function parseRange(value) {
    return typeof value === "string" && value.includes(',')
        ? min_max(...value.split(',').map(parseFloat))
        : value;
}

function loadImages(character) {
  images.tiles.src = localStorage.tiles === "true" ? "texture/tiles.jpg" : "texture/tiles2.jpg";

  const abilityMap = {
    "Magmax": ["flow", "harden"],
    "Basic": ["flow", "harden"],
    "Rime": ["warp", "paralysis"],
    "Morfe": ["reverse", "minimize"],
    "Necro": ["resurrection", "reanimate"],
    "Brute": ["stomp", "vigor"],
    "Chrono": ["backtrack", "rewind"],
    "Clown": ["heavy_ballon", "rejoicing"],
    "Aurora": ["distort", "energize"],
    "Candy": ["sugar_rush", "sweet_tooth"],
    "Jötunn": ["decay", "shatter"],
    "Shade": ["night", "vengeance"],
    "Cent": ["fusion", "mortar"],
    "Rameses": ["bandages", "latch"],
    "Reaper": ["atonement", "depart"],
    "Mirage": ["shift", "obscure"],
    "Polygon": ["morph", "resilience"],
    "Lantern": ["follower", "shrinkler"],
    "Pole": ["unknown", "unknown"],
    "Burst": ["unknown", "unknown"],
    "Idk": ["unknown", "unknown"]
  };

  if (character in abilityMap) {
    images.abilityOne.src = `texture/${abilityMap[character][0]}.png`;
    images.abilityTwo.src = `texture/${abilityMap[character][1]}.png`;
  }

  if (character === "Candy") {
    images.sweet_tooth_item.src = "texture/sweet_tooth_item.png";
  } else if (character === "Shade") {
    images.vengeance_projectile.src = "texture/vengeance_projectile.png";
  }

  if (settings.wreath.includes("Crown")) {
    images.gem.src = "texture/1000-gem.png";
  }

  const imageNames = {
    gate: "gate",
    flashlight: "flashlight",
    flashlight_item: "flashlight_item",
    lantern: "lantern",
    torchUp: "torch_upside_down",
    torch: "torch",
    pumpkinOff: "pumpkin_off",
    pumpkinOn: "pumpkin_on",
    magnetUp: "magnetism_up",
    magnetDown: "magnetism_down",
    lotusOn: "lotus_flower_on",
    lotusOff: "lotus_flower_off",
    ninja_star_sniper_projectile: "ninja_star_sniper_projectile",
    sour_candy_item: "sour_candy_item"
  };

  for (const [key, imageName] of Object.entries(imageNames)) {
    if (images[key]) {
      images[key].src = `texture/${imageName}.png`;
    }
  }
}

function clamp(value,min,max){
  return Math.min(max,Math.max(min,value))
}

function intersects(circle, boundary) { // TODO: rewrite stovoy's rust library to js and use it instead
  const tx = clamp(circle.x,boundary.x,boundary.x+boundary.w), dx = (circle.x-tx);
  const ty = clamp(circle.y,boundary.y,boundary.y+boundary.h), dy = (circle.y-ty);
  const distance = Math.sqrt(dx**2+dy**2);
  const enemy = {
    collision : distance < circle.r,
    x : dx,
    y : dy
  }
  return enemy;
};

function degrees_to_radians(degrees){
  return degrees * (Math.PI/180);
}
function radians_to_degrees(radians){
  return radians * (180/Math.PI);
}

function zoneTypeToId(type){
  switch(type){
    case "active":
      return 0
    case "safe":
      return 1;
    case "exit":
      return 2;
    case "teleport":
      return 3;
    case "victory":
      return 4;
    case "removal":
      return 5;
    case "dummy":
      return 6;
  }
}

function interval(duration, fn){
  let _this = this
  this.baseline = undefined
  
  this.run = function(){
    if(_this.baseline === undefined){
      _this.baseline = new Date().getTime();
    }
    fn();
    const end = new Date().getTime();
    _this.baseline += duration;
    let nextTick = duration - (end - _this.baseline);
    let progressToBeDone = end - _this.baseline; // make progress while afk
    if(progressToBeDone>100){
      _this.baseline = new Date().getTime();
    }
    while (progressToBeDone>100 && progressToBeDone<5000){
      fn();
      progressToBeDone-=duration;
    }
    if (nextTick<0){
      nextTick = 0;
    }
    
    _this.timer = setTimeout(function(){
      _this.run(end);
    }, nextTick)
  }

  this.stop = function(){
    clearTimeout(_this.timer);
  }
}

function applyInputDelay(inputDelay,fn){
  if(inputDelay > 0){
    setTimeout(()=>{
      fn();
    },inputDelay)
  } else {
    fn();
  }
}

function getInputKeys(keysArray){
  const newKeys = [];
  for(const i in keysArray){
    const key = keysArray[i];
    if(key){
      newKeys.push(Number(i));
    }
  }
  return newKeys;
}

function findEqualKeys(keysArray,inputKeys){
  let index = null;
  for(let i in keysArray){
    const keyInput = keysArray[i].inputKeys;
    const wrong = isKeysEqual(inputKeys,keyInput);
    if (!wrong){
      index = i;
      if(keysArray[i-1])if(isKeysEqual(keysArray[i-1].inputDelay,inputKeys)){
        index = null;
      }
    }
  }
  return index;
}

function isKeysEqual(arr1,arr2){
  if(!arr1 || !arr2) return false
  const a1 = [...arr1].sort();
  const a2 = [...arr2].sort();
  return JSON.stringify(a1)==JSON.stringify(a2);
}

const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))

const KEYS = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  J: 74,
  K: 75,
  L: 76,
  Z: 90,
  X: 88,
  C: 67,
  SHIFT: 16,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53
}

function calculateFps(){
  const thisFrameTime = (thisLoop = new Date) - lastLoop;
  frameTime += (thisFrameTime - frameTime) / filterStrength;
  lastLoop = thisLoop;
}

function textureToId(texture){
  switch(texture){
    case "leaves": return 1
    case "wooden": return 2
    case "baguette": return 3
    case "ice": return 4
    default: return 0
  }
}

class Pulsation {
  constructor(min,max,increment,increasing = true){
    this.value = min;
    this.min = min;
    this.max = max;
    this.increment = increment;
    this.increasing = increasing;
  }
  update(time){
    const timeFix = time / (1000 / 30);
    if(this.increasing){
      this.value += this.increment * timeFix;
      if(this.value >= this.max){
        this.value = this.max;
        this.increasing = false
      }
    } else {
      this.value -= this.increment * timeFix;
      if(this.value <= this.min){
        this.value = this.min;
        this.increasing = true;
      }
    }
  } 
}


function evaluateExpression(rawValue, variables = {}) {
  if (typeof rawValue === 'string' && !rawValue.includes(',')) {
    let expression = rawValue;
    let hasVariables = false;

    for (const [varName, varValue] of Object.entries(variables)) {
      if (expression.includes(varName)) {
        expression = expression.replace(new RegExp(varName, 'g'), varValue.toString());
        hasVariables = true;
      }
    }

    if (hasVariables) {
      if (!/^[0-9+\-*/.() \t\n]+$/.test(expression)) {
        console.warn(`Unsafe expression detected: "${rawValue}", falling back to parsed value`);
        return { value: parseFloat(rawValue) || 0, wasExpression: false };
      } else {
        try {
          const result = Function('"use strict"; return (' + expression + ')')();
          return { value: result, wasExpression: true };
        } catch (e) {
          console.error(`Expression evaluation failed: "${rawValue}"`, e.message);
          return { value: parseFloat(rawValue) || 0, wasExpression: false };
        }
      }
    } else {
      return { value: parseFloat(rawValue) || rawValue, wasExpression: false };
    }
  } else {
    return { value: rawValue, wasExpression: false };
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const STATS_PANEL_WIDTH = 210;

function drawStatsPanel(context, x, y, sections, uiScale) {
  const panelWidth = STATS_PANEL_WIDTH * uiScale;
  const padding = 8 * uiScale;
  const lineHeight = 16 * uiScale;
  const headerHeight = 18 * uiScale;
  const sectionGap = 6 * uiScale;

  const fontFamily = "Tahoma, Verdana, Segoe, sans-serif";
  const headerFont = `bold ${11 * uiScale}px ${fontFamily}`;
  const rowFont = `${11 * uiScale}px ${fontFamily}`;

  const UI_BACKGROUND = "rgba(0, 0, 0, 0.8)";
  const SEPARATOR = "rgba(128, 128, 128, 0.75)";
  const YELLOW = "yellow";
  const WHITE = "white";

  context.save();
  context.textBaseline = "top";
  context.lineWidth = 1;

  let panelHeight = padding * 2;
  sections.forEach((section, i) => {
    panelHeight += headerHeight + section.rows.length * lineHeight;
    if (i < sections.length - 1) panelHeight += sectionGap;
  });

  context.fillStyle = UI_BACKGROUND;
  context.fillRect(x, y, panelWidth, panelHeight);

  // --- content ---
  let cursorY = y + padding;
  sections.forEach((section, si) => {
    context.font = headerFont;
    context.textAlign = "center";
    context.fillStyle = YELLOW;
    context.fillText(section.title, x + panelWidth / 2, cursorY);
    cursorY += headerHeight;

    context.strokeStyle = SEPARATOR;
    context.beginPath();
    context.moveTo(x + padding, cursorY - 4 * uiScale);
    context.lineTo(x + panelWidth - padding, cursorY - 4 * uiScale);
    context.stroke();

    context.font = rowFont;
    section.rows.forEach(row => {
      context.textAlign = "left";
      context.fillStyle = "rgba(255, 255, 255, 0.6)";
      context.fillText(row.label, x + padding, cursorY);

      context.textAlign = "right";
      context.fillStyle = WHITE;
      context.fillText(row.value, x + panelWidth - padding, cursorY);

      cursorY += lineHeight;
    });

    if (si < sections.length - 1) cursorY += sectionGap;
  });

  // clear the path so nothing lingers for stray fill()/stroke() calls elsewhere
  context.beginPath();
  context.restore();
}

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}