let canv;
function renderArea(area, players, focus, areaUpdated) {
  var player = players[0];
  var light = document.createElement('canvas');
  var lightCtx = light.getContext("2d");
  light.width = width,
  light.height = height;
  if( (areaUpdated || !canv) && tiles.complete){
    canv = renderTiles(area, players, focus);
  }
  if(canv)context.drawImage(canv.can,(-focus.x)*fov+width/2+area.pos.x*fov,(-focus.y)*fov+height/2+area.pos.y*fov)
  renderFirstEntities(area, players, focus)
  renderAssets(area, players, focus)
  renderPlayers(area, players, focus);
  renderSecondEntities(area, players, focus)

  if(area.lighting != 1){
    for (var i in players) {
      var player = players[i];
      
      if(player.lantern_active && player.lantern){
        player.lightCount=250/32;
      } else {player.lightCount = 50/32;}

      var grad = lightCtx.createRadialGradient(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 0, width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.lightCount * fov);
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      lightCtx.beginPath();
      lightCtx.fillStyle = grad;
      lightCtx.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.lightCount * fov, 0, 2 * Math.PI, !1);
      lightCtx.fill();
      lightCtx.closePath();

      if(player.flashlight_active && player.flashlight){
        if(player.energy<=0){player.flashlight_active = false}
        var grad = lightCtx.createRadialGradient(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, 0, width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (460 / 32) * fov);
        grad.addColorStop(0, "rgba(0, 0, 0, 1)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        lightCtx.beginPath();
        lightCtx.fillStyle = grad;
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

        lightCtx.moveTo(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov);
        lightCtx.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (flashlight_distance / 32) * fov,(Math.PI/180)*(-flashlight_angle+player.lastAng), (Math.PI/180)*(flashlight_angle+player.lastAng));
        lightCtx.fill();
        lightCtx.closePath();
        }
    }
    for(let i in area.entities){
      for(let j in area.entities[i]){
        var ent = area.entities[i][j]
        if(ent.isLight && ent.lightCount>0){
          var grad1 = lightCtx.createRadialGradient(width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, 0, width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, ent.lightCount/32 * fov);
          grad1.addColorStop(0, "rgba(0, 0, 0, 1)");
          grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
          lightCtx.beginPath();
          lightCtx.fillStyle = grad1;
          lightCtx.arc(width / 2 + (area.pos.x + ent.pos.x - focus.x) * fov, height / 2 + (area.pos.y + ent.pos.y - focus.y) * fov, ent.lightCount/32 * fov, 0, 2 * Math.PI, !1);
          lightCtx.fill();
          lightCtx.closePath();
        }
      }
    }
    for (var i in area.assets) {
      var zone = area.assets[i];
      if(zone.type==6||zone.type==8||zone.type==4){
        let lightPower = 110;
        if(zone.type==4){
          lightPower = 250;
          zone.pos.x += zone.size.x/2;
          zone.pos.y += zone.size.y/2;
        }
        if(area.lighting == 1) continue;
        var grad1 = lightCtx.createRadialGradient(width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, 0, width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, (lightPower / 32) * fov);
        grad1.addColorStop(0, "rgba(0, 0, 0, 1)");
        grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
        lightCtx.beginPath();
        lightCtx.fillStyle = grad1;
        lightCtx.arc(width / 2 + (area.pos.x + zone.pos.x - focus.x) * fov, height / 2 + (area.pos.y + zone.pos.y - focus.y) * fov, (lightPower / 32) * fov, 0, 2 * Math.PI, !1);
        lightCtx.fill();
        lightCtx.closePath();
        if(zone.type==4){
          zone.pos.x -= zone.size.x/2
          zone.pos.y -= zone.size.y/2
        }
      }
    }
    lightCtx.beginPath();
    lightCtx.fillStyle = "rgba(0, 0, 0, " + area.lighting + ")"
    lightCtx.fillRect(0, 0, width, height);
    lightCtx.fill();
    lightCtx.closePath();
    context.globalCompositeOperation = "destination-in"
    context.drawImage(light, 0, 0)
    context.globalCompositeOperation = "source-over"
  } 
  applyScale(context,settings.scale,()=>{
    renderUI(area, players, focus);
    renderMinimap(area, players, focus);
    if (players[0].overlay){
      context.beginPath();
      context.font = "22px cursive";
      context.fillStyle = "gray";
      context.strokeStyle = "gray";
      context.textAlign = "start";
      context.lineWidth = 0.5;
      const avgPing = (ping.array.length > 5) ? Math.round(ping.array.reduce((e,t)=>e+t)/ping.array.length) : settings.tick_delay*33 + settings.input_delay;
      const diff = document.getElementById("diff").value;
      const devStat = "Delay: " + avgPing + ", Comb Spd: "+ combineSpeed(player);
      let offset = 0;
      if(diff == "Easy"){
        const deathCounter = (settings.dev) ? "Deaths: " + players[0].deathCounter + ", " + devStat : "Deaths: " + players[0].deathCounter; 
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
        context.strokeStyle = liveColor; 
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
        const timerClear = "Timer-clear: "+settings.timer_clear+" (P), (O)";
        context.fillText(timerClear, 0, 95+offset);
        context.strokeText(timerClear, 0, 95+offset);
      }
      context.fill();
      context.stroke();
      context.closePath();
    }
  });
}

