class Entity {
  constructor(pos, radius, color) {
    this.pos = pos;
    this.radius = this.fixedRadius = radius;
    this.color = color;
    this.vel = new Vector(0, 0);
    this.outline = false;
    this.speedMultiplier = this.radiusMultiplier = 1;
    this.angle = this.speed = this.friction = 0;
    this.weak = false;
    this.renderFirst = true;
    this.Harmless = false;
    this.immune = true;
    this.wall_push = true;
    this.isEnemy = false;
    this.toRemove = false;
    this.no_collide = false;
    this.returnCollision = false;
  }

  angleToVel(angle = this.angle) {
    const target = this.useRealVel ? this.realVel : this.vel;
    target.x = Math.cos(angle) * this.speed || 0;
    target.y = Math.sin(angle) * this.speed || 0;
  }

  velToAngle() {
    const source = this.useRealVel ? this.realVel : this.vel;
    this.angle = Math.atan2(source.y, source.x);
    if (!this.useRealVel) {
      this.speed = Math.hypot(source.x, source.y);
    }
  }

  update(time) {
    const timeFix = time / (1000 / 30);
    
    if (!this.noAngleUpdate) {
      this.velToAngle();
      this.angleToVel();
    }
    
    this.radius = this.fixedRadius * this.radiusMultiplier;
    this.radiusMultiplier = 1;
    
    const speedMult = this.speedMultiplier;
    
    if (this.freeze > 0) {
      this.freeze = Math.max(0, this.freeze - time);
    } else {
      this.pos.x += this.vel.x * speedMult / 32 * timeFix;
      this.pos.y += this.vel.y * speedMult / 32 * timeFix;
    }
    
    if (this.sugar_rush > 0) {
      this.speedMultiplier *= 0.05;
      this.sugar_rush -= time;
    }
    
    const dim = 1 - this.friction;
    this.vel.x *= dim;
    this.vel.y *= dim;
    
    this.speedMultiplier = 1;
  }

  collide(boundary) {
    collisionEnemy(this, boundary, this.vel, this.pos, this.radius, this.returnCollision);
  }

  behavior(time, area, offset, players) {}
  interact(player, worldPos) {}
  isHarmless(){
    return this.Harmless || this.disabled || this.clownHarm || this.healing > 0; 
  }
}

class Enemy extends Entity {
  constructor(pos, type, radius, speed, angle, color, aura, auraColor, auraSize) {
    super(pos, radius, color);
    this.renderFirst = false;
    this.outline = true;
    this.type = type;
    this.aura = aura;
    this.auraColor = auraColor;
    this.auraSize = this.auraStaticSize = auraSize || 0;
    this.speed = speed;
    this.angle = angle === undefined ? this.getRandomAngle() : angle;
    this.angleToVel(angle)
    this.decayed = false;
    this.repelled = false;
    this.shatterTime = 0;
    this.immune = false;
    this.isEnemy = true;
    this.self_destruction = false;
  }
  getRandomAngle(){
    return Math.random() * Math.PI * 2;
  }

  update(time) {
    const timeFix = time / (1000 / 30);
    
    this.radius = this.fixedRadius * this.radiusMultiplier;
    this.auraSize = this.auraStaticSize * this.radiusMultiplier;
    this.radiusMultiplier = 1;

    if (!this.noAngleUpdate) {
      this.velToAngle();
      this.angleToVel();
    }

    if (this.healing > 0) this.healing -= time;
    if (this.minimized > 0) {
      this.radiusMultiplier *= 0.5;
      this.minimized -= time;
    }
    if (this.HarmlessEffect > 0) {
      this.HarmlessEffect -= time;
      this.Harmless = this.HarmlessEffect > 0;
    }

    let speedMult = this.speedMultiplier;
    if (this.slowdown_time > 0) {
      this.slowdown_time = Math.max(0, this.slowdown_time - time);
      speedMult *= this.slowdown_amount;
    }
    if (this.sugar_rush > 0) {
      speedMult *= 0.05;
      this.sugar_rush -= time;
    }

    if (this.freeze > 0) {
      this.freeze = Math.max(0, this.freeze - time);
    } else {
      this.pos.x += this.vel.x * speedMult / 32 * timeFix;
      this.pos.y += this.vel.y * speedMult / 32 * timeFix;
    }

    const dim = 1 - this.friction * timeFix;
    this.vel.x *= dim;
    this.vel.y *= dim;

    this.decayed = this.repelled = false;
    this.shatterTime = Math.max(0, this.shatterTime - time);
    this.speedMultiplier = 1;
  }

  interact(player, worldPos, time) {
    interactionWithEnemy(player, this, worldPos, true, this.corrosive, this.immune);
    if (this.aura && !player.isEffectImmune()) {
      this.auraEffect(player, worldPos, time);
    }
  }

  auraEffect(player, worldPos) {}
}

class Pellet extends Entity {
  constructor(pos, power = 1, zones = []) {
    const colors = ["#b84dd4", "#a32dd8", "#3b96fd", "#43c59b", "#f98f6b", "#61c736"];
    super(pos, 8 / 32, colors[Math.floor(Math.random() * colors.length)]);
    this.multiplier = power;
    this.spawnZones = zones;
    this.static = true;
    this.scaleOscillator = new Pulsation(1.1,1.2,.005,true);
  }

  behavior(time, area, offset, players) {
    this.scaleOscillator.update(time);
    for (const player of players) {
      if (this.checkCollision(player, offset)) {
        this.respawn(area);
        this.updatePlayer(player);
        break;
      }
    }
  }

  checkCollision(player, offset) {
    return distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < player.radius + this.radius;
  }

  getRandomPosition(zone) {
    const x = Math.random() * (zone.w - 2 * this.radius) + zone.x + this.radius;
    const y = Math.random() * (zone.h - 2 * this.radius) + zone.y + this.radius;
    return new Vector(x, y);
  }

  respawn(area) {
    const combinedZone = this.getCombinedZone(area);
    this.pos = this.getRandomPosition(combinedZone);
    if (this.spawnZones.length !== 0) { 
      let attempts = 0;
      const maxAttempts = 100;
      while (!this.spawnZones.some(zone => 
        this.pos.x >= zone.pos.x && this.pos.x <= zone.pos.x + zone.size.x &&
        this.pos.y >= zone.pos.y && this.pos.y <= zone.pos.y + zone.size.y
      )){
        this.pos = this.getRandomPosition(combinedZone);
        attempts++;
        if (attempts > maxAttempts) {
          console.warn("Max attempts reached while respawning pellet. Using last position.");
          break;
        }
      };
    }
    if(area.assets.length === 0) return;

    this.isSpawned = true;
    for(let i = 0; i < area.assets.length; i++){
      const asset = area.assets[i];
      if(asset.type !== 1) continue;
      isSpawned({x: asset.pos.x, y: asset.pos.y, w: asset.size.x, h: asset.size.y, t: false, wall: true}, this);
    }
  }

  getCombinedZone(area) {
    if (this.spawnZones.length === 0) return area.getActiveBoundary();
    return this.spawnZones.reduce((acc, zone) => {
      const minX = Math.min(acc.x, zone.pos.x);
      const minY = Math.min(acc.y, zone.pos.y);
      const maxX = Math.max(acc.x + acc.w, zone.pos.x + zone.size.x);
      const maxY = Math.max(acc.y + acc.h, zone.pos.y + zone.size.y);
      return {
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY
      };
    }, { x: this.spawnZones[0].pos.x, y: this.spawnZones[0].pos.y, w: this.spawnZones[0].size.x, h: this.spawnZones[0].size.y });
  }

  updatePlayer(player) {
    player.updateExperience(Math.ceil((parseInt(player.area) + 1) / 3) * this.multiplier);
    if (player.usesPellets) {
      this.updatePelletCount(player);
    }
  }

  updatePelletCount(player) {
    if (player.usesPellets === 1 || player.usesPellets === 3) {
      player.firstPellet = Math.max(0, player.firstPellet - this.multiplier);
    }
    if (player.usesPellets === 2 || player.usesPellets === 3) {
      player.secondPellet = Math.max(0, player.secondPellet - this.multiplier);
    }
  }
}
class Player {
  constructor(pos, type, speed, color, className) {
    this.name = "Player";
    this.id = Math.random();
    this.type = type;
    this.pos = pos;
    this.className = className;
    this.ab1 = images.abilityOne;
    this.ab2 = images.abilityTwo;
    this.ab1ML = 5;
    this.ab2ML = 5;
    this.previousPos = this.pos;
    this.previousAngle = 0;
    this.oldPos = this.pos;
    this.radius = 15 / 32;
    this.fixedRadius = 15 / 32;
    this.lightCount = 0;
    this.staticRadius = 15;
    this.color = color;
    this.tempColor = color
    this.strokeColor = color;
    this.speed = speed;
    this.world = 0;
    this.area = 0;
    this.herocard = true;
    this.minimap = true;
    this.overlay = true;
    this.experienceDraining=false;
    this.maxEnergy = 30;
    this.vertSpeed = -1;
    this.reaperShade = false;
    this.magnetDirection = "Down"
    this.magnet = false;
    this.flashlight = false;
    this.flashlight_active = false;
    this.energy = this.maxEnergy;
    this.regen = 1;
    this.vel = new Vector(0, 0);
    this.invincible = false;
    this.tempPrevExperience=0;
    this.tempNextExperience=4;
    this.speedMultiplier = 1;
    this.speedAdditioner = 0;
    this.radiusMultiplier = 1;
    this.radiusAdditioner = 0;
    this.regenAdditioner = 0;
    this.verticalSpeedMultiplayer = 0;
    this.addX=0;
    this.addY=0;
    this.dirX=0;
    this.dirY=0;
    this.firstAbility = false;
    this.firstAbilityPressed = false;
    this.firstAbilityCooldown = 0;
    this.secondAbility = false;
    this.secondAbilityPressed = false;
    this.secondAbilityCooldown = 0;
    this.magnetAbilityPressed = false;
    this.lastAng = 90;
    this.inputAng = 0;
    this.frozen = true;
    this.frozenTime = 0;
    this.frozenTimeLeft = 0;
    this.poison = false;
    this.poisonTime = 0;
    this.poisonTimeLeft = 0;
    this.onTele = false;
    this.slowing = false;
    this.freezing = false;
    this.draining = false;
    this.inBarrier = false;
    this.quicksand = {
      angle: undefined,
      strength: 5,
      active: false
    };
    this.charging = false;
    this.slippery = false;
    this.disabling = false;
    this.prevSlippery = false;
    this.dyingPos = new Vector(0, 0);
    this.level = 1;
    this.points = (settings.no_points) ? 0 : 150;
    this.upgradeBrightness = new Pulsation(175,255,5);
    this.experience = 0;
    this.deathCounter = 0;
    this.hasCheated = false;
    this.safeZone = true;
    this.minimum_speed = 1;
    this.onDeathSecondAb = false;
    this.abs_d_x = 0;
    this.abs_d_y = 0;
    this.d_x = 0;
    this.d_y = 0;
    this.previousLevelExperience = 0;
    this.nextLevelExperience = 4;
    this.cent_max_distance = 10;
    this.cent_distance = 0;
    this.cent_input_ready = true;
    this.cent_acceleration = 7.5/32;
    this.cent_deceleration = this.cent_acceleration * 4;
    this.cent_accelerating = false;
    this.cent_is_moving = false;
    this.distance_moved_previously = [0,0];
    this.aura = false;
    this.auraType = -1;
    this.collides = false;
    this.effectImmune = 1;
    this.leadTimeLeft = 0;
    this.leadTime = 0;
    this.reducingEffect = 0;
    this.burningTimer = 0;
    this.stickness = 0;
    this.stickyTrailTimer = 0;
    this.sticky = false;
    this.maxSpeed = 17;
    this.maxUpgradableEnergy = 300;
    this.maxRegen = 7;
    this.ghost = false;
    this.timer = 0;
    this.victoryTimer = 0;
    this.webstickness = 0;
    this.web = false;
    this.cobweb = false;
    this.maxLives = 3;
    this.lives = this.maxLives;
    this.safeAmount = 0;
    this.collidedPrev = false;
    this.knockback_limit_count = 0;
    this.isDead = false;
  }
  input(input) {
    // Dev overlay ping calculation
    if (this.overlay && settings.dev) {
      const now = Date.now();
      if (input.isMouse && (ping.mouse.x !== input.mouse.x || ping.mouse.y !== input.mouse.y)) {
        ping.mouse.x = input.mouse.x;
        ping.mouse.y = input.mouse.y;
        const index = ping.mouseArray.findIndex(m => m.x === input.mouse.x && m.y === input.mouse.y);
        ping.array.push(now - ping.mouseTimer[index]);
      } else if (input.keys[68] && !ping.previous) {
        ping.array.push(now - ping.activationTime);
        ping.previous = true;
      } else if (!input.keys[68]) {
        ping.previous = false;
      }
      if (ping.array.length > 25) ping.array.shift();
    }

    // Reset state
    this.mouseActive = false;
    this.distance_movement = this.isDead ? 0 : 1;
    this.firstAbility = this.secondAbility = this.shift = false;

    // Handle upgrades
    if (input.keys && this.points > 0) {
      const upgrades = [
        { key: KEYS[1], prop: 'speed', max: this.maxSpeed, inc: 0.5, unlocked: true },
        { key: KEYS[2], prop: 'maxEnergy', max: this.maxUpgradableEnergy, inc: 5, unlocked: true },
        { key: KEYS[3], prop: 'regen', max: this.maxRegen, inc: 0.2, unlocked: true },
        { key: KEYS[4], prop: 'ab1L', max: this.ab1ML, unlocked: this.firstAbilityUnlocked },
        { key: KEYS[5], prop: 'ab2L', max: this.ab2ML, unlocked: this.secondAbilityUnlocked }
      ];

      upgrades.forEach(({ key, prop, max, inc, unlocked }) => {
        if (input.keys[key] && this[prop] < max && unlocked) {
          this[prop] = Math.min(this[prop] + (inc || 1), max);
          this.points--;
        }
      });
    }
    // Handle dead state
    if (this.isDead) {
      if ((this.className === "Necro" || this.className === "Chrono") && input.keys) {
        const abilityKeys = input.keys[KEYS.J] || input.keys[KEYS.Z];
        this.firstAbility = abilityKeys && !this.firstAbilityPressed;
        this.firstAbilityPressed = abilityKeys;
      }
      return;
    }

    // Handle abilities
    if (input.keys && !this.disabling) {
      const abilities = [
        { keys: [KEYS.J, KEYS.Z], ability: 'first' },
        { keys: [KEYS.K, KEYS.X], ability: 'second' }
      ];

      abilities.forEach(({ keys, ability }) => {
        const pressed = keys.some(key => input.keys[key]);
        this[`${ability}Ability`] = pressed && !this[`${ability}AbilityPressed`];
        this[`${ability}AbilityPressed`] = pressed;
      });
    }
    //if(this.slippery) return;
    
    if (input.keys[KEYS.SHIFT]) {
      this.shift = true;
    }
    if (this.energy-1>0 && !this.disabling && !this.magnetAbilityPressed && (this.magnet||this.flashlight||this.lantern) && (input.keys[KEYS.C] || input.keys[KEYS.L])) {
      if(this.magnetDirection=="Down"){this.magnetDirection = "Up"}
      else if(this.magnetDirection=="Up"){this.magnetDirection = "Down"}
      this.magnetAbilityPressed = true;
      this.flashlight_active = !this.flashlight_active;
      this.lantern_active = !this.lantern_active;
      if(this.magnet)this.energy -= 1;
    }

    if (!(input.keys[KEYS.C] || input.keys[KEYS.L])) {
      this.magnetAbilityPressed = false;
    }

    if(this.prevSlippery || this.cent_is_moving) return;
    if(this.shouldCentMove() && !this.cent_can_change_input_angle()){
      this.mouse_angle = this.cent_saved_angle;
      this.distance_movement = 1;
      return;
    } else if (input.isMouse&&!this.isMovementKeyPressed(input)) {
      this.mouse_distance_full_strength = 150*settings.scale;
      this.mouseActive = true;
      if(this.slippery){this.mouse_distance_full_strength = 1;}
      this.dirX = Math.round(input.mouse.x - width / 2);
      this.dirY = Math.round(input.mouse.y - height / 2);
      this.dist = distance(new Vector(0, 0), new Vector(this.dirX, this.dirY));

      if (this.dist > this.mouse_distance_full_strength) {
        this.dirX *= this.mouse_distance_full_strength / this.dist;
        this.dirY *= this.mouse_distance_full_strength / this.dist;
      }
      
      this.input_angle = this.mouse_angle = Math.atan2(this.dirY,this.dirX);
      this.mouse_distance = Math.min(this.mouse_distance_full_strength,Math.sqrt(this.dirX**2+this.dirY**2))
      this.distance_movement = this.mouse_distance/this.mouse_distance_full_strength;
    } else {
      this.dirY = 0; 
      this.dirX = 0;
      this.moving = false;
      if(this.isMovementKeyPressed(input)){
        this.moving = true;
        input.isMouse = false;
      }
      this.dirY = (input.keys[KEYS.S] || input.keys[KEYS.DOWN]) ? 1 : 
                  (input.keys[KEYS.W] || input.keys[KEYS.UP]) ? -1 : 0;
      this.dirX = (input.keys[KEYS.D] || input.keys[KEYS.RIGHT]) ? 1 : 
                  (input.keys[KEYS.A] || input.keys[KEYS.LEFT]) ? -1 : 0;
      this.input_angle = Math.atan2(this.dirY, this.dirX);

    }
    if(this.shouldCentMove() && this.cent_can_change_input_angle()){
      this.cent_saved_angle = this.input_angle;
      this.cent_input_ready = false;
      this.cent_is_moving = true;
    }
  }
  //returns true if the player should be using cent's movement system.
  //returns true if player is cent with specifically no lead effect or non-cent with lead effect
  shouldCentMove(){
    //special case for harden
    if (this.harden) return false;
    return (this.className == "Cent" && this.leadTimeLeft <= 0) || (this.className != "Cent" && this.leadTimeLeft > 0);
  }
  isMovementKeyPressed(input){
    return (input.keys[87] || input.keys[38] || input.keys[65] || input.keys[37] || input.keys[83] || input.keys[40] || input.keys[68] || input.keys[39]);
  }
  calculateExperience(HeroLevel){
    return Math.floor(Math.min(HeroLevel,100)*Math.min(HeroLevel+1,101)*2+Math.max(0,HeroLevel*(HeroLevel+1)*(2*HeroLevel-179)/60-3535))
  }
  updateExperience(toAdd){
    this.experience += toAdd;
    while (this.experience >= this.nextLevelExperience) {
      this.experience-=this.tempPrevExperience-this.previousLevelExperience;
      this.level++;
      this.tempPrevExperience=this.calculateExperience(this.level-1)
      this.tempNextExperience=this.calculateExperience(this.level)
      this.nextLevelExperience=this.tempNextExperience;
      this.previousLevelExperience=this.tempPrevExperience;
      this.points++;
    }
  }
  upgradeToMaxStats(){
    this.maxEnergy = this.maxUpgradableEnergy;
    this.speed = this.maxSpeed;
    this.regen = this.maxRegen;
  }
  calculateAreaZones(area) {
    let minimum_speed = 0;
    let safeZone = true;
    const playerX = this.pos.x - game.worlds[this.world].pos.x - area.pos.x;
    const playerY = this.pos.y - game.worlds[this.world].pos.y - area.pos.y;
    const playerRadius = this.radius;

    for (let i = 0; i < area.zones.length; i++) {
      const zone = area.zones[i];
      if (zone.type === 0 || zone.minimum_speed) {
        if (playerX < zone.pos.x + zone.size.x + 0.5 &&
            playerX + playerRadius > zone.pos.x &&
            playerY < zone.pos.y + zone.size.y + 0.5 &&
            playerY + playerRadius > zone.pos.y) {
          if (zone.type === 0) {
            safeZone = false;
            if (!zone.minimum_speed) continue;
          }
          if (zone.minimum_speed) {
            const zoneMinSpeed = this.shift ? zone.minimum_speed * 0.5 : zone.minimum_speed;
            const speed = settings.convert_to_legacy_speed ? zoneMinSpeed / 30 : zoneMinSpeed;
            minimum_speed = Math.max(minimum_speed, speed * this.speedMultiplier + this.speedAdditioner);
          }
        }
      }
    }
    return { safeZone, minimum_speed };
  }

