
class Game {
  constructor() {
    this.worlds = [];
    this.players = [];
  }
  inputPlayer(player, input) {
    this.players[player].input(input);
  }
  update(time) {
    const loaded = new Map();
    const playersByWorldAndArea = new Map();

    for (const player of this.players) {
      player.update(time, this.worlds[player.world].friction);
      if (!player.ghost && !player.reaperShade) {
        this.teleport(player);
        this.worlds[player.world].collisionPlayer(player.area, player);
      }

      const worldKey = player.world;
      const areaKey = player.area;
      if (!loaded.has(worldKey)) {
        loaded.set(worldKey, new Set());
      }
      loaded.get(worldKey).add(areaKey);

      const key = `${worldKey},${areaKey}`;
      if (!playersByWorldAndArea.has(key)) {
        playersByWorldAndArea.set(key, []);
      }
      playersByWorldAndArea.get(key).push(player);
    }

    for (const [worldKey, areas] of loaded) {
      for (const areaKey of areas) {
        const key = `${worldKey},${areaKey}`;
        const players = playersByWorldAndArea.get(key) || [];
        this.worlds[worldKey].update(areaKey, time, players);
      }
    }
  }
  teleport(player) {
    const area = this.worlds[player.world].areas[player.area];
    let onTele = false;

    for (const zone of area.zones) {
      const zonePos = new Vector(
        this.worlds[player.world].pos.x + area.pos.x + zone.pos.x,
        this.worlds[player.world].pos.y + area.pos.y + zone.pos.y
      );
      const teleporter = closestPointToRectangle(player.pos, zonePos, zone.size);
      const dist = distance(player.pos, teleporter);

      if (zone.type === 5 && dist < player.radius) {
        player.world = 0;
        player.area = 0;
        player.pos = new Vector(6, 9);
        if (settings.dev) {
          player.victoryTimer = 30000;
          if (player.safePoint) {
            player.energy = player.maxEnergy;
            player.firstAbilityCooldown = 0;
            player.secondAbilityCooldown = 0;
            returnToSafePoint(player, false);
          }
        }
        return;
      }

      if ((zone.type === 2 || zone.type === 3) && dist < player.radius) {
        onTele = true;
        if (!player.onTele) {
          const targetPoint = new Vector(player.pos.x + zone.translate.x, player.pos.y + zone.translate.y);
          
          if (zone.type === 2) {
            player.area = this.findClosestArea(targetPoint, player.world);
          } else {
            player.world = this.findClosestWorld(targetPoint);
          }

          player.pos = targetPoint;
          this.worlds[player.world].areas[player.area].load();
          player.dyingPos = new Vector(targetPoint.x, targetPoint.y);
          if (zone.type === 3) player.onTele = true;
        }
      }
    }

    player.onTele = onTele;
  }

  findClosestArea(targetPoint, worldIndex) {
    let minDist = Infinity;
    let closestArea = 0;

    this.worlds[worldIndex].areas.forEach((area, index) => {
      const rect = area.getBoundary();
      rect.x += area.pos.x + this.worlds[worldIndex].pos.x;
      rect.y += area.pos.y + this.worlds[worldIndex].pos.y;
      const closest = closestPointToRectangle(targetPoint, new Vector(rect.x, rect.y), new Vector(rect.w, rect.h));
      const dist = distance(targetPoint, closest);
      if (dist < minDist) {
        minDist = dist;
        closestArea = index;
      }
    });

    return closestArea;
  }

