const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))

let canv;

function renderArea(area, players, focus, old) {
  var ligth = document.createElement('canvas');
  var context1 = ligth.getContext("2d");
  ligth.width = width,
  ligth.height = height;
  var world = game.worlds[players[0].world];
  if(old.area!=players[0].area||old.world!=players[0].world||!canv&&tiles.complete){
    canv = renderTiles(area, players, focus);
  }
  if(canv){
    context.drawImage(canv.can,(-focus.x)*fov+width/2+area.pos.x*fov,(-focus.y)*fov+height/2+area.pos.y*fov)//-focus.x*fov,-focus.y*fov)//(-focus.x+world.pos.x)*fov,(-focus.y+world.pos.y)*fov);
  }
  renderFirstEntities(area, players, focus)
  renderAssets(area, players, focus)
  context.globalAlpha = 1;
  renderPlayers(area, players, focus);
  renderSecondEntities(area, players, focus)
  for (var i in players) {
    var player = players[i];
    
    if(player.lantern_active && player.lantern){
      player.lightCount=200/32;
    } else {player.lightCount = 50/32;}

    var grad = context1.createRadialGradient(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 0, width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.lightCount * fov);
    grad.addColorStop(0, "rgba(0, 0, 0, 1)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    context1.beginPath();
    context1.fillStyle = grad;
    context1.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.lightCount * fov, 0, 2 * Math.PI, !1);
    context1.fill();
    context1.closePath();

    if(player.flashlight_active && player.flashlight){
      if(player.energy<=0){player.flashlight_active = false}
      var player = players[i];
      var grad = context1.createRadialGradient(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 0, width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (460 / 32) * fov);
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      context1.beginPath();
      context1.fillStyle = grad;
      var rotationSpeed = 15;
      var flashlight_angle = 15;
      var flashlight_distance = 500;
      if(!mouse&&player.moving){
        var angle = player.lastAng;
        if(player.dirX>0){angle = 0;}
        else if(player.dirX<0){angle = 180;}
        if(player.dirY>0){angle = 90;}
        else if(player.dirY<0){angle = 270;}
        if(player.dirX>0&&player.dirY>0){angle = 45}
        else if(player.dirX>0&&player.dirY<0){angle = 315}
        else if(player.dirX<0&&player.dirY>0){angle = 135}
        else if(player.dirX<0&&player.dirY<0){angle = 225}
        player.inputAng = angle;
      }
      else if(mouse){
        var angle = Math.atan2(mousePos.y-(height / 2 + (player.pos.y - focus.y) * fov), mousePos.x-(width / 2 + (player.pos.x - focus.x) * fov));
        angle = (angle * 180) / Math.PI;
        player.inputAng = angle;
      }
      if(player.inputAng<0){player.inputAng+=360}
      if(player.inputAng>=360){player.inputAng-=360}
      var distanceOne = player.inputAng - Math.abs(player.lastAng);
      if(player.lastAng<=player.inputAng+rotationSpeed&&player.lastAng>=player.inputAng-rotationSpeed){}
      else if(distanceOne<-180){player.lastAng+=rotationSpeed;}
      else if(distanceOne>180){player.lastAng-=rotationSpeed;}
      else if(distanceOne<0){player.lastAng-=rotationSpeed;}
      else if(distanceOne>0){player.lastAng+=rotationSpeed;}
      if(player.lastAng>=360)player.lastAng-=360;
      if(player.lastAng<0)player.lastAng+=360;
      if(player.lastAng<=player.inputAng+rotationSpeed&&player.lastAng>=player.inputAng-rotationSpeed){player.lastAng = player.inputAng}

      context1.moveTo(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov);
      context1.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (flashlight_distance / 32) * fov,(Math.PI/180)*(-flashlight_angle+player.lastAng), (Math.PI/180)*(flashlight_angle+player.lastAng));
      context1.fill();
      context1.closePath();
      }
  }
  for(let i in area.entities){
    for(let j in area.entities[i]){
      var ent = area.entities[i][j]
      if(ent.isLight && ent.lightCount>0){
        try{var grad1 = context1.createRadialGradient(width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, 0, width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, ent.lightCount/32 * fov);
        grad1.addColorStop(0, "rgba(0, 0, 0, 1)");
        grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
        context1.beginPath();
        context1.fillStyle = grad1;
        context1.arc(width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, ent.lightCount/32 * fov, 0, 2 * Math.PI, !1);
        context1.fill();
        context1.closePath();
        }catch(e){}
      }
    }
  }
  for (var i in area.assets) {
    var zone = area.assets[i];
    if(zone.type==6||zone.type==8||zone.type==4){
      try{
        let lightPower = 110;
        if(zone.type==4){
          lightPower = 250;
          zone.pos.x += zone.size.x/2
          zone.pos.y += zone.size.y/2
        }
        var grad1 = context1.createRadialGradient(width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, 0, width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, (lightPower / 32) * fov);
        grad1.addColorStop(0, "rgba(0, 0, 0, 1)");
        grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
        context1.beginPath();
        context1.fillStyle = grad1;
        context1.arc(width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, (lightPower / 32) * fov, 0, 2 * Math.PI, !1);
        context1.fill();
        context1.closePath();
        if(zone.type==4){
          zone.pos.x -= zone.size.x/2
          zone.pos.y -= zone.size.y/2
        }
        }catch(e){}
    }
  }
  context1.beginPath();
  context1.fillStyle = "rgba(0, 0, 0, " + area.lighting + ")"
  context1.fillRect(0, 0, width, height);
  context1.fill();
  context1.closePath();
  context.globalCompositeOperation = "destination-in"
  context.drawImage(ligth, 0, 0)
  context.globalCompositeOperation = "source-over"
  renderUI(area, players, focus)
  renderMinimap(area, players, focus)
  context.beginPath();
  context.font = "22px cursive";
  context.fillStyle = "gray";
  context.strokeStyle = "gray";
  context.textAlign = "start";
  context.lineWidth = 0.5;
  const diff = document.getElementById("diff").value;
  const devStat = "Comb Spd: "+ combineSpeed(player) + ", Amount: " + player.safeAmount;
  let offset = 0;
  if(diff == "Easy"){
    const deathCounter = (settings.dev) ? "Death Count: " + players[0].deathCounter + ", " + devStat : "Death Count: " + players[0].deathCounter; 
    context.fillText(deathCounter, 0, 20);
    context.strokeText(deathCounter, 0, 20);
  } else if (diff == "Medium"){
    const lives = (settings.dev) ? "Lives: " + players[0].lives + ", " + devStat : "Lives: " + players[0].lives;
    let liveColor;
    switch(players[0].lives){
      case 3: liveColor = "green"
      break;
      case 2: liveColor = "yellow"
      break;
      case 1: liveColor = "orange"
      break;
      case 0: liveColor = "red"
      break;
    }
    context.fillStyle = liveColor;
    context.strokeStyle = liveColor;//'black';  
    context.fillText(lives, 0, 20);
    context.strokeText(lives, 0, 20);
  } else if (settings.dev) {
    const text = devStat;
    context.fillText(text, 0, 20);
    context.strokeText(text, 0, 20);
  }
  if(settings.dev){
    context.fillStyle = "gray";
    context.strokeStyle = 'gray';
    const safePoint = (player.safePoint) ? "Safe Point: {X:" + Math.round(player.safePoint.pos.x*fov) + ", Y: " + Math.round(player.safePoint.pos.y*fov) + "} ([), to clear (])" : "None ([)"; 
    context.fillText(safePoint, 0, 45+offset);
    context.strokeText(safePoint, 0, 45+offset);
    const playerPos = "Player: {X:" + Math.round(player.pos.x*fov) + ", Y: " + Math.round(player.pos.y*fov) + ", Speed: "+greaterMax(player)+"}"; 
    context.fillText(playerPos, 0, 70+offset);
    context.strokeText(playerPos, 0, 70+offset);
    const timerClear = "Timer-clear: "+settings.timerClear+" (P), (O)";
    context.fillText(timerClear, 0, 95+offset);
    context.strokeText(timerClear, 0, 95+offset);
  }
  context.fill();
  context.stroke();
  context.closePath();
  let scalingWidth = width / 1280;
  let scalingHeight = height / 720;
  if (players[0].hasCheated) {
    context.beginPath();
    context.fillStyle = "purple"
    context.fillRect(370, height-12*scalingHeight, 12*scalingWidth, 12*scalingHeight);
    context.closePath();
  }
  if (settings.sandbox) {
    context.beginPath();
    context.fillStyle = "black"
    context.fillRect(370, height-24*scalingHeight, 12*scalingWidth, 12*scalingHeight);
    context.closePath();
  }
  context.beginPath();
  context.fillStyle = "black"
  //context.fillRect(370, height - ((width / 2 - 258 - 370) * 2), width / 2 - 258 - 370, width / 2 - 258 - 370);
  context.closePath();
}