  calculateSpeedChanges(speed) {
    return speed * this.speedMultiplier + this.speedAdditioner;
  }
  calculateSpeed(minimum_speed){
    return Math.max(this.calculateSpeedChanges(minimum_speed),this.calculateSpeedChanges(this.speed));
  }
  update(time, friction) {
    this.update_knockback(time);
    this.upgradeBrightness.update(time);
    const timeFix = time / (1000 / 30);
    const world = game.worlds[this.world];
    const area = world.areas[this.area];
    const areaZones = this.calculateAreaZones(area);
    this.safeZone = areaZones.safeZone;
    this.calculateEffects(time);
    const speed = this.calculateSpeed(areaZones.minimum_speed);
    const magnetism = (area.magnetism || world.magnetism) ? true : false;
    const partial_magnetism = (area.partial_magnetism || world.partial_magnetism) ? true : false;
    const vertical_speed = ((partial_magnetism) ? this.speed / 2 : 10) * this.verticalSpeedMultiplayer;
    this.magnet = (magnetism || partial_magnetism) ? true : false;

    if(area.applies_lantern) this.lantern = true;
    
    if(this.flashlight_active || this.lantern_active){
      this.energy -= 1 * time / 1000;
    }

    this.energy += (this.regen+this.regenAdditioner) * time / 1000;
    if (this.energy > this.maxEnergy) {
      this.energy = this.maxEnergy;
    }

    if(this.victoryTimer<=0){
      this.timer += time;
    } else {
      this.victoryTimer -= time;
      if(this.victoryTimer<=0){
        this.timer = 0;
      }
    }
    if(!area.matched && this.area != 0){
      area.matched = true;
      this.updateExperience(12*(parseInt(this.area)));
    }
    this.distance_movement *= speed;
    if(this.shouldCentMove() && (!this.slippery || this.collides)){
      this.cent_max_distance = this.distance_movement * 2;
      if(this.cent_is_moving){
        if(this.cent_accelerating){
          if(this.cent_distance < this.cent_max_distance){
            this.cent_distance += this.cent_acceleration * this.distance_movement * timeFix;
          } else {
            this.cent_distance = this.cent_max_distance;
            this.cent_accelerating = false;
          }
        } else {
          if(this.cent_distance > 0){
            this.cent_distance -= this.cent_deceleration * this.distance_movement * timeFix;
          } else {
            this.cent_distance = 0;
            this.cent_accelerating = true;
            this.cent_is_moving = false;
            this.cent_input_ready = true;
          }
        }
        if(this.cent_distance<0){this.cent_distance = 0;}
      }
      this.distance_movement = this.cent_distance;
    }
    if (this.shift) {
      this.distance_movement *= 0.5;
    }
    if(this.shouldCentMove() && !this.cent_can_change_input_angle()){
      this.mouse_angle = this.cent_saved_angle;
      this.d_x = this.distance_movement * Math.cos(this.mouse_angle);
      this.d_y = this.distance_movement * Math.sin(this.mouse_angle);
    } else if(this.shouldCentMove()){
      this.d_x = 0;
      this.d_y = 0;
    } else if(this.mouseActive) {
      this.d_x = this.distance_movement * Math.cos(this.mouse_angle);
      this.d_y = this.distance_movement * Math.sin(this.mouse_angle);
    } else {
      this.d_x = this.distance_movement * this.dirX;
      this.d_y = this.distance_movement * this.dirY;
    }
    
    
    if(!this.safeZone && (magnetism || partial_magnetism)){
      if(!partial_magnetism){
        this.d_y = 0;
      }
      if(this.magnetDirection == "Down"){
        this.pos.y += vertical_speed / 32 * timeFix;
      }
      else if(this.magnetDirection == "Up"){
        this.pos.y += -vertical_speed / 32 * timeFix;
      }
    }

    this.oldPos = (this.previousPos.x == this.pos.x && this.previousPos.y == this.pos.y) ? this.oldPos : new Vector(this.previousPos.x,this.previousPos.y)  
    this.previousPos = new Vector(this.pos.x, this.pos.y);
    if(!this.slippery){
      const friction_factor = 1 - (friction * timeFix);

      this.slide_x = this.distance_moved_previously[0];
      this.slide_y = this.distance_moved_previously[1];

      this.slide_x *= friction_factor;
      this.slide_y *= friction_factor;

      this.d_x *= timeFix;
      this.d_y *= timeFix;

      this.d_x += this.slide_x;
      this.d_y += this.slide_y;

      this.abs_d_x = Math.abs(this.d_x);
      this.abs_d_y = Math.abs(this.d_y);

      if (this.abs_d_x<0.001) {
        this.d_x = 0;
      }
      if (this.abs_d_y<0.001) {
        this.d_y = 0;
      }

      if(this.shouldCentMove()){
        if(this.abs_d_x > this.cent_max_distance){
          this.d_x *= this.cent_max_distance / this.abs_d_x;
        }
        if(this.abs_d_y > this.cent_max_distance){
          this.d_y *= this.cent_max_distance / this.abs_d_y;
        }
      } else {
        if(this.abs_d_x>this.distance_movement){
          this.d_x *= this.distance_movement / this.abs_d_x;
        }
        if(this.abs_d_y>this.distance_movement){
          this.d_y *= this.distance_movement / this.abs_d_y;
        }
      }
      this.distance_moved_previously = [this.d_x,this.d_y];
    } else {
      this.distance_moved_previously = [0,0];
    }
    
    this.prevSlippery = this.slippery;

    if (this.mouseActive || this.moving) {
      this.previousAngle = (this.mouseActive) ? this.mouse_angle : Math.atan2(this.d_y,this.d_x);
    }

    let prvLead = this.leadTimeLeft;
    this.leadTimeLeft = Math.max(0,this.leadTimeLeft-time);
    if (this.leadTimeLeft !== prvLead && this.leadTimeLeft === 0){
      this.cent_input_ready = true;
      this.cent_accelerating = false;
      this.cent_is_moving = false;
    }
    this.firstAbilityCooldown = Math.max(this.firstAbilityCooldown-time,0);
    this.secondAbilityCooldown = Math.max(this.secondAbilityCooldown-time,0);
    if (!settings.cooldown) {
      this.energy = this.maxEnergy;
      this.firstAbilityCooldown = 0;
      this.secondAbilityCooldown = 0;
      this.firstPellet = 0;
      this.secondPellet = 0;
    }
    this.tempColor=this.color;
    this.move(this.d_x,this.d_y,timeFix);
    if(this.god&&this.isDead){this.isDead=false;}
    else if(this.deathTimer<=0&&this.isDead){death(this);}
    else if(this.isDead)this.deathTimer-=time;
    if(this.invincible_time>=0){
      this.invincible_time-=time;
      if(this.invincible_time<=0){
        this.invincible = false;
      }
    }
    this.clearEffects();
  }
  move(x,y,timeFix){
    this.pos.x += x / 32 * timeFix;
    this.pos.y += y / 32 * timeFix;
  }
  abilities(time, area, bound) {

  }
  calculateEffects(time){
    const timeFix = time / (1000 / 30);
    this.inBarrier = false;
    this.verticalSpeedMultiplayer = 1;
    this.radius = this.fixedRadius * this.radiusMultiplier;
    
    // Apply effects
    if (this.magnetic_reduction) this.verticalSpeedMultiplayer = 0.5 * this.effectImmune;
    if (this.magnetic_nullification) this.verticalSpeedMultiplayer = 0;
    if (this.enlarging) this.radiusAdditioner += 10 * this.effectImmune;
    
    if (this.poison) {
      this.poisonTime += time;
      this.speedMultiplier *= 3;
    }
    if (this.fusion) this.speedMultiplier *= 0.7;
    if (this.slowing) this.applySlowness(this.slow);
    if (this.freezing) this.applySlowness(0.15);
    
    if (this.web || this.cobweb) {
      this.webstickness = this.webstickness <= 0 ? 0.1 : this.webstickness + (Math.pow(0.85 - this.webstickness, 2) * 0.2) * timeFix;
      if (this.cobweb && this.web) this.applySlowness(this.webstickness, 1 - this.webstickness, true);
      else if (this.cobweb) this.applySlowness(this.webstickness, 1 - this.webstickness, false);
      else if (this.web) this.applySlowness(this.webstickness);
    } else if (this.webstickness > 0) this.webstickness = 0;
    
    if (this.sticky || this.stickness > 0) this.applySlowness(0.3);
    
    if (this.experienceDraining) {
      this.experience = Math.max(0, this.experience - (2 * this.level * time / 1e3) * this.effectImmune);
      if (this.experience < this.previousLevelExperience) {
        const diff = this.previousLevelExperience - this.experience;
        this.previousLevelExperience -= diff;
        this.nextLevelExperience += diff;
        this.previousLevelExperience = Number(this.previousLevelExperience.toFixed(5));
        this.nextLevelExperience = Number(this.nextLevelExperience.toFixed(5));
      }
    }
    
    if (this.speedghost && this.speed - (0.1 * this.effectImmune) * timeFix >= 5) {
      const oldSpeed = this.speed;
      this.speed -= (0.1 * this.effectImmune) * timeFix;
      if (!settings.no_points && Math.floor(oldSpeed * 2) !== Math.floor(this.speed * 2)) {
        this.points++;
      }
    }
    
    if (this.regenghost && this.regen - (0.04 * this.effectImmune) * timeFix >= 1) {
      const oldRegen = this.regen;
      this.regen = Math.max(1, this.regen - (0.04 * this.effectImmune) * timeFix);
      if (!settings.no_points && Math.floor(oldRegen * 5) !== Math.floor(this.regen * 5)) {
        this.points++;
      }
    }
    
    if (this.quicksand.active && !(this.god || this.inBarrier || this.harden)) {
      const power = this.quicksand.strength / 32;
      const angle = (this.quicksand.angle || this.quicksand.angle === 0) ? this.quicksand.angle * (Math.PI / 180) : this.previousAngle;
      this.pos.x += Math.cos(angle) * power * timeFix;
      this.pos.y += Math.sin(angle) * power * timeFix;
      this.quicksand.angle = undefined;
      this.quicksand.active = false;
    }
    
    if (this.charging) {
      this.energy = Math.min(this.maxEnergy, this.energy + (this.charge * time / 1000) * this.effectImmune);
      if (this.energy >= this.maxEnergy && !this.draining) {
        this.energy = 0;
        death(this);
      }
    }
    
    if (this.draining) this.energy = Math.max(0, this.energy - (this.drain * time / 1000) * this.effectImmune);
    
    if (this.burning) {
      this.burningTimer += time * this.effectImmune * this.burn_modifier;
      if (this.burningTimer > 1000) death(this);
    } else {
      this.burningTimer = Math.max(0, this.burningTimer - time);
    }
    
    if (this.reducing) {
      this.reducingEffect += time * this.effectImmune / 100;
    } else if (this.reducingEffect > 0) {
      this.reducingEffect = Math.max(0, this.reducingEffect - time / 100);
    }
    
    if (this.frozen) {
      this.speedMultiplier = 0;
      this.speedAdditioner = 0;
      this.frozenTime += time;
    }
    
    // Post-effect processing
    this.radius = Math.max(0, this.radius + (this.reducingEffect ? -Math.floor(this.reducingEffect) / 32 : 0) + this.radiusAdditioner / 32);
    this.radiusAdditioner = 0;
    
    if (this.radius === 0 && this.reducing) death(this);
    
    if (this.poisonTime >= this.poisonTimeLeft) {
      this.poison = false;
      this.poisonTimeLeft = 0;
    }
    
    if (this.frozenTime >= this.frozenTimeLeft) {
      this.frozen = false;
      this.frozenTimeLeft = 0;
    }
    
    if (this.shadowed_time_left > 0) {
      this.shadowed_time_left -= time;
    } else {
      this.knockback_limit_count = 0;
      this.shadowed_invulnerability = false;
    }
    
    if (this.stickness > 0) {
      if (this.stickyTrailTimer == 0 && !this.safeZone) {
        this.stickyTrailTimer = 250;
        const world = game.worlds[this.world];
        const area = world.areas[this.area];
        const trail = new StickyTrail(new Vector(this.pos.x - world.pos.x - area.pos.x, this.pos.y - world.pos.y - area.pos.y));
        area.addEntity("sticky_trail", trail);
      }
      this.stickness = Math.max(0, this.stickness - time);
      this.stickyTrailTimer = Math.max(0, this.stickyTrailTimer - time);
    }
    
    if (this.inEnemyBarrier) this.inBarrier = true;

    if(this.disabling) {
      this.firstAbilityPressed = false;
      this.secondAbilityPressed = false;
      this.firstAbility = false;
      this.secondAbility = false;
      this.firstAbilityActivated = false;
      this.secondAbilityActivated = false;
      this.flashlight_active = false;
      this.lantern_active = false;
      this.flow = false;
      this.harden = false;
      this.paralysis = false;
      this.stomp = false;
      this.distort = false;
      this.aura = false;
      this.sugar_rush = false;
    }
  }
  applySlowness(slowness, argument, min){
    const slowdown = (this.effectImmune > 1) ? (1-(1-slowness**this.effectImmune)) : (1-this.effectImmune*(1-slowness));
    if(argument === undefined) {
      this.speedMultiplier *= slowdown;
    } else {
      if(min) {
        this.speedMultiplier *= Math.min(argument,slowdown);
      } else {
        this.speedMultiplier *= argument;
      }
    }
  }
  clearEffects(){
    if(!this.blocking){
      this.reducing = false;
      this.slowing = false;
      this.freezing = false;
      this.web = false;
      this.cobweb = false;
      this.sticky = false;
      this.draining = false;
      this.experienceDraining = false;
      this.speedghost = false;
      this.regenghost = false;
      this.inEnemyBarrier = false;
      this.charging = false;
      this.burning = false;
      this.slippery = false;
      this.enlarging = false;
      this.disabling = false;
      this.magnetic_reduction = false;
      this.magnetic_nullification = false;
    }
    this.blocking = false;
    this.radiusAdditioner = 0;
    this.radiusMultiplier = 1;
    this.regenAdditioner = 0;
    this.speedMultiplier = 1;
    this.speedAdditioner = 0;
  }
  knockback_player(time,enemy,push_time,radius,offset){
    const timeFix = time / (1000 / 30);
    this.knockback = true;
    this.knockback_push_time = push_time;
    this.knockback_enemy_pos = new Vector(enemy.pos.x+offset.x,enemy.pos.y+offset.y);
    this.knockback_enemy_radius = radius;
    this.knockback_multiplayer = this.effectImmune;
    this.knockback_limit_count += 1;

    const ePos = this.knockback_enemy_pos;
    const pPos = this.pos;
    const distance_between = distance(ePos,pPos)-this.radius;
    const distance_remaining = this.knockback_enemy_radius - distance_between;
    const angle = Math.atan2(ePos.y-pPos.y,ePos.x-pPos.x)-Math.PI;
    const y_distance_remaining = Math.sin(angle) * distance_remaining;
    const x_distance_remaining = Math.cos(angle) * distance_remaining;

    const ticks_until_finished = this.knockback_push_time / timeFix;
    this.knockback_x_speed = x_distance_remaining / ticks_until_finished;
    this.knockback_y_speed = y_distance_remaining / ticks_until_finished;
  }
  update_knockback(time){
    if(!this.knockback) return;
    const timeFix = time / (1000 / 30);
    if(this.knockback_push_time > 0){
    
      this.push_player(this.pos.x+this.knockback_x_speed*this.knockback_multiplayer,
                       this.pos.y+this.knockback_y_speed*this.knockback_multiplayer);
      this.knockback_push_time -= time;
      if(this.knockback_multiplayer > 0){
        this.knockback_multiplayer -= 0.17 * timeFix;
      }
      if(this.knockback_multiplayer < 0){
        this.knockback_multiplayer = 0;
      }
    }
    else if (this.knockback_push_time < 0){
      this.knockback_push_time = 0;
      this.knockback = false;
      if(this.knockback_limit_count < 100){
        this.knockback_limit_count = 0;
      } else {
        this.shadowed_invulnerability = true;
        this.shadowed_time_left = 1000;
        this.shadowed_time = 1000;
        this.knockback_limit_count = 0;
      }
    }
  }
  push_player(x,y){
    this.pos.x = x;
    this.pos.y = y;
  }
  cent_can_change_input_angle(){
    return (this.cent_input_ready) ? 
    true : this.cent_accelerating && 2 * this.cent_distance < this.cent_max_distance;
  }
  isDetectable(){
    return !this.god && !this.isDead && !this.night && !this.safeZone;
  }
  isInvulnerable(){
    return this.god || this.inBarrier || this.shadowed_invulnerability || this.invincible;
  }
  isEffectImmune(){
    return this.effectImmune === 0 || this.god || this.isDead || this.safeZone;
  }
  onWallCollision(){
    this.no_slip = true;
    this.slippery_wall_speed_multiplier = 2;
  }
}
class Basic extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#FF0000", "Basic");
    this.hasAB = true; 
    this.ab1L = 0; 
    this.ab2L = 0; 
    this.strokeColor = "#b60000";
  }
}
class Jotunn extends Player {
  constructor(pos, speed) {
    super(pos, 1, speed, "#5cacff", "Jötunn");
    this.hasAB = true; 
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = settings.max_abilities ? 5 : 0; 
    this.firstTotalCooldown = 0; 
    this.secondTotalCooldown = 6000;
    this.firstAbilityUnlocked = this.secondAbilityUnlocked = true;
    this.strokeColor = "#3c8ccf";
  }

  abilities(time, area, offset) {
    const secondAbilityCost = 30;
    const shatterTime = 4000;
    const decayRadius = 170 / 32;

    if (this.ab1L) {
      const playerPos = new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
      const decaySlowdown = this.getDecaySlowdown();
      
      Object.values(area.entities).flat().forEach(entity => {
        if (!entity.immune && distance(entity.pos, playerPos) < decayRadius + entity.radius) {
          entity.speedMultiplier *= decaySlowdown;
          entity.decayed = true;
        }
      });
    }

    if (this.secondAbility && this.energy >= secondAbilityCost && this.secondAbilityCooldown === 0 && this.ab2L) {
      this.energy -= secondAbilityCost;
      this.updateSecondAbilityCooldown();
      
      Object.values(area.entities).flat().forEach(entity => {
        if (entity.decayed) {
          entity.shatterTime = shatterTime;
        }
      });
    }
  }

  updateSecondAbilityCooldown() {
    this.secondTotalCooldown = this.secondAbilityCooldown = 9000 - (this.ab2L) * 1000;
  }

  getDecaySlowdown() {
    return 1 - (this.ab1L) * 0.1;
  }
}
class Burst extends Player {
  constructor(pos, speed) {
    super(pos, 2, speed, "#AA3333", "Burst");
    this.firstAbilityCost = 5;
    this.secondAbilityCost = 20;
    this.firstAbilityCooldown = 500;
    this.secondAbilityCooldown = 1000;
  }

  abilities(time, area, offset) {
    if(this.firstAbility)this.useFirstAbility(area, offset);
    if(this.secondAbility)this.useSecondAbility(area);
  }

  useFirstAbility(area, offset) {
    if (this.canUseAbility(this.firstAbilityCost, this.firstAbilityCooldown)) {
      this.energy -= this.firstAbilityCost;
      this.firstAbilityCooldown = 500;
      const velocity = this.calculateVelocity();
      const dynamite = new Dynamite(
        new Vector(this.pos.x - offset.x, this.pos.y - offset.y),
        new Vector(velocity.x * 50, velocity.y * 50),
        this.id
      );
      area.addEntity("dynamites", dynamite);
    }
  }

  useSecondAbility(area) {
    if (this.canUseAbility(this.secondAbilityCost, this.secondAbilityCooldown)) {
      this.energy -= this.secondAbilityCost;
      this.secondAbilityCooldown = 1000;
      this.detonateDynamites(area);
    }
  }

  canUseAbility(cost, cooldown) {
    return this.energy > cost && cooldown === 0;
  }

  calculateVelocity() {
    const dist = distance(this.pos, this.previousPos);
    return dist === 0
      ? { x: 1, y: 0 }
      : {
          x: (this.pos.x - this.previousPos.x) / dist,
          y: (this.pos.y - this.previousPos.y) / dist
        };
  }

  detonateDynamites(area) {
    const newDynamites = [];
    area.entities["dynamites"].forEach(dynamite => {
      if (dynamite.owner === this.id) {
        this.applyExplosionEffect(area, dynamite);
        area.addEntity("explosionParticle", new ExplosionParticle(dynamite.pos));
      } else {
        newDynamites.push(dynamite);
      }
    });
    area.entities["dynamites"] = newDynamites;
  }

  applyExplosionEffect(area, dynamite) {
    Object.values(area.entities).flat().forEach(entity => {
      if (this.isAffectedByExplosion(entity, dynamite)) {
        this.redirectEntity(entity, dynamite);
      }
    });
  }

  isAffectedByExplosion(entity, dynamite) {
    return distance(dynamite.pos, entity.pos) < 9 && !entity.immune && entity.isEnemy;
  }

  redirectEntity(entity, dynamite) {
    const speed = Math.hypot(entity.vel.x, entity.vel.y);
    const direction = {
      x: entity.pos.x - dynamite.pos.x,
      y: entity.pos.y - dynamite.pos.y
    };
    const magnitude = Math.hypot(direction.x, direction.y);
    entity.vel = {
      x: (speed * direction.x) / magnitude,
      y: (speed * direction.y) / magnitude
    };
  }
}

class Dynamite extends Entity {
  constructor(pos, vel, id) {
    super(pos, 1 / 3, "#A33");
    this.vel = vel;
    this.friction = 0.1;
    this.owner = id;
    this.wall_push = false;
    this.no_collide = true;
  }
}

class ExplosionParticle extends Entity {
  constructor(pos) {
    super(pos, 1 / 3, null);
    this.g = 255;
    this.a = 1;
    this.wall_push = false;
  }

  behavior(time) {
    const timeScale = time / 1000;
    this.g -= 500 * timeScale;
    this.a -= 1.25 * timeScale;
    this.radius += 10 * timeScale;
    this.fixedRadius = this.radius;
    this.color = `rgba(255,${this.g},0,${this.a})`;
  }
}

class Pole extends Player {
  constructor(pos, speed) {
    super(pos, 4, speed, "#955CF1", "Pole");
    this.gravity = 4 / 32;
    this.secondAbilityCost = 30;
    this.secondAbilityCooldown = 0;
    this.secondTotalCooldown = 6000;
  }

  abilities(time, area, offset) {
    this.applyGravityField(time, area, offset);
    this.useSecondAbility(time, area, offset);
  }