  findClosestWorld(targetPoint) {
    let minDist = Infinity;
    let closestWorld = 0;

    this.worlds.forEach((world, index) => {
      const rect = world.areas[0].getBoundary();
      rect.x += world.pos.x;
      rect.y += world.pos.y;
      const closest = closestPointToRectangle(targetPoint, new Vector(rect.x, rect.y), new Vector(rect.w, rect.h));
      const dist = distance(targetPoint, closest);
      if (dist < minDist) {
        minDist = dist;
        closestWorld = index;
      }
    });

    return closestWorld;
  }
  getStates(index) {
    var player = this.players[index];
    var obj = {}
    var area = this.worlds[player.world].areas[player.area]
    obj.name = this.worlds[player.world].name;
    obj.zones = area.zones;
    obj.assets = area.assets;
    obj.entities = area.entities;
    obj.static_entities = area.static_entities;
    obj.effects = area.effects;
    obj.background_color = area.background_color;
    obj.lighting = area.lighting;
    obj.texture = area.texture||0;
    obj.patterns = area.patterns;
    obj.text = area.text;
    obj.pos = new Vector(area.pos.x + this.worlds[player.world].pos.x, area.pos.y + this.worlds[player.world].pos.y);
    obj.boundary = area.getBoundary();
    obj.magnetism = area.magnetism;
    obj.partial_magnetism = area.partial_magnetism;
    obj.applies_lantern = area.applies_lantern;
    obj.pellet_count = area.pellet_count;
    obj.pellet_multiplier = area.multiplier;
    obj.boss = area.boss;
    return obj;
  }
}
class World {
  constructor(pos, id, map) {
    this.pos = pos;
    this.areas = [];
    this.id = id;
    this.name = "Default";
    this.background_color = "rgba(255,255,255,0)";
    this.friction = 1;
    this.lighting = 1;
    this.magnetism = false;
    this.pellet_count = 25;
    this.pellet_multiplier = 1;
    this.fromJson(map)
  }
  update(area, time, players) {
    this.areas[area].update(time, players, this.pos)
  }
  collisionPlayer(area, players) {
    this.areas[area].collisionPlayer(players, this.pos)
  }
  processSpawner(spawner){
    const preset = [];
    for (const k in spawner) {
      const values = spawner[k];
      const object = {
        type: values.types,
        radius: values.radius || 0,
        speed: values.speed || 0,
        count: values.count || 1,
        x: values.x,
        y: values.y,
        angle: values.angle,
        auraRadius: values.effect_radius
      };

      // Add specific properties based on object type
      const typeSpecificProps = {
        quicksand: ['push_direction', 'quicksand_strength', 'immune', 'classic'],
        flower: ['growth_multiplayer'],
        wind: ['ignore_invulnerability'],
        wind_ghost: ['ignore_invulnerability'],
        homing: ['increment'],
        speed_sniper: ['speed_loss'],
        regen_sniper: ['regen_loss'],
        gravity: ['gravity'],
        repelling: ['repulsion'],
        frost_giant: ['angle', 'direction', 'turn_speed', 'shot_interval', 'cone_angle', 'pause_interval', 'pause_duration', 'turn_acceleration', 'shot_acceleration', 'pattern', 'immune', 'projectile_duration', 'projectile_radius', 'projectile_speed', 'precise_movement'],
        radiating_bullets: ['release_interval', 'release_time'],
        liquid: ['player_detection_radius'],
        draining: ['drain'],
        slowing: ['slow'],
        charging: ['charge'],
        burning: ['burn_modifier'],
        pumpkin: ['player_detection_radius'],
        vary: ['vary_modifier', 'opacity_modifier'],
        invisible: ['opacity_modifier'],
        turning: ['circle_size','turn_speed'],
        summoner: ['spawner'],
        global_spawner: ['spawner', 'cooldown', 'initial_spawner'],
        variable: ['min_speed', 'max_speed', 'speed_change'],
        wavering: ['min_speed', 'max_speed', 'speed_change'],
        slasher: ['slash_radius']
      };

      for (const type of object.type) {
        if(values[`${type}_radius`] !== undefined){
          object[`${type}_radius`] = values[`${type}_radius`];
        }
        if (typeSpecificProps[type]) {
          for (const prop of typeSpecificProps[type]) {
            if (values[prop] !== undefined) object[prop] = values[prop];
          }
        }
      }

      ['move_clockwise', 'initial_side', 'horizontal'].forEach(prop => {
        if (values[prop] !== undefined) object[prop] = values[prop];
      });

      preset.push(object);
    }
    return preset;
  }
  fromJson(json) {
    this.name = json.name
    const areas = json.areas;
    const properties = json.properties
    if (properties) {
      if (properties.background_color !== undefined) {
        var color = properties.background_color
        this.background_color = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] / 255 + ")"
      }
      if (properties.title_stroke_color !== undefined) {
        var color = properties.title_stroke_color
        this.title_stroke_color = color;
      }
      if (properties.friction !== undefined) {
        this.friction = properties.friction;
      }
      if (properties.lighting !== undefined) {
        this.lighting = properties.lighting;
      }
      if (properties.all_enemies_immune !== undefined) {
        this.all_enemies_immune = properties.all_enemies_immune;
      }
      if (properties.magnetism !== undefined) {
        this.magnetism = properties.magnetism;
      }
      if (properties.applies_lantern !== undefined) {
        this.applies_lantern = properties.applies_lantern;
      }
      if (properties.partial_magnetism !== undefined) {
        this.partial_magnetism = properties.partial_magnetism;
      }
      if (properties.pellet_count !== undefined) {
        this.pellet_count = properties.pellet_count;
      }
      if (properties.pellet_multiplier !== undefined) {
        this.pellet_multiplier = properties.pellet_multiplier;
      }    
      if (properties.texture !== undefined) {
        this.texture = textureToId(properties.texture);
      }
    }
    const xBase = areas[0].x === "var x" ? 0 : areas[0].x;
    const yBase = areas[0].y === "var y" ? 0 : areas[0].y;
    let lastDimensions = { height: 0, width: 0, right: 0, bottom: 0, y: 0, x: 0 };
    let lastAreaPos = { x: 0, y: 0, right: 0, bottom: 0 };

