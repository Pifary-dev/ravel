var entityTypes = [
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
  "draining",
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
  "experience_drain",
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
  "sand",
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
  // Not in evades
  "wind", //use wind_ghost instead
  "web",
  "cobweb",
  "defender",
  "burning",
  "sticky_sniper"

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
  var xpos = pos.x;
  var ypos = pos.y;
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

function make2Darray(cols, rows, xpos, ypos, type) {
  var arr = new Array(cols);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    for (var j = 0; j < arr[i].length; j++) {
      arr[i][j] = new Tile(i + xpos, j + ypos, type);
    }
  }
  return arr;
};
function distance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}
function perimeter(rect){
  return (rect.w*2+rect.h*2);
}
function warpAround(rect,lengthT,rad){
  var result = {};
  var length = lengthT%perimeter(rect);
  var xpos;
  var ypos;
  var dir;
  //console.log(length,rect,rad)
  if (length<rect.w) {
    dir = 0;
    ypos = rect.y;
    xpos = rect.x+length;
    if(length>rect.w/2){
      xpos-=rad;
    } else {xpos+=rad}
  }else if (length<rect.w+rect.h) {
    dir = 1;
    xpos = rect.x+rect.w;
    ypos = rect.y+(length-rect.w)
  }else if (length<rect.w*2+rect.h) {
    dir = 2;
    ypos = rect.y+rect.h
    xpos = (rect.x+rect.w)-(length-(rect.w+rect.h));
    if(length>(rect.x+rect.w)+rect.w/2){
      xpos+=rad;
    } else {xpos-=rad}
  }else if (length<rect.w*2+rect.h*2) {
    dir = 3;
    xpos = rect.x;
    ypos = (rect.y+rect.h)-(length-(rect.w*2+rect.h))
  }
  result.x = xpos;
  result.y = ypos;
  result.dir = dir;
  return result;
}
var ttest = 1;
function isSpawned(boundary,thes){
  if(thes.isSpawned){
    var wallXLpos,wallXRpos,wallYLpos,wallYRpos;
    if(thes.pos.x - thes.radius < boundary.x + boundary.w&&thes.pos.x + thes.radius > boundary.x&&!(thes.pos.y>boundary.y+boundary.h||thes.pos.y<boundary.y)){
      wallXRpos = boundary.x+boundary.w-thes.pos.x-thes.radius
    }
    if(thes.pos.x + thes.radius > boundary.x&&!(thes.pos.x + thes.radius > boundary.x + boundary.w)&&!(thes.pos.y>boundary.y+boundary.h||thes.pos.y<boundary.y)){
      wallXLpos = thes.pos.x-thes.radius-boundary.x;
    }
    if(thes.pos.y - thes.radius < boundary.y + boundary.h&&thes.pos.y + thes.radius > boundary.y&&thes.pos.x>boundary.x&&thes.pos.x<boundary.x+boundary.w){
      wallYRpos = boundary.y+boundary.h-thes.pos.y-thes.radius
    }
    if (thes.pos.y + thes.radius > boundary.y&&!(thes.pos.y + thes.radius > boundary.y + boundary.h)&&thes.pos.x>boundary.x&&thes.pos.x<boundary.x+boundary.w) {
      wallYLpos = thes.pos.y-thes.radius-boundary.y;
    }
    var lowestOne = Math.min(wallXLpos||100000,wallXRpos||100000,wallYLpos||100000,wallYRpos||100000)
    if(wallXRpos==lowestOne){
      if(ttest)thes.pos.x = boundary.x+boundary.w+thes.radius;
      thes.vel.x = Math.abs(thes.vel.x);
      thes.wallHit = true;
      thes.isSpawned = false;
    }
    if(wallXLpos==lowestOne){
      if(ttest)thes.pos.x = boundary.x-thes.radius;
      thes.vel.x = -Math.abs(thes.vel.x);
      thes.wallHit = true;
      thes.isSpawned = false;
    }
    if(wallYRpos==lowestOne){
      if(ttest)thes.pos.y = boundary.y+boundary.h+thes.radius;
      thes.vel.y = Math.abs(thes.vel.y);
      thes.wallHit = true;
      thes.isSpawned = false;
    }
    if(wallYLpos==lowestOne){
      if(ttest)thes.pos.y = boundary.y-thes.radius;
      thes.vel.y = -Math.abs(thes.vel.y);
      thes.wallHit = true;
      thes.isSpawned = false;
    }//thes.isSpawned = false
  }
}