  applyGravityField(time, area, offset) {
    const playerPos = new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
    const timeFactor = time / (1000 / 30);

    Object.values(area.entities).flat().forEach(entity => {
      if (!entity.immune && this.isInGravityField(entity, playerPos)) {
        this.attractEntity(entity, playerPos, timeFactor);
      }
    });
  }

  isInGravityField(entity, playerPos) {
    return distance(entity.pos, playerPos) < (150 / 32) + entity.radius;
  }

  attractEntity(entity, playerPos, timeFactor) {
    const dx = entity.pos.x - playerPos.x;
    const dy = entity.pos.y - playerPos.y;
    const dist = distance(new Vector(0, 0), new Vector(dx, dy));
    const attractionAmplitude = Math.pow(1.5, -(dist / (100 / 32)));
    const moveDist = this.gravity * attractionAmplitude * timeFactor;
    const angleToEnemy = Math.atan2(dy, dx);

    entity.pos.x += moveDist * Math.cos(angleToEnemy);
    entity.pos.y += moveDist * Math.sin(angleToEnemy);
    entity.repelled = true;
  }

  useSecondAbility(time, area, offset) {
    if (this.secondAbility && this.energy >= this.secondAbilityCost && this.secondAbilityCooldown === 0) {
      this.energy -= this.secondAbilityCost;
      this.secondAbilityCooldown = this.secondTotalCooldown;
      this.spawnMonoPole(area, offset);
    }
  }

  spawnMonoPole(area, offset) {
    const velocity = this.calculateVelocity();
    const pole = new MonoPole(
      new Vector(this.pos.x - offset.x, this.pos.y - offset.y),
      new Vector(velocity.x * 60, velocity.y * 60)
    );
    area.addEntity("monoPole", pole);
  }

  calculateVelocity() {
    const dist = distance(this.pos, this.previousPos);
    return dist === 0
      ? { x: 1, y: 0 }
      : {
          x: (this.pos.x - this.previousPos.x) / dist,
          y: (this.pos.y - this.previousPos.y) / dist
        };
  }
}

class MonoPole extends Entity {
  constructor(pos, vel) {
    super(pos, 2 / 5, "#ff0000");  // Set initial color to red
    this.vel = vel;
    this.friction = 0.125;
    this.area_collide = true;
    this.clock = 0;
    this.gravity = 5 / 32;
    this.a = 1;
  }

  behavior(time, area) {
    this.updateClock(time);
    this.applyGravityField(time, area);
  }

  updateClock(time) {
    const timeInSeconds = time / 1000;
    this.clock += timeInSeconds;
    if (this.clock > 0) {  // Start fading immediately
      this.a = Math.max(0, 1 - (this.clock / 3));  // Fade over 3 seconds
      this.color = `rgba(255,0,0,${this.a})`;
    }
    if (this.clock > 3) {
      this.toRemove = true;
    }
  }

  applyGravityField(time, area) {
    const timeFactor = time / (1000 / 30);
    Object.values(area.entities).flat().forEach(entity => {
      if (!entity.immune && this.isInGravityField(entity)) {
        this.repelEntity(entity, timeFactor);
      }
    });
  }

  isInGravityField(entity) {
    return distance(entity.pos, this.pos) < (130 / 32) + entity.radius;
  }

  repelEntity(entity, timeFactor) {
    const dx = entity.pos.x - this.pos.x;
    const dy = entity.pos.y - this.pos.y;
    const dist = distance(new Vector(0, 0), new Vector(dx, dy));
    const repulsionAmplitude = Math.pow(0.5, -(dist / (100 / 32)));
    const moveDist = this.gravity * repulsionAmplitude * timeFactor;
    const angleToEnemy = Math.atan2(dy, dx);

    entity.pos.x -= moveDist * Math.cos(angleToEnemy);
    entity.pos.y -= moveDist * Math.sin(angleToEnemy);
  }
}

class Lantern extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#008000", "Lantern");
    this.firstTime = 0;
    this.secondTime = 0;
    this.energyDrainRate = 5;
    this.lastSpawnTime = { follower: 0, shrinker: 0 };
    this.spawnDelay = 50;
  }

  abilities(time, area, offset) {
    const timeInSeconds = time / 1000;
    const currentTime = Date.now();

    this.toggleAbility('firstAbilityActivated', this.firstAbility);
    this.toggleAbility('secondAbilityActivated', this.secondAbility);

    if (this.firstAbilityActivated) {
      this.useAbility(timeInSeconds, currentTime, area, offset, 'firstTime', 0.005, this.createFollower.bind(this), 'follower');
    }

    if (this.secondAbilityActivated) {
      this.useAbility(timeInSeconds, currentTime, area, offset, 'secondTime', 0.01, this.createShrinker.bind(this), 'shrinker');
    }

    this.updateEntities(area.entities);
  }

  toggleAbility(abilityName, trigger) {
    if (trigger) this[abilityName] = !this[abilityName];
  }

  useAbility(timeInSeconds, currentTime, area, offset, timeProperty, interval, createEntity, entityType) {
    this[timeProperty] += timeInSeconds;
    this.energy -= this.energyDrainRate * timeInSeconds;

    if (this.energy < 0) {
      this.energy = 0;
      this[timeProperty.replace('Time', 'AbilityActivated')] = false;
      return;
    }

    if (this[timeProperty] > interval && currentTime - this.lastSpawnTime[entityType] >= this.spawnDelay) {
      createEntity(area, offset);
      this[timeProperty] = 0;
      this.lastSpawnTime[entityType] = currentTime;
    }
  }

  createFollower(area, offset) {
    area.addEntity("follower", new Follower(this.getOffsetPosition(offset)));
  }

  createShrinker(area, offset) {
    area.addEntity("shrinker", new Shrinker(this.getOffsetPosition(offset)));
  }

  getOffsetPosition(offset) {
    return new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
  }

  updateEntities(entities) {
    for (const type in entities) {
      entities[type].forEach(entity => {
        if (entity.shrinked) {
          entity.radiusMultiplier *= 0.5;
          entity.shrinked = false;
        }
      });
    }

    if (this.shrinked) {
      this.radiusMultiplier *= 0.5;
      this.shrinked = false;
    }
  }
}

class Follower extends Entity {
  constructor(pos) {
    super(pos, 1.2, "rgba(0,200,0,0.15)");
    this.clock = 0;
    this.wall_push = false;
    this.lifespan = 1;
  }

  behavior(time, area, offset, players) {
    this.clock += time / 1000;
    if (this.clock > this.lifespan) {
      this.toRemove = true;
      return;
    }

    this.affectEnemies(area.entities);
  }

  affectEnemies(entities) {
    for (let entityType in entities) {
      entities[entityType].forEach(entity => {
        if (!entity.immune && entity.isEnemy && this.isColliding(entity)) {
          entity.shrinked = true;
        }
      });
    }
  }

  isColliding(entity) {
    return distance(this.pos, entity.pos) < this.radius + entity.fixedRadius;
  }
}

class Shrinker extends Entity {
  constructor(pos) {
    super(pos, 1.8, "rgba(0,0,200,0.1)");
    this.clock = 0;
    this.wall_push = false;
    this.lifespan = 3;
  }

  behavior(time, area, offset, players) {
    this.clock += time / 1000;
    if (this.clock > this.lifespan) {
      this.toRemove = true;
      return;
    }

    this.shrinkPlayers(players, offset);
  }

  shrinkPlayers(players, offset) {
    players.forEach(player => {
      if (this.isPlayerInRange(player, offset)) {
        player.radiusMultiplier *= 0.5;
        player.shrinked = true;
      }
    });
  }

  isPlayerInRange(player, offset) {
    return distance(new Vector(this.pos.x + offset.x, this.pos.y + offset.y), player.pos) < this.radius + player.fixedRadius;
  }
}
class Shade extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#826565", "Shade");
    this.firstTime=0;
    this.secondTime=0;
    this.hasAB = true; 
    this.ab1L = (settings.max_abilities) ? 5 : 0;
    this.ab2L = (settings.max_abilities) ? 5 : 0;
    this.firstAbilityUnlocked = true;
    this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 7000; 
    this.secondTotalCooldown = 1000;
    this.shadeSpeed = 0;
    this.strokeColor = "#423545";
  }
  abilities(time, area, offset) {
    const firstAbilityCost = 30;
    const secondAbilityCost = 5;
    if (this.firstAbility && this.ab1L) {
      if(this.energy>=firstAbilityCost&&this.firstAbilityCooldown==0){
        this.energy-=firstAbilityCost;
        this.firstAbilityCooldown+=7000;
        this.shadeNight = 7000;
        this.shadeSpeed = 1.25*(this.ab1L-1);
        this.night = true;
      }
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= secondAbilityCost && this.ab2L) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.updateSecondAbilityCooldown();
      this.energy -= secondAbilityCost;
      area.addEntity(0, new shadeVengeance(new Vector(this.pos.x - offset.x, this.pos.y - offset.y),this.mouseActive ? this.mouse_angle : this.previousAngle, 1.3, 58, this.id))
    }
    if(this.night){
      this.speedAdditioner += this.shadeSpeed;
    }
    if(this.night && this.shadeNight > 0){
      this.shadeNight-=time;
    } else if(this.shadeNight <= 0 && this.night){
      this.night = false;
      this.speedAdditioner=0;
    } else {this.shadeNight = 0}
  }
  updateSecondAbilityCooldown(){
    this.secondTotalCooldown = 3000 - 500*(this.ab2L-1);
    this.secondAbilityCooldown = this.secondTotalCooldown;
  }
}

class shadeVengeance extends Entity {
  constructor(pos,angle,radius,speed,owner) {
    super(pos, radius, "brown");
    this.speed=speed;
    this.owner = owner;
    this.wall_push = true;
    this.isEnemy = false;
    this.acceleration = 2;
    this.weak = false; //affects if destroyed outside of map bounds
    this.toRemove = false;
    this.no_collide = true; //(false - maybe makes a ball bounce off the walls inside area
    this.isSpawned = false;
    this.returning = false;
    this.vel.x = Math.cos(angle+10e-8) * speed;
    this.vel.y = Math.sin(angle+10e-8) * speed;
    this.oldAngle = this.angle;
    this.targetAngle = this.angle;
    this.texture = "vengeance_projectile";
    this.clock=0
  }
  compute_speed(){
    if(this.returning && this.speed<70) {
      this.speed += this.acceleration*(this.clock*(60/1000));
    } else if(!this.returning) {
      this.speed -= this.acceleration*(this.clock*(60/1000))
      if ((this.speed - this.acceleration)<0) {
        this.angle = Math.atan2(this.vel.y, this.vel.x);
        this.speed==0
        this.returning=true;
        this.angle = this.angle + Math.PI;
      }
    }
    this.angleToVel();
    this.oldAngle = this.angle;
  }
  behavior(time, area, offset, players) {
    this.clock=time
    if (this.returning) {
      let index;
      for (var i in players) {
          index = i;
        }
      this.velToAngle();
      if (index != undefined) {
        let dX = (players[index].pos.x - offset.x) - this.pos.x;
        let dY = (players[index].pos.y - offset.y) - this.pos.y;
        this.targetAngle = Math.atan2(dY, dX);
        this.angle = this.targetAngle
      }
      this.angleToVel();
    }
    this.compute_speed();
    for (let j in area.entities) {
      for (let k in area.entities[j]) {
        if ((area.entities[j][k].isEnemy||area.entities[j][k].weak)&&!area.entities[j][k].immune) {
          if (distance(area.entities[j][k].pos, new Vector(this.pos.x, this.pos.y)) < this.radius+area.entities[j][k].radius) {
            if(this.returning) {
              area.entities[j][k].freeze = 6000;
            } else if(!this.returning) {
              area.entities[j][k].freeze = 0;
              area.entities[j][k].slowdown_amount = 0.25;
              area.entities[j][k].slowdown_time = 6000;
            }
          }
        }
      }
    }
  }
  collide() {
    let local_area = game.worlds[game.players[0].world].areas[game.players[0].area]
    let local_boundary = local_area.getBoundary()
    let local_assets = local_area.assets
    for (let i in local_assets) {
      if (local_assets[i].type==1) {
        let rectHalfSizeX_1 = local_assets[i].size.x / 2;
        let rectHalfSizeY_1 = local_assets[i].size.y / 2;
        let rectCenterX_1 = local_assets[i].pos.x + rectHalfSizeX_1;
        let rectCenterY_1 = local_assets[i].pos.y + rectHalfSizeY_1;
        let distX_1 = Math.abs(this.pos.x - rectCenterX_1);
        let distY_1 = Math.abs(this.pos.y - rectCenterY_1);
        if ((distX_1 < rectHalfSizeX_1 + this.radius) && (distY_1 < rectHalfSizeY_1 + this.radius)) {
          // Collision
          let relX_1 = (this.pos.x - rectCenterX_1) / rectHalfSizeX_1;
          let relY_1 = (this.pos.y - rectCenterY_1) / rectHalfSizeY_1;
          if (Math.abs(relX_1) > Math.abs(relY_1)) {
            // Horizontal collision.
            if (relX_1 > 0) {
              // Right collision
              this.pos.x = rectCenterX_1 + rectHalfSizeX_1 + this.radius;
              this.vel.x = Math.abs(this.vel.x);
              this.velToAngle();
              this.targetAngle = this.angle;
            } else {
              // Left collision
              this.pos.x = rectCenterX_1 - rectHalfSizeX_1 - this.radius;
              this.vel.x = -Math.abs(this.vel.x);
              this.velToAngle();
              this.targetAngle = this.angle;
            }
          } else {
            // Vertical collision
            if (relY_1 < 0) {
              // Up collision
              this.pos.y = rectCenterY_1 - rectHalfSizeY_1 - this.radius;
              this.vel.y =-Math.abs(this.vel.y);
              this.velToAngle();
              this.targetAngle = this.angle;
            } else {
              // Bottom collision
              this.pos.y = rectCenterY_1 + rectHalfSizeY_1 + this.radius;
              this.vel.y = Math.abs(this.vel.y);
              this.velToAngle();
              this.targetAngle = this.angle;
            }
          }
        }
      }
    }
    if(this.returning) {
      if (this.pos.x - this.radius < 0) {
        this.pos.x = this.radius;
        this.vel.x = Math.abs(this.vel.x);
        this.velToAngle();
        this.targetAngle = this.angle;
      }
      if (this.pos.x + this.radius > local_boundary.w) {
        this.pos.x = local_boundary.w - this.radius;
        this.vel.x = -Math.abs(this.vel.x);
        this.velToAngle();
        this.targetAngle = this.angle;
      }
      if (this.pos.y - this.radius < 0) {
        this.pos.y = this.radius;
        this.vel.y = Math.abs(this.vel.y);
        this.velToAngle();
        this.targetAngle = this.angle;
      }
      if (this.pos.y + this.radius > local_boundary.h) {
        this.pos.y = local_boundary.h - this.radius;
        this.vel.y = -Math.abs(this.vel.y);
        this.velToAngle();
        this.targetAngle = this.angle;
      }
    }
    if (!this.returning) {
      if (this.pos.x - this.radius < 0) {
        this.pos.x = this.radius;
        this.vel.x = Math.abs(this.vel.x);
        this.velToAngle();
      }
      if (this.pos.x + this.radius > local_boundary.w) {
        this.pos.x = local_boundary.w - this.radius;
        this.vel.x = -Math.abs(this.vel.x);
        this.velToAngle();
      }
      if (this.pos.y - this.radius < 0) {
        this.pos.y = this.radius;
        this.vel.y = Math.abs(this.vel.y);
        this.velToAngle();
      }
      if (this.pos.y + this.radius > local_boundary.h) {
        this.pos.y = local_boundary.h - this.radius;
        this.vel.y = -Math.abs(this.vel.y);
        this.velToAngle();
      }
    }
  }
  interact(player, worldPos) {
    if (this.returning && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < this.radius) {
      this.toRemove = true;
    }
  }
}

class Reaper extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#424a59", "Reaper");
    this.firstTime=0;
    this.secondTime=0;
    this.hasAB = true;
    this.ab1L = 0;
    this.ab2L = (settings.max_abilities) ? 5 : 0;
    this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 4000;
    this.secondTotalCooldown = 10000;
    this.strokeColor = "#222a39";
  }
  abilities(time, area, offset) {
    const invisibilityTime = 3500;
    if (this.secondAbility) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      if(this.energy>=30&&this.secondAbilityCooldown==0){
        this.energy-=30; 
        this.secondAbilityCooldown=this.secondTotalCooldown;
        this.reaperShadeTimer = invisibilityTime; 
        this.reaperShade=true; 
        this.god = true; 
      }
    }
    if(this.reaperShade){
      this.reaperShadeTimer -= time;
      if(this.reaperShadeTimer <= 0) {
        this.reaperShade = false;
        this.god = false;
      }
    }
  }
  calculateSpeed(minimum_speed){
    const reaperSpeed = 8.5 + 0.5*this.ab2L;
    const speed  = (this.reaperShade) ? reaperSpeed : this.speed;
    return Math.max(minimum_speed,(speed * this.speedMultiplier) + this.speedAdditioner);
  }
}
class Cent extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#727272", "Cent");
    this.firstTime=0;
    this.secondTime=0;
    this.hasAB = true; 
    this.ab1L = 5; 
    this.ab2L = 5; 
    this.firstTotalCooldown = 1000;
    this.secondTotalCooldown = 10000;
    this.mortarTime = 0;
    this.strokeColor = "#424242";
  }
  abilities(time, area, offset) {
    if(this.fusion){this.invincible = true; this.speedMultiplier*=0.7}
    if(this.mortarTime)if(this.mortarTime>0){
      this.mortarTime-=time; 
      this.speedMultiplier=0; 
      this.invincible = true;
      if(this.mortarTime<=0){
        this.mortar = false;
      }
    }
    if(this.firstAbility){
      if(this.firstAbilityCooldown==0){
        this.fusion = true;
        this.fusionTime = 700;
        this.firstAbilityCooldown = this.firstTotalCooldown;
        this.mortarTime = 0;
      }
    }
    if (this.secondAbility||this.onDeathSecondAb) {
      if(this.energy>=20&&this.secondAbilityCooldown==0){
        this.onDeathSecondAb = false;
        this.secondAbilityCooldown = this.secondTotalCooldown;
        this.energy-=20;
        this.mortarTime = 4000;
        this.mortar = true;
      }
    }
    if(this.god) this.mortarTime = 0;
    if(this.fusionTime>0||this.mortarTime>0){this.invincible = true}else{this.invincible = false;}
    if(this.fusionTime>0){this.fusionTime-=time;if(this.fusionTime<=0){this.fusion = false;}}
  }
}
class Rameses extends Player {
  constructor(pos, speed) {
    super(pos, 5, speed, "#989b4a", "Rameses");
    this.bandage = false;
    this.stand = false;
    this.hasAB = true; 
    this.ab1L = (settings.max_abilities) ? 5 : 0; 
    this.ab2L = 0; 
    this.firstAbilityUnlocked = true;
    this.firstTotalCooldown = 8000; 
    this.secondTotalCooldown = 6000;
    this.strokeColor = "#686b2a";
  }
  abilities(time, area, offset) {
    const firstAbilityCost = 50;
    if (this.firstAbility && this.energy >= firstAbilityCost && this.firstAbilityCooldown == 0 && !this.bandage && this.ab1L) {
      this.energy -= firstAbilityCost;
      this.stand = true;
      this.updateFirstAbilityCooldown();
    }
    if (this.firstAbilityCooldown<=0&&this.stand) {
      this.stand = false;
      this.bandage = true;
    }
    if (this.stand) {
      this.speedMultiplier*=0.5;
    }
    if(this.isUnbandaging && this.invincible_time<=0){
      this.isUnbandaging = false;
    }
  }

  updateFirstAbilityCooldown(){
    const firstCooldown = 12000 - (this.ab1L-1) * 1000;
    this.firstTotalCooldown = (this.safeZone) ? firstCooldown/3 : firstCooldown;
    this.firstAbilityCooldown = this.firstTotalCooldown;
  }
}
class Magmax extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#FF0000", "Magmax");
    this.harden = false;
    this.flow = false;
    this.hasAB = true; 
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = settings.max_abilities ? 5 : 0;
    this.firstAbilityUnlocked = this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 0; 
    this.secondTotalCooldown = 250;
    this.strokeColor = "#b60000";
  }

  abilities(time, area, offset) {
    const firstAbilityCost = 2;
    const secondAbilityCost = 12;

    if (this.firstAbility && this.ab1L) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.flow = !this.flow;
      if (this.flow && this.harden) {
        this.harden = false;
        this.updateHardenCooldown();
      }
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.ab2L) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.harden = !this.harden;
      if(!this.harden){
        this.updateHardenCooldown();
      } else {
        this.flow = false;
      }
    }

    if (this.harden) {
      this.tempColor = "rgb(200, 70, 0)";
      this.invincible = true;
      this.speedMultiplier = 0;
      this.d_x = 0;
      this.d_y = 0;
      this.energy -= secondAbilityCost * time / 1000;
    } else {
      this.invincible = false;
    }

    if (this.flow) {
      this.tempColor = "rgb(255, 80, 10)";
      this.speedAdditioner += this.getFlowSpeed();
      this.energy -= firstAbilityCost * time / 1000;
    }

    if (this.energy <= 0) {
      this.harden = this.flow = false;
      this.energy = 0;
    }
  }

  getFlowSpeed() {
    return 1 + this.ab1L;
  }

  updateHardenCooldown() {
    this.secondTotalCooldown = this.secondAbilityCooldown = 250 * (this.ab2ML - this.ab2L + 1);
  }
}