function renderTiles(area, players, focus) {
  var boundary = area.boundary; let wid = boundary.w*fov, heig = boundary.h*fov, world = game.worlds[players[0].world];
  var tile_image = tiles;
  const can = createOffscreenCanvas(wid,heig)
  const ctx = can.getContext('2d');
  const zoneCanvas = createOffscreenCanvas(128,128);
  const zoneCTX = zoneCanvas.getContext('2d');
	ctx.scale(fov/32,fov/32);
  for (var i in area.zones) {
    var zone = area.zones[i];
    var textureType = (zone.type == 6) ? 0 : zone.type;
    if(zone.type == 4){textureType = 2;}
    else if(zone.type == 5){textureType = 4;}
		zoneCTX.drawImage(tile_image,textureType*128,area.texture*128,128,128,0,0,128,128);
    ctx.imageSmoothingEnabled = true;
		var pattern=ctx.createPattern(zoneCanvas,"repeat");
    ctx.fillStyle=pattern;
    ctx.beginPath();
    ctx.fillRect(Math.round((zone.pos.x)*32),Math.round((zone.pos.y)*32),zone.size.x*32,zone.size.y*32);
    ctx.closePath();
    ctx.fillStyle = (zone.background_color) ? zone.background_color : area.background_color;
    ctx.beginPath();
    ctx.fillRect(Math.round((zone.pos.x)*32),Math.round((zone.pos.y)*32),zone.size.x*32,zone.size.y*32);
    ctx.closePath();
  }
  return {can:can,ctx:ctx};
}