    areas.forEach((curArea, i) => {
      const areaName = (curArea.name) ? curArea.name : (curArea.boss) ? "BOSS " + `AREA ${i + 1}` : `Area ${i + 1}`;
      let areaPosX = (typeof curArea.x === "string") ? parseFloat(curArea.x) : curArea.x - xBase;
      let areaPosY = (typeof curArea.y === "string") ? parseFloat(curArea.y) : curArea.y - yBase;
      const { zones, assets, properties: propertiesC } = curArea;
      const curAreaXStr = curArea.x.toString();
      const curAreaYStr = curArea.y.toString();

      if (curAreaXStr.startsWith("var x")) areaPosX = 0;
      if (curAreaYStr.startsWith("var y")) areaPosY = 0;
      if (curAreaXStr.startsWith("last_right")) areaPosX = lastAreaPos.right;
      if (curAreaYStr.startsWith("last_y")) areaPosY = lastAreaPos.y;
      if (curAreaXStr.startsWith("last_x")) areaPosX = lastAreaPos.x;
      if (curAreaYStr.startsWith("last_bottom")) areaPosY = lastAreaPos.bottom;
      
      if(curAreaXStr.includes("+")){
        areaPosX += parseFloat(curAreaXStr.split("+")[1])
     } else if (curAreaXStr.includes("-",1)){
        areaPosX -= parseFloat(curAreaXStr.substring(1).split("-")[1])
     }
      if(curAreaYStr.includes("+")){
        areaPosY += parseFloat(curAreaYStr.split("+")[1])
      } else if (curAreaYStr.includes("-",1)){
        areaPosY -= parseFloat(curAreaYStr.substring(1).split("-")[1])
      }

      lastAreaPos.x = areaPosX;
      lastAreaPos.y = areaPosY;

      const area = new Area(new Vector(areaPosX / 32, areaPosY / 32));
      Object.assign(area, {
        name: areaName,
        background_color: this.background_color,
        title_stroke_color: this.title_stroke_color,
        text: curArea.text,
        lighting: this.lighting,
        pellet_count: this.pellet_count,
        pellet_multiplier: this.pellet_multiplier,
        texture: this.texture
      });



      if (propertiesC) {
        if (propertiesC.background_color) {
          const colorC = propertiesC.background_color;
          area.background_color = `rgba(${colorC[0]},${colorC[1]},${colorC[2]},${colorC[3] / 255})`;
          area.color = true;
        }
        if (propertiesC.title_stroke_color) area.title_stroke_color = propertiesC.title_stroke_color;
        if (propertiesC.lighting !== undefined) area.lighting = propertiesC.lighting;
        if (propertiesC.all_enemies_immune !== undefined) area.all_enemies_immune = propertiesC.all_enemies_immune;
        if (propertiesC.magnetism) area.magnetism = true;
        if (propertiesC.partial_magnetism) area.partial_magnetism = true;
        if (propertiesC.applies_lantern) area.applies_lantern = true;
        if (propertiesC.pellet_count !== undefined) area.pellet_count = propertiesC.pellet_count;
        if (propertiesC.pellet_multiplier !== undefined) area.pellet_multiplier = propertiesC.pellet_multiplier;
        if (propertiesC.texture !== undefined) area.texture = textureToId(propertiesC.texture);
      }

      let lastPosX = 0, lastPosY = 0;

      zones.forEach(zone => {
        const type = zoneTypeToId(zone.type);
        let areax = zone.x, areay = zone.y;
        let widthSize = zone.width, heightSize = zone.height;

        if (heightSize.toString().startsWith("last_height")) heightSize = lastDimensions.height;
        if (widthSize.toString().startsWith("last_width")) widthSize = lastDimensions.width;
        if (areax.toString().startsWith("last_right")) areax = lastDimensions.right - areaPosX;
        if (areay.toString().startsWith("last_bottom")) areay = lastDimensions.bottom - areaPosY;
        if (areay.toString().startsWith("last_y") || areay.toString().startsWith("last_top")) areay = lastDimensions.y;
        if (areax.toString().startsWith("last_x") || areax.toString().startsWith("last_left")) areax = lastDimensions.x;
        if (zone.patterns) area.patterns = zone.patterns;

        // corrupted casino crashes without this ;-;
        if(typeof areax === "string") areax = parseFloat(areax);
        if(typeof areay === "string") areay = parseFloat(areay);

        const absoluteZoneRight = areax + widthSize + areaPosX;
        const absoluteZoneBottom = areay + heightSize + areaPosY;
        lastPosX = Math.max(lastPosX, absoluteZoneRight);
        lastPosY = Math.max(lastPosY, absoluteZoneBottom);

        const xPos = areaPosX + areax;
        const yPos = areaPosY + areay;
        const block = new Zone(
          new Vector(xPos / 32 - areaPosX / 32, yPos / 32 - areaPosY / 32),
          new Vector(widthSize / 32, heightSize / 32),
          type
        );
        block.background_color = area.background_color;

        if (zone.properties) {
          if (zone.properties.background_color) {
            const colorC = zone.properties.background_color;
            block.color = true;
            block.background_color = `rgba(${colorC[0]},${colorC[1]},${colorC[2]},${colorC[3] / 255})`;
          }
          if (zone.properties.minimum_speed !== undefined) block.minimum_speed = zone.properties.minimum_speed;
          if (zone.properties.spawns_pellets !== undefined) block.spawns_pellets = zone.properties.spawns_pellets;
        }

        if (zone.type === "teleport" || zone.type === "exit") {
          block.translate = new Vector(zone.translate.x / 32, zone.translate.y / 32);
        }

        if (zone.spawner) {
          area.preset = area.preset.concat(this.processSpawner(zone.spawner));
        }

        area.preset.sort((a, b) => b.radius - a.radius);
        area.zones.push(block);

        Object.assign(lastDimensions, {
          y: areay,
          x: areax,
          height: heightSize,
          width: widthSize,
          right: xPos + widthSize,
          bottom: yPos + heightSize
        });
      });

      lastAreaPos.right = lastPosX;
      lastAreaPos.bottom = lastPosY;

      const assetTypeMap = { wall: 1, light_region: 4, flashlight_spawner: 5, gate: 7 };
      const wallTextureMap = { normal: 0, leaves: 1, wooden: 2, baguette: 3, ice: 4 };

      for (const key in assets) {
        const asset = assets[key];
        let type = 0;
        let texture;

        if (asset.type in assetTypeMap) {
          type = assetTypeMap[asset.type];
          if (asset.type === "wall" && asset.texture) {
            texture = wallTextureMap[asset.texture];
          }
        } else if (asset.type === "torch") {
          type = asset.upside_down ? 8 : 6;
        }

        if (type !== 0) {
          const position = new Vector((areaPosX + asset.x - areaPosX) / 32, (areaPosY + asset.y - areaPosY) / 32);
          const size = new Vector(asset.width / 32, asset.height / 32);
          const block = new Asset(position, size, type);
          if (texture !== undefined) block.texture = texture;
          area.assets.push(block);
        }
      }
      this.areas.push(area);
    });
  }
}
class Area {
  constructor(pos) {
    this.pos = pos;
    this.zones = [];
    this.assets = [];
    this.entities = {};
    this.static_entities = {};
    this.effects = {};
    this.preset = [];
    this.background_color = "rgba(255,255,255,0)";
    this.name = "undefined";
    this.lighting = 1;
    this.magnetism = false;
  }
  update(time, players, worldPos) {
    const boundary = this.getActiveBoundary();
    const areaBoundary = this.getBoundary();
    const areaOffset = {x: this.pos.x + worldPos.x, y: this.pos.y + worldPos.y};

    // Update static entities
    for (const staticEntityType in this.static_entities) {
      this.static_entities[staticEntityType].forEach(entity => {
        entity.behavior(time, this, areaOffset, players);
      });
    }

    // Update dynamic entities
    for (const entityType in this.entities) {
      this.entities[entityType] = this.entities[entityType].filter(entity => {
        entity.update(time);
        entity.collide(boundary);
        
        for (const asset of this.assets) {
          if (asset.type === 1) {
            const dx = Math.abs(entity.pos.x - (asset.pos.x + asset.size.x / 2));
            const dy = Math.abs(entity.pos.y - (asset.pos.y + asset.size.y / 2));
            const speed = Math.abs(entity.speed / 32);
            if (dx < (asset.size.x / 2 + entity.radius + speed) && dy < (asset.size.y / 2 + entity.radius + speed)) {
              entity.collide({x: asset.pos.x, y: asset.pos.y, w: asset.size.x, h: asset.size.y, t: false, wall: true});
            }
          }
        }

        if (entity.defended) {
          entity.defended = entity.curDefend;
          entity.immune = entity.curDefend;
          entity.curDefend = false;
        }
        
        entity.behavior(time, this, areaOffset, players);
        
        if (!entity.toRemove) {
          const entityBoundary = entity.area_collide ? areaBoundary : boundary;
          const inside = pointInRectangle(
            entity.pos,
            {x: entityBoundary.x + entity.radius, y: entityBoundary.y + entity.radius},
            {x: entityBoundary.w - entity.radius * 2, y: entityBoundary.h - entity.radius * 2}
          );
          
          if (inside || !entity.weak) {
            if (entity.wall_push && !entity.no_collide) {
              entity.pos = closestPointToRectangle(
                entity.pos,
                {x: entityBoundary.x + entity.radius, y: entityBoundary.y + entity.radius},
                {x: entityBoundary.w - entity.radius * 2, y: entityBoundary.h - entity.radius * 2}
              );
            }
            for (const player of players) {
              if(!player.god) entity.interact(player, areaOffset, time);
            }
            return true;
          }
        }
        return false;
      });
    }

    // Update effects
    for (const effectType in this.effects) {
      this.effects[effectType].forEach(entity => {
        entity.behavior(time, this, areaOffset, players);
        for (const player of players) {
          if(!player.god) entity.interact(player, areaOffset, time);
        }
      });
    }
    
    for (const player of players) {
      player.abilities(time, this, areaOffset);
    }
  }
  getBoundary() {
    if (this.zones.length === 0) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }

    const boundaries = this.zones.reduce((acc, zone) => {
      return {
        minX: Math.min(acc.minX, zone.pos.x),
        minY: Math.min(acc.minY, zone.pos.y),
        maxX: Math.max(acc.maxX, zone.pos.x + zone.size.x),
        maxY: Math.max(acc.maxY, zone.pos.y + zone.size.y)
      };
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });

    return {
      x: boundaries.minX,
      y: boundaries.minY,
      w: boundaries.maxX - boundaries.minX,
      h: boundaries.maxY - boundaries.minY
    };
  }
  getActiveBoundary() {
    const activeZones = this.zones.filter(zone => zone.type === 0 || zone.type === 4);
    
    if (activeZones.length === 0) {
      return { x: 0, y: 0, w: 0, h: 0, t: false };
    }

    const boundaries = activeZones.reduce((acc, zone) => {
      return {
        minX: Math.min(acc.minX, zone.pos.x),
        minY: Math.min(acc.minY, zone.pos.y),
        maxX: Math.max(acc.maxX, zone.pos.x + zone.size.x),
        maxY: Math.max(acc.maxY, zone.pos.y + zone.size.y),
        isVictory: acc.isVictory || zone.type === 4
      };
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      isVictory: false
    });

    return {
      x: boundaries.minX,
      y: boundaries.minY,
      w: boundaries.maxX - boundaries.minX,
      h: boundaries.maxY - boundaries.minY,
      t: boundaries.isVictory
    };
  }
  collisionPlayer(player, worldPos) {
    const boundary = this.getBoundary();
    const adjustedBoundary = {
      x: boundary.x + this.pos.x + worldPos.x,
      y: boundary.y + this.pos.y + worldPos.y,
      w: boundary.w,
      h: boundary.h
    };

    const fixed = closestPointToRectangle(
      player.pos,
      new Vector(adjustedBoundary.x + player.radius, adjustedBoundary.y + player.radius),
      new Vector(adjustedBoundary.w - player.radius * 2, adjustedBoundary.h - player.radius * 2)
    );

    player.collides = Math.abs(fixed.x - player.pos.x) + Math.abs(fixed.y - player.pos.y) !== 0;
    player.pos = fixed;

    player.no_slip = false;
    this.checkAssetCollisions(player, worldPos);
    if (player.collides) player.onWallCollision();
  }

  checkAssetCollisions(player, worldPos) {
    for (const asset of this.assets) {
      if (asset.type !== 1) continue;

      const assetRect = {
        centerX: asset.pos.x + this.pos.x + worldPos.x + asset.size.x / 2,
        centerY: asset.pos.y + this.pos.y + worldPos.y + asset.size.y / 2,
        halfWidth: asset.size.x / 2,
        halfHeight: asset.size.y / 2
      };

      if (this.detectRectCircleCollision(player, assetRect)) {
        this.resolveRectCircleCollision(player, assetRect);
      }
    }
  }

  detectRectCircleCollision(player, rect) {
    const distX = Math.abs(player.pos.x - rect.centerX);
    const distY = Math.abs(player.pos.y - rect.centerY);
    return (distX < rect.halfWidth + player.radius) && (distY < rect.halfHeight + player.radius);
  }

  resolveRectCircleCollision(player, rect) {
    player.collides = true;
    const relX = (player.pos.x - rect.centerX) / rect.halfWidth;
    const relY = (player.pos.y - rect.centerY) / rect.halfHeight;

    if (Math.abs(relX) > Math.abs(relY)) {
      // Horizontal collision
      player.pos.x = rect.centerX + (relX > 0 ? 1 : -1) * (rect.halfWidth + player.radius);
    } else {
      // Vertical collision
      player.pos.y = rect.centerY + (relY > 0 ? 1 : -1) * (rect.halfHeight + player.radius);
    }
  }
  load() {
    this.entities = {};
    this.static_entities = {};
    this.effects = {};
    const boundary = this.getActiveBoundary();
    this.spawnPellets(boundary);
    this.spawnEnemies();
  }
  
  spawnPattern(preset, boundary, matchingPattern) {
    const {
      auraRadius: auraRadiusRaw, 
      count: countRaw, 
      radius: radiusRaw,
      speed: speedRaw, 
      x: xRaw, 
      y: yRaw, 
      angle: angleRaw, 
      type: enemyTypes
    } = preset;

    // Determine how many pattern instances to spawn
    const patternCount = (typeof countRaw === 'object') ? random_between(countRaw) : countRaw;
            
    // Spawn each pattern instance
    for (let patternInstance = 0; patternInstance < patternCount; patternInstance++) {
      // Calculate standard properties for this pattern instance
      const standard_radius = (typeof radiusRaw === 'object') ? random_between(radiusRaw) : radiusRaw;
      const standard_speed = (typeof speedRaw === 'object') 
        ? random_between(speedRaw) / (settings.convert_to_legacy_speed ? 30 : 1) 
        : speedRaw / (settings.convert_to_legacy_speed ? 30 : 1);

      // Calculate pattern boundaries to ensure proper positioning
      let maxX = 0, minX = 0, maxY = 0, minY = 0, maxRadius = 0;
      for (const spawner of matchingPattern.spawner) {
        maxX = Math.max(maxX, spawner.x || 0);
        minX = Math.min(minX, spawner.x || 0);
        maxY = Math.max(maxY, spawner.y || 0);
        minY = Math.min(minY, spawner.y || 0);
        maxRadius = Math.max(maxRadius, spawner.radius || standard_radius);
      }
      minX = Math.abs(minX);
      minY = Math.abs(minY);
      
      // Calculate base position for this pattern instance
      const calculateCoordinate = (rawValue, boundarySize, boundaryOffset, maxOffset, minOffset, maxRadius) => {
        if (rawValue !== undefined) {
          if (typeof rawValue === "string" && rawValue.includes(',')) {
            return min_max(...rawValue.split(',').map(parseFloat)) / 32;
          }
          return rawValue / 32;
        }
        const availableSpace = boundarySize * 32 - (maxOffset + maxRadius + minOffset + maxRadius);
        return Math.random() * availableSpace / 32 + boundaryOffset + (minOffset + maxRadius) / 32;
      };

      const basePosX = calculateCoordinate(xRaw, boundary.w, boundary.x, maxX, minX, maxRadius);
      const basePosY = calculateCoordinate(yRaw, boundary.h, boundary.y, maxY, minY, maxRadius);
      
      // Calculate base angle for this pattern instance
      const baseAngle = (angleRaw !== undefined) 
        ? (Math.PI * angleRaw) / 180 
        : Math.random() * Math.PI * 2;

      // Spawn each entity in the pattern
      for (const patternSpawner of matchingPattern.spawner) {
        // Calculate entity-specific properties
        const entityRadius = patternSpawner.radius 
          ? (typeof patternSpawner.radius === 'object') ? random_between(patternSpawner.radius) : patternSpawner.radius 
          : standard_radius;
        
        const entitySpeed = patternSpawner.speed 
          ? (typeof patternSpawner.speed === 'object') ? random_between(patternSpawner.speed) : patternSpawner.speed 
          : standard_speed;
        const finalEntitySpeed = (entitySpeed == standard_speed) ? entitySpeed : entitySpeed / (settings.convert_to_legacy_speed ? 30 : 1);
        
        const patternTypes = patternSpawner.types || enemyTypes;
        
        // Calculate entity position with pattern offsets
        let entityPosX = basePosX;
        let entityPosY = basePosY;

        if (patternSpawner.x !== undefined) {
          entityPosX = basePosX + patternSpawner.x / 32;
        }
        if (patternSpawner.y !== undefined) {
          entityPosY = basePosY + patternSpawner.y / 32;
        }
        
        const entityAngle = patternSpawner.angle !== undefined ? patternSpawner.angle : baseAngle;
        
        const randomIndex = Math.floor(Math.random() * (patternTypes?.length || 1));
        const selectedEnemyType = patternTypes?.[randomIndex];
        const entityAuraRadius = (preset[`${selectedEnemyType}_radius`]) ? preset[`${selectedEnemyType}_radius`] : auraRadiusRaw;

        const enemy = this.createEnemy(
          selectedEnemyType, 
          entityPosX, 
          entityPosY, 
          entityRadius, 
          finalEntitySpeed, 
          entityAngle, 
          preset, 
          entityAuraRadius, 
          patternInstance, 
          patternCount
        );
        
        enemy.isSpawned = true;
        if (this.all_enemies_immune) enemy.immune = true;
        this.addEntity(entityTypes[enemy.type], enemy);
      }
    }
  }
  

  spawnEnemies(extraSpawner, extraSpawnerProps, relativeSpawn) {
    const spawner = extraSpawner ? extraSpawner : this.preset;
    const boundary = this.getActiveBoundary();
    const patterns = this.patterns;

    // Process presets  
    for (const preset of spawner || []) {
      const {
        auraRadius: auraRadiusRaw, count: countRaw, radius: radiusRaw,
        speed: speedRaw, x: xRaw, y: yRaw, angle: angleRaw, type: enemyTypes
      } = preset;

      if (settings.convert_to_legacy_speed && !preset.converted_to_legacy) {
        if (preset.turn_speed) preset.turn_speed /= 30;
        if (preset.turn_acceleration) preset.turn_acceleration /= 30;
        if (preset.shot_acceleration) preset.shot_acceleration /= 30;
        if (preset.projectile_speed) preset.projectile_speed /= 30;
        if (preset.speed_loss) preset.speed_loss /= 30;
        if (preset.increment) preset.increment /= 30;
        if (preset.gravity) preset.gravity /= 30;
        if (preset.repulsion) preset.repulsion /= 30;
        if (preset.quicksand_strength) preset.quicksand_strength /= 30;
        if (preset.min_speed) preset.min_speed /= 30;
        if (preset.max_speed) preset.max_speed /= 30;
        preset.converted_to_legacy = true;
      }

      const patternTypes = [];
      let matchingPattern;
      if (patterns && enemyTypes && Array.isArray(enemyTypes)) {
        for (const enemyType of enemyTypes) {
          matchingPattern = patterns.find(pattern => pattern.name === enemyType);
          if (matchingPattern && matchingPattern.spawner) {
            patternTypes.push(enemyType);
          }
        }
      }

      if (patternTypes.length > 0 && matchingPattern) {
        this.spawnPattern(preset, boundary, matchingPattern);
      } else {
        const count = (typeof countRaw === 'object') ? random_between(countRaw) : countRaw;
        const radius = (typeof radiusRaw === 'object') ? random_between(radiusRaw) : radiusRaw;
        const speed = (typeof speedRaw === 'object') ? random_between(speedRaw) / (settings.convert_to_legacy_speed ? 30 : 1) : speedRaw / (settings.convert_to_legacy_speed ? 30 : 1);
        const x = xRaw;
        const y = yRaw;
        const auraRadius = auraRadiusRaw;

        let angle;
        if (angleRaw !== undefined) {
          angle = (Math.PI * angleRaw) / 180;
        }

        for (let index = 0; index < count; index++) {
          const rand = Math.floor(Math.random() * (enemyTypes?.length || 1));
          const currentEnemyType = enemyTypes?.[rand];
          let currentAuraRadius = auraRadius;
          if(preset[`${currentEnemyType}_radius`]){
            currentAuraRadius = preset[`${currentEnemyType}_radius`];
          }

          let posX, posY;
          if (x !== undefined) {
            posX = typeof x === "string" && x.includes(',')
              ? min_max(...x.split(',').map(parseFloat)) / 32
              : x / 32;
          } else {
            posX = (relativeSpawn) ? extraSpawnerProps.pos.x + Math.cos(extraSpawnerProps.angle + Math.PI * 2 / count * index) * extraSpawnerProps.radius
            : Math.random() * (boundary.w - radius / 16) + boundary.x + radius / 32;
          }

          if (y !== undefined) {
            posY = typeof y === "string" && y.includes(',')
              ? min_max(...y.split(',').map(parseFloat)) / 32
              : y / 32;
          } else {
            posY = (relativeSpawn) ? extraSpawnerProps.pos.y + Math.sin(extraSpawnerProps.angle + Math.PI * 2 / count * index) * extraSpawnerProps.radius
            : Math.random() * (boundary.h - radius / 16) + boundary.y + radius / 32;
          }

          let changing_angle = angle;
          if(relativeSpawn && angle === undefined) {
            changing_angle = (extraSpawnerProps.angle + Math.PI * 2 / count * index) + degrees_to_radians(Math.random() * 45);
          }
          let enemy = this.createEnemy(currentEnemyType, posX, posY, radius, speed, changing_angle, preset, currentAuraRadius, index, count);
          enemy.isSpawned = true;
          if(this.all_enemies_immune) enemy.immune = true;
          if(extraSpawner){
            enemy.Harmless = true;
            enemy.HarmlessEffect = (relativeSpawn) ? 450 : 1000;
            enemy.appearing = true;
          }
          this.addEntity(entityTypes[enemy.type],enemy);
        }
      }
    }
  }

  spawnPellets(boundary) {
    const pelletZones = this.zones.filter(zone => zone.spawns_pellets);
    const pelletsAtZone = boundary.t ? 200 : this.pellet_count;
    const pelletMultiplier = this.pellet_multiplier;
    for (let i = 0; i < pelletsAtZone; i++) {
      const pellet = new Pellet(new Vector(0, 0), pelletMultiplier, pelletZones || []);
      pellet.respawn(this);
      this.addStaticEntity("pellet", pellet);
    }
  }

  createEnemy(enemyType, posX, posY, radius, speed, angle, preset, auraRadius, j, count) {
    switch (enemyType) {
      case "normal":
        return new Normal(new Vector(posX, posY), radius / 32, speed, angle);
      case "wall":
        return new Wall(new Vector(posX, posY), radius / 32, speed, this.getActiveBoundary(), j, count, preset.move_clockwise, preset.initial_side);
      case "dasher":
        return new Dasher(new Vector(posX, posY), radius / 32, speed, angle);
      case "homing":
        return new Homing(new Vector(posX, posY), radius / 32, speed, angle, preset.increment);
      case "slowing":
        return new Slowing(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.slow);
      case "draining":
        return new Draining(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.drain);
      case "oscillating":
        return new Oscillating(new Vector(posX, posY), radius / 32, speed, angle);
      case "turning":
        return new Turning(new Vector(posX, posY), radius / 32, speed, angle, preset.circle_size, preset.turn_speed);
      case "liquid":
        return new Liquid(new Vector(posX, posY), radius / 32, speed, angle, preset.player_detection_radius);
      case "sizing":
        return new Sizing(new Vector(posX, posY), radius / 32, speed, angle);
      case "switch":
        return new Switch(new Vector(posX, posY), radius / 32, speed, angle, j, count);
      case "sniper":
        return new Sniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "freezing":
        return new Freezing(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "web":
        return new Web(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "cobweb":
        return new Cobweb(new Vector(posX, posY), radius / 32, speed, angle);
      case "teleporting":
        return new Teleporting(new Vector(posX, posY), radius / 32, speed, angle);
      case "star":
        return new Star(new Vector(posX, posY), radius / 32, speed, angle);
      case "immune":
        return new Immune(new Vector(posX, posY), radius / 32, speed, angle);
      case "ice_sniper":
        return new IceSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "disabling":
        return new Disabling(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "toxic":
        return new Toxic(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "icicle":
        return new Icicle(new Vector(posX, posY), radius / 32, speed, angle, preset.horizontal);
      case "spiral":
        return new Spiral(new Vector(posX, posY), radius / 32, speed, angle);
      case "gravity":
        return new Gravity(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.gravity);
      case "repelling":
        return new Repelling(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.repulsion);
      case "gravity_ghost":
        return new Gravity_Ghost(new Vector(posX, posY), radius / 32, speed, angle);
      case "repelling_ghost":
        return new Repelling_Ghost(new Vector(posX, posY), radius / 32, speed, angle);
      case "wavy":
        return new Wavy(new Vector(posX, posY), radius / 32, speed, angle);
      case "zigzag":
        return new Zigzag(new Vector(posX, posY), radius / 32, speed, angle);
      case "zoning":
        return new Zoning(new Vector(posX, posY), radius / 32, speed, angle);
      case "radiating_bullets":
        return new Radiating(new Vector(posX, posY), radius / 32, speed, angle, preset.release_interval, preset.release_time);
      case "frost_giant":
        return new FrostGiant(new Vector(posX, posY), radius / 32, (speed) ? speed : 0, angle, preset.direction, preset.turn_speed, preset.shot_interval, preset.cone_angle, preset.pause_interval, preset.pause_duration, preset.turn_acceleration, preset.shot_acceleration, preset.pattern, preset.immune, preset.projectile_duration, preset.projectile_radius, preset.projectile_speed, preset.precise_movement);
      case "speed_sniper":
        return new SpeedSniper(new Vector(posX, posY), radius / 32, speed, angle, preset.speed_loss);
      case "regen_sniper":
        return new RegenSniper(new Vector(posX, posY), radius / 32, speed, angle, preset.regen_loss);
      case "snowman":
        return new Snowman(new Vector(posX, posY), radius / 32, speed, angle);
      case "slippery":
        return new Slippery(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "corrosive":
        return new Corrosive(new Vector(posX, posY), radius / 32, speed, angle);
      case "corrosive_sniper":
        return new CorrosiveSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "enlarging":
        return new Enlarging(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "poison_sniper":
        return new PoisonSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "magnetic_reduction":
        return new MagneticReduction(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "magnetic_nullification":
        return new MagneticNullification(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "positive_magnetic_sniper":
        return new PositiveMagneticSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "negative_magnetic_sniper":
        return new NegativeMagneticSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "tree":
        return new Tree(new Vector(posX, posY), radius / 32, speed, angle);
      case "pumpkin":
        return new Pumpkin(new Vector(posX, posY), radius / 32, speed, preset.player_detection_radius);
      case "fake_pumpkin":
        return new FakePumpkin(new Vector(posX, posY), radius / 32);
      case "experience_drain":
        return new ExperienceDraining(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "fire_trail":
        return new Fire_Trail(new Vector(posX, posY), radius / 32, speed, angle);
      case "wind":
      case "wind_ghost":
        return new Wind(new Vector(posX, posY), radius / 32, speed, angle, preset.ignore_invulnerability);
      case "lava":
        return new Lava(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "burning":
        return new Burning(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.burn_modifier);
      case "sticky_sniper":
        return new StickySniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "ice_ghost":
        return new Ice(new Vector(posX, posY), radius / 32, speed, angle);
      case "positive_magnetic_ghost":
        return new PositiveMagneticGhost(new Vector(posX, posY), radius / 32, speed, angle);
      case "negative_magnetic_ghost":
        return new NegativeMagneticGhost(new Vector(posX, posY), radius / 32, speed, angle);
      case "poison_ghost":
        return new Poison_Ghost(new Vector(posX, posY), radius / 32, speed, angle);
      case "grass":
        return new Grass(new Vector(posX, posY), radius / 32, speed, angle);
      case "defender":
        return new Defender(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "glowy":
        return new Glowy(new Vector(posX, posY), radius / 32, speed, angle);
      case "firefly":
        return new Firefly(new Vector(posX, posY), radius / 32, speed, angle);
      case "mist":
        return new Mist(new Vector(posX, posY), radius / 32, speed, angle);
      case "phantom":
        return new Phantom(new Vector(posX, posY), radius / 32, speed, angle);
      case "lunging":
        return new Lunging(new Vector(posX, posY), radius / 32, speed, angle);
      case "barrier":
        return new Barrier(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "quicksand":
        return new Quicksand(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, preset.push_direction, preset.quicksand_strength, preset.immune, preset.classic);
      case "radar":
        return new Radar(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "wind_sniper":
        return new WindSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "disabling_ghost":
        return new DisablingGhost(new Vector(posX, posY), radius / 32, speed, angle);
      case "sand":
        return new Sand(new Vector(posX, posY), radius / 32, speed, angle);
      case "sandrock":
        return new Sandrock(new Vector(posX, posY), radius / 32, speed, angle);
      case "crumbling":
        return new Crumbling(new Vector(posX, posY), radius / 32, speed, angle);
      case "flower":
        return new Flower(new Vector(posX, posY), radius / 32, speed, angle, preset.growth_multiplayer);
      case "seedling":
        return new Seedling(new Vector(posX, posY), radius / 32, speed, angle);
      case "cactus":
        return new Cactus(new Vector(posX, posY), radius / 32, speed, angle);
      case "speed_ghost":
        return new SpeedGhost(new Vector(posX, posY), radius / 32, speed, angle);
      case "regen_ghost":
        return new RegenGhost(new Vector(posX, posY), radius / 32, speed, angle);
      case "stalactite":
        return new Stalactite(new Vector(posX, posY), radius / 32, speed, angle);
      case "charging":
        return new Charging(new Vector(posX, posY), radius / 32, speed, angle);
      case "lead_sniper":
        return new LeadSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "reducing":
        return new Reducing(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "blocking":
        return new Blocking(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "force_sniper_a":
        return new ForceSniperA(new Vector(posX, posY), radius / 32, speed, angle);
      case "force_sniper_b":
        return new ForceSniperB(new Vector(posX, posY), radius / 32, speed, angle);
      case "infectious":
        return new Infectious(new Vector(posX, posY), radius / 32, speed, angle);
      case "penny":
        return new Penny(new Vector(posX, posY), radius / 32, speed, angle);
      case "confectioner":
        return new Confectioner(new Vector(posX, posY), radius / 32, speed, angle);
      case "confectioner_switch":
        return switchCombiner(Confectioner, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#cfc6f9");
      case "penny_switch":
        return switchCombiner(Penny, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#d9b67f");
      case "wavy_switch":
        return switchCombiner(Wavy, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#fa5336");
      case "spiral_switch":
        return switchCombiner(Spiral, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#f5e199");
      case "zoning_switch":
        return switchCombiner(Zoning, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#b35f40");
      case "oscillating_switch":
        return switchCombiner(Oscillating, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#b6c46f");
      case "homing_switch":
        return switchCombiner(Homing, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#694d0e");
      case "dasher_switch":
        return switchCombiner(Dasher, new Vector(posX, posY), radius / 32, speed, angle, j, count, "#00243d");
      case "vary":
        return new Vary(new Vector(posX, posY), radius / 32, speed, angle, preset.vary_modifier, preset.opacity_modifier)
      case "invisible":
        return new Invisible(new Vector(posX, posY), radius / 32, speed, angle, preset.opacity_modifier);
      case "halfwall":
        return new HalfWall(new Vector(posX, posY), radius / 32, speed, this.getActiveBoundary(), j, count);
      case "blind":
        return new Blind(new Vector(posX, posY), radius / 32, speed, angle);
      case "lotus_flower":
        return new LotusFlower(new Vector(posX, posY), radius / 32, speed, angle);
      case "ninja_star_sniper":
        return new NinjaStarSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "summoner":
        return new Summoner(new Vector(posX, posY), radius / 32, speed, angle, preset.spawner);
      case "global_spawner":
        return new GlobalSpawner(new Vector(posX, posY), radius / 32, speed, angle, preset.spawner, preset.cooldown, preset.initial_spawner);
      case "slasher":
        return new Slasher(new Vector(posX, posY), radius / 32, speed, angle, preset.slash_radius);
      case "withering":
        return new Withering(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "void_crawler":
        return new VoidCrawler(new Vector(posX, posY), radius / 32, speed, angle);
      case "dripping":
        return new Dripping(new Vector(posX, posY), radius / 32, speed, angle);
      case "wavering":
        return new Wavering(new Vector(posX, posY), radius / 32, speed, angle, preset.min_speed, preset.max_speed, preset.speed_change);
      case "variable":
        return new Wavering(new Vector(posX, posY), radius / 32, speed, angle, preset.min_speed, preset.max_speed, preset.speed_change);
      case "expander":
        return new Expander(new Vector(posX, posY), radius / 32, speed, angle);
      case "cursed":
        return new Cursed(new Vector(posX, posY), radius / 32, speed, angle);
      case "silence":
        return new Silence(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "void_drain":
        return new VoidDrain(new Vector(posX, posY), radius / 32, speed, angle, auraRadius);
      case "void_sniper":
        return new VoidSniper(new Vector(posX, posY), radius / 32, speed, angle);
      case "void_swarm":
        return new VoidSwarm(new Vector(posX, posY), radius / 32, speed, angle);
      case "static":
        return new Static(new Vector(posX, posY), radius / 32, speed, angle);
      case "thunderbolt":
        return new Thunderbolt(new Vector(posX, posY), radius / 32, speed, angle);
      case "superstar":
        return new Superstar(new Vector(posX, posY), radius / 32, speed, angle);
      default:
        return new Unknown(new Vector(posX, posY), radius / 32, speed, angle);
    }
  }
  addEffect(type,pos,power){
    if(type == 0){
      var effect = new SweetTooth(new Vector(pos.x,pos.y),power)
      this.addEntitiesBehind("SweetTooth", effect,1);
    }
  }
  addSniperBullet(type, pos, angle, radius, speed, ...properties) {
    const bulletTypes = {
      0: { name: "SniperProjectile", class: SniperBullet },
      1: { name: "IceSniperProjectile", class: IceSniperBullet },
      2: { name: "RadiatingProjectile", class: RadiatingBullet },
      3: { name: "SpeedProjectile", class: SpeedSniperBullet },
      4: { name: "RegenProjectile", class: RegenSniperBullet },
      5: { name: "CorrosiveSniperProjectile", class: CorrosiveSniperBullet },
      6: { name: "PoisonSniperProjectile", class: PoisonSniperBullet },
      7: { name: "PositiveMagneticSniperProjectile", class: PositiveMagneticSniperBullet },
      8: { name: "NegativeMagneticSniperProjectile", class: NegativeMagneticSniperBullet },
      9: { name: "frost_giant_ice_projectile", class: frost_giant_ice_bullet },
      10: { name: "leaf_projectile", class: leaf_projectile },
      11: { name: "sticky_projectile", class: StickySniperBullet },
      12: { name: "radar_projectile", class: RadarBullet },
      13: { name: "WindSniperProjectile", class: WindSniperBullet },
      14: { name: "Residue", class: Residue },
      15: { name: "stalactite_projectile", class: StalactiteProjectile },
      16: { name: "LeadSniperProjectile", class: LeadSniperBullet },
      17: { name: "ForceSniperAProjectile", class: ForceSniperABullet },
      18: { name: "ForceSniperBProjectile", class: ForceSniperBBullet },
      19: { name: "NinjaStarSniperProjectile", class: NinjaStarSniperBullet },
      20: { name: "VoidSniperProjectile", class: VoidSniperBullet },
      21: { name: "VoidSwarmProjectile", class: VoidSwarmBullet }
    };

    if (bulletTypes[type]) {
      const { name, class: BulletClass } = bulletTypes[type];
      const bulletArgs = [new Vector(pos.x, pos.y), angle, radius, speed, ...properties];
      const bullet = new BulletClass(...bulletArgs);
      this.addEntity(name, bullet);
    }
  }

  addEntity(name, entity) {
    const entityName = name + ' ' + entity.radius + ' radius';
    if(this.entities[entityName] === undefined) this.entities[entityName] = [];
    this.entities[entityName].push(entity);
  }
  addEntitiesBehind(name, entity, amount){ // ¯\_(ツ)_/¯
    const isExists = this.entities[name] !== undefined;
    const newEntities = isExists ? this.entities[name] : [];
    for(let i = 0; i<amount; i++){
      newEntities.push(entity);
    }
    const entObj = {[name] : newEntities};
    const oldEntites = this.entities;
    this.entities = entObj;
    Object.assign(this.entities, oldEntites)
  }
  addStaticEntity(name, entity) {
    if(this.static_entities[name] === undefined) this.static_entities[name] = [];
    this.static_entities[name].push(entity);
  }
  addEffect(name, entity) {
    if(this.effects[name] === undefined) this.effects[name] = [];
    this.effects[name].push(entity);
  }
}
class Zone {
  constructor(pos, size, type) {
    this.pos = new Vector(pos.x, pos.y);
    this.size = new Vector(size.x, size.y);
    this.type = type;
    this.background_color = "rgba(255,255,255,0)";
  }
}
class Asset {
  constructor(pos, size, type) {
    this.pos = new Vector(pos.x, pos.y);
    this.size = new Vector(size.x, size.y);
    this.type = type;
  }
}