class Rime extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#3333ff", "Rime");
    this.paralysis = false;
    this.hasAB = true;
    this.firstAbilityUnlocked = this.secondAbilityUnlocked = true;
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = settings.max_abilities ? 5 : 0;
    this.firstTotalCooldown = 500;
    this.secondTotalCooldown = 0;
    this.strokeColor = "#2626af";
  }

  abilities(time, area, offset) {
    const firstAbilityCost = 3;
    const secondAbilityCost = 15;
    const paralysisRadius = this.getParalysisRadius();
    const paralysisDuration = 2000;

    if (this.firstAbility && this.firstAbilityCooldown === 0 && this.energy >= firstAbilityCost && this.ab1L > 0) {
      const warpDistance = this.getWarpDistance();
      const angle = this.mouseActive ? this.mouse_angle : this.previousAngle;
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.firstAbilityCooldown = this.firstTotalCooldown;
      this.pos.x += warpDistance * Math.cos(angle);
      this.pos.y += warpDistance * Math.sin(angle);
      this.energy -= firstAbilityCost;
      game.worlds[this.world].collisionPlayer(this.area, this);
    }

    if (this.secondAbility && this.ab2L > 0) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      if (this.aura && this.energy >= secondAbilityCost) {
        this.paralyzeEntities(area, offset, paralysisRadius, paralysisDuration);
        this.aura = false;
        this.auraType = -1;
        this.energy -= secondAbilityCost;
      } else {
        this.aura = true;
        this.auraType = 1;
      }
    }
  }

  paralyzeEntities(area, offset, radius, duration) {
    const playerPos = new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
    Object.values(area.entities).flat().forEach(entity => {
      if (!entity.immune && distance(entity.pos, playerPos) < radius + entity.radius) {
        entity.freeze = duration;
      }
    });
  }

  getWarpDistance() {
    return (60 + this.ab1L * 20) / 32;
  }

  getParalysisRadius() {
    return (110 + this.ab2L * 20) / 32;
  }
}

class Aurora extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#ff7f00", "Aurora");
    this.distort = false;
    this.hasAB = true;
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = 0;
    this.firstTotalCooldown = this.secondTotalCooldown = 0;
    this.firstAbilityUnlocked = true;
    this.strokeColor = "#ba5600";
  }

  abilities(time, area, offset) {
    if (this.firstAbility && this.energy >= 1 && this.ab1L) {
      this.firstAbilityActivated = this.distort = !this.distort;
      if (!this.distort) this.aura = false;
    }

    if (this.distort) {
      this.energy -= 7 * time / 1000;
      if (this.energy <= 0) {
        this.distort = this.aura = false;
      } else {
        this.aura = true;
        this.auraType = 2;
        this.applyDistortEffect(area, offset);
      }
    }
  }

  applyDistortEffect(area, offset) {
    const distortRadius = this.getDistortRadius();
    const slowdown = this.getDistortSlowdown();
    const playerPos = new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
    Object.values(area.entities).flat().forEach(entity => {
      if (!entity.immune && distance(entity.pos, playerPos) < distortRadius + entity.radius) {
        entity.speedMultiplier *= slowdown;
      }
    });
  }

  getDistortSlowdown() {
    return 1 - (0.25 + 0.05 * this.ab1L);
  }

  getDistortRadius() {
    return (150 + 30 * this.ab1L) / 32;
  }
}

class Chrono extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#00b270", "Chrono");
    this.rewind = false;
    this.hasAB = true;
    this.ab1L = (settings.max_abilities) ? 5 : 0;
    this.ab2L = (settings.max_abilities) ? 5 : 0;
    this.firstTotalCooldown = 5500;
    this.secondTotalCooldown = 5000;
    this.firstAbilityUnlocked = true;
    this.secondAbilityUnlocked = true;
    this.teleportPosition = [];
    this.strokeColor = "#009260";
    this.entityPositions = new Map();
    this.lastUpdateTime = 0;
    this.updateInterval = 100; // 100ms update interval
    this.maxTeleportPositions = 75;
    this.maxEntityPositionAge = 2600; // 2.6 seconds
    this.lastTeleportUpdateTime = 0;
    this.teleportUpdateInterval = 1000 / 30; // 30 fps update interval for teleport positions
  }

  abilities(time, area, offset) {
    const timeFix = time / (1000 / 30);
    this.updateTeleportPosition(time);
    this.updateEntityPositions(area, time);
    this.handleFirstAbility(area, offset, time);
    this.handleSecondAbility(area, offset);
  }

  updateTeleportPosition(time) {
    const currentTime = Date.now();
    if (currentTime - this.lastTeleportUpdateTime >= this.teleportUpdateInterval) {
      this.teleportPosition.push(new Vector(this.pos.x, this.pos.y));
      if (this.teleportPosition.length > this.maxTeleportPositions) {
        this.teleportPosition.shift();
      }
      this.lastTeleportUpdateTime = currentTime;
    }
  }

  updateEntityPositions(area, time) {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime >= this.updateInterval || (this.secondAbility && this.secondAbilityCooldown === 0 && this.ab2L)) {
      for (const entities of Object.values(area.entities)) {
        for (const entity of entities) {
          if (entity.immune) continue;
          this.updateEntityPosition(entity, currentTime);
        }
      }
      this.lastUpdateTime = currentTime;
    }
  }

  updateEntityPosition(entity, currentTime) {
    if (!this.entityPositions.has(entity)) {
      this.entityPositions.set(entity, []);
    }
    const positions = this.entityPositions.get(entity);
    positions.push({
      position: new Vector(entity.pos.x, entity.pos.y),
      time: currentTime
    });
    while (positions.length > 0 && currentTime - positions[0].time > this.maxEntityPositionAge) {
      positions.shift();
    }
  }

  handleFirstAbility(area, offset, time) {
    if (this.firstAbility && this.firstAbilityCooldown === 0 && this.energy >= 30 && this.ab1L) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.updateFirstAbilityCooldown();
      this.pos = this.teleportPosition[0];
      this.energy -= 30;
      if (this.isDead) {
        this.deathTimer = Math.min(this.deathTimer + 2500 + time, 60000);
        this.isDead = this.deathTimer < 60000;
      }
    }
  }

  handleSecondAbility(area, offset) {
    if (this.secondAbility && this.secondAbilityCooldown === 0 && this.ab2L) {
      if (this.aura && this.energy >= 20) {
        this.applySecondAbilityEffect(area, offset);
        this.aura = false;
        this.auraType = -1;
        this.energy -= 20;
        this.updateSecondAbilityCooldown();
      } else {
        this.aura = true;
        this.auraType = 4;
      }
    }
  }

  applySecondAbilityEffect(area, offset) {
    const auraRadius = 150 / 32;
    for (const entities of Object.values(area.entities)) {
      for (const entity of entities) {
        if (!entity.immune && this.isEntityInRange(entity, offset, auraRadius)) {
          entity.HarmlessEffect = 3000;
          entity.Harmless = true;
          this.rewindEntityPosition(entity);
        }
      }
    }
  }

  isEntityInRange(entity, offset, radius) {
    return distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < radius + entity.radius;
  }

  rewindEntityPosition(entity) {
    const positions = this.entityPositions.get(entity);
    if (positions && positions.length > 0) {
      entity.pos = new Vector(positions[0].position.x, positions[0].position.y);
    }
  }

  updateFirstAbilityCooldown() {
    this.firstTotalCooldown = 7500 - 500 * this.ab1L;
    this.firstAbilityCooldown = this.firstTotalCooldown;
  }

  updateSecondAbilityCooldown() {
    this.secondTotalCooldown = 7500 - 500 * this.ab2L;
    this.secondAbilityCooldown = this.secondTotalCooldown;
  }
}

class Brute extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#9b5800", "Brute");
    this.stomp = false;
    this.hasAB = true;
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = settings.max_abilities ? 5 : 0;
    this.firstTotalCooldown = 1000;
    this.secondTotalCooldown = 0;
    this.firstAbilityUnlocked = this.secondAbilityUnlocked = true;
    this.strokeColor = "#703f00";
    this.stompAnimations = new Map(); // Store animations for stomped entities
  }

  abilities(time, area, offset) {
    this.handleFirstAbility(area, offset);
    this.handleSecondAbility();
    this.updateStompAnimations(time);
  }

  handleFirstAbility(area, offset) {
    const firstAbilityCost = 10;
    if (this.firstAbility && this.firstAbilityCooldown === 0) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      if (this.stomp && this.energy >= firstAbilityCost && this.ab1L) {
        this.performStomp(area, offset);
        this.energy -= firstAbilityCost;
      } else if (this.ab1L && this.energy >= firstAbilityCost) {
        this.stomp = true;
        this.aura = true;
        this.auraType = 3;
      }
    }
  }

  performStomp(area, offset) {
    const stompRadius = this.getStompRadius();
    const playerPos = new Vector(this.pos.x - offset.x, this.pos.y - offset.y);
    const world = game.worlds[this.world];
    const currentArea = world.areas[this.area];

    for (const entities of Object.values(area.entities)) {
      for (const entity of entities) {
        if (!entity.immune && this.isEntityInStompRange(entity, playerPos, stompRadius)) {
          this.applyStompEffect(entity, playerPos, stompRadius, currentArea);
        }
      }
    }

    this.resetStompState();
  }

  isEntityInStompRange(entity, playerPos, stompRadius) {
    return distance(entity.pos, playerPos) < stompRadius + entity.radius;
  }

  applyStompEffect(entity, playerPos, stompRadius, currentArea) {
    entity.freeze = 4000;
    const prevVel = { x: entity.vel.x, y: entity.vel.y };
    const dir = {
      x: entity.pos.x - (this.pos.x - game.worlds[this.world].pos.x - currentArea.pos.x),
      y: entity.pos.y - (this.pos.y - game.worlds[this.world].pos.y - currentArea.pos.y)
    };
    const speed = Math.hypot(prevVel.x, prevVel.y);
    const dirMag = Math.hypot(dir.x, dir.y);
    
    entity.vel.x = speed * dir.x / dirMag;
    entity.vel.y = speed * dir.y / dirMag;

    const angle = Math.atan2(entity.vel.y, entity.vel.x);
    const startPos = {
      x: this.pos.x - game.worlds[this.world].pos.x - currentArea.pos.x,
      y: this.pos.y - game.worlds[this.world].pos.y - currentArea.pos.y
    };
    const endPos = this.handleCollisions({
      x: startPos.x + (stompRadius + entity.radius) * Math.cos(angle),
      y: startPos.y + (stompRadius + entity.radius) * Math.sin(angle)
    }, currentArea, entity.radius);

    // Start the stomp animation
    this.stompAnimations.set(entity, {
      startTime: Date.now(),
      startPos: { x: entity.pos.x, y: entity.pos.y },
      endPos: endPos,
      duration: 200 // 0.5 seconds
    });

    entity.vel = prevVel;
  }

  handleCollisions(position, area, radius) {
    const boundary = area.getActiveBoundary();
    const startPos = {
      x: position.x,
      y: position.y
    };
    
    // Combine walls with boundary
    const walls = area.assets.filter(asset => asset.type === 1).map(asset => ({
      x: asset.pos.x,
      y: asset.pos.y,
      w: asset.size.x,
      h: asset.size.y
    }));

    let entity = {
      pos: startPos,
      radius: radius,
      vel: { x: 0, y: 0 },
      isSpawned: true
    };

    const inside = pointInRectangle(
      entity.pos,
      {x: boundary.x + entity.radius, y: boundary.y + entity.radius},
      {x: boundary.w - entity.radius * 2, y: boundary.h - entity.radius * 2}
    );
    
    if (!inside) {
      entity.pos = closestPointToRectangle(
        entity.pos,
        {x: boundary.x + entity.radius, y: boundary.y + entity.radius},
        {x: boundary.w - entity.radius * 2, y: boundary.h - entity.radius * 2}
      );
    }

    for (const wall of walls) {
      isSpawned(wall, entity);
      if (!entity.isSpawned) {
        break;
      }
    }

    return entity.pos;
  }

  updateStompAnimations() {
    const currentTime = Date.now();
    for (const [entity, animation] of this.stompAnimations.entries()) {
      const progress = (currentTime - animation.startTime) / animation.duration;
      if (progress >= 1) {
        // Animation complete
        entity.pos.x = animation.endPos.x;
        entity.pos.y = animation.endPos.y;
        this.stompAnimations.delete(entity);
      } else {
        // Interpolate position
        entity.pos.x = animation.startPos.x + (animation.endPos.x - animation.startPos.x) * progress;
        entity.pos.y = animation.startPos.y + (animation.endPos.y - animation.startPos.y) * progress;
      }
    }
  }

  resetStompState() {
    this.stomp = false;
    this.aura = false;
    this.firstAbilityCooldown = 1000;
  }

  handleSecondAbility() {
    if (this.ab2L) {
      const vigorRadius = [1, 1, 2, 2, 3][this.ab2L];
      this.radiusAdditioner += vigorRadius;

      const effectImmunity = 1 - (this.ab2L * 15) / 100;
      this.effectImmune = (this.energy === this.maxEnergy) ? effectImmunity - 0.25 : effectImmunity;
    }
  }

  getStompRadius() {
    return (115 + this.ab1L * 15) / 32;
  }
}

class Morfe extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#00dd00", "Morfe");
    this.hasAB = true;
    this.ab1L = (settings.max_abilities) ? 5 : 0;
    this.ab2L = (settings.max_abilities) ? 5 : 0;
    this.firstAbilityUnlocked = true;
    this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 3000;
    this.secondTotalCooldown = 1500;
    this.strokeColor = "#007d00";
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 10 && this.ab1L) {
      this.energy -= 10;
      this.firstAbilityCooldown = this.firstTotalCooldown;
      this.spawnBullet(area,'reverse_projectile')
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 10 && this.ab2L) {
      this.energy -= 10;
      this.secondAbilityCooldown = this.secondTotalCooldown;
      this.spawnBullet(area,'minimize_projectile')
    }
  }
  spawnBullet(area,bulletType){
    let projectile_amount = (bulletType == 'reverse_projectile') ? this.ab1L : 1+this.ab2L;
    let static_shooting_angle = 90;
    let shooting_angle = static_shooting_angle/(projectile_amount+1);
    for(let i = 0; i < projectile_amount; i++){
      let angle = (this.mouseActive) ? this.mouse_angle : this.previousAngle;
      angle = radians_to_degrees(angle)-static_shooting_angle/2;
      angle += shooting_angle*(i+1);
      angle = degrees_to_radians(angle);
      const world = game.worlds[this.world];
      const bullet_class = (bulletType == 'reverse_projectile') ? ReverseProjectile : MinimizeProjectile;
      const bullet = new bullet_class(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle) 
      area.addEntity(bulletType,bullet)
    }
  }
}

class Mirage extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#020fa2", "Mirage");
    this.hasAB = true;
    this.ab1L = (settings.max_abilities) ? 5 : 0;
    this.ab2L = (settings.max_abilities) ? 5 : 0;
    this.firstAbilityUnlocked = true;
    this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 7000;
    this.secondTotalCooldown = 2500;
    this.strokeColor = "#000172";
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 30 && this.ab1L && this.lastSafePos) {
      this.energy -= 30;
      this.updateFirstAbilityCooldown();
      this.pos = new Vector(this.lastSafePos.x, this.lastSafePos.y);
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 15 && this.ab2L) {
      this.energy -= 15;
      this.updateSecondAbilityCooldown();
      this.spawnBullet(area,'obscure_projectile', this)
    }
    this.isObscured = (this.invincible_time>0) ? true : false;
    if(this.isObscured){
      this.tempColor = "rgba(0, 8, 96, 1)";
    } else {
      this.tempColor = this.color;
    }
    if(this.safeZone && this.ab1L){
      this.lastSafePos = new Vector(this.pos.x,this.pos.y);
    }
  }
  spawnBullet(area,bulletType){
      let angle = (this.mouseActive) ? this.mouse_angle : this.previousAngle;
      const world = game.worlds[this.world];
      const bullet = new ObscureProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle, this)
      area.addEntity("obscure_projectile", bullet)
  }
  updateFirstAbilityCooldown() {
    this.firstTotalCooldown = 11000 - 1000 * this.ab1L;
    this.firstAbilityCooldown = this.firstTotalCooldown;
  }
  updateSecondAbilityCooldown() {
    this.secondTotalCooldown = 5000 - 500 * this.ab2L;
    this.secondAbilityCooldown = this.secondTotalCooldown;
  }
}

class Necro extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#FF00FF", "Necro");
    this.hasAB = true;
    this.ab1L = (settings.max_abilities) ? 1 : 0;
    this.ab2L = 0;
    this.ab1ML = 1;
    this.firstAbilityUnlocked = true;
    this.firstPelletTotal = 75;
    this.firstPellet = 0;
    this.resurrectAvailable = true;
    this.usesPellets = 1; // 1 - firstPellet | 2 - secondPellet | 3 - bothPellet
    this.strokeColor = "#a900a9";
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstPellet == 0 && this.energy >= 0 && this.resurrectAvailable && this.isDead && this.ab1L) {
      this.isDead = false;
      this.firstPellet = this.firstPelletTotal;
      if(settings.cooldown)this.resurrectAvailable = false;
    }
    else if(this.firstPellet == 0 && !this.resurrectAvailable){
      this.resurrectAvailable = true;
    }
  }
}

class Candy extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#ff80bd", "Candy");
    this.sugar_rush = false;
    this.sweetToothConsumed = false;
    this.sweetToothTimer = 0;
    this.hasAB = true; 
    this.ab1L = settings.max_abilities ? 5 : 0;
    this.ab2L = settings.max_abilities ? 5 : 0;
    this.firstAbilityUnlocked = this.secondAbilityUnlocked = true;
    this.firstTotalCooldown = 4000; 
    this.secondTotalCooldown = 5000;
    this.strokeColor = "#cf609d";
  }

  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown === 0 && this.energy >= 15 && this.ab1L) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.sugar_rush = true;
      this.energy -= 15;
      this.sugarRushing = 2000;
      this.updateFirstAbilityCooldown();
    }

    if (this.secondAbility && this.secondAbilityCooldown === 0 && this.energy >= 5 && this.ab2L) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.energy -= 5;
      const angle = this.mouseActive ? this.mouse_angle : this.previousAngle;
      const distance = 64 / 32;
      const candy = new Vector(
        this.pos.x + distance * Math.cos(angle),
        this.pos.y + distance * Math.sin(angle)
      );
      const effect = new SweetTooth(new Vector(candy.x - offset.x, candy.y - offset.y),this.ab2L)
      area.addEntitiesBehind("SweetTooth",effect,1);
      this.secondAbilityCooldown = this.secondTotalCooldown;
    }

    if (this.sugar_rush) {
      this.aura = true;
      this.auraType = 0;
      const sugarRushRadius = this.getSugarRushRadius();
      for (const entityType of Object.values(area.entities)) {
        for (const entity of entityType) {
          if (!entity.immune && distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < sugarRushRadius + entity.radius) {
            entity.sugar_rush = 2000;
          }
        }
      }
    } else {
      this.aura = false;
      this.auraType = -1;
    }

    if (this.sugarRushing > 0) {
      this.sugarRushing -= time;
      this.tempColor = "rgba(230, 103, 164, 1)";
    } else {
      this.sugar_rush = false;
    }

    if (this.sweetToothConsumed) {
      this.energy = Math.min(this.energy + this.maxEnergy / 2, this.maxEnergy);
      this.sweetToothConsumed = false;
    }

    if (this.sweetToothEffect) {
      this.speedAdditioner += this.sweetToothPower;
      this.regenAdditioner += this.sweetToothPower;
      this.sweetToothTimer -= time;
      if (this.sweetToothTimer <= 0) {
        this.sweetToothTimer = 0;
        this.sweetToothEffect = false;
      }
    }
  }

  getSugarRushRadius() {
    return (100 + Math.abs(greaterMax(this)) * 5) / 32;
  }

  updateFirstAbilityCooldown() {
    this.firstTotalCooldown = this.firstAbilityCooldown = 6500 - 500 * this.ab1L;
  }
}
class Clown extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#ffb8c6", "Clown");
    this.hasAB = true;
    this.ab1L = (settings.max_abilities) ? 5 : 0;
    this.ab2L = (settings.max_abilities) ? 1 : 0;
    this.firstAbilityUnlocked = true;
    this.secondAbilityUnlocked = true;
    this.ab2ML = 1;
    this.firstTotalCooldown = 4000;
    this.secondTotalCooldown = 0;
    this.maxSpeed = 14;
    this.maxUpgradableEnergy = 60;
    this.maxRegen = 2;
    this.prevColor = 0;
    this.heavyBallon = false;
    this.heavyBallonSize = 1;
    this.rejoicing = false;
    this.maxHeavyBallonSize = 92;
    this.strokeColor = "#b36b79";
  }
  abilities(time, area, offset) {
    const timeFix = time / (1000 / 30);
    const heavyBallonCost = 5;
    const colors = ["rgb(2, 135, 4, .8)","rgb(228, 122, 42, .8)","rgb(255, 219, 118, .8)","rgb(4, 70, 255, .8)", "rgb(216, 48, 162, .8)"]
    if (this.firstAbility && this.firstAbilityCooldown == 0 && (this.energy >= heavyBallonCost || this.heavyBallon) && this.ab1L) {
      const world = game.worlds[this.world];
      if(this.heavyBallon){
        this.spawnHeavyBallon(world, colors, area);
      } else {
        this.heavyBallon=true;
        this.heavyBallonSize = 20;
        this.energy-=heavyBallonCost;
        let color = this.prevColor;
        while(color == this.prevColor){
          color = Math.floor(Math.random()*5);
        }
        this.prevColor = color;
      }
    }
    if (this.ab2L){
      if(!this.rejoicing){
        this.rejoicing = true;
        this.effectImmune = 1.5;
        this.speed += 5;
        this.maxSpeed = 20;
        this.maxUpgradableEnergy = 200;
        this.maxRegen = 5;
      } else {
        this.radiusAdditioner += 5;
      }
    }
    if(this.heavyBallon){
      this.heavyBallonSize += 1 * timeFix;
      this.energy -= 5 * time / 1000;
      if(this.energy<=0){
        const world = game.worlds[this.world];
        this.spawnHeavyBallon(world, colors, area);
      }

      if(this.heavyBallonSize>this.maxHeavyBallonSize){
        death(this);
        this.heavyBallonSize = 20;
        this.heavyBallon = false;
      }
    }

  }
  updateFirstAbilityCooldown() {
    this.firstTotalCooldown = 9000-1000*this.ab1L;
    this.firstAbilityCooldown = this.firstTotalCooldown;
  }
  spawnHeavyBallon(world, colors, area){
    const angle = (this.mouseActive) ? this.mouse_angle : this.previousAngle;
    const ball = new ClownTrail(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),this.heavyBallonSize/32,angle,colors[this.prevColor]);
    if(!area.entities["clown_trail"]){area.entities["clown_trail"] = []}
    area.entities["clown_trail"].push(ball);
    this.heavyBallon = false
    this.heavyBallonSize = 20;
    this.updateFirstAbilityCooldown();
  }
}
class Polygon extends Player {
  constructor(pos, speed) {
    super(pos, 7, speed, "#000000", "Polygon");
    this.shape = 0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility) {
      this.shape++;
      this.shape = this.shape%4;
    }
    if (this.shape==1) {
      this.speedAdditioner+=2;
    }
    if (this.shape==3) {
      this.radiusMultiplier = 0.75;
    }
  }
}
class Poop extends Player {
  constructor(pos, speed) {
    super(pos, 8, speed, "#FFC0CB", "Idk");
    this.shields = [];
    this.dist = 2;
  }
  abilities(time, area, offset) {
    if (this.firstAbility) {
      this.shields.push(new Shield(new Vector(this.pos.x - offset.x,this.pos.y - offset.y),this.id))
      area.addEntity("shield",this.shields[this.shields.length-1])
    }
    for (var i in area.entities["shield"]) {
      if (area.entities["shield"][i].owner==this.id) {
        var dist = distance(this.pos, this.oldPos);
        if (dist!=0) {
          var vx = (this.pos.x - this.oldPos.x) / dist;
          var vy = (this.pos.y - this.oldPos.y) / dist;
          var pos = new Vector(this.pos.x - offset.x + vx * 2,this.pos.y - offset.y + vy * 2)
          area.entities["shield"][i].pos = pos
          area.entities["shield"][i].rot = Math.atan2(vy,vx)+Math.PI/2
        }
      }
    }
  }
}