function renderFirstEntities(area, players, focus) {
  var entities = area.entities //entities[i] = entities[i].sort((a,b)=>a.radius-b.radius);
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
          if(!entities[i][j].texture){
            context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].radius * fov, 0, Math.PI * 2, true);
            context.fill();
            context.closePath();
          }
          else{
            var Texture;
            switch(entities[i][j].texture){
              case "pumpkinOn": Texture = pumpkinOn;
              break;
              case "pumpkinOff": Texture = pumpkinOff;
              break;
              case "sweet_tooth_item": Texture = sweet_tooth_item;
              break;
              case "vengeance_projectile": Texture = vengeance_projectile;
            }
            if(Texture){
              context.imageSmoothingEnabled = true;
              context.drawImage(Texture,width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x-entities[i][j].radius) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y-entities[i][j].radius) * fov,entities[i][j].radius * fov*2,entities[i][j].radius * fov*2)
              Texture = 0;
              context.imageSmoothingEnabled = false;
            }
          }
          if (entities[i][j].outline && settings.outline) {
            context.strokeStyle = "black";
            if(entities[i][j].texture) context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].radius * fov, 0, Math.PI * 2);
            context.lineWidth = 2/(32/fov);
            context.stroke()
          }
        }
        }
      }
    }
  }
}
function renderPlayers(area, players, focus) {
  context.imageSmoothingEnabled = true;
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
        const radius = player.getSugarRushRadius();
        context.beginPath();
        context.fillStyle = "rgba(255, 128, 189, 0.25)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, radius * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 1){
        const radius = player.getParalysisRadius();
        context.beginPath();
        context.fillStyle = "rgba(77, 233, 242, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, radius * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 2){
        const radius = player.getDistortRadius();
        context.beginPath();
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, radius * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 3){
        const radius = player.getStompRadius();
        context.beginPath();
        context.fillStyle = "rgba(153, 62, 6, 0.2)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, radius * fov, 0, Math.PI * 2, true);
        context.fill();
        context.closePath();
      } else if(player.auraType == 4){
        const radius = 190 / 32;
        context.beginPath();
        context.fillStyle = "rgba(76, 240, 161, 0.25)";
        context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, radius * fov, 0, Math.PI * 2, true);
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
    if(player.wallGod){
      context.fillStyle = "rgba(139,0,0,.5)";
    } else if (player.god&&!player.reaperShade) {
      context.fillStyle = "purple";
    } else {
      context.fillStyle = player.tempColor;
      let rgb = hexToRgb(player.tempColor);
      if(player.night){context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`}
      if(player.mortar){context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},${1-player.mortarTime/1000})`}
      if(player.fusion){context.fillStyle="rgba(60, 60, 75)"}
      if(player.isDead){context.fillStyle=`rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`}
    }
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
      if(!player.reaperShade)if(!player.mortar)context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);
    }
    context.fill();
    context.closePath();
    if(player.poison){
      var poisoness = (player.poisonTimeLeft-player.poisonTime)/player.poisonTimeLeft;
      context.beginPath();
      context.fillStyle = "rgb(140, 1, 183,"+poisoness+")";
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (player.radius+0.5/32) * fov, 0, Math.PI * 2, true);
      context.fill();
    }
    if(player.frozen){
      var iceness = Math.min((player.frozenTimeLeft-player.frozenTime)/player.frozenTimeLeft,0.7);
      context.beginPath();
      context.fillStyle = "rgb(137, 231, 255,"+iceness+")";
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, (player.radius+0.5/32) * fov, 0, Math.PI * 2, true);
      context.fill();
    }
    if(player.burningTimer>0){
      context.beginPath();
      context.fillStyle = "rgb(0, 0, 0,"+player.burningTimer/1000+")";
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);
      context.fill();
    }
    if(player.leadTimeLeft>0){
      var leadEffect = 1-Math.min((player.leadTime-player.leadTimeLeft)/player.leadTime,0.75);
      context.beginPath();
      context.fillStyle = "rgb(33, 33, 39,"+leadEffect+")";
      context.arc(width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov, player.radius * fov, 0, Math.PI * 2, true);
      context.fill();
    }
    context.beginPath();
    if(document.getElementById("wreath").value!="None")if(!player.reaperShade)context.drawImage(hat, width / 2 + (player.pos.x - focus.x) * fov - (25*((player.radius*32)/15)) / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - (25*((player.radius*32)/15)) / 32 * fov, 50 / 32 * fov * ((player.radius*32)/15), 50 / 32 * fov * ((player.radius*32)/15));
    context.closePath();
    context.beginPath();
    if(document.getElementById("wreath").value.endsWith("Crown"))if(!player.reaperShade)context.drawImage(gem, width / 2 + (player.pos.x - focus.x) * fov - (25*((player.radius*32)/15)) / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - (25*((player.radius*32)/15)) / 32 * fov, 50 / 32 * fov * ((player.radius*32)/15), 50 / 32 * fov * ((player.radius*32)/15));
    context.closePath();
    context.beginPath();
    context.fillStyle = "blue";
    if(!settings.cooldown)context.fillStyle = "rgb(255, 255, 0)";
    else if(player.sweetToothEffect)context.fillStyle = "rgb(255, 43, 143)";
    if(!player.reaperShade)context.fillRect(width / 2 + (player.pos.x - focus.x) * fov - 18 / 32 * fov, height / 2 + (player.pos.y - focus.y) * fov - player.radius * fov - 8 / 32 * fov, 36 / 32 * fov * player.energy / player.maxEnergy, 7 / 32 * fov);
    context.fill();
    context.closePath();
    context.beginPath();
    context.strokeStyle = "rgb(68, 118, 255)";
    context.lineWidth = 1/(32/fov);
    if(!settings.cooldown)context.strokeStyle = "rgb(211, 211, 0)";
    else if(player.sweetToothEffect)context.strokeStyle = "rgb(212, 0, 100)";
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
      context.fillText((Math.abs(Math.floor(player.deathTimer)/1e3)).toFixed(0),width / 2 + (player.pos.x - focus.x) * fov, height / 2 + (player.pos.y - focus.y) * fov + 6 * settings.scale)
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
          context.lineWidth = 2/(32/fov);
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
              if(entities[i][j].texture) context.arc(width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov, height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov, entities[i][j].radius * fov, 0, Math.PI * 2);
              context.lineWidth = 2/(32/fov);
              context.stroke()
            }
            context.globalAlpha = 1;
            context.closePath();
          }
          if (entities[i][j].releaseTime>1000){
            if(entities[i][j].clock>=entities[i][j].releaseTime-500){
              const alpha=(500-Math.max(entities[i][j].releaseTime-entities[i][j].clock,0))/500*.2+.05;
              context.fillStyle=`rgba(1, 1, 1, ${alpha})`;
              context.fill();
            }
          }
        }
        if (entities[i][j].provoked){
          //draw exclamation mark for charging enemies
          context.fillStyle = `rgba(161, 167, 172, 1)`;
          context.font = 24 + "px Tahoma, Verdana, Segoe, sans-serif";
          let x = width / 2 + (area.pos.x + entities[i][j].pos.x - focus.x) * fov;
          let y = height / 2 + (area.pos.y + entities[i][j].pos.y - focus.y) * fov;
          y -= entities[i][j].radius * fov;
          y -= 0.2 * fov;
          context.fillText("!", x, y);
        }
      }
    }
  }
}

