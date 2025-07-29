let tilesCanvas;
let minimapCanvas;
let shouldRenderPartially = undefined;
let effects = [];

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
let width = canvas.width,
  height = canvas.height;

function renderArea(area, players, focus, areaUpdated) {
  if (!images.tiles.complete) return;
  const player = players[0];
  const light = document.createElement('canvas');
  const lightCtx = light.getContext("2d");
  light.width = width;
  light.height = height;
  if (areaUpdated || !tilesCanvas) {
    tilesCanvas = undefined;
    minimapCanvas = undefined;
    shouldRenderPartially = undefined;
    effects = [];
  }
  renderTiles(area, players, focus);
  renderAssets(area, players, focus);
  renderStaticEntities(area, players, focus);
  renderPlayers(area, players, focus);
  renderEntities(area, players, focus);

  if (area.lighting !== 1) {
    const renderLight = (x, y, radius) => {
      const grad = lightCtx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      lightCtx.beginPath();
      lightCtx.fillStyle = grad;
      lightCtx.arc(x, y, radius, 0, 2 * Math.PI);
      lightCtx.fill();
    };

    players.forEach(player => {
      let playerX = width / 2 + (player.pos.x - focus.x) * fov;
      let playerY = height / 2 + (player.pos.y - focus.y) * fov;

      player.lightCount = (player.lantern_active && player.lantern) ? 250 / 32 : 50 / 32;
      renderLight(playerX || 0, playerY || 0, player.lightCount * fov);

      if (player.flashlight_active && player.flashlight && player.energy > 0) {
        const flashlightRadius = (460 / 32) * fov;
        const flashlightAngle = 15;
        const flashlightAngleIncrement = 9;
        const flashlightDistance = 500 / 32 * fov;

        player.inputAng = mouse ? Math.atan2(mousePos.y - playerY, mousePos.x - playerX) * 180 / Math.PI :
          player.moving ? Math.atan2(player.dirY, player.dirX) * 180 / Math.PI : player.lastAng;

        player.inputAng = (player.inputAng + 360) % 360;

        const angleDiff = ((player.inputAng - player.lastAng + 540) % 360) - 180;
        player.lastAng += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), flashlightAngleIncrement);
        player.lastAng = (player.lastAng + 360) % 360;

        lightCtx.beginPath();
        lightCtx.moveTo(playerX, playerY);
        lightCtx.arc(playerX, playerY, flashlightDistance, (player.lastAng - flashlightAngle) * Math.PI / 180, (player.lastAng + flashlightAngle) * Math.PI / 180);
        lightCtx.fillStyle = lightCtx.createRadialGradient(playerX, playerY, 0, playerX, playerY, flashlightRadius);
        lightCtx.fillStyle.addColorStop(0, "rgba(0, 0, 0, 1)");
        lightCtx.fillStyle.addColorStop(1, "rgba(0, 0, 0, 0)");
        lightCtx.fill();
      }
    });

    Object.values(area.entities).flat().concat(area.assets)
      .filter(entity => (entity.isLight && entity.lightCount > 0) || ([6, 8, 4].includes(entity.type) && entity.size))
      .forEach(entity => {
        if (entity && entity.pos) {
          const lightPower = entity.type === 4 ? 250 : (entity.lightCount || 110);
          let entityX = width / 2 + (area.pos.x + entity.pos.x - focus.x) * fov;
          let entityY = height / 2 + (area.pos.y + entity.pos.y - focus.y) * fov;
          if (entity.type === 4 && entity.size) {
            entityX += entity.size.x / 2 * fov;
            entityY += entity.size.y / 2 * fov;
          }

          renderLight(entityX || 0, entityY || 0, (lightPower / 32) * fov);
        }
      });

    lightCtx.fillStyle = `rgba(0, 0, 0, ${area.lighting})`;
    lightCtx.fillRect(0, 0, width, height);

    context.globalCompositeOperation = "destination-in";
    context.drawImage(light, 0, 0);
    context.globalCompositeOperation = "source-over";
  }
  applyScale(context, settings.scale, () => {
    renderUI(area, players, focus);
    renderMinimap(area, players, focus);
    if (player.overlay) {
      const uiScale = settings.ui_scale || 1;
      context.beginPath();
      context.font = `${22 * uiScale}px cursive`;
      context.textAlign = "start";
      context.lineWidth = 0.5 * uiScale;

      const roughDelay = settings.fps_limit === "unlimited" ? 0 : Math.round((settings.tick_delay * (1000 / parseInt(settings.fps_limit))) + settings.input_delay);
      const avgPing = ping.array.length > 5 ? Math.round(ping.array.reduce((e, t) => e + t) / ping.array.length) : roughDelay;
      const devStat = `Delay: ${avgPing}, FPS: ${Math.round(1000 / frameTime)}`;

      let text, color;
      if (settings.diff === "Easy") {
        text = settings.dev ? `Deaths: ${player.deathCounter}, ${devStat}` : `Deaths: ${player.deathCounter}`;
        color = "gray";
      } else if (settings.diff === "Medium") {
        text = settings.dev ? `Lives: ${player.lives}, ${devStat}` : `Lives: ${player.lives}`;
        color = ["red", "orange", "yellow", "green"][player.lives] || "gray";
      } else if (settings.dev) {
        text = devStat;
        color = "gray";
      }

      if (text) {
        context.fillStyle = context.strokeStyle = color;
        context.fillText(text, 0, 20 * uiScale);
        context.strokeText(text, 0, 20 * uiScale);
      }

      if (settings.dev) {
        context.fillStyle = context.strokeStyle = "gray";
        const texts = [
          player.safePoint ? `Safe Point: {X:${Math.round(player.safePoint.pos.x * fov)}, Y:${Math.round(player.safePoint.pos.y * fov)}} ([), to clear (])` : "None ([)",
          `Player: {X:${Math.round(player.pos.x * fov)}, Y:${Math.round(player.pos.y * fov)}, Speed:${greaterMax(player)}}`,
          `Timer-clear: ${settings.timer_clear} (P), (O)`
        ];
        texts.forEach((text, i) => {
          context.fillText(text, 0, (45 + i * 25) * uiScale);
          context.strokeText(text, 0, (45 + i * 25) * uiScale);
        });
      }

      context.fill();
      context.stroke();
      context.closePath();
    }
  });
}

function renderStaticEntities(area, players, focus) {
  context.globalAlpha = 1;
  for (const entityType in area.static_entities) {
    const entities = area.static_entities[entityType];
    for (const entity of entities) {
      const enemyX = width / 2 + (area.pos.x + entity.pos.x - focus.x) * fov;
      const enemyY = height / 2 + (area.pos.y + entity.pos.y - focus.y) * fov;
      const enemyRadius = (entity.scaleOscillator ? entity.scaleOscillator.value : 1) * entity.radius * fov;
      if (enemyX + enemyRadius < 0 || enemyX - enemyRadius > width ||
        enemyY + enemyRadius < 0 || enemyY - enemyRadius > height) {
        continue;
      }
      renderNormalEntity(context, entity, enemyX, enemyY, enemyRadius);
    }
  }
}