class Shield extends Entity {
  constructor(pos,owner) {
    super(pos, 0.7, "black");
    this.owner = owner;
    this.rot = 0
    this.size = new Vector(2,0.3);
    this.wall_push = false;
    this.isEnemy = false;
  }
  behavior(time, area, offset, players) {
    for (var j in area.entities) {
      for (var k in area.entities[j]) {
        if (area.entities[j][k].isEnemy||area.entities[j][k].weak) {
          var angle = Math.atan2(area.entities[j][k].pos.y-this.pos.y,area.entities[j][k].pos.x-this.pos.x)
          var newAngle = angle-this.rot;
          var posX = Math.cos(newAngle)*distance(this.pos,area.entities[j][k].pos);
          var posY = Math.sin(newAngle)*distance(this.pos,area.entities[j][k].pos);
          if (pointInRectangle(new Vector(posX,posY),new Vector(-this.size.x-area.entities[j][k].radius,-this.size.y-area.entities[j][k].radius),new Vector(this.size.x*2+area.entities[j][k].radius*2,this.size.y*2+area.entities[j][k].radius*2))) {
            area.entities[j][k].vel.x = Math.cos(this.rot-Math.PI/2)*area.entities[j][k].speed;
            area.entities[j][k].vel.y = Math.sin(this.rot-Math.PI/2)*area.entities[j][k].speed;
          }
        }
      }
    }
  }
}
class Unknown extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("unknown"), radius, speed, angle, "purple");
  }
}
class Normal extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("normal"), radius, speed, angle, "#939393");
  }
}

class Corrosive extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("corrosive"), radius, speed, angle, "#00eb00");
    this.corrosive = true;
  }
}

class Wall extends Enemy {
  constructor(pos, radius, speed, boundary, wallIndex, count, move_clockwise = true, initial_side) {
    super(pos, entityTypes.indexOf("wall"), radius, speed, undefined,"#222222");
    this.speed = speed;
    this.wall = true;
    this.returnCollision = true;
    this.boundary = boundary
    this.move_clockwise = !move_clockwise;
    var x,y;
    var radius = radius;
    var distance = wallIndex * (
      (boundary.w - radius * 2) * 2 +
      (boundary.h - radius * 2) * 2) / count

    this.initial_side = (initial_side) ? initial_side : 0; 

    if (this.initial_side == 0) {
      x = (boundary.w / 2) + this.left();
      y = this.top() + radius;
    }
    else if (this.initial_side == 1) {
      x = this.right() - radius;
      y = (boundary.h / 2) + this.top();
    }
    else if (this.initial_side == 2) {
      x = (boundary.w / 2) + this.left();
      y = this.bottom() - radius;
    }
    else if (this.initial_side == 3) {
      x = this.left() + radius;
      y = (boundary.h / 2) + this.top();
    } else {
      console.error(this.initial_side)
    }

    this.direction = this.rotate(this.initial_side,this.move_clockwise)
    var anti_crash = 0;
    while (distance > 0){
      if(anti_crash>1000){
        console.error("It sometimes crashes, but this is in evades code... Check your wall enemies!");
        break;
      }
      anti_crash++;
      if(this.direction == 0){
        y -= distance;
          if(y < this.top() + radius){
            distance = (this.top() + radius) - y;
            y = this.top() + radius;
            this.direction = this.rotate(this.direction,this.move_clockwise);
          } else break;
      } else if (this.direction == 1){
        x += distance;
        if (x > this.right() - radius){
          distance = x - (this.right() - radius);
          x = this.right() - radius;
          this.direction = this.rotate(this.direction,this.move_clockwise);
        } else break;
      } else if (this.direction == 2){
        y += distance;
        if (y > this.bottom() - radius){
          distance = y - (this.bottom() - radius);
          y = this.bottom() - radius;
          this.direction = this.rotate(this.direction,this.move_clockwise);
        } else break;
      } else if (this.direction == 3){
        x -= distance;
        if (x < this.left() + radius){
          distance = (this.left() + radius) - x;
          x = this.left() + radius;
          this.direction = this.rotate(this.direction,this.move_clockwise);
        } else break;
      }
    }
    this.pos = new Vector(x,y);
    this.immune = true;
    this.applySpeed();
  }
  top () {
    return this.boundary.y;
  }
  bottom (){
    return this.boundary.y+this.boundary.h;
    
  }
  right () {
    return this.boundary.x+this.boundary.w;
  }
  left (){
    return this.boundary.x;
  }

  rotate(direction,move_clockwise){
    switch (direction){
      case 0:
        return (move_clockwise) ? 3: 1;
      case 2:
        return (move_clockwise) ? 1 : 3;
      case 1:
        return (move_clockwise) ? 0 : 2;
      case 3:
        return (move_clockwise) ? 2 : 0;
    }
  }

  getVector(){
    switch(this.direction){
      case 0: this.vel = new Vector(0,-this.speed); break;
      case 2: this.vel = new Vector(0,this.speed); break;
      case 1: this.vel = new Vector(this.speed,0); break;
      case 3: this.vel = new Vector(-this.speed,0); break;
    }
  }

  applySpeed(){
    this.getVector();
    this.velToAngle();
  }

  behavior(time, area, offset, players) {
    this.applySpeed();
  }
}

class Dasher extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("dasher"), radius, speed, angle, "#003c66");
    this.speed = speed;
    this.time_to_prepare = 750;
    this.time_to_dash = 3000;
    this.time_between_dashes = 750;
    this.normal_speed = speed;
    this.base_speed = this.normal_speed / 5;
    this.prepare_speed = this.normal_speed / 5;
    this.dash_speed = this.normal_speed;
    this.time_dashing = 0;
    this.time_preparing = 0;
    this.time_since_last_dash = 0;
    this.velToAngle();
    this.oldAngle = this.angle;
    this.dasher = true;
    this.returnCollision = true;
  }
  compute_speed(){
    this.speed = (this.time_since_last_dash < this.time_between_dashes && this.time_dashing == 0 && this.time_preparing == 0) ? 0 : (this.time_dashing == 0) ? this.prepare_speed : this.base_speed//(this.time_preparing>0) ? this.prepare_speed : this.base_speed
    this.angleToVel();
    this.oldAngle = this.angle;
  }
  behavior(time, area, offset, players) {
    this.angle = this.oldAngle;
    if(this.time_preparing == 0){
      if(this.time_dashing == 0){
        if(this.time_since_last_dash < this.time_between_dashes){
          this.time_since_last_dash += time;
        }
        else{
          this.time_since_last_dash = 0;
          this.time_preparing += time;
          this.base_speed = this.prepare_speed;
        }
      }
      else {
        this.time_dashing += time;
        if (this.time_dashing > this.time_to_dash){
          this.time_dashing = 0;
          this.base_speed = this.normal_speed;
        } else {
          this.base_speed = this.dash_speed * ( 1 - (this.time_dashing / this.time_to_dash ) );
        }
      }
    } else {
      this.time_preparing += time;
      if (this.time_preparing > this.time_to_prepare){
        this.time_preparing = 0;
        this.time_dashing += time;
        this.base_speed = this.dash_speed;
      } else {
        this.base_speed = this.prepare_speed * ( 1 - (this.time_preparing / this.time_to_prepare) );
      }
    }
    this.compute_speed();
  }
}
class Homing extends Enemy {
  constructor(pos, radius, speed, angle, increment = 0.05, home_range = 200) {
    super(pos, entityTypes.indexOf("homing"), radius, speed, angle, "#966e14");
    this.increment = increment;
    this.home_range = home_range / 32;
    this.velToAngle();
    this.targetAngle = this.angle;
    this.homing = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    const closestPlayer = this.findClosestPlayer(players, offset);
    if (closestPlayer) {
      const dX = closestPlayer.x - this.pos.x;
      const dY = closestPlayer.y - this.pos.y;
      this.targetAngle = Math.atan2(dY, dX);
    }
    const angleDiff = Math.atan2(Math.sin(this.targetAngle - this.angle), Math.cos(this.targetAngle - this.angle));
    const angleIncrement = this.increment * (time / 30);
    if (Math.abs(angleDiff) >= this.increment) {
      this.angle += Math.sign(angleDiff) * angleIncrement;
    }
    this.angleToVel();
  }
  findClosestPlayer(players, offset) {
    let closestDist = this.home_range;
    let closestPlayer = null;
    for (const player of players) {
      if (player.isDetectable()) {
        const dist = distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y));
        if (dist < closestDist) {
          closestDist = dist;
          closestPlayer = {x: player.pos.x - offset.x, y: player.pos.y - offset.y};
        }
      }
    }
    return closestPlayer;
  }
}

class Slowing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, slow = 0.3) {
    super(pos, entityTypes.indexOf("slowing"), radius, speed, angle, "#ff0000", true, "rgba(255, 0, 0, 0.15)", auraRadius / 32);
    this.slow = slow;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.slowing = true;
      player.slow = 1-this.slow;
    }
  }
}

class Draining extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, drain = 15) {
    super(pos, entityTypes.indexOf("draining"), radius, speed, angle, "#0000ff", true, "rgba(0, 0, 255, 0.15)", auraRadius / 32);
    this.drain = drain;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.draining = true;
      player.drain = this.drain;
    }
  }
}

class Reducing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 140) {
    super(pos, entityTypes.indexOf("reducing"), radius, speed, angle, "rgb(45, 50, 55)", true, "rgba(45, 50, 55, 0.15)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.reducing = true;
    }
  }
}

class Blocking extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("blocking"), radius, speed, angle, "#bf5213", true, "rgba(191, 82, 19, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.blocking = true;
    }
  }
}

class Quicksand extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, push_direction, strength = 5, immune = false, classic = false) {
    super(pos, entityTypes.indexOf("quicksand"), radius, speed, angle, "#6c541e", true, "rgba(108, 84, 30, 0.3)", auraRadius / 32);
    this.quicksand = push_direction;
    this.quicksand_strength = strength;
    this.immune = immune;
    var player = game.players[0];
    if(classic){
      if(!this.quicksand && this.quicksand !== 0){
      var world = game.worlds[player.world];
      var area = world.areas[player.area];
      if(area.entities['quicksand'] && area.entities['quicksand'].length>0){
        this.quicksand = area.entities['quicksand'][min_max(0,area.entities['quicksand'].length-1)].quicksand;  
      } else {
        this.quicksand = random_between([0,90,180,270]);
      }
      }
    }
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.quicksand = {angle: this.quicksand, strength: this.quicksand_strength, active: true};
    }
  }
}

class Defender extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("defender"), radius, speed, angle, "#312f40", true, "rgba(0, 0, 0, 0.2)", auraRadius / 32);
    this.immune = true;
  }
  behavior(time, area, offset, players) {
    const thisPos = new Vector(this.pos.x, this.pos.y);
    const maxDistance = this.auraSize;

    for (const entityGroup of Object.values(area.entities)) {
      for (const entity of entityGroup) {
        if (distance(entity.pos, thisPos) < entity.radius + maxDistance) {
          if (!entity.immune || entity.defended) {
            Object.assign(entity, { defended: true, curDefend: true, immune: true });
          }
        }
      }
    }
  }
}
class Turning extends Enemy {
  constructor(pos, radius, speed, angle, circleSize = 150) {
    super(pos, entityTypes.indexOf("turning"), radius, speed, angle, "#336600");
    this.dir = speed / circleSize;
    this.turning = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    this.velToAngle();
    this.angle += this.dir * (time / 30);
    this.angleToVel();
  }
}
class Liquid extends Enemy {
  constructor(pos, radius, speed, angle, player_detection_radius = 160) {
    super(pos, entityTypes.indexOf("liquid"), radius, speed, angle, "#6789ef");
    this.player_detection_radius = player_detection_radius / 32;
  }
  behavior(time, area, offset, players) {
    for (const player of players) {
      if (distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < this.player_detection_radius && player.isDetectable()) {
        this.speedMultiplier *= 5;
      }
    }
  }
}
class Sizing extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sizing"), radius, speed, angle, "#f27743");
    this.growing = true;
    this.sizing_multiplier = 1;
    this.sizing_bound_multiplier = 2.5;
    this.sizing_lower_bound = this.sizing_multiplier / this.sizing_bound_multiplier;
    this.sizing_upper_bound = this.sizing_multiplier * this.sizing_bound_multiplier;
    this.sizing_changing_speed = 0.04;
  }
  behavior(time, area, offset, players) {
    const timeFix = (time / (1000 / 30));
    if (this.growing) {
      this.sizing_multiplier += this.sizing_changing_speed * timeFix;
      if (this.sizing_multiplier >= this.sizing_upper_bound) {
        this.growing = false;
      }
    } else {
      this.sizing_multiplier -= this.sizing_changing_speed * timeFix;
      if (this.sizing_multiplier <= this.sizing_lower_bound) {
        this.growing = true;
      }
    }
    this.radiusMultiplier = this.sizing_multiplier;
  }
}
class Switch extends Enemy {
  constructor(pos, radius, speed, angle, index, count) {
    super(pos, entityTypes.indexOf("switch"), radius, speed, angle, "#565656");
    this.switching = true;
    this.disabled = false;
    if (index >= count / 2) {
      this.disabled = true;
    }
    this.switch_clock = 0;
    this.switch_total_time = 3000;
    this.fading_effects_time = 1500;

    // evades code
    if (radius == 1919){
      this.switch_total_time = 5500;
      this.switch_clock = 5500 - 2000;
    } else if(radius == 159){
      this.switch_total_time = 3000;
      this.switch_clock = 3000 - 250;
    }
  }
  behavior(time, area, offset, players) {
    this.switch_clock += time;
    if (this.switch_clock > this.switch_total_time) {
      this.disabled = !this.disabled;
      this.switch_clock = this.switch_clock % this.switch_total_time;
    }
  }
}
class Sniper extends Enemy {
  constructor(pos, radius, speed, angle, color = "#a05353") {
    super(pos, entityTypes.indexOf("sniper"), radius, speed, angle, color);
    this.releaseTime = 3000;
    this.bulletType = 0;
    this.bulletSpeed = 10;
    this.bulletRadius = this.radius / 2;
    this.clock = Math.random() * this.releaseTime;
    this.detectionDistance = 600 / 32;
    this.additionalProperties = [];
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      const target = this.findClosestPlayer(players, offset, area.getActiveBoundary());
      if (target && target.isDetectable()) {
        const angle = Math.atan2((target.pos.y - offset.y) - this.pos.y, (target.pos.x - offset.x) - this.pos.x);
        area.addSniperBullet(this.bulletType, this.pos, angle, this.bulletRadius, this.bulletSpeed, ...this.additionalProperties);
        this.clock = 0;
      }
    }
  }
  findClosestPlayer(players, offset, boundary) {
    let detectionDistance = this.detectionDistance;
    let closestPlayer = null;
    for (const player of players) {
      const playerPos = new Vector(player.pos.x - offset.x, player.pos.y - offset.y);
      if (!pointInRectangle(playerPos, new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) continue;
      const dist = distance(this.pos, playerPos);
      if (dist < detectionDistance) {
        detectionDistance = dist;
        closestPlayer = player;
      }
    }
    return closestPlayer;
  }
}

class SniperBullet extends Enemy {
  constructor(pos, angle, radius, speed) {
    super(pos, entityTypes.indexOf("sniper_bullet"), radius, speed, angle, "#a05353");
    this.clock = 0;
    this.removeTime = 3000;
    this.immune = true;
    this.weak = true;
    this.outline = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.removeTime) {
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune);
  }
}

class Stalactite extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#302519");
    this.wallHit = false;
    this.clock = 0;
    this.immune = true;
  }
  behavior(time, area, offset, players) {
    if (this.wallHit){
      if(this.clock == 0) area.addSniperBullet(15, this.pos, this.radius / 2);
      this.clock += time;
      if (this.clock > 1000) {
        this.wallHit = false;
        this.clock = 0;
      } else {
        this.speedMultiplier = 0;
      }
    }
  }
  collide(boundary){
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius,this.immune).col)this.wallHit = true;
  }
}

class StalactiteProjectile extends SniperBullet {
  constructor(pos, radius) {
    super(pos, Math.random() * Math.PI * 2, radius, 3);
    this.color = "#614c37";
    this.immune = false;
    this.outline = true;
  }
  behavior(time, area, offset, players) {
    super.behavior(time, area, offset, players);
    if (this.clock > 1500){
      this.toRemove = true;
    }
  }
}
class ForceSniperA extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#0a5557");
    this.bulletType = 17;
    this.bulletSpeed = 12;
  }
}
class ForceSniperB extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#914d83");
    this.bulletType = 18;
    this.bulletSpeed = 12;
  }
}
class ForceSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed, color) {
    super(pos, angle, radius, speed);
    this.color = color;
    this.touched = false;
  }
  interact(player, worldPos, time) {
    if (!this.touched && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      this.useAbility(player)
      this.updateAbilities(player,worldPos)
    }
  }
  useAbility(player){

  }
  updateAbilities(player,worldPos){
    const world = game.worlds[player.world];
    const area = world.areas[player.area];
    player.abilities(0, area, worldPos);
    this.touched = true;
  }
}

class ForceSniperABullet extends ForceSniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed, "#0a5557");
  }
  useAbility(player){
    player.firstAbility = true;
  }
}
class ForceSniperBBullet extends ForceSniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed, "#914d83");
  }
  useAbility(player){
    player.secondAbility = true;
  }
}

class WindSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#9de3c6");
    this.releaseTime = 1000;
    this.bulletType = 13;
    this.bulletSpeed = 16;
  }
}

class WindSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#82c2a5";
    this.immune = true;
    this.gravity = 64 / 32;
  }
  interact(player, worldPos, time) {
    const timeFix = time / (1000 / 30);
    const maxIterations = 25;
    let iterations = 0;
    
    while (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && iterations < maxIterations) {
      const dx = player.pos.x - (this.pos.x + worldPos.x);
      const dy = player.pos.y - (this.pos.y + worldPos.y);
      const dist = Math.hypot(dx, dy);
      const attractionAmplitude = Math.pow(2, -(dist / (this.radius/2)));
      const moveDist = this.gravity * attractionAmplitude * timeFix;
      const angleToPlayer = Math.atan2(dy, dx);
      player.pos.x += moveDist * Math.cos(angleToPlayer);
      player.pos.y += moveDist * Math.sin(angleToPlayer);
      game.worlds[player.world].collisionPlayer(player.area, player);
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      console.warn('Max iterations reached in WindSniperBullet interact');
    }
  }
}