function renderMinimap(area, players, focus) {
  if (!players[0].minimap) return;
  const minimapSize = new Vector(370, 100);
  const bound = area.boundary;
  const xCoef = minimapSize.x / bound.w;
  const yCoef = minimapSize.y / bound.h;
  let coef = xCoef;
  if (yCoef < xCoef) {
    coef = yCoef;
  }
  // coef = Math.round(coef)
  const yOff = Math.round(minimapSize.y - bound.h * coef);
  context.closePath();
  for (const i in area.zones) {
    context.beginPath();
    const zone = area.zones[i];
    let style = "rgb(255, 255, 255, 255)";
    switch(zone.type){
      case 1: style = "rgb(195, 195, 195, 255)";break;
      case 2:case 4: style = "rgb(255, 244, 108, 255)";break;
      case 3: style = "rgb(106, 208, 222, 255)";break;
      case 5: style = "rgb(255, 249, 186, 255)";break;
    }
    style = toRGBArray(style);
    const x = Math.round((zone.pos.x - bound.x) * coef);
    const y = Math.round(staticHeight - minimapSize.y + (zone.pos.y - bound.y) * coef + yOff);
    const w = Math.ceil(zone.size.x * coef);
    const h = Math.ceil(zone.size.y * coef);
    // Canvas floating numbers moment
    
    let background_color = toRGBArray(zone.background_color);
    background_color[3] *= 255;
    background_color = arrayToInt32(background_color);
    const background_color_array = [background_color >> 24 & 255, background_color >> 16 & 255, background_color >> 8 & 255, 255 & background_color];
    
    context.fillStyle = arrayToRGBStr(mixColors(style,background_color_array));
    context.fillRect(x, y, w, h);
    context.closePath();
    
    context.beginPath();
    context.fillStyle = "rgba(80, 80, 80, 0.6)",
		context.fillRect(x, y, w, h);
    context.closePath();
  }
  for(const i in area.assets){
    const asset = area.assets[i];
    if(asset.texture === undefined) continue
    const x = (asset.pos.x - bound.x) * coef;
    const y = staticHeight - minimapSize.y + (asset.pos.y - bound.y) * coef + yOff;
    const w = asset.size.x * coef;
    const h = asset.size.y * coef;
    context.fillStyle = "rgba(0, 0, 0, 0.4)";
		context.fillRect(x, y, w, h)
  }

  for (var i in players) {
    var newPos = new Vector((players[i].pos.x - area.pos.x - bound.x) * coef, (players[i].pos.y - area.pos.y - bound.y) * coef)
    context.beginPath();
    context.fillStyle = players[i].color;
    context.arc(newPos.x, staticHeight - minimapSize.y + newPos.y + yOff, 4, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();
  }
}

function renderUI(area, players, focus) {
  const player = players[0];
  if(!players[0].herocard) return
  context.lineWidth = 1;
  const c = hexToRgb(players[0].color);
  context.imageSmoothingEnabled = true;
  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = "rgba(0, 0, 0, 0.8)"
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 85, 516, 85);}
  else{context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 85, 516+82, 85);}
  context.fill();
  context.closePath();

  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = `rgb(${c[0]},${c[1]},${c[2]},0.4)`
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 100, 516, 15);}
  else{context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 100, 516+82, 15);}
  context.fill();
  context.closePath();
  
  context.beginPath();
  context.strokeStyle = "#000000";
  context.fillStyle = game.players[0].color
  if(!(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern)){context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 100, ((Math.floor(game.players[0].experience)-Math.floor(game.players[0].previousLevelExperience)) / (Math.floor(game.players[0].nextLevelExperience)-Math.floor(game.players[0].previousLevelExperience))) * 516, 15);}
  else{context.fillRect(staticWidth / 2 - 516 / 2, staticHeight - 100, ((Math.floor(game.players[0].experience)-Math.floor(game.players[0].previousLevelExperience)) / (Math.floor(game.players[0].nextLevelExperience)-Math.floor(game.players[0].previousLevelExperience))) * 598, 15);}
  context.fill();
  context.closePath();

  if(game.players[0].magnet||game.players[0].flashlight||game.players[0].lantern){
    context.beginPath();
    if(game.players[0].magnet){if(game.players[0].magnetDirection == "Down")context.drawImage(magnetDown,staticWidth/2+(516-132+82+82)/2,staticHeight-68,48,48)
    else if(game.players[0].magnetDirection == "Up")context.drawImage(magnetUp,staticWidth/2+(516-132+82+82)/2,staticHeight-68,48,48)}
    else if(game.players[0].flashlight){context.drawImage(flashlight,staticWidth/2+(516-132+82+82)/2,staticHeight-68,48,48)}
    else if(game.players[0].lantern){context.drawImage(lantern,staticWidth/2+(516-132+82+82)/2,staticHeight-68,48,48)}
    context.closePath();

    context.beginPath();
    context.fillStyle = "yellow";
    context.arc(staticWidth/2+(516-84+82+82)/2,staticHeight-77, 3.6, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();

    context.beginPath();
    context.fillStyle = "white";
    context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
    context.textAlign = "center";
    context.fillText("[C] or [L]", staticWidth/2+(516-84+82+82)/2,staticHeight-8)
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
      context.drawImage(ab, staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24, staticHeight - 85 - 3 + 17 + 44 - 17 - 24,48,48)
      if(players[0].points <= 0){
        context.fillText(text, staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct, staticHeight - 85 + 17/2 + 44 - 17 + 24 + 17);
      } else {
        const active = (abL == ab1ML) ? false : true;
        renderUpgrade(context, staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct, staticHeight - 85 + 17/2 + 44 - 17 + 24 + 9.5, (a==1) ? 4 : 5, players[0], active);
      }
      context.closePath();
      if(!abL||cooldownTime==1){context.fillStyle="rgba(0, 0, 0, 0.6)"}
      else{context.fillStyle="rgba(0, 0, 0, 0.2)"};
      context.fillRect(staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24, staticHeight - 85 - 3 + 17 + 44 - 17 - 24,48,48)
      context.linestaticWidth = 1;
      for(var p = 0; p<5; p++){
        (!abL||cooldownTime==1)?context.strokeStyle="rgb(150, 150, 150)":context.strokeStyle="rgb(200, 200, 200)"
        context.beginPath();
        var h = staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24 + 5; var f = h + 40; var y = staticHeight - 85 - 3 + 17 + 44 - 17 - 24 + 45 - 48 - 6;
        var b = (ab1ML != 5) ? (h+(f-h)*(2/(5-1))):h+(f-h)*(p/(5-1))
        context.arc(b,y,3,0,Math.PI * 2, true)
        context.stroke();
        context.closePath();
      }
      context.fillStyle = "rgb(255, 255, 0)";
      context.strokeStyle = "rgb(255, 255, 0)";
      for(var p = 0; p<abL; p++){
        context.beginPath();
        var h = staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24 + 5; var f = h + 40; var y = staticHeight - 85 - 3 + 17 + 44 - 17 - 24 + 45 - 48 - 6;
        var b = (ab1ML != 5) ? (h+(f-h)*(2/(5-1))):h+(f-h)*(p/(5-1))
        context.arc(b,y,3,0,Math.PI * 2, true)
        if(abL)context.fill();
        if(abL)context.stroke();
        context.closePath();
      }
      context.fillStyle="rgba(0, 0, 0, 0.6)";
      sectorInRect(context,staticWidth / 2 - 516 / 2 + 105 + 41 + 246 + correct - 24,staticHeight - 85 - 3 + 17 + 44 - 17 - 24,48,48,360*(1-cooldownTime)-90)
    }
  }

  context.beginPath();
  context.font = 18 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillStyle = game.players[0].color;
  context.fillText(game.players[0].className, staticWidth / 2 - 516 / 2 + 55, staticHeight - 85 + 20)
  context.closePath();

  context.beginPath();
  context.fillStyle = game.players[0].color;
  context.arc(staticWidth / 2 - 516 / 2 + 55, staticHeight - 85 + 55, 23, 0, Math.PI * 2);
  context.fill();
  context.closePath();

  context.beginPath();
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillStyle = "white"
  context.fillText(game.players[0].level, staticWidth / 2 - 516 / 2 + 55, staticHeight - 85 + 63)
  context.closePath();

  context.beginPath();
  context.linestaticWidth = 2;
  context.strokeStyle = "rgba(128, 128, 128,0.75)"
  context.moveTo(staticWidth / 2 - 516 / 2 + 105, staticHeight - 85);
  context.lineTo(staticWidth / 2 - 516 / 2 + 105, staticHeight);
  context.stroke();
  context.closePath();

  if(players[0].points > 0){
    context.beginPath();
    context.font = 13 + "px Tahoma, Verdana, Segoe, sans-serif";
    context.textAlign = "center";
    context.fillStyle = "white"
    context.fillText("Points:", staticWidth / 2 - 516 / 2 + 136, staticHeight - 85 + 16)
    context.closePath();
    context.fillStyle = "rgb(200,200,0)";

    if(players[0].points > 8){
      context.beginPath();
      context.arc(staticWidth / 2 - 516 / 2 + 169, staticHeight - 85 + 12, 8, 0, Math.PI * 2);
      context.fill();
      context.closePath();

      context.beginPath();
      context.fillStyle = "black";
      context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
      context.textAlign = "center";
      context.fillText(players[0].points, staticWidth / 2 - 516 / 2 + 169, staticHeight - 85 + 16)
      context.closePath();
    } else {
      for (let step = 0; step < players[0].points; step++){
        context.beginPath();
        context.arc(staticWidth / 2 - 516 / 2 + 169 + 20 * step, staticHeight - 85 + 12, 6, 0, Math.PI * 2);
        context.fill();
        context.closePath();
      }
    }

    const w = 105;
    const i = staticWidth / 2 - 516 / 2;
    const a = staticHeight / 2 + 275;
    const speedActive = (parseFloat(player.speed.toFixed(3)) < player.maxSpeed) ? true : false;
    const energyActive = (player.maxEnergy < player.maxUpgradableEnergy) ? true : false;
    const regenActive = (parseFloat(player.regen.toFixed(3)) < player.maxRegen) ? true : false;
		let s = i + w;
		let l = a + 17;
    renderUpgrade(context, s + 41, l + 52, 1, player, speedActive);
		s = i + w + 82;
		renderUpgrade(context, s + 41, l + 52, 2, player, energyActive);
		s = i + w + 164;
		renderUpgrade(context, s + 41, l + 52, 3, player, regenActive);
  }

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Speed", staticWidth / 2 - 516 / 2 + 105 + 41, staticHeight - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  if(players[0].speed)context.fillText(parseFloat(players[0].speed.toFixed(1)), staticWidth / 2 - 516 / 2 + 105 + 41, staticHeight - 85 + 17 + 44 - 17)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Energy", staticWidth / 2 - 516 / 2 + 105 + 41 + 82, staticHeight - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText((Math.round(players[0].energy)) + " / " + players[0].maxEnergy, staticWidth / 2 - 516 / 2 + 105 + 41 + 82, staticHeight - 85 + 17 + 44 - 17)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 10 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText("Regen", staticWidth / 2 - 516 / 2 + 105 + 41 + 164, staticHeight - 85 + 17 + 44)
  context.closePath();

  context.beginPath();
  context.fillStyle = "white";
  context.font = 22 + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  context.fillText((Math.round(players[0].regen * 10) / 10), staticWidth / 2 - 516 / 2 + 105 + 41 + 164, staticHeight - 85 + 17 + 44 - 17)
  context.closePath();

  const shape = settings.sandbox ? 'rect' : 'triangle';
  const color = players[0].hasCheated ? "purple" : "#696969"
  drawShape(context, shape, 386, staticHeight - 4, color, 12, 12);
  
}