function renderTiles(area, players, focus) {
  var boundary = area.boundary; let wid = boundary.w*fov, heig = boundary.h*fov, world = game.worlds[players[0].world];
  var tile_image = tiles;
  const can = createOffscreenCanvas(wid,heig)
  const ctx = can.getContext('2d');
  ctx.translate(-Math.round(width / 2 + ((area.pos.x)) * fov),-Math.round(height / 2 + ((area.pos.y)) * fov))
  for (var i in area.zones) {
    var zone = area.zones[i];
    var areaXMinus = 0;
    var areaYMinus = 0;
    zone.size.x = Math.round(zone.size.x)
    zone.size.y = Math.round(zone.size.y)
    if(area.pos.x!=Math.round(area.pos.x))areaXMinus = Math.round(area.pos.x) - area.pos.x
    if(area.pos.y!=Math.round(area.pos.y))areaYMinus = Math.round(area.pos.y) - area.pos.y
    for (var j = 0; j < zone.size.x; j++) {
      for (var k = 0; k < zone.size.y; k++) {
        ctx.beginPath();
        var posX = ((area.pos.x + zone.pos.x + j) % 4);
        var posY = ((area.pos.y + zone.pos.y + k) % 4);
        if (posX < 0) {
          posX = 4 - Math.abs(posX);
        }
        if (posY < 0) {
          posY = 4 - Math.abs(posY);
        }
        var sizeX = zone.size.x;
        posX-=areaXMinus;
        posY-=areaYMinus;
        //console.log(Math.round(width / 2 + ((area.pos.x + zone.pos.x + j)) * fov))
        //console.log(Math.round(height / 2 + ((area.pos.y + zone.pos.y + k)) * fov))
        //console.log(width,height)
        var textureType = zone.type
        if(zone.type == 4){textureType = 2;}
        else if(zone.type == 5){textureType = 4;}
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(tile_image, Math.abs(posX) * 32 + textureType * 128, Math.abs(posY) * 32 + area.texture * 128, 32, 32, Math.round(width / 2 + ((area.pos.x + zone.pos.x + j)) * fov), Math.round(height / 2 + ((area.pos.y + zone.pos.y + k)) * fov), fov, fov);
          ctx.closePath();
          ctx.beginPath();
          ctx.fillStyle = (zone.background_color) ? zone.background_color : area.background_color;
          ctx.fillRect(Math.round(width / 2 + ((area.pos.x + zone.pos.x + j)) * fov), Math.round(height / 2 + ((area.pos.y + zone.pos.y + k)) * fov), fov, fov);
          ctx.fill();
          ctx.closePath();
      }
    }
  }
  return {can:can,ctx:ctx};
}