class Radar extends Sniper {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, radius, speed, angle, "#c90000");
    this.aura = true;
    this.auraColor = "rgba(153, 153, 153, 0.2)";
    this.auraRadius = auraRadius / 32;
    this.releaseTime = 250;
    this.base_speed = 5;
    this.bulletType = 12;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      const closestPlayer = this.findClosestPlayer(players, offset, area.getActiveBoundary(), this.auraRadius);
      if (closestPlayer && closestPlayer.isDetectable()) {
        const angle = Math.atan2(closestPlayer.y - this.pos.y, closestPlayer.x - this.pos.x);
        area.addSniperBullet(this.bulletType, this.pos, angle, this.auraRadius, this.radius / 3, this.speed + this.base_speed, this);
        this.clock = 0;
      }
    }
  }
}

class RadarBullet extends SniperBullet {
  constructor(pos, angle, auraOfSpawner, radius, speed, spawner) {
    super(pos, angle, radius, speed);
    this.color = "#c90000";
    this.auraOfSpawner = auraOfSpawner;
    this.spawner = spawner;
  }
  behavior(time, area, offset, players) {
    super.behavior(time, area, offset, players);
    if (distance(this.spawner.pos, this.pos) > this.auraOfSpawner) {
      this.toRemove = true;
    }
  }
}

class CorrosiveSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#61ff61");
    this.bulletType = 5;
  }
}

class CorrosiveSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#61ff61";
    this.corrosive = true;
    this.immune = false;
    this.outline = true;
    this.clock = 0;
  }
  behavior(time, area, offset, players) {
    super.behavior(time, area, offset, players);
    this.clock += time;
    if(this.clock >= 3000){
      this.toRemove = true;
    }
  }
}

class IceSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#8300ff");
    this.bulletType = 1;
    this.bulletRadius = 10 / 32;
    this.bulletSpeed = 16;
  }
}

class IceSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#8300ff";
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
        player.frozen = true;
        player.frozenTimeLeft = 1000*player.effectImmune;
        player.frozenTime = 0;
    }
  }
}

class PoisonSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#8c01b7");
    this.bulletType = 6;
    this.bulletSpeed = 16;
    this.bulletRadius = 10 / 32;
  }
}

class PoisonSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#8c01b7";
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
        player.poison = true;
        player.poisonTimeLeft = 1000*player.effectImmune;
        player.poisonTime = 0;
    }
  }
}

class SpeedGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("speed_ghost"), radius, speed, angle, "#fca330");
    this.Harmless = true;
    this.immune = true;
    this.radius = radius;
  }
  interact(player, worldPos, time) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius+this.radius && !player.isInvulnerable()) {
      player.speedghost = true;
    }
  }
}

class RegenGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("regen_ghost"), radius, speed, angle, "#32e3ae");
    this.Harmless = true;
    this.immune = true;
    this.radius = radius;
  }
  interact(player, worldPos, time) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius+this.radius && !player.isInvulnerable()) {
      player.regenghost = true;
    }
  }
}

class SpeedSniper extends Sniper {
  constructor(pos, radius, speed, angle, speedLoss = 1) {
    super(pos, radius, speed, angle, "#ff9000");
    this.bulletType = 3;
    this.speedLoss = speedLoss;
    this.bulletRadius = 10 / 32;
    this.bulletSpeed = 16;
    this.additionalProperties.push(speedLoss);
  }
}

class SpeedSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed, speedLoss) {
    super(pos, angle, radius, speed);
    this.color = "#d6885c";
    this.weak = true;
    this.Harmless = true;
    this.speedLoss = speedLoss;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      if(player.speed > 5){
        player.speed -= this.speedLoss * player.effectImmune;
        if(!settings.no_points) player.points += Math.round(this.speedLoss * 2);
      }
      if(player.speed < 5) player.speed = 5;
      this.toRemove = true;
    }
  }
}

class RegenSniper extends Sniper {
  constructor(pos, radius, speed, angle, regenLoss = 0.4) {
    super(pos, radius, speed, angle, "#00cc8e");
    this.bulletType = 4;
    this.regenLoss = regenLoss;
    this.bulletRadius = 10 / 32;
    this.bulletSpeed = 16;
    this.additionalProperties.push(regenLoss);
  }
}

class RegenSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed, regenLoss) {
    super(pos, angle, radius, speed);
    this.color = "#00a875";
    this.weak = true;
    this.Harmless = true;
    this.regenLoss = regenLoss;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      player.regen -= this.regenLoss * player.effectImmune;
      if(!settings.no_points) player.points += Math.round(this.regenLoss * 5);
      if(player.regen < 1) player.regen = 1;
      this.toRemove = true;
    }
  }
}

class PositiveMagneticSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#ff3852");
    this.bulletType = 7;
    this.bulletRadius = 10 / 32;
    this.bulletSpeed = 16;
  }
}

class PositiveMagneticSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#e3001e";
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      this.toRemove = true;
      if(!player.isEffectImmune()) player.magnetDirection = "Up";
    }
  }
}

class NegativeMagneticSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#a496ff");
    this.bulletType = 8;
    this.bulletRadius = 10 / 32;
    this.bulletSpeed = 16;
  }
}

class NegativeMagneticSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#6f59ff";
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      if(!player.isEffectImmune()) player.magnetDirection = "Down";
      this.toRemove = true;
    }
  }
}

class LeadSniper extends Sniper {
  constructor(pos, radius, speed, angle) {
    super(pos, radius, speed, angle, "#788898");
    this.bulletType = 16;
    this.bulletSpeed = 16;
  }
}

class LeadSniperBullet extends SniperBullet {
  constructor(pos, angle, radius, speed) {
    super(pos, angle, radius, speed);
    this.color = "#788898";
    this.weak = true;
    this.power = 3500;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      if (player.leadTimeLeft <= 0){
        player.cent_input_ready = true;
        player.cent_accelerating = false;
        player.cent_is_moving = false;
      }
      player.leadTimeLeft = player.leadTime = this.power * player.effectImmune;
      this.toRemove = true;
    }
  }
}
class Freezing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 100) {
    super(pos, entityTypes.indexOf("freezing"), radius, speed, angle, "#64c1b9", true, "rgba(58, 117, 112, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.freezing = true;
    }
  }
}

class Web extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 110) {
    super(pos, entityTypes.indexOf("web"), radius, speed, angle, "#4a4a4a", true, "rgba(255, 255, 255, 0.6)", auraRadius / 32);
    this.immune = true;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize && !player.god ) {
      player.web = true;
    }
  }
}

class Cobweb extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("cobweb"), radius, speed, angle, "#e4e4e4");
    this.Harmless = true;
    this.immune = true;
    this.outline = false;
  }
  interact(player,worldPos){
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.god) {
      player.cobweb = true;
    }
  }
}

class Teleporting extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("teleporting"), radius, speed, angle,"#ecc4ef");
    this.clock = 0;
    this.teleportInterval = 1000;
  }
  update(time) {
    const timeFix = time / (1000 / 30);
    this.speedMultiplier /= timeFix;
    const oldPos = new Vector(this.pos.x, this.pos.y);
    super.update(time);
    if (this.clock >= this.teleportInterval) {
      this.pos = oldPos;
    }
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock >= this.teleportInterval) {
      this.speedMultiplier = 1;
      this.clock = 0;
    } else {
      this.speedMultiplier = 0;
    }
  }
}

class Star extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("star"), radius, speed, angle, "#faf46e");
    this.clock = 0;
    this.starPos = true;
    this.immune = false;
    this.moveMultiplier = 2;
  }
  update(time) {
    const timeFix = time / (1000 / 30);
    this.speedMultiplier /= timeFix;
    const oldPos = new Vector(this.pos.x, this.pos.y);
    super.update(time);
    const deltaPos = new Vector(this.pos.x - oldPos.x, this.pos.y - oldPos.y);
    
    const direction = this.starPos ? 1 : -1;
    this.pos.x = oldPos.x + Math.abs(deltaPos.x) * this.moveMultiplier * direction;
    this.pos.y = oldPos.y + Math.abs(deltaPos.y) * this.moveMultiplier * direction;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    this.clock = (this.clock + time) % 400;
    if (this.clock < time) {
      this.starPos = !this.starPos;
      this.speedMultiplier = 1;
    } else {
      this.speedMultiplier = 0;
    }
  }
}

class Immune extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("immune"), radius, speed, angle, "#000000");
    this.immune = true;
  }
}

class Ice extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("ice_ghost"), radius, speed, angle, "#be89ff");
    this.immune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
        player.frozen = true;
        player.frozenTimeLeft = 150*player.effectImmune;
        player.frozenTime = 0
    }
  }
}

class PositiveMagneticGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("positive_magnetic_ghost"), radius, speed, angle, "#e3001e");
    this.immune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
        player.magnetDirection = "Up";
    }
  }
}

class NegativeMagneticGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("negative_magnetic_ghost"), radius, speed, angle, "#6f59ff");
    this.immune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
        player.magnetDirection = "Down";
    }
  }
}

class Disabling extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("disabling"), radius, speed, angle, "#a87c86", true, "rgba(255, 191, 206, 0.5)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.disabling = true;
    }
  }
}

class DisablingGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("disabling_ghost"), radius, speed, angle, "rgba(255, 191, 206, 0.5)");
    this.Harmless = true;
    this.immune = true;
    this.radius = radius;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      player.disabling = true;
    }
  }
}

class Toxic extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("toxic"), radius, speed, angle, "#00c700", true, "rgba(0, 199, 0, 0.2)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      const corrosive = (0.7*player.effectImmune)*player.maxEnergy;
      if(player.energy>corrosive){player.energy=corrosive}
    }
  }
}

class Enlarging extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("toxic"), radius, speed, angle, "#4d0163", true, "rgba(77, 1, 99, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.enlarging = true;
    }
  }
}

class Icicle extends Enemy {
  constructor(pos, radius, speed, angle, horizontal) {
    super(pos, entityTypes.indexOf("icicle"), radius, speed, angle, "#adf8ff");
    const velChange = random_between([-1, 1]) * speed;
    this.clock = 0
    this.wallHit = false;
    if(angle !== undefined){
      this.angle = angle;
    } else if (horizontal) {
      this.vel.x = velChange;
      this.vel.y = 0;
    } else {
      this.vel.x = 0;
      this.vel.y = velChange;
    }
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius,true).col)this.wallHit=true;
  }
  behavior(time, area, offset, players) {
    if (this.wallHit) {
      this.clock += time
      if (this.clock > 1000) {
        this.wallHit = false;
        this.clock = 0;
      } else {
        this.speedMultiplier = 0;
      }
    } 
  }
}
class Spiral extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("spiral"), radius, speed, angle, "#e8b500");
    this.angleIncrement = 0.15;
    this.angleIncrementChange = 0.004;
    this.angleAdd = false;
    this.dir = 1;
    this.turning = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    if (this.angleIncrement < 0.001) {
      this.angleAdd = true;
    } else if (this.angleIncrement > 0.35) {
      this.angleAdd = false;
    }
    if (this.angleIncrement < 0.05) {
      this.angleIncrementChange = 0.0022;
    } else {
      this.angleIncrementChange = 0.004;
    }
    if (this.angleAdd) {
      this.angleIncrement += this.angleIncrementChange * timeFix;
    } else {
      this.angleIncrement -= this.angleIncrementChange * timeFix;
    }
    this.velToAngle();
    this.angle += this.angleIncrement * this.dir * timeFix;
    this.angleToVel();
  }
}
class Gravity extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, gravity = 6) {
    super(pos, entityTypes.indexOf("gravity"), radius, speed, angle, "#78148c", true, "rgba(60, 0, 115, 0.15)", auraRadius / 32);
    this.gravity = gravity / 32;
  }
  auraEffect(player, worldPos, time) {
    if (player.isInvulnerable()) return;
    const dx = player.pos.x - (this.pos.x + worldPos.x);
    const dy = player.pos.y - (this.pos.y + worldPos.y);
    const dist = Math.hypot(dx, dy);
    if (dist > player.radius + this.auraSize) return;
    const attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
    const moveDist = this.gravity * attractionAmplitude * player.effectImmune * (time / (1000 / 30));
    const angleToPlayer = Math.atan2(dy, dx);
    player.pos.x -= moveDist * Math.cos(angleToPlayer);
    player.pos.y -= moveDist * Math.sin(angleToPlayer);
  }
}

class Gravity_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("gravity_ghost"), radius, speed, angle, "#78148c");
    this.gravity = 12 / 32;
    this.radius = radius;
    this.Harmless = true;
    this.immune = true;
  }
  interact(player, worldPos, time) {
    if (player.isEffectImmune() || player.isInvulnerable()) return;
    const dx = player.pos.x - (this.pos.x + worldPos.x);
    const dy = player.pos.y - (this.pos.y + worldPos.y);
    const dist = Math.hypot(dx, dy);
    if (dist > player.radius + this.radius) return;
    const attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
    const moveDist = this.gravity * attractionAmplitude * player.effectImmune * (time / (1000 / 30));
    const angleToPlayer = Math.atan2(dy, dx);
    player.pos.x -= moveDist * Math.cos(angleToPlayer);
    player.pos.y -= moveDist * Math.sin(angleToPlayer);
  }
}

class Repelling extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, repulsion = 6) {
    super(pos, entityTypes.indexOf("repelling"), radius, speed, angle, "#7b9db2", true, "rgba(210, 228, 239, 0.2)", auraRadius / 32);
    this.repulsion = repulsion / 32;
  }
  auraEffect(player, worldPos, time) {
    if (player.isInvulnerable()) return;
    const dx = player.pos.x - (this.pos.x + worldPos.x);
    const dy = player.pos.y - (this.pos.y + worldPos.y);
    const dist = Math.hypot(dx, dy);
    if (dist > player.radius + this.auraSize) return;
    const repulsionAmplitude = Math.pow(2, -(dist / (100 / 32)));
    const moveDist = this.repulsion * repulsionAmplitude * player.effectImmune * (time / (1000 / 30));
    const angleToPlayer = Math.atan2(dy, dx);
    player.pos.x += moveDist * Math.cos(angleToPlayer);
    player.pos.y += moveDist * Math.sin(angleToPlayer);
    game.worlds[player.world].collisionPlayer(player.area, player);
  }
}

class Repelling_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("repelling_ghost"), radius, speed, angle, "#7b9db2");
    this.repulsion = 12 / 32;
    this.Harmless = true;
    this.immune = true;
  }
  interact(player, worldPos, time) {
    if (player.isEffectImmune() || player.isInvulnerable()) return;
    const dx = player.pos.x - (this.pos.x + worldPos.x);
    const dy = player.pos.y - (this.pos.y + worldPos.y);
    const dist = Math.hypot(dx, dy);
    if (dist > player.radius + this.radius) return;
    const repulsionAmplitude = Math.pow(2, -(dist / (100 / 32)));
    const moveDist = this.repulsion * repulsionAmplitude * player.effectImmune * (time / (1000 / 30));
    const angleToPlayer = Math.atan2(dy, dx);
    player.pos.x += moveDist * Math.cos(angleToPlayer);
    player.pos.y += moveDist * Math.sin(angleToPlayer);
    game.worlds[player.world].collisionPlayer(player.area, player);
  }
}
class Wavy extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("wavy"), radius, speed, angle, "#dd2606");
    this.change_angle(0); // but why???
    this.angle_increment = parseFloat((0.0175 * speed).toFixed(4));
    this.dir = 1;
    this.switch_interval = 3200 / (speed / 2);
    this.switch_time = this.switch_interval;
    this.turning = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    if(this.switch_time > 0){
      this.switch_time -= time;
    } else {
      this.switch_time = this.switch_interval;
      this.dir *= -1;
    }
    this.change_angle(this.angle + this.angle_increment * timeFix * this.dir)
  }
  change_angle(change){
    this.velToAngle();
    this.angle = change;
    this.angleToVel();
  }
}
class Zigzag extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("zigzag"), radius, speed, angle, "#b371f2");
    const random_angle = random_between([0,90,180,270]);
    this.change_angle(degrees_to_radians(random_angle));
    console.log(degrees_to_radians(random_angle))
    this.dir = 1;
    this.switch_interval = 500;
    this.switch_time = this.switch_interval;
    this.turn_angle = Math.PI / 2;
    this.maximum_speed = speed * 1.5;
    this.base_speed = speed;
    this.switch_add = false;
    this.noAngleUpdate = true;
    this.turning = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    const amaster = 28 / 60 * timeFix * 60;
    if (this.switch_time > 0) {
      this.switch_time -= time;
      this.compute_speed();
      if(this.switch_time < this.switch_interval * 0.5 && this.base_speed > 0){
        this.base_speed -= this.maximum_speed / amaster;
        if(this.base_speed < 0){
          this.base_speed = 0;
        }
      }
      if(this.switch_time >= this.switch_interval * 0.5 && this.base_speed < this.maximum_speed){
        this.base_speed += this.maximum_speed / amaster;
        if(this.base_speed > this.maximum_speed){
          this.base_speed = this.maximum_speed;
        }
      }
    } else {
      this.switch_time = this.switch_interval;
      if(!this.switch_add){
        this.angle -= this.turn_angle * this.dir;
        this.change_angle(this.angle);
        this.switch_add = true;
      } else {
        this.angle += this.turn_angle * this.dir;
        this.change_angle(this.angle);
        this.switch_add = false;
      };
    }
  }
  change_angle(change){
    this.velToAngle();
    this.angle = change;
    this.compute_speed();
  }
  compute_speed(){
    this.speed = this.base_speed;
    this.angleToVel();
  }
}
class Zoning extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("zoning"), radius, speed, angle, "#a03811");
    const random_angle = random_between([0,90,180,270]);
    this.change_angle(degrees_to_radians(random_angle));
    this.base_speed = speed;
    this.noAngleUpdate = true;

    this.turn_coin = Math.random();
    this.dir = 1;

    this.switch_interval = 1000;
    this.switch_time = Math.random() * this.switch_interval;
    this.turn_angle = Math.PI / 2;
    this.maximum_speed = this.base_speed * 1.4;
    this.turning = true;
    this.returnCollision = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    const amaster = 28 / 30 * timeFix * 60;
    if (this.switch_time > 0) {
      this.switch_time -= time;
      this.compute_speed();
      if(this.switch_time < this.switch_interval * 0.5 && this.base_speed > 0){
        this.base_speed -= this.maximum_speed / amaster;
        if(this.base_speed < 0){
          this.base_speed = 0;
        }
      }
      if(this.switch_time >= this.switch_interval * 0.5 && this.base_speed < this.maximum_speed){
        this.base_speed += this.maximum_speed / amaster;
        if(this.base_speed > this.maximum_speed){
          this.base_speed = this.maximum_speed;
        }
      }
    } else {
      this.switch_time = this.switch_interval;
      if(this.turn_coin < 0.5){
        this.angle += this.turn_angle * this.dir;
      } else {
        this.angle -= this.turn_angle * this.dir;
      }
      this.change_angle(this.angle);
    }
  }
  change_angle(change){
    this.velToAngle();
    this.angle = change;
    this.compute_speed();
  }
  compute_speed(){
    this.speed = this.base_speed;
    this.angleToVel();
  }
}

class Oscillating extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("oscillating"), radius, speed, angle, "#869e0f");
    this.change_angle(this.angle);
    this.base_speed = speed;
    this.noAngleUpdate = true;

    this.switch_interval = 1000;
    this.switch_time = Math.random() * this.switch_interval;
    this.turn_angle = Math.PI;
    this.maximum_speed = this.base_speed * 1.4;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    const amaster = 28 / 30 * timeFix * 60;
    if (this.switch_time > 0) {
      this.switch_time -= time;
      this.compute_speed();
      if(this.switch_time < this.switch_interval * 0.5 && this.base_speed > 0){
        this.base_speed -= this.maximum_speed / amaster;
        if(this.base_speed < 0){
          this.base_speed = 0;
        }
      }
      if(this.switch_time >= this.switch_interval * 0.5 && this.base_speed < this.maximum_speed){
        this.base_speed += this.maximum_speed / amaster;
        if(this.base_speed > this.maximum_speed){
          this.base_speed = this.maximum_speed;
        }
      }
    } else {
      this.switch_time = this.switch_interval;
      this.angle += this.turn_angle;
      this.change_angle(this.angle)
    }
  }
  change_angle(change){
    this.velToAngle();
    this.angle = change;
    this.compute_speed();
  }
  compute_speed(){
    this.speed = this.base_speed;
    this.angleToVel();
  }
}

function switchCombiner (parentClass, ...properties) {
  return new class SwitchCombiner extends parentClass {
    constructor(pos, radius, speed, angle, index, count){
      super(pos, radius, speed, angle);
      this.switching = true;
      this.disabled = false;
      if (index >= count / 2) {
        this.disabled = true;
      }
      this.switch_clock = 0;
      this.switch_total_time = 3000;
      this.fading_effects_time = 1500;

      // evades code
      if (radius == 1919){
        this.switch_total_time = 5500;
        this.switch_clock = 5500 - 2000;
      } else if(radius == 159){
        this.switch_total_time = 3000;
        this.switch_clock = 3000 - 250;
      }
      // still better than doing extra million classes :)
      this.color = properties[properties.length-1];
    }
    behavior(time, area, offset, players){
      this.switch_clock += time;
      if (this.switch_clock > this.switch_total_time) {
        this.disabled = !this.disabled;
        this.switch_clock = this.switch_clock % this.switch_total_time;
      }
      super.behavior(time, area, offset, players);
    }
  }(...properties)
}