//Definitely didn't copy evades code

function sectorInRect(t,e,o,n,a,i){
  i<0&&(i=360+i);
  var l=270*Math.PI/180;
  i*=Math.PI/180;
  var r=e+n/2,
  h=o+a/2,
  s={x:e,y:o},
  c={x:e+n,y:o},
  v={x:e+n,y:o+a},
  f={x:e,y:o+a},
  u=Math.sqrt(2)*n/2,
  d=Math.sqrt(2)*a/2,
  M=r+u*Math.cos(l),
  T=(Math.sin(l),
  r+u*Math.cos(i)),
  P=h+d*Math.sin(i),
  g={x:M,y:o},
  x={x:T,y:o},
  b={x:e+n,y:P},
  y={x:T,y:o+a},
  I={x:e,y:P},
  m=[],
  k=Math.PI/180*225,
  p=Math.PI/180*315,
  q=Math.PI/180*45,
  C=Math.PI/180*135;
  m=i>p||i<q?[g,s,f,v,c,b]:i>q&&i<=C?[g,s,f,y]:i>C&&i<=k?[g,s,I]:g.x<x.x?[g,s,f,v,c,x]:[x,g],
  t.beginPath(),t.moveTo(r,h);for(var S=0;S<m.length;S++){var H=m[S];t.lineTo(H.x,H.y)}t.lineTo(r,h),t.closePath(),t.fill()
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

function returnToSafePoint (player){
  if(settings.timer_clear){player.timer = 0}
  const safeP = {world:player.safePoint.world,area:player.safePoint.area,pos:{x:player.safePoint.pos.x,y:player.safePoint.pos.y}};
  player.pos = safeP.pos;
  player.world = safeP.world;
  player.area = safeP.area;
}

function invulnerable(player){
  if (player.god||player.inBarrier||player.invicible) return true;
  return false
}

function death(player,enemy){
  if(player.className == "Morfe" && !player.isDead){
    const entities = game.worlds[player.world].areas[player.area].entities;
    let longestHealingEffect = 0;
    for(let i in entities){
      const entityType = entities[i];
      if(entityType!="Pellet"){
        for(let j in entityType){
          const entity = entityType[j];
          if(entity.healing){
            if(entity.healing>longestHealingEffect){
              longestHealingEffect = entity.healing;
            }
          }
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
  const diff = document.getElementById("diff").value;
  if(enemy){
    if(enemy.radius===0){
      return;
    }
  }
  player.teleportPosition = [];
  player.deathCounter++;
  player.reducingPower = 0;
  if(!settings.deathcd){
    player.firstAbilityCooldown = 0; 
    player.secondAbilityCooldown = 0;
    if(player.className=="Rameses"){player.bandage=true;}
    if(player.className=="Necro"){player.resurrectAvailable=true;player.firstPellet = 0;}
    if(player.className=="Candy"){player.sugarRushing = 0;}
    if(player.className=="Shade"){player.shadeNight = 0;}
  }

  if(diff == "Easy" || (diff == "Medium" && player.lives-1>=0)){
    player.pos = new Vector(player.dyingPos.x, player.dyingPos.y);
    if(diff == "Medium") player.lives--;
  } else {
    player.world = 0;
    player.area = 0;
    player.pos = new Vector(6,9);
    player.lives = player.maxLives;
  }
  if(settings.dev && player.safePoint){
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

function renderBackground(t,e){
  if(null!==this.areaCanvas){
    var i={x:e.left+e.width/2,y:e.top+e.height/2};
    this.drawNearbyMinimap(i);
    t.beginPath();
    t.rect(this.left,this.top,this.minimapWidth,this.minimapHeight);
    t.clip();
    t.drawImage(this.areaCanvas,(e.left-this.x-this.areaCanvasOffset.x)*this.canvasScale,(e.top-this.y-this.areaCanvasOffset.y)*this.canvasScale,e.width*this.canvasScale,e.height*this.canvasScale,this.left,this.top,this.minimapWidth,this.minimapHeight),t.fillStyle="rgba(80, 80, 80, 0.6)",t.fillRect(this.left,this.top,this.minimapWidth,this.minimapHeight)}
  }

function drawNearbyMinimap(t,ctx,canvas,zones,areaPos){
  t = {x:t.x*32,y:t.y*32}
  var areaCanvasOffset = {x:10000,y:10000};
  var nearbySize = 10000;
  var canvasScale = scale;
  var e=roundTo(t.x,nearbySize);
  var i=roundTo(t.y,nearbySize);
  var a=e-nearbySize;
  var n=i-nearbySize;
  var r=e+nearbySize;
  var s=i+nearbySize;
  if(null===areaCanvasOffset||areaCanvasOffset.x!==a||areaCanvasOffset.y!==n){
    areaCanvasOffset={x:a,y:n};
    ctx.clearRect(0,0,canvas.width,canvas.height);
    var o={};
    o[0]=[255,255,255,255];
    o[1]=[195,195,195,255];
    o[2]=[255,244,108,255];
    o[3]=[106,208,222,255];
    o[4]=[255,244,108,255];
    o[5]=[255,249,186,255];
    var l=!0,u=!1,f=void 0;
    try{
      for(var c in zones){
        var y=zones[c];
        if(!(y.pos.x>r||y.pos.x+y.width<a||y.pos.y>s||y.pos.y+y.height<n)){
          var m=[y.backgroundColor>>24&255,y.backgroundColor>>16&255,y.backgroundColor>>8&255,255&y.backgroundColor];
          var p=mixColors(o[y.type],m);
          ctx.fillStyle="rgba(".concat(p[0],", ").concat(p[1],", ").concat(p[2],", ").concat(p[3]);
          var v=(y.pos.x-areaPos.x-areaCanvasOffset.x)*canvasScale;
          var g=(y.pos.y-areaPos.y-areaCanvasOffset.y)*canvasScale;
          ctx.fillRect(v,g,y.width*canvasScale,y.height*canvasScale)}
        }
      }catch(b){u=!0,f=b}
      finally{try{l||null==d.return||d.return()}finally{if(u)throw f}
    }
  }
}

function collisionEnemy(enemy,boundary,vel,pos,radius,inject = ""){
  let collision = false;
  if(enemy.no_collide) return
  if(enemy.area_collide && !boundary.wall)boundary=game.worlds[game.players[0].world].areas[game.players[0].area].getBoundary();
  if(enemy.dasher) enemy.angle = enemy.oldAngle;
  if(!boundary.wall){
    if (pos.x - radius < boundary.x) {
      vel.x = Math.abs(vel.x);
      enemy.velToAngle();
    }
    if (pos.x + radius > boundary.x + boundary.w) {
      vel.x = -Math.abs(vel.x);
      enemy.velToAngle();
    }
    if (pos.y - radius < boundary.y) {
      vel.y = Math.abs(vel.y);
      enemy.velToAngle();
    }
    if (pos.y + radius > boundary.y + boundary.h) {
      vel.y = -Math.abs(vel.y);
      enemy.velToAngle();
    }

    if(pos.x - radius < boundary.x ||
      pos.x + radius > boundary.x + boundary.w ||
      pos.y - radius < boundary.y ||
      pos.y + radius > boundary.y + boundary.h){
        collision = true;
    }
  } else {
    isSpawned(boundary,enemy);
      const circle = {x:enemy.pos.x,y:enemy.pos.y,r:radius,angle:enemy.angle,vel:vel}
      if(enemy.isEnemy||enemy.weak){
        const intersect = intersects(circle,boundary);
        if(intersect.collision&&enemy.weak){enemy.toRemove = true}
        else if (intersect.collision){
          collision = true;
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

  enemy.isSpawned = false;

  return {col:collision};
}

function interactionWithEnemy(player,enemy,offset,barrierInvulnerable, corrosive, immune, Harmless, killInSafeZone = false){
  let dead = true;
  let inDistance = false;
  if(Harmless === undefined){
    Harmless = (enemy.healing > 0) ? true : enemy.Harmless;
  }
  if (collides(player,enemy,offset) && (!player.safeZone||!killInSafeZone)) {
    inDistance = true;
    if(enemy.healing > 0)player.isDead = false;
    if((barrierInvulnerable&&player.inBarrier)||player.god)return {dead: false, inDistance: inDistance}

    if(player.night && !immune && !enemy.disabled){
      player.night=false;
      player.speedAdditioner=0;
      enemy.Harmless=true;
      enemy.HarmlessEffect = 2000; 
      Harmless = true;
    }
    if(enemy.texture=="pumpkinOff" || enemy.radius <= 0 || Harmless || enemy.shatterTime > 0){
      dead = false;
    }
    if(dead){
      if(player.className == "Cent" && !player.invicible){
        if(player.energy >= 20 && player.secondAbilityCooldown==0 && player.mortarTime<=0){
          player.onDeathSecondAb=true;
          player.invicible=true;
        }
      }
      if(player.bandage){
        player.bandage = false;
        player.invicible = true;
        player.invicible_time = 900;
      }
  }
    if((player.invicible&&!corrosive)||Harmless){
      dead = false;
    }
    if(dead && !player.isDead){
      death(player)
    }
  } else {
    dead = false;
  }
  return {dead: dead, inDistance: inDistance}
}

function mixColors(t,e){
  var i=t[3]/255;
  var a=e[3]/255;
  var n=[];
  var r=1-(1-a)*(1-i);
  return n[0]=Math.round(e[0]*a/r+t[0]*i*(1-a)/r),n[1]=Math.round(e[1]*a/r+t[1]*i*(1-a)/r),n[2]=Math.round(e[2]*a/r+t[2]*i*(1-a)/r),n[3]=r,n
}

function roundTo(t,e){
  return Math.round(t/e)*e
}

function createOffscreenCanvas (width,height){
  const canvas = document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  return canvas;
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

function math_module(variable,pushableVariable){
  if(variable.includes("+")){
    pushableVariable += parseFloat(variable.split("+")[1])
  } else if(variable.includes("-")) {
    pushableVariable -= parseFloat(variable.split("-")[1])
  } else if(variable.includes("*")) {
    pushableVariable *= parseFloat(variable.split("*")[1])
  } else if(variable.includes("/")) {
    pushableVariable /= parseFloat(variable.split("/")[1])
  } else if(variable.includes("^")) {
    pushableVariable **= parseFloat(variable.split("^")[1])
  }
  return pushableVariable
}

function process_variable(variable){
  let pushableVariable = 0;

  if(typeof parseFloat(variable) === "number" && !isNaN(parseFloat(variable))){
    pushableVariable = parseFloat(variable);
  } else if(variable.startsWith("random_between")){
    pushableVariable = parseFloat(random_between(variable.split("(")[1].split(")")[0].split("|")));
  } else if(variable.startsWith("random")){
    pushableVariable = random(parseInt(variable.split("(")[1]));
  } else if(variable.startsWith("min")){
    const min = parseInt(variable.split("min(")[1].split(")")[0]);
    const max = parseInt(variable.split("max(")[1].split(")")[0]);
    pushableVariable = min_max(min,max);
  }
  return pushableVariable
}

function find_variable(preset, variables, hashVariables, pattern_id, amount){
  const string = preset.split("var")[1];
  const id = parseInt(string);
  if(pattern_id !== undefined && hashVariables[pattern_id] && hashVariables[pattern_id][id]){
    const xVariable = hashVariables[pattern_id][id][amount[pattern_id]]

    return math_module(string,xVariable);
  }
  const flow = variables[id];
  return math_module(string,flow);
}

function loadImages(character){
  if(localStorage.tiles == "true"){
    tiles.src = "texture/tiles.jpg";
  } else {
    tiles.src = "texture/tiles2.jpg";
  }

  switch(character){
    case "Magmax":
    case "Basic":
      abilityOne.src = "texture/flow.png";
      abilityTwo.src = "texture/harden.png";
      break;
    case "Rime":
      abilityOne.src = "texture/warp.png";
      abilityTwo.src = "texture/paralysis.png";
      break;
    case "Morfe":
      abilityOne.src = "texture/reverse.png";
      abilityTwo.src = "texture/minimize.png";
      break;
    case "Necro":
      abilityOne.src = "texture/resurrection.png";
      abilityTwo.src = "texture/reanimate.png";
      break;
    case "Brute":
      abilityOne.src = "texture/stomp.png";
      abilityTwo.src = "texture/vigor.png";
      break;
    case "Chrono":
      abilityOne.src = "texture/backtrack.png";
      abilityTwo.src = "texture/rewind.png";
      break;
    case "Clown":
      abilityOne.src = "texture/heavy_ballon.png";
      abilityTwo.src = "texture/rejoicing.png";
      break;
    case "Aurora":
      abilityOne.src = "texture/distort.png";
      abilityTwo.src = "texture/energize.png";
      break;
    case "Candy":
      abilityOne.src = "texture/sugar_rush.png";
      abilityTwo.src = "texture/sweet_tooth.png";
      sweet_tooth_item.src = "texture/sweet_tooth_item.png";
      break;
    case "Jötunn":
      abilityOne.src = "texture/decay.png";
      abilityTwo.src = "texture/shatter.png";
      break;
    case "Shade":
      abilityOne.src = "texture/night.png";
      abilityTwo.src = "texture/vengeance.png";
      vengeance_projectile.src = "texture/vengeance_projectile.png";
      break;
    case "Cent":
      abilityOne.src = "texture/fusion.png";
      abilityTwo.src = "texture/mortar.png";
      break;
    case "Rameses":
      abilityOne.src = "texture/bandages.png";
      abilityTwo.src = "texture/latch.png";
      break;
    case "Reaper":
      abilityOne.src = "texture/atonement.png";
      abilityTwo.src = "texture/depart.png";
      break;
    case "Mirage":
      abilityOne.src = "texture/shift.png";
      abilityTwo.src = "texture/obscure.png";
  }

  if(document.getElementById("wreath").value.includes("Crown")){
    gem.src = "texture/1000-gem.png";
  }

  gate.src = "texture/gate.png";
  flashlight.src = "texture/flashlight.png";
  flashlight_item.src = "texture/flashlight_item.png";
  lantern.src = "texture/lantern.png";
  torchUp.src = "texture/torch_upside_down.png";
  torch.src = "texture/torch.png";
  pumpkinOff.src = "texture/pumpkin_off.png";
  pumpkinOn.src = "texture/pumpkin_on.png";
  magnetUp.src = "texture/magnetism_up.png";
  magnetDown.src = "texture/magnetism_down.png";
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
  var _this = this
  this.baseline = undefined
  
  this.run = function(){
    if(_this.baseline === undefined){
      _this.baseline = new Date().getTime();
    }
    fn();
    var end = new Date().getTime();
    _this.baseline += duration;
    var nextTick = duration - (end - _this.baseline);
    var progressToBeDone = end - _this.baseline; // make progress while afk
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

function updateBackground(context,width,height,color){
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.fillStyle = color;
  context.rect(0, 0, width, height);
  context.fill();
  context.closePath();
}

function drawAreaHeader(context,lineSize,strokeStyle,text,width,height,world,size = 35,fillStyle = "#f4faff"){
  context.beginPath();
  context.textAlign = "center";
  context.lineWidth = lineSize;
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.font = "bold " + size + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  if(world != null){
    context.strokeText(world.name + ": " + text, width / 2, height);
    context.fillText(world.name + ": " + text, width / 2, height);
  } else {
    context.strokeText(text, width / 2, height);
    context.fillText(text, width / 2, height);
  }
  context.closePath();
}

function drawShape(context, type, x, y, color, width, height) {
  context.beginPath();
  context.fillStyle = color;
  
  if (type === 'rect') {
    context.fillRect(x, y - height, width, height);
  } else if (type === 'triangle') {
    context.moveTo(x, y);
    context.lineTo(x + width, y);
    context.lineTo(x + width / 2, y - height + 2);
    context.fill();
  }
  
  context.closePath();
}

function applyScale(context,scale,drawFunction){
  if(scale != 1){
    context.save();
    context.scale(scale,height/staticHeight); //hmm...
  }
  drawFunction();
  if(scale != 1){
    context.restore();
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

function changeResolution(newWidth,newHeight){ //hmm...
  const scalingFactor = newWidth/staticWidth;
  width = newWidth;
  height = newHeight;
  fov = 32 * scalingFactor;
  settings.scale = scalingFactor;
  canvas.width = newWidth;
  canvas.height = newHeight;
  window.onresize();
  canv = null;
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