function renderUpgrade(ctx, xValue, yValue, text, player, active) {
  const upgradeBrightness = (active) ? Math.round((player.upgradeBrightness.value - player.upgradeBrightness.min) / 3) : -120;
  const red = 200;
  const green = 200;
  const blue = 0;
  ctx.fillStyle = `rgb(${red + upgradeBrightness}, ${green + upgradeBrightness}, ${blue + upgradeBrightness})`;
  ctx.strokeStyle = ctx.fillStyle;
  const x = xValue - 6;
  const y = yValue;
  const width = 12;
  const height = 12;
  roundedRect(ctx, x, y, width, height, 1, true, true);
  ctx.fillStyle = `rgb(${upgradeBrightness}, ${upgradeBrightness}, ${upgradeBrightness})`;
  context.font = 12 + "px Tahoma, Verdana, Segoe, sans-serif";
  ctx.fillText(text, x + width/2, y + 10);
}

function renderAssets(area, players, focus) {
  context.globalAlpha = 1;
  var tile_image = tiles;
  var player = players[0];
  for (var i in area.assets) {
    var zone = area.assets[i];
    for (var j = 0; j < zone.size.x; j++) {
      for (var k = 0; k < zone.size.y; k++) {
        if (zone.type > 3) continue;
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
    var posX = area.pos.x + zone.pos.x;
    var posY = area.pos.y + zone.pos.y;
    const imageX = width/2+(posX-focus.x)*fov;
    const imageY = height/2+(posY-focus.y)*fov;
    const scale = settings.scale;
    switch(zone.type){
      case 5:
        context.drawImage(flashlight_item, imageX, imageY, flashlight_item.width * scale, flashlight_item.height * scale)
        if(posX-focus.x<2&&posX-focus.x>-2&&posY-focus.y<2&&posY-focus.y>-2){player.flashlight = true;}
        break;
      case 6:
        context.drawImage(torch, imageX, imageY, torch.width * scale, torch.height * scale);
        break;
      case 7:
        context.drawImage(gate, imageX, imageY, gate.width * scale, gate.height * scale);
        break;
      case 8:
        context.drawImage(torchUp, imageX, imageY, torchUp.width * scale, torchUp.height * scale);
        break;
    }
  }
}

function roundedRect(ctx, x, y, width, height, strokeSize=5, fillEnabled=false, strokeEnabled=true) {
	ctx.beginPath();
	ctx.moveTo(x + strokeSize, y);
	ctx.lineTo(x + width - strokeSize, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + strokeSize);
	ctx.lineTo(x + width, y + height - strokeSize);
	ctx.quadraticCurveTo(x + width, y + height, x + width - strokeSize, y + height);
	ctx.lineTo(x + strokeSize, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - strokeSize);
	ctx.lineTo(x, y + strokeSize);
	ctx.quadraticCurveTo(x, y, x + strokeSize, y);
	ctx.closePath();
	if(fillEnabled) ctx.fill();
	if(strokeEnabled) ctx.stroke();
}