class Radiating extends Enemy {
  constructor(pos, radius, speed, angle, releaseInterval = 4000, releaseTime) {
    super(pos, entityTypes.indexOf("radiating_bullets"), radius, speed, angle, "#d3134f");
    this.releaseTime = releaseInterval;
    this.clock = releaseTime || Math.random() * this.releaseTime;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      for (var i = 0; i < 9; i++) {
        area.addSniperBullet(2, this.pos, i * Math.PI / 4, 8 / 32, 8)
      }
      this.clock = 0;
    }
  }
}
class RadiatingBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#a30838");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.clock=0;
  }
  interact(player, worldPos) {
    if(interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune).inDistance){
      this.toRemove = true;
    }
  }
  behavior(time){
    this.clock+=time
    if(this.clock>=3000){
      this.toRemove = true;
    }
  }
}
class FrostGiant extends Enemy {
  constructor(pos, radius, speed = 0, angle = Math.floor(Math.random()*360), direction = 1, turn_speed = 2, shot_interval = 200, cone_angle = 45, pause_interval = 0, pause_duration = 0, turn_acceleration = 0, shot_acceleration = 0, pattern, immune = true, projectile_duration = 4000,projectile_radius = 10,projectile_speed = 4,precise_movement = false) {
    super(pos, entityTypes.indexOf("frost_giant"), radius, speed, angle,"#7e7cd6");
    this.immune = immune;
    this.entityAngle = angle;
    this.angle = angle;
    this.tick_time = 1000/30;
    this.rotation = false;
    this.precise_movement = precise_movement;
    this.noAngleUpdate = true;
    if(speed>0){this.velToAngle();}

    this.pattern_generator = this.get_pattern_generator(pattern)

    this.projectile_duration = projectile_duration;
    this.projectile_radius = projectile_radius;
    this.projectile_speed = projectile_speed;
    this.shot_interval = shot_interval;
    this.turn_speed = turn_speed * (Math.PI/180);
    this.initial_shot_interval = this.shot_interval;
    this.initial_turn_speed = this.turn_speed;
    this.shot_acceleration = shot_acceleration;
    this.turn_acceleration = turn_acceleration * (Math.PI/180);
    this.pause_interval = pause_interval;
    this.pause_duration = pause_duration;
    this.direction = direction;
    this.initial_angle = this.angle;
    this.cone_angle = cone_angle * (Math.PI/180);
    this.fps_stabilizer = 0;
    this.returnCollision = true;
    this.reset_parameters();
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    this.time = time;
    if(!this.rotation){
      this.generate_entities(area,time);
    }
    if(this.rotation){
      this.velToAngle();
      this.angle += 2*((this.turn_speed * timeFix) * time * this.direction);
      this.angleToVel();
    }
  }
  addBullet(pos,angle,area,radius = this.projectile_radius,speed = this.projectile_speed){
    area.addSniperBullet(9, pos, angle, radius / 32, speed, this.projectile_duration)
  }

  get_pattern_generator(pattern){
    switch(pattern){
      case"spiral": return this.spiral_pattern;
      case"twinspiral": return this.twinspiral_pattern;
      case"quadspiral": return this.quadspiral_pattern;
      case"cone": return this.cone_pattern;
      case"twincone": return this.twincone_pattern;
      case"cone_edges": return this.cone_edges_pattern;
      case"twin": return this.twin_pattern;
      case"singlebig": return this.singlebig_pattern;
      default: this.rotation = true; return ()=>{}
    }
  }

  prepare_shot(){
    const time = this.time;
    if(this.pause_interval!=0){
      if(this.pause_cooldown <= 0){
        this.shot_interval = this.initial_shot_interval;
        this.turn_speed = this.initial_turn_speed;
        this.pause_time -= time;
        if(this.pause_time<0){
          this.pause_cooldown = this.pause_interval;
          this.pause_time = this.pause_duration;
        }
      return false;
      } else {
          this.pause_cooldown -= time;
        }
    }
    this.shot_cooldown -= time;
    if(this.shot_cooldown < 0){
      this.shot_cooldown = this.shot_interval;
      return true;
    } return false;
  }
  reset_parameters(){
    this.shot_cooldown = this.shot_interval;
    this.pause_cooldown = this.pause_interval;
    this.pause_time = this.pause_duration;
  }
  generate_entities(area, time){
    const timeFix = time / (1000 / 30);
    this.angle += this.turn_speed * this.direction * timeFix;
    this.shot_interval -= this.shot_acceleration * timeFix;
    this.turn_speed += this.turn_acceleration * timeFix;
    this.pattern_generator(area)
  }
  singlebig_pattern(area){
    if(this.prepare_shot()){
      const big_radius = this.projectile_radius*3;
      const big_speed = this.projectile_speed;
      const offset_distance = (big_radius / 32) / 2
      const newPos = {x:this.pos.x + Math.cos(this.initial_angle) * offset_distance,
                      y:this.pos.y + Math.sin(this.initial_angle) * offset_distance}
      this.addBullet(newPos,this.initial_angle,area,big_radius,big_speed)
    }
  }
  twin_pattern(area){
    if(this.prepare_shot()){
      this.direction *= -1;

      const perpendicular_angle = this.initial_angle + Math.PI / 2 * this.direction;
      const offset_distance = 15/32;
      const newPos = {x: this.pos.x + Math.cos(perpendicular_angle) * offset_distance,
                      y: this.pos.y + Math.sin(perpendicular_angle) * offset_distance}
      
      this.addBullet(newPos,this.initial_angle,area)
    }
  }
  cone_edges_pattern(area){
    if(this.prepare_shot()){
      this.addBullet(this.pos,this.angle + this.cone_angle,area)
      this.addBullet(this.pos,this.angle - this.cone_angle,area)
    }
  }
  twincone_pattern(area){
    function angle_difference(x,y){
      return Math.min(Math.abs(y-x),Math.abs(y-x+Math.PI*2),Math.abs(y-x-Math.PI*2))
    };

    const angle_moved = angle_difference(this.angle, this.initial_angle);

    if(Math.abs(angle_moved) >= this.cone_angle){
      // Avoid accumulation floating point error by resetting angle.
      this.angle = this.initial_angle + this.cone_angle * this.direction;
      this.direction *= -1;
    }

    if(this.prepare_shot()){
      this.addBullet(this.pos,this.initial_angle+angle_moved,area)
      this.addBullet(this.pos,this.initial_angle-angle_moved,area)
    }
  }
  cone_pattern(area){
    function angle_difference(x,y){
      return Math.min(Math.abs(y-x),Math.abs(y-x+Math.PI*2),Math.abs(y-x-Math.PI*2))
    };

    if(Math.abs(angle_difference(this.angle,this.initial_angle)) >= this.cone_angle){
      // Avoid accumulation floating point error by resetting angle.
      this.angle = this.initial_angle + this.cone_angle * this.direction;
      this.direction *= -1;
    }

    if(this.prepare_shot()){
      this.addBullet(this.pos,this.angle,area)
    }
  }
  quadspiral_pattern(area){
    if(this.prepare_shot()){
      for(var i = 0; i<4; i++){
        this.addBullet(this.pos,this.angle + i * Math.PI / 2,area)
      }
    }
  }
  twinspiral_pattern(area){
    if(this.prepare_shot()){
      for(var i = 0; i<2; i++){
        this.addBullet(this.pos,this.angle + i * Math.PI,area)
      }
    }
  }
  spiral_pattern(area){
    if(this.prepare_shot()){
      this.addBullet(this.pos,this.angle,area)
    }
  }
}

class frost_giant_ice_bullet extends Entity {
  constructor(pos, angle, radius, speed, duration) {
    super(pos, radius, "#a0a7d6");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.duration = duration;
    this.clock = 0;
    this.weak = true;
    this.outline = true;
    this.renderFirst = false;
    this.decayed = false;
    this.immune = false;
    this.shatterTime = 0;
    this.isEnemy = true;
    this.repelled = false;
    this.alpha = 1;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    this.decayed = false;
    this.repelled = false;
    this.shatterTime -= time;
    if (this.shatterTime < 0) {
      this.shatterTime = 0;
    }
    if(this.clock>this.duration-600){
      this.alpha -= time/600;
      if(this.alpha<0){this.alpha=0.001}
    }
    if(this.clock>=this.duration){
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune)
  }
}

class Fire_Trail extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("fire_trail"), radius, speed, angle, "#cf5504");
    this.lightCount=this.radius*32+40;
    this.isLight = true;
    this.clock = 0;
  }
  behavior(time, area, offset, players) {
    this.clock+=time;
    if (this.clock>=(1000*(this.radius*2)/this.speed)) {
        this.spawnTrail(area);
        this.clock=0;
    }
  }
  spawnTrail(area){
    const trail = new Trail(new Vector(this.pos.x,this.pos.y),this.radius);
    area.addEntity("trail",trail);
  }
}

class Trail extends Enemy {
  constructor(pos, radius) {
    super(pos, entityTypes.indexOf("trail"), radius, 0, undefined,"#cf5504");
    this.lightCount=this.radius*32+40;
    this.isLight = true;
    this.clock = 0;
    this.alpha = 1;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>=1000){
      this.alpha -= time/500;
      if(this.alpha<=0){this.alpha=0.001}
    }
    if(this.clock>=1500){
      this.toRemove = true;
    }
  }
}

class Tree extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("tree"), radius, speed, angle, "#4e2700");
    this.original_speed = speed;
    this.noAngleUpdate = true;
    this.velToAngle();
    this.reset_parameters();
  }
  behavior(time, area, offset, players) {
    this.movement_time += time;
    
    if(!this.shaking){
      this.base_speed = this.original_speed * Math.max(
        Math.sin(this.movement_time/200), 0
      );
      this.time_since_shake += time;
      if(this.time_since_shake > this.shake_interval){
        this.shaking = true;
        this.time_since_shake = 0;
      }
    } else {
      this.base_speed = this.original_speed * Math.sin(this.movement_time / 20)
      this.shake_time += time;
      if (this.shake_time >= this.total_shake_time) {
        this.release_ready = true;
        this.generate_entities(area);
        this.shaking = false;
        this.shake_time = 0;
      }
    }
    this.compute_negative_speed();
  }
  compute_negative_speed(){
    this.speed = this.base_speed;
    this.angleToVel();
  }
  generate_entities(area){
    if (this.release_ready) {
      const count = min_max(2,8);
      const radius = 12 / 32;
      const speed = 6;
      for (let i = 0; i < count; i++) {
        area.addSniperBullet(10, this.pos, i * Math.PI / (count/2), radius, speed)
      }
    }
  }
  reset_parameters(){
    this.shake_interval = 4000;
    this.time_since_shake = min_max(1,this.shake_interval);
    this.shaking = false;
    this.total_shake_time = 400;
    this.shake_time = 0;
    this.movement_time = 0;
    this.release_ready = false;
  }
}

class leaf_projectile extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#035b12");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.renderFirst = false;
    this.decayed = false;
    this.immune = true;
    this.shatterTime = 0;
    this.isEnemy = true;
    this.repelled = false;
    this.dir = speed / 150;
  }
  behavior(time, area, offset, players) {
    this.velToAngle();
    this.angle += this.dir * (time / 30);
    this.angleToVel();
    this.clock += time;
    this.decayed = false;
    this.repelled = false;
    this.shatterTime -= time;
    if (this.shatterTime < 0) {
      this.shatterTime = 0;
    }
    if(this.clock>=2000){
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune)
  }
}

class Pumpkin extends Enemy {
  constructor(pos, radius, speed, player_detection_radius = 240) {
    super(pos, entityTypes.indexOf("pumpkin"), radius, speed, undefined,"#e26110");
    this.texture = "pumpkinOff"
    this.staticVel = new Vector(this.vel.x,this.vel.y);
    this.nextAngle = 0;
    this.clock = 0;
    this.nextAngleDetected = false;
    this.staticSpeed = speed + 0;
    this.isLight = false;
    this.lightCount = this.radius*32+30;
    this.outline = true;
    this.player_detection_radius = player_detection_radius / 32;
    this.last_detected_angle = undefined;
    this.totalShakeTime = 1000;
    this.totalAttackTime = 2000;
    this.shakeTimer = 0;
    this.attackTimer = 0;
    this.state = "idle";
    this.stopMovement();
  }
  behavior(time,area,offset,players){
    let minimalDistance = this.player_detection_radius;
    let index;
    const boundary = area.getActiveBoundary();
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < minimalDistance && player.isDetectable() && pointInRectangle(new Vector(player.pos.x - offset.x, player.pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
        minimalDistance = distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y));
        index = i;
      }
    }
    if (index !== undefined && this.state == "idle") {
      const player = players[index];
      this.last_detected_angle = Math.atan2(player.pos.y - offset.y - this.pos.y, player.pos.x - offset.x - this.pos.x);
      this.texture = "pumpkinOn";
      this.isLight = true;
      this.state = "shaking";
    }

    if(this.state == "shaking"){
      this.shakeTimer += time;
      this.angle = Math.random();
      const xvel = Math.cos(this.angle * Math.PI * 2) * 4
      const yvel = Math.sin(this.angle * Math.PI * 2) * 4
      this.vel = new Vector(xvel, yvel);
      if(index !== undefined){
        const player = players[index];
        const dX = (player.pos.x - offset.x) - this.pos.x;
        const dY = (player.pos.y - offset.y) - this.pos.y;
        this.last_detected_angle = Math.atan2(dY,dX);
      }
      if(this.shakeTimer > this.totalShakeTime){
        this.state = "attacking";
        this.angle = this.last_detected_angle;
        this.speed = this.staticSpeed;
        this.angleToVel();
        this.shakeTimer = 0;
      }
    }

    if(this.state == "attacking"){
      this.attackTimer += time;
      if(this.attackTimer > this.totalAttackTime){
        this.state = "idle";
        this.attackTimer = 0;
        this.texture = "pumpkinOff";
        this.isLight = false;
        this.stopMovement();
      }
    }
  }
  stopMovement(){
    this.vel = new Vector(0,0);
  }
}
class FakePumpkin extends Entity {
  constructor(pos, radius) {
    super(pos, radius, "#e26110");
    this.texture = "pumpkinOff";
    this.Harmless = true;
    this.no_collide = true;
    this.outline = true;
    this.static = true;
  }
}

class Snowman extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("snowman"), radius, speed, angle, "#ffffff");
    this.wallHit = false;
    this.snowmanRadiusMultiplier = 1;
    this.growthRate = 0.05 / 2//32;
    this.maxRadiusMultiplier = 3;
    this.wallTime = 1500;
    this.wallDuration = this.wallTime;
    this.wallDuration2 = this.wallTime;
    this.fixatedShink = false;
    this.shrinkingRemaining = 1;
    this.isLight = true;
    this.lightCount = this.radius*32+60;
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius,true).col)this.wallHit=true;
  }
  behavior(time, area, offset, players) {
    if (this.wallHit) {
      if(!this.fixatedShink)this.shrinkingRemaining = this.snowmanRadiusMultiplier;
      this.fixatedShink = true;
      var radiusDifference = this.shrinkingRemaining * (Math.ceil(this.wallDuration2)/this.wallTime); 
      this.snowmanRadiusMultiplier = radiusDifference;
      this.snowmanRadiusMultiplier = Math.max(this.snowmanRadiusMultiplier,1)
      this.radiusMultiplier *= this.snowmanRadiusMultiplier;
      this.wallDuration -= time;
      this.wallDuration2 -= time*2;
      this.speedMultiplier = 0;
      if (this.wallDuration < 0) {
        this.wallDuration = this.wallTime;
        this.wallDuration2 = this.wallTime;
        this.wallHit = false;
        this.fixatedShink = false;
      }
    } else {
      this.snowmanRadiusMultiplier = Math.min(this.snowmanRadiusMultiplier + this.growthRate, this.maxRadiusMultiplier);
      this.radiusMultiplier *= this.snowmanRadiusMultiplier;
    }
  }
}
class Slippery extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 180) {
    super(pos, entityTypes.indexOf("slippery"), radius, speed, angle, "#1aacbf", true, "rgba(33, 161, 165, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.slippery = true;
      
    }
  }
}

class MagneticReduction extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 125) {
    super(pos, entityTypes.indexOf("magnetic_reduction"), radius, speed, angle, "#bd67d2", true, "rgba(189, 103, 210, 0.25)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.magnetic_reduction = true;
    }
  }
}

class MagneticNullification extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 125) {
    super(pos, entityTypes.indexOf("magnetic_nullification"), radius, speed, angle, "#642374", true, "rgba(100, 35, 116, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.magnetic_nullification = true;
    }
  }
}

class ExperienceDraining extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("experience_draining"), radius, speed, angle, "#b19cd9", true, "rgba(60, 0, 0, 0.2)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.experienceDraining=true;
    }
  }
}
class Wind extends Enemy {
  constructor(pos, radius, speed, angle, ignore_invulnerability = false) {
    super(pos, entityTypes.indexOf("wind_ghost"), radius, speed, angle, "#cfffeb");
    this.Harmless = true;
    this.immune = true;
    this.gravity = 16 / 32;
    this.ignore_invulnerability = ignore_invulnerability;
  }
  interact(player,worldPos,time){
    const timeFix = time / (1000 / 30);
    if(!player.isInvulnerable()||this.ignore_invulnerability) {
      const maxIterations = 100; // Prevent infinite loop
      let iterations = 0;
      while(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && iterations < maxIterations) {
        const dx = player.pos.x - (this.pos.x + worldPos.x);
        const dy = player.pos.y - (this.pos.y + worldPos.y);
        const dist = Math.hypot(dx, dy);
        const attractionAmplitude = Math.pow(2, -(dist / (this.radius/2)));
        const moveDist = this.gravity * attractionAmplitude;
        const angleToPlayer = Math.atan2(dy, dx);
        player.pos.x += (moveDist * Math.cos(angleToPlayer)) * timeFix;
        player.pos.y += (moveDist * Math.sin(angleToPlayer)) * timeFix;
        game.worlds[player.world].collisionPlayer(player.area, player);
        iterations++;
      }
    }
  }
}

class Grass extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("grass"), radius, speed, angle, "#75eb26");
    this.active = false;
    this.activation_complete = false;
    this.canKill = false;
    this.alpha = 0.5;
    this.clock = 0;
  }
  behavior(time,area,offset,players){
    if(!this.active){
      this.reset();
    } else {
      this.clock += time;
      if(this.clock > 1000 && !this.activation_complete){
        this.canKill = true;
        this.activation_complete = true;
      }
    }
    if(this.active && !this.activation_complete){
      this.alpha = 0.5+this.clock/20/100;
      if(this.alpha>1){
        this.alpha = 1;
      }
    }
  }
  interact(player,worldPos,time){
    if(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.god && !player.isDead) {
      if(!this.active){
        this.active = true;
      }
    }
    if(interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune,!this.canKill).dead){
      this.reset();
    }
  }
  reset(){
    this.active = false;
    this.canKill = false;
    this.activation_complete = false;
    this.alpha = 0.5;
    this.clock = 0;
  }
}

class Glowy extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("glowy"), radius, speed, angle, "#ede658");
    this.invisible_timing = 500;
    this.brightness = 1;
    this.mode = true;
    this.timer = this.invisible_timing;
    this.brightness_tick = 0.06;
    this.isLight = true;
  }
  behavior(time,area,offset){
    const timeFix = time / (1000 / 30);
    this.lightCount = 3 * this.radius * this.brightness * 32;

    if(this.mode && this.timer <= 0){
      this.brightness -= this.brightness_tick * timeFix;
      if(this.brightness <= 0){
        this.brightness = 0.00001;
        this.mode = false;
        this.timer = this.invisible_timing;
      }
    } else if (!this.mode && this.timer <= 0){
      this.brightness += this.brightness_tick * timeFix;
      if(this.brightness >= 1){
        this.brightness = 1;
        this.mode = true;
        this.timer = this.invisible_timing;
      }
    }

    if (this.timer > 0){
      this.timer -= time;
    }

    this.alpha = this.brightness;
  }
}

class Firefly extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("firefly"), radius, speed, angle, "#f0841f");
    this.invisible_timing = 500;
    this.brightness = Math.random();
    this.mode = true;
    this.timer = this.invisible_timing;
    this.brightness_tick = 0.06;
    this.isLight = true;
  }
  behavior(time,area,offset){
    const timeFix = time / (1000 / 30);
    this.lightCount = 3 * this.radius * this.brightness * 32;

    if(this.mode && this.timer <= 0){
      this.brightness -= this.brightness_tick * timeFix;
      if(this.brightness <= 0){
        this.brightness = 0.00001;
        this.mode = false;
        this.timer = this.invisible_timing;
      }
    } else if (!this.mode && this.timer <= 0){
      this.brightness += this.brightness_tick * timeFix;
      if(this.brightness >= 1){
        this.brightness = 1;
        this.mode = true;
        this.timer = this.invisible_timing;
      }
    }

    if (this.timer > 0){
      this.timer -= time;
    }

    this.alpha = this.brightness;
  }
}