function renderEntities(area, players, focus) {
  const ctx = context;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const areaX = area.pos.x;
  const areaY = area.pos.y;
  const focusX = focus.x;
  const focusY = focus.y;
  // Render effects first
  for (const entityType in { ...area.entities, ...area.effects }) {
    const entities = area.entities[entityType] ? area.entities[entityType] : area.effects[entityType];
    const firstEntity = entities[0];
    if (!firstEntity) continue;
    if (!firstEntity.aura && !firstEntity.isEffect) continue;
    if (settings.effect_blending) if (effects[entityType] === undefined) {
      effects[entityType] = {};
      effects[entityType].canvas = createOffscreenCanvas(width, height);
      effects[entityType].ctx = effects[entityType].canvas.getContext("2d");
    } else {
      effects[entityType].ctx.clearRect(0, 0, width, height);
    }
    const color = firstEntity.isEffect ? firstEntity.color : firstEntity.auraColor;
    const len = entities.length;
    for (let i = 0; i < len; i++) {
      const entity = entities[i];

      const effectX = halfWidth + (areaX + entity.pos.x - focusX) * fov;
      const effectY = halfHeight + (areaY + entity.pos.y - focusY) * fov;
      const effectRadius = (entity.isEffect ? entity.radius : entity.auraSize) * fov;

      // Check if the entity is within the visible range
      if (effectX + effectRadius < 0 || effectX - effectRadius > width ||
        effectY + effectRadius < 0 || effectY - effectRadius > height) {
        continue;
      }

      // Render effect
      if (settings.effect_blending && !entity.isEffect) {
        const effectCtx = effects[entityType].ctx;
        const colorArray = toRGBArray(color);
        effectCtx.beginPath();
        effectCtx.fillStyle = `rgb(${colorArray[0]},${colorArray[1]},${colorArray[2]})`;
        effectCtx.arc(effectX, effectY, effectRadius, 0, Math.PI * 2);
        effectCtx.fill();
        continue;
      };

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(effectX, effectY, effectRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = toRGBArray(color)[3];
    if (settings.effect_blending) ctx.drawImage(effects[entityType].canvas, 0, 0);
    ctx.globalAlpha = 1;
  }

  for (const entityType in area.entities) {
    const entities = area.entities[entityType];
    const len = entities.length;

    for (let i = 0; i < len; i++) {
      const entity = entities[i];

      const entityX = halfWidth + (areaX + entity.pos.x - focusX) * fov;
      const entityY = halfHeight + (areaY + entity.pos.y - focusY) * fov;
      const radius = entity.radius * fov;

      // Check if the entity is within the visible range
      if (entityX + radius < 0 || entityX - radius > width || entityY + radius < 0 || entityY - radius > height) {
        continue;
      }

      // Render entity
      if (entity.isShield) {
        renderShieldEntity(ctx, entity, entityX, entityY);
      } else if (entity.shatterTime > 0) {
        renderShatteredEntity(ctx, entity, entityX, entityY, radius);
      } else {
        renderNormalEntity(ctx, entity, entityX, entityY, radius);
      }

      // Render provoked indicator if needed
      entity.provoked && renderProvokedIndicator(ctx, entityX, entityY, radius);
    }
  }
}

function renderShatteredEntity(ctx, entity, x, y, radius) {
  ctx.globalAlpha = 0.4;
  const shatterProgress = 4000 - entity.shatterTime;
  const quarterRadius = radius / 4;
  const fragmentationFactor = (shatterProgress - 500) / 500;
  const healingFactor = (shatterProgress - 1000) / 3000;

  if (shatterProgress < 250) {
    ctx.beginPath();
    ctx.fillStyle = entity.color;
    ctx.arc(x, y, Math.max(quarterRadius, radius * (1 - shatterProgress / 250)), 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
  } else if (shatterProgress < 500) {
    ctx.beginPath();
    ctx.fillStyle = entity.color;
    ctx.arc(x, y, quarterRadius, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
  } else if (shatterProgress < 1000) {
    let rotationAngle = 5 * fragmentationFactor;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.fillStyle = entity.color;
      ctx.arc(
        x + (Math.cos(rotationAngle) * fragmentationFactor * radius),
        y + (Math.sin(rotationAngle) * fragmentationFactor * radius),
        radius / 3,
        0,
        2 * Math.PI,
        false
      );
      rotationAngle += 2 * Math.PI / 3;
      ctx.fill();
      ctx.closePath();
    }
  } else {
    let rotationAngle = 5 - 3 * healingFactor;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.fillStyle = entity.color;
      ctx.arc(
        x + Math.cos(rotationAngle) * (radius - healingFactor * radius),
        y + Math.sin(rotationAngle) * (radius - healingFactor * radius),
        Math.min(radius, Math.max(quarterRadius, radius * healingFactor)),
        0,
        2 * Math.PI,
        false
      );
      rotationAngle += 2 * Math.PI / 3;
      ctx.fill();
      ctx.closePath();
    }
  }
  ctx.globalAlpha = 1;
}

function renderShieldEntity(ctx, entity, x, y) {
  if (entity.isShield) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(entity.rot)
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.fillRect(-entity.size.x * fov, -entity.size.y * fov, entity.size.x * fov * 2, entity.size.y * fov * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}

function renderNormalEntity(ctx, entity, x, y, radius) {
  let alpha = 1;
  const harmlessDuration = (entity.appearing) ? 450 : 1000;
  if (entity.static) {
    alpha = 1;
  } else if (entity.alpha) {
    alpha = entity.alpha;
  } else if (entity.star_visibility > 0) {
    alpha = entity.star_visibility / entity.wall_time;
  } else if (settings.fading_effects && entity.HarmlessEffect > 0 && entity.HarmlessEffect < harmlessDuration) {
    alpha = 0.4 + 0.6 * (1 - entity.HarmlessEffect / harmlessDuration);
  } else if (entity.isHarmless()) {
    alpha = 0.4;
  }
  ctx.globalAlpha = alpha;
  ctx.beginPath();

  if (entity.color_change) {
    const [r, g, b] = hexToRgb(entity.color);
    ctx.fillStyle = `rgb(${r + entity.color_change},${g - 1.45 * entity.color_change},${b - 1.3 * entity.color_change})`;
  } else {
    ctx.fillStyle = entity.healing > 0 ? "rgb(0, 221, 0)" : entity.color;
  }
  if (entity.slashTime >= 200 && entity.slashTime <= 600 && settings.fading_effects) {
    const slash = (entity.slashTime - 200) / 400;
    const color = Math.floor(54 + 66 * slash);
    ctx.fillStyle = `rgba(${color}, ${color}, ${color}, 1)`;
  }
  if (entity.slashing) {
    ctx.fillStyle = "rgb(190, 190, 190)";
  }

  if (entity.texture) {
    renderTexturedEntity(ctx, entity, x, y, radius);
  } else {
    if (entity.isHalf) {
      ctx.arc(x, y, radius, 0, Math.PI, entity.orientation);
    } else {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  if (settings.fading_effects) {
    const switch_time = entity.switch_total_time - entity.switch_clock;
    if (entity.switching && switch_time <= entity.fading_effects_time) {
      alpha = 0.3 - 0.3 * Math.cos((entity.fading_effects_time - switch_time) / 220 * Math.PI);
      entity.disabled ? ctx.fillStyle = `rgba(25,25,25,${alpha})` : ctx.fillStyle = `rgba(147,147,147,${alpha})`;
      ctx.fill();
    }
  }

  if (entity.sugar_rush > 0) {
    const sugarRushMaxTime = 2000;
    const highestAlpha = 0.7;
    const adjustedAlpha = Math.min(Math.max(highestAlpha - highestAlpha * ((sugarRushMaxTime - entity.sugar_rush) / sugarRushMaxTime), 0), highestAlpha);
    ctx.fillStyle = `rgba(255, 128, 189, ${adjustedAlpha})`;
    ctx.fill();
  }

  if (entity.decayed) {
    ctx.fillStyle = "rgba(0, 0, 128, 0.2)";
    ctx.fill();
  }
  if (entity.defended) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fill();
  }
  if (entity.repelled) {
    ctx.fillStyle = "rgba(255, 230, 200, 0.5)";
    ctx.fill();
  }

  if (entity.releaseTime > 1000 && entity.clock >= entity.releaseTime - 500) {
    ctx.fillStyle = `rgba(1, 1, 1, ${(500 - Math.max(entity.releaseTime - entity.clock, 0)) / 500 * 0.2 + 0.05})`;
    ctx.fill();
  }

  const isOutline = (settings.outline && entity.outline);
  const isProjectile = (settings.projectile_outline && !entity.static && !entity.texture && entity.projectile_outline);
  if (entity.outlineAlpha || entity.outlineAlpha === 0) ctx.globalAlpha = entity.outlineAlpha;

  if (isOutline || isProjectile) {
    if (entity.texture) ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (isOutline) ctx.lineWidth = 2 / (32 / fov);
    else if (!entity.outline) ctx.lineWidth = 1 / (32 / fov);

    if (isOutline || !entity.outline) {
      ctx.strokeStyle = entity.whiteOutline && settings.different_outlines ? "white" : "black";
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

function renderTexturedEntity(ctx, entity, x, y, radius) {
  let texture;
  switch (entity.texture) {
    case "ninja_star_sniper_projectile":
      texture = images.ninja_star_sniper_projectile;
      break;
    case "lotusOn":
      texture = images.lotusOn;
      break;
    case "lotusOff":
      texture = images.lotusOff;
      break;
    case "pumpkinOn":
      texture = images.pumpkinOn;
      break;
    case "pumpkinOff":
      texture = images.pumpkinOff;
      break;
    case "sweet_tooth_item":
      texture = images.sweet_tooth_item;
      break;
    case "vengeance_projectile":
      texture = images.vengeance_projectile;
      break;
  }
  if (texture) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(texture, x - radius, y - radius, radius * 2, radius * 2);
    ctx.imageSmoothingEnabled = false;
  }
}

function renderProvokedIndicator(ctx, x, y, radius) {
  ctx.fillStyle = "rgba(161, 167, 172, 1)";
  ctx.font = "24px Tahoma, Verdana, Segoe, sans-serif";
  ctx.fillText("!", x, y - radius - 0.2 * fov);
}

function renderPlayers(area, players, focus) {
  context.imageSmoothingEnabled = true;

  const auraTypes = {
    0: { getRadius: player => player.getSugarRushRadius?.() || 0, color: "rgba(255, 128, 189, 0.25)" },
    1: { getRadius: player => player.getParalysisRadius?.() || 0, color: "rgba(77, 233, 242, 0.2)" },
    2: { getRadius: player => player.getDistortRadius?.() || 0, color: "rgba(255, 0, 0, 0.2)" },
    3: { getRadius: player => player.getStompRadius?.() || 0, color: "rgba(153, 62, 6, 0.2)" },
    4: { getRadius: () => 150 / 32, color: "rgba(76, 240, 161, 0.25)" },
  };

  const heavyBalloonColors = ["rgb(2, 135, 4, .8)", "rgb(228, 122, 42, .8)", "rgb(255, 219, 118, .8)", "rgb(4, 70, 255, .8)", "rgb(216, 48, 162, .8)"];

  for (const player of players) {
    const playerX = width / 2 + (player.pos.x - focus.x) * fov;
    const playerY = height / 2 + (player.pos.y - focus.y) * fov;
    const playerRadius = player.radius * fov;

    // Render bandage
    if (player.bandage || player.isUnbandaging) {
      context.beginPath();
      context.fillStyle = "#dedabe";
      context.arc(playerX, playerY, (player.radius + (player.isUnbandaging ? 1 : 3) / 32) * fov, 0, Math.PI * 2);
      context.fill();
      if (!player.isUnbandaging) {
        context.strokeStyle = "#aaa791";
        context.lineWidth = 1 / (32 / fov);
        context.stroke();
      }
    }

    // Render aura
    if (player.aura) {
      const aura = auraTypes[player.auraType];
      if (aura) {
        context.beginPath();
        context.fillStyle = aura.color;
        context.arc(playerX, playerY, aura.getRadius(player) * fov, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Render heavy balloon
    if (player.heavyBallon) {
      context.beginPath();
      context.fillStyle = heavyBalloonColors[player.prevColor];
      context.arc(playerX, playerY, player.heavyBallonSize / 32 * fov, 0, Math.PI * 2);
      context.fill();
      if (settings.outline) {
        context.strokeStyle = "black";
        context.lineWidth = 2 / (32 / fov);
        context.stroke();
      }
    }

    // Set player fill style
    if (player.ghost && player.god) {
      context.fillStyle = "rgba(132,0,85,.5)";
    } else if (player.ghost) {
      context.fillStyle = "rgba(139,0,0,.5)";
    } else if (player.god && !player.reaperShade) {
      context.fillStyle = "purple";
    } else {
      const rgb = hexToRgb(player.tempColor);
      context.fillStyle = player.night ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.6)` :
        player.mortar ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]},${1 - player.mortarTime / 1000})` :
          player.fusion ? "rgba(60, 60, 75)" :
            player.isDead ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]},0.4)` :
              player.tempColor;
    }

    // Render player shape
    context.beginPath();
    if (player.type === 7 && player.shape > 0) {
      const numberOfSides = player.shape === 1 ? 4 : player.shape === 2 ? 3 : player.shape === 3 ? 5 : 4;
      context.moveTo(playerX + playerRadius * Math.cos(-Math.PI / 2), playerY + playerRadius * Math.sin(-Math.PI / 2));
      for (let i = 1; i <= numberOfSides; i++) {
        context.lineTo(
          playerX + playerRadius * Math.cos(i * 2 * Math.PI / numberOfSides - Math.PI / 2),
          playerY + playerRadius * Math.sin(i * 2 * Math.PI / numberOfSides - Math.PI / 2)
        );
      }
    } else if (!player.reaperShade && !player.mortar) {
      context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    }
    context.fill();

    // Render effects (poison, frozen, burning, lead)
    if (player.poison) {
      context.fillStyle = `rgba(140, 1, 183, ${(player.poisonTimeLeft - player.poisonTime) / player.poisonTimeLeft})`;
      context.beginPath();
      context.arc(playerX, playerY, (player.radius + 0.5 / 32) * fov, 0, Math.PI * 2);
      context.fill();
    }
    if (player.lava) {
      context.fillStyle = `rgba(247, 131, 6, ${(player.lavaTimeLeft - player.lavaTime) / player.lavaTimeLeft})`;
      context.beginPath();
      context.arc(playerX, playerY, (player.radius + 0.5 / 32) * fov, 0, Math.PI * 2);
      context.fill();
    }
    if (player.frozen) {
      context.fillStyle = `rgba(137, 231, 255, ${Math.min((player.frozenTimeLeft - player.frozenTime) / player.frozenTimeLeft, 0.7)})`;
      context.beginPath();
      context.arc(playerX, playerY, (player.radius + 0.5 / 32) * fov, 0, Math.PI * 2);
      context.fill();
    }
    if (player.burningTimer > 0) {
      context.fillStyle = `rgba(0, 0, 0, ${player.burningTimer / 1000})`;
      context.beginPath();
      context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
      context.fill();
    }
    if (player.voidDrainTimer > 0) {
      context.fillStyle = `rgba(94, 77, 102, ${player.voidDrainTimer / 2500})`;
      context.beginPath();
      context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
      context.fill();
    }
    if (player.curseEffect > 0) {
      const curseRatio = 1 - (player.curseEffect / 1500);
      const startColor = [121, 29, 29];
      const endColor = [57, 10, 10];
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * curseRatio);
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * curseRatio);
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * curseRatio);

      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${(1500 - player.curseEffect) / 1500})`;
      context.beginPath();
      context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
      context.fill();
    }
    if (player.leadTimeLeft > 0) {
      context.fillStyle = `rgba(33, 33, 39,${1 - Math.min((player.leadTime - player.leadTimeLeft) / player.leadTime, 0.75)})`;
      context.beginPath();
      context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
      context.fill();
    }

    // Constants for rendering
    const WREATH_SIZE = 50;
    const ENERGY_BAR_WIDTH = 36;
    const ENERGY_BAR_HEIGHT = 7;
    const ENERGY_BAR_Y_OFFSET = 8;
    const NAME_FONT_SIZE = 12;
    const NAME_Y_OFFSET = 11;
    const DEATH_TIMER_FONT_SIZE = 16;
    const DEATH_TIMER_Y_OFFSET = 6;

    // Render wreath and crown
    if (!player.reaperShade) {
      const wreathValue = settings.wreath;
      if (wreathValue !== "None") {
        const wreathSize = WREATH_SIZE / 32 * fov * ((player.radius * 32) / 15);
        const wreathPosition = playerX - wreathSize / 2;
        context.drawImage(images.hat, wreathPosition, playerY - wreathSize / 2, wreathSize, wreathSize);
      }
      if (wreathValue.endsWith("Crown")) {
        const crownSize = WREATH_SIZE / 32 * fov * ((player.radius * 32) / 15);
        const crownPosition = playerX - crownSize / 2;
        context.drawImage(images.gem, crownPosition, playerY - crownSize / 2, crownSize, crownSize);
      }
    }

    // Render energy bar
    if (!player.reaperShade) {
      const energyBarWidth = ENERGY_BAR_WIDTH / 32 * fov;
      const energyBarHeight = ENERGY_BAR_HEIGHT / 32 * fov;
      const energyBarY = playerY - player.radius * fov - ENERGY_BAR_Y_OFFSET / 32 * fov;

      context.fillStyle = !settings.cooldown ? "rgb(255, 255, 0)" : player.sweetToothEffect ? "rgb(255, 43, 143)" : "blue";
      context.fillRect(playerX - energyBarWidth / 2, energyBarY, energyBarWidth * player.energy / player.maxEnergy, energyBarHeight);

      context.strokeStyle = !settings.cooldown ? "rgb(211, 211, 0)" : player.sweetToothEffect ? "rgb(212, 0, 100)" : "rgb(68, 118, 255)";
      context.lineWidth = 1 / (32 / fov);
      context.strokeRect(playerX - energyBarWidth / 2, energyBarY, energyBarWidth, energyBarHeight);
    }

    // Render player name
    if (!player.reaperShade) {
      context.fillStyle = "black";
      context.font = `${NAME_FONT_SIZE / 32 * fov}px Tahoma, Verdana, Segoe, sans-serif`;
      context.textAlign = "center";
      context.fillText(player.name, playerX, playerY - player.radius * fov - NAME_Y_OFFSET / 32 * fov);
    }

    // Render death timer
    if (player.isDead) {
      context.fillStyle = "red";
      context.font = `${DEATH_TIMER_FONT_SIZE / 32 * fov}px Tahoma, Verdana, Segoe, sans-serif`;
      context.fillText((Math.abs(Math.floor(player.deathTimer) / 1000)).toFixed(0), playerX, playerY + DEATH_TIMER_Y_OFFSET * settings.scale);
    }
  }
}

function renderMinimap(area, players, focus) {
  if (!players[0].minimap) return;
  const uiScale = settings.ui_scale || 1;
  const minimapSize = new Vector(370 * uiScale, 100 * uiScale);
  const bound = area.boundary;
  const xCoef = minimapSize.x / bound.w,
    yCoef = minimapSize.y / bound.h;
  if (xCoef > yCoef) {
    minimapSize.x *= yCoef / xCoef;
  } else {
    minimapSize.y *= xCoef / yCoef;
  }
  const coef = Math.ceil(Math.min(xCoef, yCoef));

  // If minimapCanvas doesn't exist or needs to be recreated (e.g., when area changes)
  if (!minimapCanvas) {
    const canvasSize = new Vector(bound.w * coef, bound.h * coef);
    minimapCanvas = createOffscreenCanvas(canvasSize.x, canvasSize.y);
    const ctx = minimapCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    for (const i in area.zones) {
      const zone = area.zones[i];
      let style = "rgb(255, 255, 255, 255)";
      switch (zone.type) {
        case 1: style = "rgb(195, 195, 195, 255)"; break;
        case 2: case 4: style = "rgb(255, 244, 108, 255)"; break;
        case 3: style = "rgb(106, 208, 222, 255)"; break;
        case 5: style = "rgb(255, 249, 186, 255)"; break;
      }
      style = toRGBArray(style);
      const x = (zone.pos.x - bound.x) * coef;
      const y = (zone.pos.y - bound.y) * coef;
      const w = zone.size.x * coef;
      const h = zone.size.y * coef;

      let background_color = toRGBArray(zone.background_color);
      background_color[3] *= 255;
      background_color = arrayToInt32(background_color);
      const background_color_array = [background_color >> 24 & 255, background_color >> 16 & 255, background_color >> 8 & 255, 255 & background_color];

      ctx.fillStyle = arrayToRGBStr(mixColors(style, background_color_array));
      ctx.fillRect(x, y, w, h);
    }

    for (const i in area.assets) {
      const asset = area.assets[i];
      if (asset.texture === undefined) continue;
      const x = (asset.pos.x - bound.x) * coef;
      const y = (asset.pos.y - bound.y) * coef;
      const w = asset.size.x * coef;
      const h = asset.size.y * coef;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x, y, w, h);
    }

    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(minimapCanvas, 0, staticHeight - Math.round(minimapSize.y), Math.round(minimapSize.x), Math.round(minimapSize.y));
  context.imageSmoothingEnabled = true;

  // Draw players on main context with correct size and position
  for (const i in players) {
    const player = players[i];
    const playerMinimapRadius = Math.min((player.radius + coef), 4) * uiScale;
    const newPos = new Vector(
      (player.pos.x - area.pos.x - bound.x) * coef,
      (player.pos.y - area.pos.y - bound.y) * coef
    );
    context.beginPath();
    context.fillStyle = player.color;
    context.strokeStyle = player.strokeColor;
    context.lineWidth = 2 * uiScale;
    context.arc(newPos.x * (minimapSize.x / minimapCanvas.width), staticHeight - minimapSize.y + newPos.y * (minimapSize.y / minimapCanvas.height), playerMinimapRadius, 0, Math.PI * 2, true);
    context.fill();
    context.stroke();
    context.closePath();
  }
}

function renderUI(area, players, focus) {
  const player = players[0];
  if (!player.herocard) return;

  const uiScale = settings.ui_scale || 1;
  const UI_CONSTANTS = {
    BASE_WIDTH: 516 * uiScale,
    EXTRA_WIDTH: 80 * uiScale,
    UI_HEIGHT: 85 * uiScale,
    EXP_BAR_HEIGHT: 15 * uiScale,
    ABILITY_SPACING: 82 * uiScale,
    ABILITY_SIZE: 48 * uiScale,
    ABILITY_DOT_RADIUS: 3 * uiScale,
    LEVEL_CIRCLE_RADIUS: 23 * uiScale,
    UPGRADE_SIZE: 12 * uiScale,
    POINT_CIRCLE_LARGE: 8 * uiScale,
    POINT_CIRCLE_SMALL: 6 * uiScale,
    POINT_SPACING: 20 * uiScale,
    SEPARATOR_X: 105 * uiScale,
    CLASS_NAME_OFFSET: { X: 55 * uiScale, Y: 20 * uiScale },
    LEVEL_OFFSET: { X: 55 * uiScale, Y: 55 * uiScale },
    STAT_SPACING: 82 * uiScale,
    FPS_INDICATOR: { X: 386 * uiScale, Y: 4 * uiScale, SIZE: 12 * uiScale },
    COLORS: {
      UI_BACKGROUND: "rgba(0, 0, 0, 0.8)",
      EXP_BAR_BACKGROUND: (r, g, b) => `rgba(${r},${g},${b},0.4)`,
      YELLOW: "yellow",
      WHITE: "white",
      POINT_COLOR: "rgb(200,200,0)",
      SEPARATOR: "rgba(128, 128, 128,0.75)",
      FPS_NORMAL: "#696969",
      FPS_CHEAT: "purple"
    },
    FONT_SIZES: {
      TINY: `${10 * uiScale}px`,
      SMALL: `${13 * uiScale}px`,
      MEDIUM: `${18 * uiScale}px`,
      LARGE: `${22 * uiScale}px`
    }
  };

  const renderRect = (x, y, width, height, fillStyle, strokeStyle = null) => {
    context.beginPath();
    context.fillStyle = fillStyle;
    context.fillRect(x, y, width, height);
    context.fill();
    if (strokeStyle) {
      context.strokeStyle = strokeStyle;
      context.stroke();
    }
    context.closePath();
  };

  const c = hexToRgb(player.color);
  const hasSpecialItem = player.magnet || player.flashlight || player.lantern;
  const totalWidth = UI_CONSTANTS.BASE_WIDTH + (hasSpecialItem ? UI_CONSTANTS.EXTRA_WIDTH : 0);
  const centerX = staticWidth / 2;
  const bottomY = staticHeight - UI_CONSTANTS.UI_HEIGHT;

  context.lineWidth = 1;
  context.imageSmoothingEnabled = true;

  // Main UI background
  renderRect(centerX - UI_CONSTANTS.BASE_WIDTH / 2, bottomY, totalWidth, UI_CONSTANTS.UI_HEIGHT, UI_CONSTANTS.COLORS.UI_BACKGROUND);

  // Experience bar background
  renderRect(centerX - UI_CONSTANTS.BASE_WIDTH / 2, bottomY - UI_CONSTANTS.EXP_BAR_HEIGHT, totalWidth, UI_CONSTANTS.EXP_BAR_HEIGHT, UI_CONSTANTS.COLORS.EXP_BAR_BACKGROUND(c[0], c[1], c[2]));

  // Experience bar fill
  const expPercentage = (player.experience - player.previousLevelExperience) / (player.nextLevelExperience - player.previousLevelExperience);
  renderRect(centerX - UI_CONSTANTS.BASE_WIDTH / 2, bottomY - UI_CONSTANTS.EXP_BAR_HEIGHT, totalWidth * expPercentage, UI_CONSTANTS.EXP_BAR_HEIGHT, player.color);

  if (player.hasAB) {
    const texts = ["[X] or [K]", "[Z] or [J]", "[C] or [L]"];
    const abilities = [
      { key: "ab1", cooldown: "firstAbilityCooldown", totalCooldown: "firstTotalCooldown", pellet: "firstPellet", pelletTotal: "firstPelletTotal", upgradeIndex: 4 },
      { key: "ab2", cooldown: "secondAbilityCooldown", totalCooldown: "secondTotalCooldown", pellet: "secondPellet", pelletTotal: "secondPelletTotal", upgradeIndex: 5 },
      { key: "specialItem", upgradeIndex: 6 }
    ];

    if (player.usesPellets === 1 || player.usesPellets === 3) {
      player.firstAbilityCooldown = player.firstPellet;
      player.firstTotalCooldown = player.firstPelletTotal;
    }
    if (player.usesPellets === 2 || player.usesPellets === 3) {
      player.secondAbilityCooldown = player.secondPellet;
      player.secondTotalCooldown = player.secondPelletTotal;
    }

    abilities.forEach((ability, index) => {
      if (index === 2 && !hasSpecialItem) return; // Skip rendering special item if player doesn't have it

      const { key, cooldown, totalCooldown, upgradeIndex } = ability;
      const text = texts[index];
      const x = staticWidth / 2 - UI_CONSTANTS.BASE_WIDTH / 2 + UI_CONSTANTS.SEPARATOR_X + 41 * uiScale + 246 * uiScale + index * UI_CONSTANTS.ABILITY_SPACING;
      const y = staticHeight - UI_CONSTANTS.UI_HEIGHT;

      // Draw ability icon
      if (index < 2) {
        context.drawImage(player[key], x - UI_CONSTANTS.ABILITY_SIZE / 2, y - 3 * uiScale + 17 * uiScale + 44 * uiScale - 17 * uiScale - UI_CONSTANTS.ABILITY_SIZE / 2, UI_CONSTANTS.ABILITY_SIZE, UI_CONSTANTS.ABILITY_SIZE);
      } else if (hasSpecialItem) {
        let itemImage;
        if (player.magnet) {
          itemImage = player.magnetDirection === "Down" ? images.magnetDown : images.magnetUp;
        } else if (player.flashlight) {
          itemImage = images.flashlight;
        } else if (player.lantern) {
          itemImage = images.lantern;
        }
        context.drawImage(itemImage, x - UI_CONSTANTS.ABILITY_SIZE / 2, y - 3 * uiScale + 17 * uiScale + 44 * uiScale - 17 * uiScale - UI_CONSTANTS.ABILITY_SIZE / 2, UI_CONSTANTS.ABILITY_SIZE, UI_CONSTANTS.ABILITY_SIZE);
      }

      // Render text or upgrade
      context.fillStyle = UI_CONSTANTS.COLORS.WHITE;
      context.font = `${UI_CONSTANTS.FONT_SIZES.TINY} Tahoma, Verdana, Segoe, sans-serif`;
      context.textAlign = "center";
      if (player.points > 0) {
        const active = index < 2 ? player[`${key}L`] !== player[`${key}ML`] : false;
        renderUpgrade(context, x, y + 17 / 2 * uiScale + 44 * uiScale - 17 * uiScale + UI_CONSTANTS.ABILITY_SIZE / 2 + 9.5 * uiScale, upgradeIndex, player, active);
      } else {
        context.fillText(text, x, y + 17 / 2 * uiScale + 44 * uiScale - 17 * uiScale + UI_CONSTANTS.ABILITY_SIZE / 2 + 17 * uiScale);
      }

      // Draw cooldown overlay
      if (index < 2) {
        const cooldownTime = player[cooldown] / player[totalCooldown];
        context.fillStyle = !player[`${key}L`] || cooldownTime === 1 ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.2)";
        context.fillRect(x - UI_CONSTANTS.ABILITY_SIZE / 2, y - 3 * uiScale + 17 * uiScale + 44 * uiScale - 17 * uiScale - UI_CONSTANTS.ABILITY_SIZE / 2, UI_CONSTANTS.ABILITY_SIZE, UI_CONSTANTS.ABILITY_SIZE);
      }

      // Draw ability level indicators
      const dotY = y - 3 * uiScale + 17 * uiScale + 44 * uiScale - 17 * uiScale - UI_CONSTANTS.ABILITY_SIZE / 2 + 45 * uiScale - UI_CONSTANTS.ABILITY_SIZE - 6 * uiScale;
      const maxLevel = index < 2 ? player[`${key}ML`] : 1;
      const currentLevel = index < 2 ? player[`${key}L`] : 1;
      for (let p = 0; p < 5; p++) {
        context.strokeStyle = !player[`${key}L`] || (index < 2 && player[cooldown] === player[totalCooldown]) ? "rgb(150, 150, 150)" : "rgb(200, 200, 200)";
        const dotX = x - UI_CONSTANTS.ABILITY_SIZE / 2 + 5 * uiScale + (40 * uiScale * (maxLevel !== 5 ? 2 : p) / 4);
        context.beginPath();
        context.arc(dotX, dotY, UI_CONSTANTS.ABILITY_DOT_RADIUS, 0, Math.PI * 2);
        context.stroke();
      }

      // Fill in active level indicators
      context.fillStyle = UI_CONSTANTS.COLORS.YELLOW;
      context.strokeStyle = UI_CONSTANTS.COLORS.YELLOW;
      for (let p = 0; p < currentLevel; p++) {
        const dotX = x - UI_CONSTANTS.ABILITY_SIZE / 2 + 5 * uiScale + (40 * uiScale * (maxLevel !== 5 ? 2 : p) / 4);
        context.beginPath();
        context.arc(dotX, dotY, UI_CONSTANTS.ABILITY_DOT_RADIUS, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }

      // Draw cooldown arc for first two abilities only
      if (index < 2) {
        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        const abilityX = x - UI_CONSTANTS.ABILITY_SIZE / 2;
        const abilityY = y - 3 * uiScale + 17 * uiScale + 44 * uiScale - 17 * uiScale - UI_CONSTANTS.ABILITY_SIZE / 2;
        sectorInRect(context, abilityX, abilityY, UI_CONSTANTS.ABILITY_SIZE, UI_CONSTANTS.ABILITY_SIZE, 360 * (1 - player[cooldown] / player[totalCooldown]) - 90);
      }
    });
  }

  function drawText(context, text, x, y, font, color, align = "center") {
    context.beginPath();
    context.font = font;
    context.textAlign = align;
    context.fillStyle = color;
    context.fillText(text, x, y);
    context.closePath();
  }

  function drawCircle(context, x, y, radius, color) {
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  }

  function drawLine(context, x1, y1, x2, y2, color, width) {
    context.beginPath();
    context.lineWidth = width;
    context.strokeStyle = color;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
  }

  function drawShape(context, shape, x, y, color, width, height) {
    const uiScale = settings.ui_scale || 1;
    context.fillStyle = color;
    context.beginPath();

    switch (shape) {
      case 'rect':
        context.fillRect(x, y - height * uiScale, width * uiScale, height * uiScale);
        break;
      case 'triangle':
        context.moveTo(x, y);
        context.lineTo(x + width * uiScale, y);
        context.lineTo(x + (width * uiScale) / 2, y - height * uiScale);
        context.closePath();
        context.fill();
        break;
      case 'circle':
        context.arc(x + (width * uiScale) / 2, y - (height * uiScale) / 2, (width * uiScale) / 2, 0, Math.PI * 2);
        context.fill();
        break;
    }
    context.closePath();
  }

  const baseX = staticWidth / 2 - UI_CONSTANTS.BASE_WIDTH / 2;
  const baseY = staticHeight - UI_CONSTANTS.UI_HEIGHT;

  // Draw class name
  drawText(context, player.className, baseX + UI_CONSTANTS.CLASS_NAME_OFFSET.X, baseY + UI_CONSTANTS.CLASS_NAME_OFFSET.Y, `${UI_CONSTANTS.FONT_SIZES.MEDIUM} Tahoma, Verdana, Segoe, sans-serif`, player.color);

  // Draw level circle
  drawCircle(context, baseX + UI_CONSTANTS.LEVEL_OFFSET.X, baseY + UI_CONSTANTS.LEVEL_OFFSET.Y, UI_CONSTANTS.LEVEL_CIRCLE_RADIUS, player.color);
  drawText(context, player.level, baseX + UI_CONSTANTS.LEVEL_OFFSET.X, baseY + UI_CONSTANTS.LEVEL_OFFSET.Y + 8 * uiScale, `${UI_CONSTANTS.FONT_SIZES.LARGE} Tahoma, Verdana, Segoe, sans-serif`, UI_CONSTANTS.COLORS.WHITE);

  // Draw separator line
  drawLine(context, baseX + UI_CONSTANTS.SEPARATOR_X, baseY, baseX + UI_CONSTANTS.SEPARATOR_X, staticHeight, UI_CONSTANTS.COLORS.SEPARATOR, 2 * uiScale);

  if (player.points > 0) {
    drawText(context, "Points:", baseX + 136 * uiScale, baseY + 16 * uiScale, `${UI_CONSTANTS.FONT_SIZES.SMALL} Tahoma, Verdana, Segoe, sans-serif`, UI_CONSTANTS.COLORS.WHITE);

    if (player.points > 8) {
      drawCircle(context, baseX + 169 * uiScale, baseY + 12 * uiScale, UI_CONSTANTS.POINT_CIRCLE_LARGE, UI_CONSTANTS.COLORS.POINT_COLOR);
      drawText(context, player.points, baseX + 169 * uiScale, baseY + 16 * uiScale, `${UI_CONSTANTS.FONT_SIZES.TINY} Tahoma, Verdana, Segoe, sans-serif`, "black");
    } else {
      for (let step = 0; step < player.points; step++) {
        drawCircle(context, baseX + 169 * uiScale + UI_CONSTANTS.POINT_SPACING * step, baseY + 12 * uiScale, UI_CONSTANTS.POINT_CIRCLE_SMALL, UI_CONSTANTS.COLORS.POINT_COLOR);
      }
    }

    const upgradeY = baseY + 17 / 2 * uiScale + 44 * uiScale - 17 * uiScale + UI_CONSTANTS.ABILITY_SIZE / 2 + 9.5 * uiScale;
    const speedActive = parseFloat(player.speed.toFixed(3)) < player.maxSpeed;
    const energyActive = player.maxEnergy < player.maxUpgradableEnergy;
    const regenActive = parseFloat(player.regen.toFixed(3)) < player.maxRegen;

    renderUpgrade(context, baseX + UI_CONSTANTS.SEPARATOR_X + 41 * uiScale, upgradeY, 1, player, speedActive);
    renderUpgrade(context, baseX + UI_CONSTANTS.SEPARATOR_X + 123 * uiScale, upgradeY, 2, player, energyActive);
    renderUpgrade(context, baseX + UI_CONSTANTS.SEPARATOR_X + 205 * uiScale, upgradeY, 3, player, regenActive);
  }

  const statBaseX = baseX + UI_CONSTANTS.SEPARATOR_X + 41 * uiScale;
  const statY = baseY + 17 * uiScale + 44 * uiScale;

  function drawStat(label, value, xOffset = 0) {
    drawText(context, label, statBaseX + xOffset, statY, `${UI_CONSTANTS.FONT_SIZES.TINY} Tahoma, Verdana, Segoe, sans-serif`, UI_CONSTANTS.COLORS.WHITE);
    drawText(context, value, statBaseX + xOffset, statY - 17 * uiScale, `${UI_CONSTANTS.FONT_SIZES.LARGE} Tahoma, Verdana, Segoe, sans-serif`, UI_CONSTANTS.COLORS.WHITE);
  }

  drawStat("Speed", parseFloat(player.speed.toFixed(1)));
  drawStat("Energy", `${Math.round(player.energy)} / ${player.maxEnergy}`, 82 * uiScale);
  drawStat("Regen", Math.round(player.regen * 10) / 10, 164 * uiScale);

  const shape = settings.fps_limit === "unlimited" ? 'rect' : (settings.fps_limit === "60" ? 'triangle' : 'circle');
  const color = player.hasCheated ? "purple" : "#696969";
  drawShape(context, shape, baseX + UI_CONSTANTS.SEPARATOR_X + 41 * uiScale + 246 * uiScale + 2 * UI_CONSTANTS.ABILITY_SPACING - 550 * uiScale, staticHeight - 4 * uiScale, color, 12, 12);
}

function renderUpgrade(ctx, xValue, yValue, text, player, active) {
  const uiScale = settings.ui_scale || 1;
  const upgradeBrightness = (active) ? Math.round((player.upgradeBrightness.value - player.upgradeBrightness.min) / 3) : -120;
  const red = 200;
  const green = 200;
  const blue = 0;
  ctx.fillStyle = `rgb(${red + upgradeBrightness}, ${green + upgradeBrightness}, ${blue + upgradeBrightness})`;
  ctx.strokeStyle = ctx.fillStyle;
  const x = xValue - 6 * uiScale;
  const y = yValue;
  const width = 12 * uiScale;
  const height = 12 * uiScale;
  roundedRect(ctx, x, y, width, height, 1, true, true);
  ctx.fillStyle = `rgb(${upgradeBrightness}, ${upgradeBrightness}, ${upgradeBrightness})`;
  context.font = `${12 * uiScale}px Tahoma, Verdana, Segoe, sans-serif`;
  ctx.fillText(text, x + width / 2, y + 10 * uiScale);
}

function roundedRect(ctx, x, y, width, height, strokeSize = 5, fillEnabled = false, strokeEnabled = true) {
  const uiScale = settings.ui_scale || 1;
  strokeSize = strokeSize * uiScale;
  ctx.beginPath();
  ctx.moveTo(x + strokeSize, y);
  ctx.arcTo(x + width, y, x + width, y + height, strokeSize);
  ctx.arcTo(x + width, y + height, x, y + height, strokeSize);
  ctx.arcTo(x, y + height, x, y, strokeSize);
  ctx.arcTo(x, y, x + width, y, strokeSize);
  ctx.closePath();
  if (fillEnabled) ctx.fill();
  if (strokeEnabled) ctx.stroke();
}

function drawTiles(area, focus) {
  const x = (-focus.x + area.pos.x) * fov + width / 2;
  const y = (-focus.y + area.pos.y) * fov + height / 2;
  context.drawImage(tilesCanvas, x, y);
}

function renderTiles(area, players, focus) {
  if (tilesCanvas) {
    drawTiles(area, focus);
    return;
  }
  if (!shouldRenderPartially) {
    const { boundary, zones, assets, texture, background_color } = area;
    const { w, h } = boundary;
    const wid = w * fov, heig = h * fov;

    tilesCanvas = createOffscreenCanvas(wid, heig);
    const ctx = tilesCanvas.getContext('2d');
    if (fov !== 32) ctx.scale(fov / 32, fov / 32);

    const zoneCanvas = createOffscreenCanvas(128, 128);
    const zoneCTX = zoneCanvas.getContext('2d');

    // Pre-create patterns for each texture type
    const patterns = {};
    for (let i = 0; i < 7; i++) {
      zoneCTX.clearRect(0, 0, 128, 128);
      zoneCTX.drawImage(images.tiles, i * 128, texture * 128, 128, 128, 0, 0, 128, 128);
      patterns[i] = ctx.createPattern(zoneCanvas, "repeat");
    }

    // Render zones (floor tiles)
    ctx.imageSmoothingEnabled = false//true;
    zones.forEach(zone => {
      const textureType = zone.type === 6 ? 0 : (zone.type === 4 ? 2 : (zone.type === 5 ? 4 : zone.type));
      ctx.fillStyle = patterns[textureType];
      ctx.fillRect(Math.round(zone.pos.x * 32), Math.round(zone.pos.y * 32), zone.size.x * 32, zone.size.y * 32);

      ctx.fillStyle = zone.background_color || background_color;
      ctx.fillRect(zone.pos.x * 32, zone.pos.y * 32, zone.size.x * 32, zone.size.y * 32);
    });

    // Render walls
    assets.forEach(zone => {
      if (zone.type > 3) return;
      const modifier = zone.texture === 4 ? 4 : 1;
      const zoneType = zone.texture === 4 ? 0 : zone.type;

      zoneCanvas.width = zoneCanvas.height = 128 * modifier;
      zoneCTX.drawImage(images.tiles, zoneType * 128, zone.texture * 128, 128 * modifier, 128 * modifier, 0, 0, 128 * modifier, 128 * modifier);

      ctx.fillStyle = ctx.createPattern(zoneCanvas, "repeat");
      ctx.fillRect(Math.round(zone.pos.x * 32), Math.round(zone.pos.y * 32), zone.size.x * 32, zone.size.y * 32);
    });

    drawTiles(area, focus);
  } else {
    const { zones, assets, texture, background_color } = area;

    const tileSize = 32; // Assuming each tile is 32x32 pixels in the tileset
    const scaledTileSize = tileSize * (fov / 32);

    // Calculate visible area
    const visibleWidth = width / fov;
    const visibleHeight = height / fov;
    const startX = Math.floor(focus.x - visibleWidth / 2);
    const startY = Math.floor(focus.y - visibleHeight / 2);
    const endX = Math.ceil(focus.x + visibleWidth / 2);
    const endY = Math.ceil(focus.y + visibleHeight / 2);
    const areaX = area.pos.x;
    const areaY = area.pos.y;

    // Pre-calculate common values
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Render zones (floor tiles)
    context.imageSmoothingEnabled = false;
    zones.forEach(zone => {
      const zoneStartX = Math.max(startX, zone.pos.x + areaX);
      const zoneStartY = Math.max(startY, zone.pos.y + areaY);
      const zoneEndX = Math.min(endX, zone.pos.x + zone.size.x + areaX);
      const zoneEndY = Math.min(endY, zone.pos.y + zone.size.y + areaY);

      const textureType = zone.type === 6 ? 0 : (zone.type === 4 ? 2 : (zone.type === 5 ? 4 : zone.type));
      const tilesetX = textureType * tileSize * 4;
      const tilesetY = texture * tileSize * 4;

      for (let x = zoneStartX; x < zoneEndX; x++) {
        const screenX = Math.round((x - focus.x) * fov + halfWidth);
        const tileX = ((x - areaX) & 3) * tileSize; // Using bitwise AND for modulo 4

        for (let y = zoneStartY; y < zoneEndY; y++) {
          const screenY = Math.round((y - focus.y) * fov + halfHeight);
          const tileY = ((y - areaY) & 3) * tileSize; // Using bitwise AND for modulo 4

          context.drawImage(
            images.tiles,
            tilesetX + tileX, tilesetY + tileY, tileSize, tileSize,
            screenX, screenY, scaledTileSize, scaledTileSize
          );

          if (zone.background_color || background_color) {
            context.fillStyle = zone.background_color || background_color;
            context.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
          }
        }
      }
    });

    // Render walls
    assets.forEach(zone => {
      if (zone.type > 3) return;
      const modifier = zone.texture === 4 ? 4 : 1;
      const zoneType = zone.texture === 4 ? 0 : zone.type;

      const zoneStartX = Math.max(startX, zone.pos.x + areaX);
      const zoneStartY = Math.max(startY, zone.pos.y + areaY);
      const zoneEndX = Math.min(endX, zone.pos.x + zone.size.x + areaX);
      const zoneEndY = Math.min(endY, zone.pos.y + zone.size.y + areaY);

      const tilesetX = zoneType * tileSize * 4;
      const tilesetY = zone.texture * tileSize * 4;

      for (let x = zoneStartX; x < zoneEndX; x++) {
        const screenX = Math.round((x - focus.x) * fov + halfWidth);
        const tileX = ((x - areaX) % (4 * modifier)) * tileSize;

        for (let y = zoneStartY; y < zoneEndY; y++) {
          const screenY = Math.round((y - focus.y) * fov + halfHeight);
          const tileY = ((y - areaY) % (4 * modifier)) * tileSize;

          context.drawImage(
            images.tiles,
            tilesetX + tileX, tilesetY + tileY, tileSize, tileSize,
            screenX, screenY, scaledTileSize, scaledTileSize
          );
        }
      }
    });
  }
}

function renderAssets(area, players, focus) {
  if (!area.assets.length) return;
  const player = players[0];
  const scale = settings.scale / (32 / fov * settings.scale);
  const assetImages = {
    5: images.flashlight_item,
    6: images.torch,
    7: images.gate,
    8: images.torchUp
  };

  area.assets.forEach(zone => {
    if (zone.type < 5) return;

    const posX = area.pos.x + zone.pos.x;
    const posY = area.pos.y + zone.pos.y;
    const imageX = width / 2 + (posX - focus.x) * fov;
    const imageY = height / 2 + (posY - focus.y) * fov;

    const image = assetImages[zone.type];
    context.drawImage(image, imageX, imageY, image.width * scale, image.height * scale);

    if (zone.type === 5) {
      const dx = posX - focus.x;
      const dy = posY - focus.y;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        player.flashlight = true;
      }
    }
  });
}

function updateBackground(context, width, height, color) {
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.fillStyle = color;
  context.rect(0, 0, width, height);
  context.fill();
  context.closePath();
}

function drawAreaHeader(context, lineSize, strokeStyle, text, width, height, world, size = 35, fillStyle = "#f4faff") {
  const uiScale = settings.ui_scale || 1;
  context.beginPath();
  context.textAlign = "center";
  context.lineWidth = lineSize * uiScale;
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.font = "bold " + (size * uiScale) + "px Tahoma, Verdana, Segoe, sans-serif";
  context.textAlign = "center";
  if (world != null) {
    context.strokeText(world.name + ": " + text, width / 2, height * uiScale);
    context.fillText(world.name + ": " + text, width / 2, height * uiScale);
  } else {
    context.strokeText(text, width / 2, height * uiScale);
    context.fillText(text, width / 2, height * uiScale);
  }
  context.closePath();
}

function applyScale(context, scale, drawFunction) {
  if (scale != 1) {
    context.save();
    context.scale(scale, height / staticHeight); //hmm...
  }
  drawFunction();
  if (scale != 1) {
    context.restore();
  }
}

function changeResolution(newWidth, newHeight) { //hmm...
  const scalingFactor = newWidth / staticWidth;
  width = newWidth;
  height = newHeight;
  fov = 32 * scalingFactor;
  settings.scale = scalingFactor;
  canvas.width = newWidth;
  canvas.height = newHeight;
  window.onresize();
  tilesCanvas = null;
}