function renderFirstEntities(area, players, focus) {
  var entities = area.entities
  for (var i in entities) {
    context.globalAlpha = 1;
    for (var j in entities[i]) {
      if (entities[i][j].renderFirst) {
        if (i=="shield") {
          context.save()
          context.translate((width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov), (height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov))
          context.rotate(entities[i][j].rot)
          context.beginPath();
          context.fillStyle = "black";
          context.fillRect(-entities[i][j].size.x*fov,-entities[i][j].size.y*fov, entities[i][j].size.x*fov*2, entities[i][j].size.y*fov*2);
          context.fill();
          context.closePath();
          context.restore();
        }else {
          context.beginPath();
          context.fillStyle = entities[i][j].color;
          if ((entities[i][j].Harmless || entities[i][j].healing>0)&&!entities[i][j].texture) {
            context.globalAlpha = 0.4;
            if(entities[i][j].healing>0){
              context.fillStyle="rgb(0, 221, 0)";
            }
          }
          if(entities[i][j].radius * fov>0){
          if(!entities[i][j].texture)context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].radius * fov, 0, Math.PI * 2, true);
          else{
            var Texture;
            switch(entities[i][j].texture){
              case "pumpkinOn": Texture = pumpkinOn;
              break;
              case "pumpkinOff": Texture = pumpkinOff;
              break;
              case "sweet_tooth_item": Texture = sweet_tooth_item;
            }
            if(Texture){
              context.imageSmoothingEnabled = true;
              context.drawImage(Texture,width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x-entities[i][j].radius) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y-entities[i][j].radius) * fov,entities[i][j].radius * fov*2,entities[i][j].radius * fov*2)
              Texture = 0;
              context.imageSmoothingEnabled = false;
            }
          }
        }
          context.fill();
          context.closePath();
        }
      }
    }
  }
}
function renderPlayers(area, players, focus) {
  for (var i in players) {
    var player = players[i];
    if (player.bandage) {
      context.beginPath();
      context.fillStyle = "#dedabe";
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov + 3, 0, Math.PI * 2, true);
      context.fill();
      context.closePath();
    }
    if(player.aura){
      if(player.auraType == 0){
        context.beginPath();
        context.fillStyle = "rgba(255, 128, 189, 0.25)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, ((100+Math.abs(greaterMax(player))*5) / 32) * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 1){
        context.beginPath();
        context.fillStyle = "rgba(77, 233, 242, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 210/32 * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 2){
        context.beginPath();
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 230/32 * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 3){
        context.beginPath();
        context.fillStyle = "rgba(153, 62, 6, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 190/32 * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 4){
        context.beginPath();
        context.fillStyle = "rgba(76, 240, 161, 0.25)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 190/32 * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      }
    }

    if(player.clownBall){
      const colors = ["rgb(2, 135, 4, .8)","rgb(228, 122, 42, .8)","rgb(255, 219, 118, .8)","rgb(4, 70, 255, .8)", "rgb(216, 48, 162, .8)"]
      context.beginPath();
      context.fillStyle = colors[player.prevColor]
      context.strokeStyle = "black"
      context.lineWidth = 2/(32/fov);
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.clownBallSize/32 * fov, 0, Math.PI * 2, true);
      context.fill();
      if(settings.outline)context.stroke();
      context.closePath();
    }
    let rgb;
    if(player.wallGod){
      context.fillStyle = "rgba(139,0,0,.5)"
    } else if (player.god&&!player.reaperShade) {
      context.fillStyle = "purple";
    } else {
      context.fillStyle = player.tempColor;
      rgb = hexToRgb(player.tempColor);
      if(player.night){context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`}
      if(player.mortarTime>0&&player.mortarTime<1000){context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},${1-player.mortarTime/1000})`}
      if(player.fusion){context.fillStyle="rgba(60, 60, 75)"}
    }
    if(player.isDead && !player.god)context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`;
    context.beginPath();
    if (player.type==7) {
      if (player.shape>0) {
        context.moveTo(width / 2 + (player.pos.x - focus.x + player.radius * Math.cos(-Math.PI/2)) * fov, height / 2 + (player.pos.y - focus.y + player.radius * Math.sin(-Math.PI/2)) * fov);
        var numberOfSides=4;
        if (player.shape==1) {
          numberOfSides=4;
        }
        if (player.shape==2) {
          numberOfSides=3;
        }
        if (player.shape==3) {
          numberOfSides=5;
        }
        for (var i = 1; i <= numberOfSides; i += 1) {
          context.lineTo(width / 2 + (player.pos.x - focus.x + player.radius * Math.cos(i * 2 * Math.PI / numberOfSides-Math.PI/2)) * fov,  height / 2 + (player.pos.y - focus.y + player.radius * Math.sin(i * 2 * Math.PI / numberOfSides-Math.PI/2)) * fov);
        }
      }else {
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);
      }
    } else {
      if(!player.reaperShade)if(player.mortarTime<1000)context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);
    }
    context.fill();
    context.closePath();
    if(player.poison){var poisoness = (player.poisonTimeLeft-player.poisonTime)/player.poisonTimeLeft; context.beginPath();context.fillStyle = "rgb(140, 1, 183,"+poisoness+")";context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (player.radius+0.5/32) * fov, 0, Math.PI * 2, true);context.fill();context.closePath();}
    if(player.frozen){var iceness = (player.frozenTimeLeft-player.frozenTime)/player.frozenTimeLeft; context.beginPath();context.fillStyle = "rgb(137, 231, 255,"+iceness+")";context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (player.radius+0.5/32) * fov, 0, Math.PI * 2, true);context.fill();context.closePath();}
    if(player.burningTimer>0){context.beginPath();context.fillStyle = "rgb(0, 0, 0,"+player.burningTimer/1000+")";context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);context.fill();context.closePath();}
    context.beginPath();
    if(document.getElementById("wreath").value!="None")if(!player.reaperShade)context.drawImage(hat, width / 2 + (player.pos.x - focus.x) * fov - (25*((player.radius*32)/15)) / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - (25*((player.radius*32)/15)) / 32 * fov, 50 / 32 * fov * ((player.radius*32)/15), 50 / 32 * fov * ((player.radius*32)/15));
    context.closePath();
    context.beginPath();
    if(document.getElementById("wreath").value.endsWith("Crown"))if(!player.reaperShade)context.drawImage(gem, width / 2 + (player.pos.x - focus.x) * fov - (25*((player.radius*32)/15)) / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - (25*((player.radius*32)/15)) / 32 * fov, 50 / 32 * fov * ((player.radius*32)/15), 50 / 32 * fov * ((player.radius*32)/15));
    context.closePath();
    context.beginPath();
    context.fillStyle = "blue";
    if(player.sweetToothConsumed){context.fillStyle = "rgb(255, 43, 143)";}
    if(!player.reaperShade)context.fillRect(width / 2 + (player.pos.x - focus.x) * fov - 18 / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - player.radius * fov - 8 / 32 * fov, 36 / 32 * fov * player.energy / player.maxEnergy, 7 / 32 * fov);
    context.fill();
    context.closePath();
    context.beginPath();
    context.strokeStyle = "rgb(68, 118, 255)";
    context.lineWidth = 1;
    if(player.sweetToothConsumed){context.strokeStyle = "rgb(212, 0, 100)";}
    if(!player.reaperShade)context.strokeRect(width / 2 + (player.pos.x - focus.x) * fov - 18 / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - player.radius * fov - 8 / 32 * fov, 36 / 32 * fov, 7 / 32 * fov);
    context.closePath();
    context.beginPath();
    context.fillStyle = "black";
    context.font = 12 / 32 * fov + "px Tahoma, Verdana, Segoe, sans-serif";
    context.textAlign = "center";
    if(!player.reaperShade)context.fillText(player.name, width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov - player.radius * fov - 11 / 32 * fov);
    context.closePath();
    if(player.isDead){
      context.textAlign="center";
      context.fillStyle="red";
      context.font = 16 / 32 * fov + "px Tahoma, Verdana, Segoe, sans-serif";
      context.fillText((Math.abs(Math.floor(player.deathTimer)/1e3)).toFixed(0),width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov + 6)
    }
  }
}

function renderSecondEntities(area, players, focus) {
  var entities = area.entities
  for (var i in entities) {
    for (var j in entities[i]) {
      if (entities[i][j].aura) {
        context.beginPath();
        context.fillStyle = entities[i][j].auraColor;
        context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].auraSize * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      }
    }
  }
  for (var i in entities) {
    for (var j in entities[i]) {
      context.globalAlpha = 1;
      if (!entities[i][j].renderFirst) {
        if (entities[i][j].shatterTime > 0) {
          context.globalAlpha = 0.4;
          var midX = width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov;
          var midY = height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov;
          var l = entities[i][j].radius / 4;
          var s = entities[i][j].radius;
          var u = 4e3 - entities[i][j].shatterTime;
          var f = (u - 500) / 500;
          var h = (u - 1e3) / 3e3;
          if (u < 250) {
            console.log("1");
            context.beginPath();
            context.fillStyle = entities[i][j].color;
            context.arc(midX, midY, Math.max(l, Math.max(l, entities[i][j].radius * (1 - u / 250))) * fov, 0, 2 * Math.PI, !1);
            context.fill();
            context.closePath()
          } else if (u < 500) {
            console.log("2");
            context.beginPath();
            context.fillStyle = entities[i][j].color;
            context.arc(midX, midY, l * fov, 0, 2 * Math.PI, !1);
            context.fill();
            context.closePath()
          } else if (u < 1e3) {
            console.log("3");
            let n = 5 * f;
            for (var o = 0; o < 8; o++) {
              context.beginPath();
              context.fillStyle = entities[i][j].color;
              context.arc(midX + (Math.cos(n) * f * s) * fov, midY + (Math.sin(n) * f * s) * fov, entities[i][j].radius / 3 * fov, 0, 2 * Math.PI, !1);
              n += 2 * Math.PI / 3;
              context.fill();
              context.closePath();
            }
          } else {
            console.log("4");
            let n = 5 - 3 * h;
            for (var o = 0; o < 8; o++) {
              context.beginPath();
              context.fillStyle = entities[i][j].color;
              context.arc(midX + Math.cos(n) * (s - h * s) * fov, midY + Math.sin(n) * (s - h * s) * fov, Math.min(entities[i][j].radius, Math.max(l, entities[i][j].radius * h)) * fov, 0, 2 * Math.PI, !1);
              n += 2 * Math.PI / 3;
              context.fill();
              context.closePath();
            }
          } context.globalAlpha = 1;
        } else {
          context.globalAlpha = 1;
          context.beginPath();
          context.fillStyle = entities[i][j].color;
          if ((entities[i][j].Harmless || entities[i][j].healing>0)&&!entities[i][j].texture) {
            context.globalAlpha = 0.4;
          }
          if (entities[i][j].alpha){
            if(!entities[i][j].Harmless){context.globalAlpha = entities[i][j].alpha;}
          }
          if (entities[i][j].color_change){
            const rgbColor = hexToRgb(entities[i][j].color);
            rgbColor[0] = parseInt(rgbColor[0])+entities[i][j].color_change;
            rgbColor[1] = parseInt(rgbColor[1])-1.45*entities[i][j].color_change;
            rgbColor[2] = parseInt(rgbColor[2])-1.3*entities[i][j].color_change;
            context.fillStyle = `rgb(${rgbColor[0]},${rgbColor[1]},${rgbColor[2]})`;
          }
          if(entities[i][j].healing>0){
            context.fillStyle="rgb(0, 221, 0)";
          }
          context.lineWidth = 2
          context.strokeStyle = "black"
          if(entities[i][j].radius * fov>0){
            if(!entities[i][j].texture){context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].radius * fov, 0, Math.PI * 2, true);}
            else{
              var Texture;
              switch(entities[i][j].texture){
                case "pumpkinOn": Texture = pumpkinOn;
                break;
                case "pumpkinOff": Texture = pumpkinOff;
                break;
              }
              if(Texture){
                context.imageSmoothingEnabled = true;
                context.drawImage(Texture,width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x-entities[i][j].radius) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y-entities[i][j].radius) * fov,entities[i][j].radius * fov*2,entities[i][j].radius * fov*2)
                Texture = 0;
                context.imageSmoothingEnabled = false;
              }
            }
            context.fill();
            if (entities[i][j].decayed) {
              context.fillStyle = "rgba(0, 0, 128, 0.2)"
              context.fill();
            }
            if(entities[i][j].defended){
              context.fillStyle = "rgba(0, 0, 0, 0.6)"
              context.fill();
            }
            if (entities[i][j].repelled) {
              context.fillStyle = "rgba(255, 230, 200, 0.5)"
              context.fill();
            }
            if (entities[i][j].outline && settings.outline) {
              context.lineWidth = 2/(32/fov);
              context.stroke()
            }
            context.globalAlpha = 1;
            context.closePath();
          }
        }
      }
    }
  }
}

function renderMinimap(area, players, focus) {
  /*this.minimapWidth=this.maxWidth,this.minimapHeight=this.maxHeight;
  var e={};
  e.centerX=this.self.entity.x;
  e.centerY=this.self.entity.y;
  e.width=this.minimapWidth/.1;
  e.height=this.minimapHeight/.1;
  e.left=this.self.entity.x-e.width/2;
  e.top=this.self.entity.y-e.height/2;
  this.renderBackground(t,e);
  for(var i=0;i<this.entities.length;i++){
    var a=this.entities[i];
    n=.1*(a.x-e.centerX)+this.left+this.minimapWidth/2;
    r=.1*(a.y-e.centerY)+this.top+this.minimapHeight/2;
    if(a.wall){
      var h=.1*a.width;
      s=.1*a.height;
      renderWall(t,a,n,r,h,s)}
    else{
      var o=.1*a.radius;
      renderEntity(t,a,n,r,o);
    }}*/
  //drawNearbyMinimap(focus,context,canvas,area.zones,area.pos)
  var minimapSize = new Vector(370, 100)
  var bound = area.boundary;
  var xCoef = minimapSize.x / bound.w;
  var yCoef = minimapSize.y / bound.h;
  var coef = xCoef;
  if (yCoef < xCoef) {
    coef = yCoef;
  }
  var yOff = minimapSize.y - bound.h * coef
  for (var i in area.zones) {
    context.beginPath();
    if (area.zones[i].type == 0) {
      context.fillStyle = "rgb(255, 255, 255)"
    }
    if (area.zones[i].type == 1) {
      context.fillStyle = "rgb(195, 195, 195)"
    }
    if (area.zones[i].type == 2) {
      context.fillStyle = "rgb(255, 244, 108)"
    }
    if (area.zones[i].type == 3) {
      context.fillStyle = "rgb(106, 208, 222)"
    }
    context.fillRect((area.zones[i].pos.x - bound.x) * coef, height - minimapSize.y + (area.zones[i].pos.y - bound.y) * coef + yOff, area.zones[i].size.x * coef, area.zones[i].size.y * coef);
    context.closePath();
  }
  for (var i in players) {
    var newPos = new Vector((players[i].pos.x - area.pos.x - bound.x) * coef, (players[i].pos.y - area.pos.y - bound.y) * coef)
    context.beginPath();
    context.fillStyle = players[i].color;
    context.arc(newPos.x, height - minimapSize.y + newPos.y + yOff, 4, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();
  }
}

function renderUI(area, players, focus) {
  const c = hexToRgb(game.players[0].color);
  context.imageSmoothingEnabled = true;
  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = "rgba(0, 0, 0, 0.8)"
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(width / 2 - 516 / 2, height - 85, 516, 85);}
  else{context.fillRect(width / 2 - 516 / 2, height - 85, 516+82, 85);}
  context.fill();
  context.closePath();

  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = `rgb(${c[0]},${c[1]},${c[2]},0.4)`
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(width / 2 - 516 / 2, height - 100, 516, 15);}
  else{context.fillRect(width / 2 - 516 / 2, height - 100, 516+82, 15);}
  context.fill();
  context.closePath();
  
  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = game.players[0].color
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(width / 2 - 516 / 2, height - 100, (game.players[0].currentExperience / game.players[0].maxExperience) * 516, 15);}
  else{context.fillRect(width / 2 - 516 / 2, height - 100, (game.players[0].currentExperience / game.players[0].maxExperience) * 598, 15);}
  context.fill();
  context.closePath();

  if(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern){
    context.beginPath();
    if(game.players[0].magnet){if(game.players[0].magnetDirection == "Down")context.drawImage(magnetDown,width/2+(516-132+82+82)/2,height-68,48,48)
    else if(game.players[0].magnetDirection == "Up")context.drawImage(magnetUp,width/2+(516-132+82+82)/2,height-68,48,48)}
    else if(game.players[0].flashlight){context.drawImage(flashlight,width/2+(516-132+82+82)/2,height-68,48,48)}
    else if(game.players[0].lantern){context.drawImage(lantern,width/2+(516-132+82+82)/2,height-68,48,48)}
    context.closePath();

    context.beginPath();
    context.fillStyle = "yellow";
    context.arc(width/2+(516-84+82+82)/2,height-77, 3.6, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();

    context.beginPath();
    context.fillStyle = "white";
    context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
    context.textAlign = "center";
    context.fillText("[C] or [L]", width/2+(516-84+82+82)/2,height-8)
    context.closePath();
  } 

  if(game.players[0].hasAB){
    var text1 = "[Z] or [J]";
    var text2 = "[X] or [K]";
    var text3 = "Locked";
    if(players[0].usesPellets == 1 || players[0].usesPellets == 3){
      players[0].firstAbilityCooldown = players[0].firstPellet;
      players[0].firstTotalCooldown = players[0].firstPelletTotal;
    }
    if(players[0].usesPellets == 2 || players[0].usesPellets == 3){
      players[0].secondAbilityCooldown = players[0].secondPellet;
      players[0].secondTotalCooldown = players[0].secondPelletTotal;
    }
    for(var a = 0; a<2; a++){
      var text = (a==1) ? text1 : text2;
      var ab = (a==1) ? players[0].ab1 : players[0].ab2;
      var abL = (a==1) ? players[0].ab1L : players[0].ab2L;
      var abC = (a==1) ? players[0].firstAbilityCooldown : players[0].secondAbilityCooldown;
      var abTC = (a==1) ? players[0].firstTotalCooldown : players[0].secondTotalCooldown;
      var ab1ML = (a==1) ? players[0].ab1ML||false : players[0].ab2ML||false;
      if(!abL){text = text3;}
      var correct = (a==1) ? 0 : 82;
      var cooldownTime = abC/abTC;
      context.fillStyle = "white";
      context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
      context.textAlign = "center";
      context.beginPath();
      context.drawImage(ab, width / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24, height - 85 - 3 + 17 + 44 - 17 - 24,48,48)
      context.fillText(text, width / 2 - 516 / 2 + 105 + 41 + 246 + correct, height - 85 + 17/2 + 44 - 17 + 24 + 17)
      context.closePath();
      if(!abL||cooldownTime==1){context.fillStyle="rgba(0, 0, 0, 0.6)"}
      else{context.fillStyle="rgba(0, 0, 0, 0.2)"};
      context.fillRect(width / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24, height - 85 - 3 + 17 + 44 - 17 - 24,48,48)
      context.lineWidth = 1;
      for(var p = 0; p<5; p++){
        (!abL||cooldownTime==1)?context.strokeStyle="rgb(150, 150, 150)":context.strokeStyle="rgb(200, 200, 200)"
        context.beginPath();
        var h = width / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24 + 5; var f = h + 40; var y = height - 85 - 3 + 17 + 44 - 17 - 24 + 45 - 48 - 6;
        var b = (ab1ML)? (h+(f-h)*(2/(5-1))):h+(f-h)*(p/(5-1))
        context.arc(b,y,3,0,Math.PI * 2, true)
        context.stroke();
        context.closePath();
      }
      context.fillStyle = "rgb(255, 255, 0)";
      context.strokeStyle = "rgb(255, 255, 0)";
      for(var p = 0; p<abL; p++){
        context.beginPath();
        var h = width / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24 + 5; var f = h + 40; var y = height - 85 - 3 + 17 + 44 - 17 - 24 + 45 - 48 - 6;
        var b = (ab1ML)? (h+(f-h)*(2/(5-1))):h+(f-h)*(p/(5-1))
        context.arc(b,y,3,0,Math.PI * 2, true)
        if(abL)context.fill();
        if(abL)context.stroke();
        context.closePath();
      }
      context.fillStyle="rgba(0, 0, 0, 0.6)";
      sectorInRect(context,width / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24,height - 85 - 3 + 17 + 44 - 17 - 24,48,48,360*(1-cooldownTime)-90)
    }
  }

  context.beginPath();
  context.font = 18 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillStyle = game.players[0].color;
  context.fillText(game.players[0].className, width / 2 - 516 / 2 + 55, height - 85 + 20)
  context.closePath();

  context.beginPath();
  context.fillStyle = game.players[0].color;
  context.arc(width / 2 - 516 / 2 + 55, height - 85 + 55, 23, 0, Math.PI * 2, true);
  context.fill();
  context.closePath();

  context.beginPath();
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillStyle = "white"
  context.fillText(game.players[0].level, width / 2 - 516 / 2 + 55, height - 85 + 63)
  context.closePath();

  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(128, 128, 128,0.75)"
  context.moveTo(width / 2 - 516 / 2 + 105, height - 85);
  context.lineTo(width / 2 - 516 / 2 + 105, height);
  context.stroke();
  context.closePath();

  context.beginPath();
  context.font = 13 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillStyle = "white"
  context.fillText("Points:", width / 2 - 516 / 2 + 136, height - 85 + 16)
  context.closePath();

  context.beginPath();
  context.fillStyle = "yellow";
  context.arc(width / 2 - 516 / 2 + 169, height - 85 + 12, 8, 0, Math.PI * 2, true);
  context.fill();
  context.closePath();

  context.beginPath();
  context.fillStyle = "black";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText(players[0].points, width / 2 - 516 / 2 + 169, height - 85 + 16)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Speed", width / 2 - 516 / 2 + 105 + 41, height - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText(parseFloat(players[0].speed.toFixed(1)), width / 2 - 516 / 2 + 105 + 41, height - 85 + 17 + 44 - 17)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Energy", width / 2 - 516 / 2 + 105 + 41 + 82, height - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText((Math.round(players[0].energy)) + " / " + players[0].maxEnergy, width / 2 - 516 / 2 + 105 + 41 + 82, height - 85 + 17 + 44 - 17)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Regen", width / 2 - 516 / 2 + 105 + 41 + 164, height - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText((Math.round(players[0].regen * 10) / 10), width / 2 - 516 / 2 + 105 + 41 + 164, height - 85 + 17 + 44 - 17)
  context.closePath();
}

function renderAssets(area, players, focus) {
  context.globalAlpha = 1;
  var tile_image = tiles
  var player = players[0];
  for (var i in area.assets) {
    var zone = area.assets[i];
    for (var j = 0; j < zone.size.x; j++) {
      for (var k = 0; k < zone.size.y; k++) {
        var tileSize = 4;
        if (zone.texture == 4) {
          tileSize = 16
        }
        context.beginPath();
        var posX = ((area.pos.x + zone.pos.x + j) % tileSize);
        var posY = ((area.pos.y + zone.pos.y + k) % tileSize);
        if (posX < 0) {
          posX = tileSize - Math.abs(posX);
        }
        if (posY < 0) {
          posY = tileSize - Math.abs(posY);
        }
        context.imageSmoothingEnabled = true;
        context.drawImage(tile_image, Math.abs(posX) * 32, Math.abs(posY) * 32 + zone.texture * 128, 32, 32, width / 2 + ((area.pos.x + zone.pos.x + j) - focus.x) * fov, height / 2 + ((area.pos.y + zone.pos.y + k) - focus.y) * fov, fov, fov);
        context.closePath();
      }
    }
    if(zone.type==6){
      var posX = area.pos.x + zone.pos.x;
      var posY = area.pos.y + zone.pos.y;
      context.drawImage(torch, width/2+(posX-focus.x)*fov,height/2+(posY-focus.y)*fov)
    } else if(zone.type==7){
      var posX = area.pos.x + zone.pos.x;
      var posY = area.pos.y + zone.pos.y;
      context.drawImage(gate, width/2+(posX-focus.x)*fov,height/2+(posY-focus.y)*fov)
    } else if(zone.type==8){
      var posX = area.pos.x + zone.pos.x;
      var posY = area.pos.y + zone.pos.y;
      context.drawImage(torchUp, width/2+(posX-focus.x)*fov,height/2+(posY-focus.y)*fov)
    }
    else if(zone.type==5){
      var posX = area.pos.x + zone.pos.x;
      var posY = area.pos.y + zone.pos.y;
      context.drawImage(flashlight_item, width/2+(posX-focus.x)*fov,height/2+(posY-focus.y)*fov)
      if(posX-focus.x<2&&posX-focus.x>-2&&posY-focus.y<2&&posY-focus.y>-2){player.flashlight = true;}
    }
  }
}