class Mist extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("mist"), radius, speed, angle, "#b686db");
    this.brightness = 1;
    this.mode = true;
    this.visibility_radius = 200;
    this.brightness_tick = 0.05;
    this.isLight = true;
  }
  behavior(time,area,offset,players){
    const timeFix = time / (1000 / 30);
    this.lightCount = 3 * this.radius * this.brightness * 32;

    const closestPlayer = this.getClosestPlayer(players, area);
    if (closestPlayer) {
      const distToPlayer = distance(closestPlayer.pos, new Vector(this.pos.x + closestPlayer.worldPos.x, this.pos.y + closestPlayer.worldPos.y));
      const close_enough = distToPlayer < closestPlayer.radius + this.visibility_radius / 32;

      if(close_enough){
        this.brightness -= this.brightness_tick * timeFix;
        if(this.brightness <= 0){
          this.brightness = 0.00001;
        }
      } else {
        this.brightness += this.brightness_tick * timeFix;
        if(this.brightness >= 1){
          this.brightness = 1;
        }
      }
    }

    this.alpha = this.brightness;
  }

  getClosestPlayer(players, area) {
    let closestPlayer = null;
    let minDistance = Infinity;
    for (const player of players) {
      const worldPos = game.worlds[player.world].pos;
      const position = {x: worldPos.x + area.pos.x, y: worldPos.y + area.pos.y};
      const dist = distance(player.pos, new Vector(this.pos.x + position.x, this.pos.y + position.y));
      if (dist < minDistance) {
        minDistance = dist;
        closestPlayer = player;
        closestPlayer.worldPos = position;
      }
    }

    return closestPlayer;
  }
}

class Phantom extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("phantom"), radius, speed, angle, "#86d7db");
    this.brightness = 0;
    this.mode = true;
    this.visibility_radius = 300;
    this.brightness_tick = 0.05;
    this.isLight = true;
  }
  behavior(time,area,offset,players){
    const timeFix = time / (1000 / 30);
    this.lightCount = 3 * this.radius * this.brightness * 32;
    
    const closestPlayer = this.getClosestPlayer(players, area);
    if (closestPlayer) {
      const distToPlayer = distance(closestPlayer.pos, new Vector(this.pos.x + closestPlayer.worldPos.x, this.pos.y + closestPlayer.worldPos.y));
      const close_enough = distToPlayer < closestPlayer.radius + this.visibility_radius / 32;

      if(!close_enough){
        this.brightness -= this.brightness_tick * timeFix;
        if(this.brightness <= 0){
          this.brightness = 0.00001;
        }
      } else {
        this.brightness += this.brightness_tick * timeFix;
        if(this.brightness >= 1){
          this.brightness = 1;
        }
      }
    }

    this.alpha = this.brightness;
  }

  getClosestPlayer(players, area) {
    let closestPlayer = null;
    let minDistance = Infinity;

    for (const player of players) {
      const worldPos = game.worlds[player.world].pos;
      const position = {x: worldPos.x + area.pos.x, y: worldPos.y + area.pos.y};
      const dist = distance(player.pos, new Vector(this.pos.x + position.x, this.pos.y + position.y));
      if (dist < minDistance) {
        minDistance = dist;
        closestPlayer = player;
        closestPlayer.worldPos = position;
      }
    }

    return closestPlayer;
  }
}

class Poison_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("poison_ghost"), radius, speed, angle, "#590174");
    this.Harmless = true;
    this.immune = true;
  }
  interact(player,worldPos,time){
    if(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      player.poison = true;
      player.poisonTime = 0;
      player.poisonTimeLeft = 150*player.effectImmune;
    }
  }
}

class Burning extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 120, burn_modifier = 1) {
    super(pos, entityTypes.indexOf("burning"), radius, speed, angle, "#FFA500", true, "rgba(255, 165, 0, 0.3)", auraRadius / 32);
    this.isLight = true;
    this.lightCount = auraRadius+60;
    this.burn_modifier = burn_modifier;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.burning = true;
      player.burn_modifier = this.burn_modifier;
    }
  }
}

class Lava extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, charge = 15) {
    super(pos, entityTypes.indexOf("lava"), radius, speed, angle, "#f78306", true, "rgba(247, 131, 6, 0.3)", auraRadius / 32);
    this.charge = charge;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.charging = true;
      player.charge = this.charge;
    }
  }
}

class Barrier extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 100) {
    super(pos, entityTypes.indexOf("barrier"), radius, speed, angle, "#29ffc6", true, "rgba(41, 255, 198, 0.3)", auraRadius / 32);
    this.immune = true;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.inEnemyBarrier = true;
    }
  }
}

class Lunging extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("lunging"), radius, speed, angle, "#c88250");
    this.base_speed = speed;
    this.reset_parameters();
    this.player_detection_radius = 250 / 32;
    this.noAngleUpdate = true;
  }
  reset_parameters(){
    this.lunge_speed = this.base_speed;
    this.normal_speed = 0;

    this.time_to_lunge = 1500;
    this.lunge_timer = 0;

    this.max_lunge_time = 2000;
    this.time_during_lunge = 0;

    this.lunge_cooldown_max = 500;
    this.lunge_cooldown_timer = 0;

    this.base_speed = 0;
    this.compute_speed();
  }

  update_parameters(time,players,offset){
    if(this.in_fear||this.stomped){
      return;
    }
    const timeFix = time / (1000 / 30);
    let closest_entity = undefined;
    let closest_entity_distance = undefined;
    let min = this.player_detection_radius;
    let dX;
    let dY;
    for (const player of players) {
      if(player.isDetectable() && distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < min) {
        min = distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y));
        closest_entity = player;
      }
    }
    if (closest_entity !== undefined) {
      dX = (closest_entity.pos.x - offset.x) - this.pos.x;
      dY = (closest_entity.pos.y - offset.y) - this.pos.y;
      closest_entity_distance = dX ** 2 + dY ** 2;
    }
    if (this.time_during_lunge>0){
      if(this.time_during_lunge >= this.max_lunge_time){
        this.time_during_lunge = 0;
        this.lunge_cooldown_timer = 1;
        this.base_speed = this.normal_speed;
        this.compute_speed();
      } else {
        this.time_during_lunge += time;
        this.base_speed = this.lunge_speed * (1 - (this.time_during_lunge / this.max_lunge_time));
        this.compute_speed();
      }
    }
    if(this.lunge_cooldown_timer > 0){
      if(this.lunge_cooldown_timer > this.lunge_cooldown_max){
        this.lunge_cooldown_timer = 0;
      } else {
        this.lunge_cooldown_timer += time;
        this.color_change = 55-Math.floor(55*this.lunge_cooldown_timer/this.lunge_cooldown_max)
      }
    }
    else {
      let lunge_time_ratio = this.lunge_timer / this.time_to_lunge;
      if(closest_entity !== undefined){
        let target_angle = Math.atan2(dY,dX);
        target_angle += Math.random() * Math.PI/8 - Math.PI/16;
        if (this.time_during_lunge == 0){
          this.lunge_timer += time;
          this.color_change = Math.floor(55 * lunge_time_ratio);
          if(this.lunge_timer >= this.time_to_lunge){
            this.lunge_timer = 0;
            this.time_during_lunge = 1;
            this.base_speed = this.lunge_speed;
            this.change_angle(target_angle);
          }
        }
      } else {
        if(this.lunge_timer > 0){
          this.lunge_timer-=time;
          this.color_change = Math.floor(55 * lunge_time_ratio);
        }
        if(this.lunge_timer < 0){
          this.lunge_timer = 0;
        }
      }
      if (lunge_time_ratio > 0.75){
        this.move(min_max(-2, 2) / 32, min_max(-2, 2) / 32, timeFix);
      }
    }
  }

  behavior(time, area, offset, players) {
    this.update_parameters(time,players,offset)
  }

  compute_speed(){
    this.speed = this.base_speed;
    this.angleToVel();
  }

  change_angle(angle){
    this.angle = angle;
    this.compute_speed();
  }

  move (x, y, timeFix){
    this.pos.x += x * timeFix;
    this.pos.y += y * timeFix;
  }
}

class Sand extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sand"), radius, speed, angle, "#d5ae7f");
    this.realVel = new Vector(this.vel.x, this.vel.y);
    this.collision = false;
    this.friction = 1;
    this.useRealVel = true;
    this.speed = speed;
  }
  behavior(time, area, offset, players) {
    this.friction += time / 1000;
    if(this.friction>3){
      this.friction = 3;
    }
    if(this.collision){
      this.collision = false;
      this.friction = 0;
    }
    this.vel = new Vector(this.realVel.x * this.friction, this.realVel.y * this.friction);
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius,true).col)this.collision=true;
  }
}

class Sandrock extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sandrock"), radius, speed, angle, "#a57a6d");
    this.realVel = new Vector(this.vel.x, this.vel.y);
    this.minimum_speed = 0.1;
    this.collision = false;
    this.friction = 1;
    this.useRealVel = true;
    this.speed = speed;
  }
  behavior(time, area, offset, players) {
    this.friction -= time / 3000;

    if(this.friction < this.minimum_speed){
      this.friction = this.minimum_speed;
    }
    
    if(this.collision){
      this.collision = false;
      this.friction = 1;
    }
    this.vel = new Vector(this.realVel.x * this.friction, this.realVel.y * this.friction);
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius,true).col)this.collision=true;
  }
}

class Crumbling extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("crumbling"), radius, speed, angle, "#bd9476");
    this.collision = false;
    this.staticRadius = radius;
    this.staticSpeed = speed;
    this.realRadius = radius;
    this.radius = radius;
    this.speed = speed;
    this.clock = 3001;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    if(this.collision&&this.clock>3000){
      this.collision = false;
      this.angle = this.velToAngle()
      this.clock = 0;
      this.realRadius = this.staticRadius / 2;
      this.velToAngle();
      this.speed = this.staticSpeed / 2;
      this.angleToVel();
      area.addSniperBullet(14, this.pos, Math.random() * Math.PI, this.staticRadius / 3, this.staticSpeed / 3)
    } else if (this.clock > 3000 && this.radius != this.realRadius){
      this.realRadius += timeFix * this.staticRadius / 2 / 2000 * 30;
      if (this.realRadius > this.radius) {
        this.realRadius = this.radius;
      }
      this.velToAngle();
      this.speed = this.staticSpeed;
      this.angleToVel();
    }
    this.clock += time;
    this.radius = this.realRadius;
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.realRadius,true).col)this.collision=true;
  }
}

class Residue extends Enemy {
  constructor(pos, angle, radius, speed) {
    super(pos, entityTypes.indexOf("residue"), radius, speed, angle, "#675327");
    this.clock=0;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock>3000) {
      this.toRemove=true;
    }
  }
}

class Flower extends Enemy {
  constructor(pos, radius, speed, angle, growthMultiplayer = 1, player_detection_radius = 200) { 
    super(pos, entityTypes.indexOf("flower"), radius, speed, angle, "#e8e584");
    this.id = 1;
    this.growthMultiplayer = growthMultiplayer
    this.player_detection_radius = player_detection_radius / 32;
  }
  behavior(time, area, offset, players) {
    while(this.id<=5){
      this.spawnFlower(area,this.id);
      this.id++;
    }
  }
  spawnFlower(area, id){
    const flower_projectile = new FlowerProjectile(new Vector(this.pos.x,this.pos.y),this.radius,id,this);
    area.addEffect("flower_projectile",flower_projectile);
  }
}

class FlowerProjectile extends Entity {
  constructor(pos, radius, id, spawner) {
    super(pos, radius, "#e084e8");
    this.id = id;
    this.spawner = spawner;
    this.no_collide = true;
    this.triggerZone = spawner.player_detection_radius;
    this.growthMultiplayer = spawner.growthMultiplayer;
    this.radiusRatio = 1;
    this.immune = true;
    this.Harmless = false;
    this.isEffect = true;
  }
  behavior(time, area, offset, players) {
    this.radius = this.fixedRadius * this.radiusMultiplier;
    this.radiusMultiplier = 1;

    const timeFix = time / (1000 / 30);
    const growth = this.radius/32 * this.growthMultiplayer;
    const player = this.closestPlayer(players, offset);
    switch(this.id){
      case 1:
        this.pos = this.newPosition(1,-0.25);
        break;
      case 2:
        this.pos = this.newPosition(-1,-0.25);
        break;
      case 3:
        this.pos = this.newPosition(0,-1);
        break;
      case 4:
        this.pos = this.newPosition(0.6,0.9);
        break;
      case 5:
        this.pos = this.newPosition(-0.6,0.9);
        break;
    }
    if (player != undefined) {
      this.radiusRatio -= growth * timeFix;
    } else {
      this.radiusRatio += growth * timeFix;
    }
    if(this.radiusRatio>1){
      this.radiusRatio = 1;
    }
    this.radius *= Math.max(0,this.radiusRatio);
  }
  interact(player, worldPos) {
    this.updateHarmlessState();
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune,this.Harmless,true)
  }
  newPosition(x,y){
    return new Vector(this.spawner.pos.x+x*this.radius,this.spawner.pos.y+y*this.radius)
  }
  updateHarmlessState(){
    if(this.spawner.Harmless){
      this.Harmless = true;
    } else {
      this.Harmless = false;
    }
  }
  closestPlayer(players, offset){
    let min = this.triggerZone;
    let closest_entity = undefined;
    for (const player of players) {
      if(player.isDetectable()) if (distance(this.spawner.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < min) {
        min = distance(this.spawner.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y));
        closest_entity = player;
      }
    }
    return closest_entity;
  }
}

class Seedling extends Enemy {
  constructor(pos, radius, speed, angle, growthMultiplayer) { 
    super(pos, entityTypes.indexOf("seedling"), radius, speed, angle, "#259c55");
    this.spawnedProjectile = false;
    this.immune = true;
  }
  behavior(time, area, offset, players) {
    if(!this.spawnedProjectile){
      this.spawnedProjectile = true;
      const seedling_projectile = new SeedlingProjectile(new Vector(this.pos.x,this.pos.y),this.radius,this.speed,this);
      area.addEntity("seedling_projectile",seedling_projectile);
    }
  }
}

class SeedlingProjectile extends Entity {
  constructor(pos, radius, speed, spawner) {
    super(pos, radius, "#259c55");
    this.spawner = spawner;
    this.no_collide = true;
    this.outline = true;
    this.renderFirst = false;
    this.immune = true;
    this.angle = Math.random()*360;
    this.dir = 10;
    this.radius = radius;
    this.noAngleUpdate = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    this.angle += this.dir * timeFix;
    const combinedRadius = this.radius + this.spawner.radius / 2;
    const xPos = combinedRadius*Math.cos(this.angle/180*Math.PI);
    const yPos = combinedRadius*Math.sin(this.angle/180*Math.PI);
    this.pos = this.newPosition(xPos,yPos);
    this.speedMultiplier = 0;
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.immune,false,true)
  }
  newPosition(x,y){
    return new Vector(this.spawner.pos.x+x,this.spawner.pos.y+y)
  }
}

class Cactus extends Enemy {
  constructor(pos, radius, speed, angle) { 
    super(pos, entityTypes.indexOf("cactus"), radius, speed, angle, "#5b8e28");
    this.immune = true;
    this.push_time = 200;
    this.staticRadius = this.realRadius = radius;
  }
  interact(player,offset,time){
    var timeFix = time / (1000 / 30);
    this.realRadius += timeFix * this.staticRadius / 2 / 2000 * 30;
    if(this.realRadius > this.staticRadius) this.realRadius = this.staticRadius;
    this.radius = this.realRadius;
    if(player.isInvulnerable()) return
    if (distance(player.pos, new Vector(this.pos.x + offset.x, this.pos.y + offset.y)) < player.radius + this.radius && !player.safeZone) {
      if(player.knockback_limit_count<100){
        if(!player.shadowed_invulnerability){
          player.knockback_player(time,this,this.push_time,this.radius*8*32+50,offset);
        }
      }
      this.radius = this.realRadius = this.staticRadius / 2;
    }
  }
}

class Charging extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("charging"), radius, speed, angle, "#374037");
    this.realVel = new Vector(this.vel.x, this.vel.y);
    this.collision = false;
    this.friction = 1;
    this.useRealVel = true;
    this.speed = speed;

    this.provoked = false;
    this.provokedTime = 0;
  }
  behavior(time, area, offset, players) {
    this.friction += 0.05 * time/(1e3/30);
    if(this.friction > 2.5){
      this.friction = 2.5;
    }
    if(this.provoked){
      this.provokedTime -= time;
    }
    if(this.provokedTime <= 0){
      this.provoked = false;
    }
    if(this.collision){
      this.collision = false;
      this.friction = 0;
      this.retarget(offset, players);
    }
    this.vel = new Vector(this.realVel.x * this.friction, this.realVel.y * this.friction);
  }
  collide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius,true).col) {
      this.collision=true;
    }
  }
  retarget(offset, players){
    let min = 250 / 32;
    for (let i in players) {
      if(!players[i].safeZone && !players[i].night && !players[i].god && !players[i].isDead) if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min) {
        //found player
        this.provoked = true;
        this.friction = 1;
        this.provokedTime = 1500;
        //redirect
        this.velToAngle();
        let dy = players[i].pos.y - offset.y - this.pos.y;
        let dx = players[i].pos.x - offset.x - this.pos.x;
        this.angle = Math.atan2(dy, dx);
        this.angleToVel();
      }
    }
  }
}
// custom

class StickySniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sticky_sniper"), radius, speed, angle, "#000037");
    this.releaseTime = 2000;
    this.clock = Math.random() * this.releaseTime;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      var min = 18.75;
      var index;
      var boundary = area.getActiveBoundary();
      for (var i in players) {
        if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min && pointInRectangle(new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
          min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
          index = i;
        }
      }
      if (index != undefined && !players[index].isDetectable()) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(11, this.pos, Math.atan2(dY, dX), this.radius / 2, 10)
        this.clock = 0;
      }
    }
  }
}

class StickySniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#000037");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      player.stickness = 1000;
      this.toRemove = true;
    }
  }
}

class StickyTrail extends Enemy {
  constructor(pos) {
    super(pos, entityTypes.indexOf("sticky_trail"), 0, 0, undefined,"rgb(0,0,69,0.5)");
    this.clock = 0;
    this.alpha = 1;
    this.radius = 8/32;
    this.immune = true;
  }
  behavior(time, area, offset, players) {
    this.radius = 5/32*Math.min(2500,this.clock)/250;
    this.clock += time;
    if(this.clock>=4000){
      this.alpha -= time/1000;
      if(this.alpha<=0){this.alpha=0.001}
    }
    if(this.clock>=5000){
      this.toRemove = true;
    }
  }
  interact(player,worldPos){
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !player.isInvulnerable()) {
      player.sticky = true;
    }
  }
}

class ClownTrail extends Enemy {
  constructor(pos,radius,angle,color) {
    super(pos, entityTypes.indexOf("clown_trail"), radius, 12, undefined,color);
    this.clock = 0;
    this.alpha = 1;
    this.radius = radius;
    this.angle = angle;
    this.speed = 12;
    this.angleToVel();
    this.no_collide = true;
    this.clown = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    this.radius -= (this.clock/1000)/4;
    this.clock += time;
    this.alpha -= time/1500;
    if(this.alpha<=0){this.alpha=0.001}
    if(this.clock>=1500){
      this.toRemove = true;
    }
    const affectedEntities = [];
    for (const entityGroup of Object.values(area.entities)) {
      for (const entity of entityGroup) {
        if (!entity.immune && !entity.Harmless && !entity.clown &&
            distance(this.pos, entity.pos) < this.radius + entity.radius) {
          entity.Harmless = true;
          entity.clownHarm = true;
          affectedEntities.push(entity);
        }
      }
    }
    if (affectedEntities.length > 0) {
      setTimeout(() => {
        for (const entity of affectedEntities) {
          entity.Harmless = false;
          entity.clownHarm = false;
        }
      }, 1500);
    }
  }
  interact(){}
}

// non-enemies

class SweetTooth extends Entity {
  constructor(pos,power) {
    super(pos, 0.4,"#e26110");
    this.texture = "sweet_tooth_item";
    this.no_collide = true;
    this.power = power;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius*1.5) {
      player.sweetToothEffect = true;
      player.sweetToothConsumed = true;
      player.sweetToothTimer = 15000;
      player.sweetToothPower = this.power;
      this.no_collide = false;
      this.weak = true;
      this.toRemove = true;
    }
  }
}

class ReverseProjectile extends Enemy {
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("reverse_projectile"), 30/32, undefined, undefined, "#00dd00");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.immune = true;
    this.speed = 30;
    this.outline = false;
    this.angleToVel();
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>=1500){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.immune) {
          if(!entity.healing || entity.healing<3700){
            entity.angle+=Math.PI;
            entity.angleToVel();
          }
          entity.healing = 4000;
        }
      }
    }
  }
  interact(){}
}

class ObscureProjectile extends Enemy {
  constructor(pos,angle,player) {
    super(pos, entityTypes.indexOf("obscure_projectile"), 15/32, undefined, undefined, "#020fa2");
    this.clock = 0;
    this.angle = angle;
    this.immune = true;
    this.speed = 50;
    this.outline = false;
    this.angleToVel();
    this.obscure = true
    this.area_collide = true;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>=500){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        const player = players[0];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.toRemove && entity.isEnemy && !entity.obscure) {
          player.pos = new Vector(entity.pos.x+offset.x,entity.pos.y+offset.y)
          player.invincible_time = 1000;
          player.invincible = true;
          this.toRemove = true;
        }
      }
    }
  }
  interact(){}
}

class MinimizeProjectile extends Enemy {
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("minimize_projectile"), 11/32, undefined, undefined, "#ff0000");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.immune = true;
    this.speed = 15;
    this.outline = false;
    this.angleToVel();
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>=1500){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.immune) {
          entity.minimized = 4000;
        }
      }
    }
  }
  interact(){}
}