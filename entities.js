class Entity {
  constructor(pos, radius, color) {
    this.pos = pos;
    this.radius = radius;
    this.fixedRadius = radius;
    this.color = color;
    this.vel = new Vector(0, 0);
    this.outline = false;
    this.speedMultiplier = 1;
    this.radiusMultiplier = 1;
    this.angle = 0;
    this.speed = 0;
    this.friction = 0;
    this.weak = false;
    this.renderFirst = true;
    this.Harmless = false;
    this.imune = true;
    this.collide = true;
    this.isEnemy = false;
    this.toRemove = false;
    this.no_collide = false;
    this.teleportPosition = [];
  }
  angleToVel(ang = this.angle) {
    if(this.useRealVel){
      this.realVel.x = Math.cos(ang) * this.speed;
      this.realVel.y = Math.sin(ang) * this.speed;
      return;
    }
    this.vel.x = Math.cos(ang) * this.speed;
    this.vel.y = Math.sin(ang) * this.speed;  
  }
  velToAngle() {
    if(this.useRealVel){
      this.angle = Math.atan2(this.realVel.y, this.realVel.x);
      return;
    }
    this.angle = Math.atan2(this.vel.y, this.vel.x);
    var dist = distance(new Vector(0, 0), this.vel);
    this.speed = dist;
  }
  update(time) {
    this.radius = this.fixedRadius;
    if(!this.noAngleUpdate){ //temporary
      this.velToAngle();
      this.angleToVel();
    }
    var timeFix = time / (1000 / 30);
    var vel = new Vector(this.vel.x * this.speedMultiplier, this.vel.y * this.speedMultiplier)
    this.speedMultiplier = 1;
    this.radius *= this.radiusMultiplier;
    this.radiusMultiplier = 1;
    if(!this.freeze>0){this.pos.x += vel.x / 32 * timeFix;
    this.pos.y += vel.y / 32 * timeFix;}
    else {this.freeze -= time;}
    if(this.freeze<0){this.freeze = 0;}
    if(this.sugar_rush>0){
      this.speedMultiplier*=0.05;
      this.sugar_rush-=time;
    }
    if(game.players[0].className == "Chrono" && this.isEnemy){
      this.teleportPosition.push(new Vector(this.pos.x,this.pos.y));
      if(this.teleportPosition.length>Math.round(75/timeFix)){this.teleportPosition.shift();}
    }
    var dim = 1 - this.friction;
    this.vel.x *= dim;
    this.vel.y *= dim;
  }
  colide(boundary) {
    collisionEnemy(this,boundary,this.vel,this.pos,this.radius)
  }
  behavior(time, area, offset, players) {

  }
  interact(player, worldPos) {

  }
}
class Pellet extends Entity {
  constructor(pos,power) {
    const p = ["#b84dd4", "#a32dd8", "#3b96fd", "#43c59b", "#f98f6b"];
    super(pos, 0.29, p[Math.floor(Math.random() * p.length)]);
    this.multiplier = power;
  }
  behavior(time, area, offset, players) {
    for (const i in players) {
      const player = players[i];
      if (distance(this.pos, new Vector(player.pos.x - offset.x, player.pos.y - offset.y)) < player.radius + this.radius) {
        const boundary = area.getActiveBoundary();
        const posX = Math.random() * boundary.w + boundary.x;
        const posY = Math.random() * boundary.h + boundary.y;
        this.pos = new Vector(posX, posY)
        player.updateExperience(Math.ceil((parseInt(player.area)+1)/3)*this.multiplier);
        if(player.usesPellets){
          if(player.usesPellets == 1 || player.usesPellets == 3){
            player.firstPellet-=this.multiplier;
            if(player.firstPellet<0) player.firstPellet=0;
          }
          if(player.usesPellets == 2 || player.usesPellets == 3){
            player.secondPellet-=this.multiplier;
            if(player.secondPellet<0) player.secondPellet=0;
          }
        }
      }
    }
  }
}
class Player {
  constructor(pos, type, speed, color, className) {
    this.name = document.getElementById("nick").value;
    this.id = Math.random();
    this.type = type;
    this.pos = pos;
    this.className = className;
    this.ab1 = abilityOne;
    this.ab2 = abilityTwo;
    this.previousPos = this.pos;
    this.previousAngle = 0;
    this.oldPos = this.pos;
    this.radius = 15 / 32;
    this.fixedRadius = 15 / 32;
    this.lightCount = 0;
    this.staticRadius = 15;
    this.color = color;
    this.tempColor = color
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
    this.invicible = false;
    this.tempPrevExperience=0;
    this.tempNextExperience=4;
    this.speedMultiplier = 1;
    this.speedAdditioner = 0;
    this.radiusMultiplier = 1;
    this.radiusAdditioner = 0;
    this.regenAdditioner = 0;
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
    this.wasFrozen = false;
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
    this.quicksand = {angle: undefined, strength: 5};
    this.charging = false;
    this.slippery = false;
    this.disabling = false;
    this.prevSlippery = false;
    this.dyingPos = new Vector(0, 0);
    this.level = 1;
    this.points = (settings.no_points)? 0 : 150;
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
    this.cent_max_distance = 10;
    this.cent_distance = 0;
    this.previousLevelExperience = 0;
    this.nextLevelExperience = 4;
    this.cent_input_ready = true;
    this.cent_deceleration = 0.666;
    this.cent_acceleration = 0.333;
    this.cent_accelerating = false;
    this.cent_is_moving = false;
    this.mortarTime = 0;
    this.distance_moved_previously = [0,0];
    this.aura = false;
    this.auraType = -1;
    this.collides = false;
    this.effectImmune = 1;
    this.effectReplayer = 1;
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
    this.clownBall = false;
    this.clownBallSize = 1;
    this.wallGod = false;
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
    if(this.overlay && settings.dev){
      if(input.isMouse && ping.mouse.x != input.mouse.x && ping.mouse.y != input.mouse.y){
        ping.mouse = new Vector(input.mouse.x,input.mouse.y)
        let index = 0;
        for(let i in ping.mouseArray){
          let mouseInput = ping.mouseArray[i];
          if(mouseInput.x == input.mouse.x && mouseInput.y == input.mouse.y){
            index = i;
          }
        }
        const pingTime = new Date().getTime() - ping.mouseTimer[index];
        ping.array.push(pingTime);
        //console.log("avgPing: " + ping.array.reduce((e,t)=>e+t)/ping.array.length,"ping: " + pingTime)
      } /*else if(input.keys.length){
        const inputKeys = getInputKeys(input.keys);
        if(inputKeys.length){
          ping.keys = [...inputKeys];
          let index = findEqualKeys(ping.keysArray,inputKeys);
          if(index !== null){
            const pingTime = new Date().getTime() - ping.keysArray[index].timestamp;
            console.log(pingTime)
            ping.array.push(pingTime)
            ping.keysArray.splice(index,1)
          }
        }
      }*/else if (input.keys[68] && !ping.previous){
        const pingTime = new Date().getTime()-ping.activationTime;
        ping.previous = true;
        ping.array.push(pingTime)
        //console.log("avgPing: " + ping.array.reduce((e,t)=>e+t)/ping.array.length,"ping: " + pingTime)
      } else if (!input.keys[68]){ping.previous = false}

      if(ping.array.length > 25){
        ping.array.shift();
      }
    }

    this.firstAbility = false;
    this.secondAbility = false;
    if(this.isDead) {
      if( (this.className == "Necro" || this.className == "Chrono") && input.keys){
        if ((input.keys[74] || input.keys[90]) && !this.firstAbilityPressed) {
          this.firstAbility = true;
          this.firstAbilityPressed = true;
        }
        if (!(input.keys[74] || input.keys[90])) {
          this.firstAbilityPressed = false;
        }
      }
      input = [];
    }
    if (input.keys) {
      if ((input.keys[74] || input.keys[90]) && !this.firstAbilityPressed && !this.disabling) {
        this.firstAbility = true;
        this.firstAbilityPressed = true;
      }
      if ((input.keys[75] || input.keys[88]) && !this.secondAbilityPressed && !this.disabling) {
        this.secondAbility = true;
        this.secondAbilityPressed = true;
      }
      if (!(input.keys[74] || input.keys[90])) {
        this.firstAbilityPressed = false;
      }
      if (!(input.keys[75] || input.keys[88])) {
        this.secondAbilityPressed = false;
      }
      if (!this.prevSlippery||this.collides||(this.d_x == 0 && this.d_y == 0)) {
        if (this.slippery&&!this.prevSlippery) {
          if (!(input.keys[87] || input.keys[38]||input.keys[65] || input.keys[37]||input.keys[83] || input.keys[40]||input.keys[68] || input.keys[39])) {
            this.vel = new Vector(0,0);
          }
        }
        if (input.keys[16]&&!this.slippery) {
          this.shift = 2;
        } else {this.shift = 1;}
        if(!this.reaperShade)if(input.keys[49]) {
          if (this.speed < this.maxSpeed && this.points > 0) {
            this.speed += 0.5;
            this.points--;
            if(this.speed > this.maxSpeed){this.speed = this.maxSpeed;}
          }
        }
        if (input.keys[50]) {
          if (this.maxEnergy < this.maxUpgradableEnergy && this.points > 0) {
            this.maxEnergy += 5;
            this.points--;
          }
        }
        if (input.keys[51]) {
          if (parseFloat(this.regen.toFixed(3)) < this.maxRegen && this.points > 0) {
            this.regen += 0.2;
            this.points--;
            if(this.regen > this.maxRegen){this.regen = this.maxRegen;}
          }
        }
        if (this.energy-1>0 && !this.disabling && !this.magnetAbilityPressed && (this.magnet||this.flashlight||this.lantern) && (input.keys[76] || input.keys[67])) {
          if(this.magnetDirection=="Down"){this.magnetDirection = "Up"}
          else if(this.magnetDirection=="Up"){this.magnetDirection = "Down"}
          this.magnetAbilityPressed = true;
          this.flashlight_active = !this.flashlight_active;
          this.lantern_active = !this.lantern_active;
          if(this.magnet)this.energy -= 1;
        }

        if (!(input.keys[76] || input.keys[67])) {
          this.magnetAbilityPressed = false;
        }
        this.statSpeed = this.speed+0;
        this.addX = 0; this.addY =0;
        this.d_x=0; this.d_y=0;
        if(this.sweetToothConsumed){
          this.speedAdditioner=5;
          this.regenAdditioner=5;
        }
        if(this.minimum_speed>this.speed+this.speedAdditioner){this.speed=this.minimum_speed}
        if (!this.shouldCentMove() && this.shift == 2) {
          this.speedMultiplier *= 0.5;
          this.speedAdditioner *= 0.5;
        }
        if (this.poison) {
          this.speedMultiplier *= 3;
        }
        if (this.fusion) {
          this.speedMultiplier *= 0.7;
        }
        if (this.slowing) {
          this.speedMultiplier *= (1-this.effectImmune*(1-0.7))*this.effectReplayer;
        }
        if (this.freezing) {
          this.speedMultiplier *= (1-this.effectImmune*(1-0.2))*this.effectReplayer;
        }
        if (this.cobweb && this.web){
          this.speedMultiplier *= Math.min(1-(this.webstickness),(1-this.effectImmune*(this.webstickness))*this.effectReplayer)
        } else if (this.cobweb) {
          this.speedMultiplier *= 1-(this.webstickness)
        } else if (this.web) {
          this.speedMultiplier *= (1-this.effectImmune*(this.webstickness))*this.effectReplayer;
        }
        if(this.sticky || this.stickness>0){
          this.speedMultiplier *= (1-this.effectImmune*(1-0.2))*this.effectReplayer;
        }
        this.distance_movement = (this.speed*this.speedMultiplier)+this.speedAdditioner;
        this.mouseActive = false;
          if (input.isMouse&&!this.cent_is_moving&&!(input.keys[87] || input.keys[38]||input.keys[65] || input.keys[37]||input.keys[83] || input.keys[40]||input.keys[68] || input.keys[39])) {
            this.mouse_distance_full_strength = 150*settings.scale;
            this.mouseActive = true;
            if(this.slippery){this.mouse_distance_full_strength = 1;}

            if(!this.shouldCentMove() || (this.shouldCentMove() && this.cent_input_ready)){

              if(this.shouldCentMove()){
                this.cent_input_ready = false;
                this.cent_is_moving = true;
                this.cent_accelerating = true; 
                this.mouse_distance_full_strength = 1;
              }

              this.dirX = Math.round(input.mouse.x - width / 2);
              this.dirY = Math.round(input.mouse.y - height / 2);
              this.dist = distance(new Vector(0, 0), new Vector(this.dirX, this.dirY));

              if (this.dist > this.mouse_distance_full_strength) {
                this.dirX *= this.mouse_distance_full_strength / this.dist;
                this.dirY *= this.mouse_distance_full_strength / this.dist;
              }
              
              this.mouse_angle = Math.atan2(this.dirY,this.dirX);
              this.input_angle = this.mouse_angle;
              this.mouse_distance = Math.min(this.mouse_distance_full_strength,Math.sqrt(this.dirX**2+this.dirY**2))
              this.distance_movement*=this.mouse_distance/this.mouse_distance_full_strength;

              if(this.shouldCentMove() && this.cent_input_ready){
                this.cent_saved_angle = this.input_angle;
                this.cent_input_ready = false;
                this.cent_is_moving = true;
              }

              this.d_x = this.distance_movement*Math.cos(this.mouse_angle)
              this.d_y = this.distance_movement*Math.sin(this.mouse_angle)
            }

            if(!this.shouldCentMove()){this.vel.x = this.dirX * this.speed / this.mouse_distance_full_strength;
            this.addX = this.dirX * this.speedAdditioner/this.mouse_distance_full_strength;
            this.addY = this.dirY * this.speedAdditioner/this.mouse_distance_full_strength;
            if(!this.magnet||this.magnet&&this.safeZone){if(this.vertSpeed==-1){this.vel.y = this.dirY * this.speed / this.mouse_distance_full_strength;}else{this.vel.y = this.dirY * this.vertSpeed / this.mouse_distance_full_strength;}} 
            }
        } else if (!this.cent_is_moving){
            this.dirY = 0; this.dirX = 0;
            this.moving = false;
            if(this.isMovementKeyPressed(input)){
              if(this.shouldCentMove() && this.cent_input_ready) this.cent_is_moving = true;
              this.moving=true;
              input.isMouse = false;
              if (this.shouldCentMove()) this.cent_input_ready = false;
              this.cent_accelerating = true;
            }
            if (input.keys[83] || input.keys[40]) {
              this.dirY = 1;
            }
            if (input.keys[87] || input.keys[38]) {
              this.dirY = -1;
            }
            if (input.keys[65] || input.keys[37]) {
              this.dirX = -1;
            }
            if (input.keys[68] || input.keys[39]) {
              this.dirX = 1;
            }
        }

        this.input_angle = Math.atan2(this.dirY,this.dirX)

        if(this.shouldCentMove() && this.cent_input_ready){
          this.cent_saved_angle = this.input_angle;
          this.cent_input_ready = false;
          this.cent_is_moving = true;
        }

        if(this.shouldCentMove() && this.cent_distance){
          this.d_x = this.dirX * this.cent_distance;
          this.d_y = this.dirY * this.cent_distance;
        }
        else if(this.moving&&!input.isMouse&&!this.shouldCentMove()) {
          this.d_x = this.distance_movement * this.dirX;
          this.d_y = this.distance_movement * this.dirY;
        }
        //this.speed-=this.speedAdditioner;
        this.speed=this.statSpeed;
      }
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
  update(time, friction, magnet) {
    this.update_knockback(time);
    const timeFix = time / (1000 / 30);
    this.inBarrier = false;

    if(this.flashlight_active || this.lantern_active){
      this.energy -= 1 * time / 1000;
    }

    if(this.sweetToothConsumed){
      this.speedAdditioner=5;
      this.regenAdditioner=5;
    }
    if(this.victoryTimer<=0){
      this.timer += time;
    } else {
      this.victoryTimer -= time;
      if(this.victoryTimer<=0){this.timer = 0;}
    }
    const world = game.worlds[this.world];
    const area = world.areas[this.area];
    if(!magnet){
      if(area.magnetism || world.magnetism){this.magnet = true; magnet = true;}
    }
    if(area.applies_lantern || world.applies_lantern){
      this.lantern = true;
    } else if(this.lantern){
      this.lantern = false;
    }
    if(!area.matched && this.area != 0){
      area.matched = true; 
      this.updateExperience(12*(parseInt(this.area)));
    }
      this.safeZone = true;
      this.minimum_speed = 1;
      for(var i in area.zones){
        var zone = area.zones[i];
        if(zone.type == 0||(zone.type==1&&zone.minimum_speed)){
          var rect1 = {x:this.pos.x-game.worlds[this.world].pos.x-game.worlds[this.world].areas[this.area].pos.x,y:this.pos.y-game.worlds[this.world].pos.y-game.worlds[this.world].areas[this.area].pos.y,width:this.radius, height:this.radius};
          var rect2 = {x:zone.pos.x, y:zone.pos.y, width:zone.size.x+0.5, height:zone.size.y+0.5}
          if (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y) {
              if(zone.type==0)this.safeZone=false;
              this.minimum_speed=zone.minimum_speed;
          }
        }
      }
      this.speedMultiplier = 1;
      if(this.collides&&this.slippery){
        this.d_x*=2;
        this.d_y*=2;
        this.collidedPrev = true;
      } else if (this.collidedPrev) {
        this.d_x/=2;
        this.d_y/=2;
        this.collidedPrev = false;
      }
      if (this.poison) {
        this.poisonTime += time;
        this.speedMultiplier *= 3;
      }
      if (this.fusion) {
        this.speedMultiplier *= 0.7;
      }
      if (!this.shouldCentMove()&&this.shift == 2) {
        this.speedMultiplier *= 0.5;
        this.speedAdditioner *= 0.5;
      }
      if (this.poisonTime >= this.poisonTimeLeft) {
        this.poison = false;
        this.poisonTimeLeft = 0;
      }
      if (this.slowing) {
        this.speedMultiplier *= (1-this.effectImmune*(1-0.7))*this.effectReplayer;
      }
      if (this.freezing) {
        this.speedMultiplier *= (1-this.effectImmune*(1-0.2))*this.effectReplayer;
      }
      if (this.web || this.cobweb) {
        if(this.webstickness <= 0){
          this.webstickness = 0.1;
        } else {
          this.webstickness += (Math.pow(0.85-this.webstickness,2) * 0.2) * (time / (1000 / 30))
        }
        if (this.cobweb && this.web){
          this.speedMultiplier *= Math.min(1-(this.webstickness),(1-this.effectImmune*(this.webstickness))*this.effectReplayer)
        } else if (this.cobweb) {
          this.speedMultiplier *= 1-(this.webstickness)
        } else if (this.web) {
          this.speedMultiplier *= (1-this.effectImmune*(this.webstickness))*this.effectReplayer;
        }
      } else if (this.webstickness > 0) {this.webstickness = 0;}

      if(this.sticky || this.stickness>0){
        this.speedMultiplier *= (1-this.effectImmune*(this.stickness))*this.effectReplayer;
      }
      if(this.className == "Brute"){
        if(this.energy == this.maxEnergy){
          this.effectImmune = 0;
        } else {this.effectImmune = 0.2}
      }

      if (this.shadowed_time_left>0){
        this.shadowed_time_left-=time;
      } else {
        this.knockback_limit_count = 0;
        this.shadowed_invulnerability = false;
      }

      if(this.mortarTime>0){this.speedMultiplier = 0;}
      if(this.minimum_speed>this.speed + this.speedAdditioner){this.speed=this.minimum_speed}
        if(this.shouldCentMove()){
          this.distance_movement = (this.speed*this.speedMultiplier)+this.speedAdditioner;
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
    if (Math.abs(this.vel.x)<0.001) {
      this.vel.x = 0;
    }
    if (Math.abs(this.vel.y)<0.001) {
      this.vel.y = 0;
    }
    this.magnet = magnet;
    this.radius = (this.reducingEffect) ? this.fixedRadius-Math.floor(this.reducingEffect)/32 : this.fixedRadius;
    this.radius *= this.radiusMultiplier;
    this.radiusMultiplier = 1;
    if(this.enlarging){
      const strength = 10 * this.effectImmune / this.effectReplayer;
      this.radiusAdditioner += strength;
    }
    if(this.radiusAdditioner!=0){
      this.radius += this.radiusAdditioner / 32;
      this.radiusAdditioner = 0;
    }
    if(this.radius < 0) {
      this.radius = 0;
      if(this.reducing){
        death(this);
      }
    }
    this.radiusAdditioner = 0;
    this.stickness = Math.max(0,this.stickness-time)
    this.stickyTrailTimer = Math.max(0,this.stickyTrailTimer-time)
    if(this.magnet&&!this.safeZone){
      var magneticSpeed = (this.vertSpeed == -1) ? 10 : this.vertSpeed
      if(this.magnetDirection == "Down"){this.d_y = magneticSpeed;}
      else if(this.magnetDirection == "Up"){this.d_y = -magneticSpeed;}
    }
    this.wasFrozen = this.frozen;
    if (this.frozen) {
      this.frozenTime += time;
    }
    if (this.frozenTime >= this.frozenTimeLeft) {
      this.frozen = false;
      this.frozenTimeLeft = 0;
    }
    if(this.stickness>0){
      if(this.stickyTrailTimer==0&&!this.safeZone){
        this.stickyTrailTimer = 250;
        const world = game.worlds[this.world]
        const area = world.areas[this.area];
        const trail = new StickyTrail(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y));
        if(!area.entities["sticky_trail"]){area.entities["sticky_trail"] = []}
        area.entities["sticky_trail"].push(trail);
      }
    }
    if(this.experienceDraining){
      this.experience-=(2*this.level*time/1e3)*this.effectImmune/this.effectReplayer;
      this.experience=Math.max(0,this.experience);
      if(this.experience<this.previousLevelExperience){
        var diff=this.previousLevelExperience-this.experience;
        this.previousLevelExperience-=diff;
        this.nextLevelExperience+=diff;
        this.previousLevelExperience=Number(this.previousLevelExperience.toFixed(5));
        this.nextLevelExperience=Number(this.nextLevelExperience.toFixed(5));
      }
    }
    if(this.speedghost && this.speed - (0.1*this.effectImmune)/this.effectReplayer*timeFix >= 5){
      if(!settings.no_points && parseFloat(this.speed.toFixed(1))%0.5 == 0)this.points++
      this.speed-=(0.1*this.effectImmune)/this.effectReplayer*timeFix;
      this.statSpeed-=(0.1*this.effectImmune)/this.effectReplayer*timeFix;
      if(this.statSpeed < 5){this.statSpeed = 5;}
    }

    if(this.regenghost && this.regen - (0.04*this.effectImmune)/this.effectReplayer*timeFix >= 1){
      if(!settings.no_points && (false || Number((parseFloat(this.regen.toFixed(1))%0.2).toFixed(1)) == 0.2) )this.points++
      this.regen-=(0.04*this.effectImmune)/this.effectReplayer*timeFix;
      if(this.regen < 1){this.regen = 1;}
    }

    if (this.inEnemyBarrier){
      this.inBarrier = true;
    }

    if((this.quicksand.angle || this.quicksand.angle === 0) && !(this.god||this.inBarrier||(this.invicible&&this.className=="Magmax"))){
      this.pos.x += Math.cos(this.quicksand.angle * (Math.PI/180)) * (this.quicksand.strength/32) * timeFix;
      this.pos.y += Math.sin(this.quicksand.angle * (Math.PI/180)) * (this.quicksand.strength/32) * timeFix;  
      this.quicksand.angle = undefined;
    }

    if (this.charging) {
      this.energy += (16 * time / 1000)*this.effectImmune/this.effectReplayer;
      if (this.energy > this.maxEnergy) {
        this.energy = this.maxEnergy;
      }
      if(this.energy>=this.maxEnergy && !this.draining){
        this.energy = 0;
        death(this);
      }
    }
    if (this.draining) {
      this.energy -= (16 * time / 1000)*this.effectImmune/this.effectReplayer;
      if (this.energy < 0) {
        this.energy = 0;
      }
    }
    if(this.burning) {
      this.burningTimer+=time*this.effectImmune/this.effectReplayer;
      if(this.burningTimer>1000){
        death(this);
      }
    } else {
      this.burningTimer = Math.max(0,this.burningTimer-time)
    }

    if(this.reducing){  
      this.reducingEffect += time*this.effectImmune/this.effectReplayer/100;
    } else if (this.reducingEffect>0) {
      this.reducingEffect -= time/100;
      if(this.reducingEffect<0) this.reducingEffect = 0;
    }

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
    this.energy += (this.regen+this.regenAdditioner) * time / 1000;
    if (this.energy > this.maxEnergy) {
      this.energy = this.maxEnergy;
    }
    this.oldPos = (this.previousPos.x == this.pos.x && this.previousPos.y == this.pos.y) ? this.oldPos : new Vector(this.previousPos.x,this.previousPos.y)  
    this.previousPos = new Vector(this.pos.x, this.pos.y);
    var dim = (1 - friction);
    if (this.slippery) {
      dim = 0;
    }
    //dim = 0;
    var friction_factor = dim;

    this.slide_x = this.distance_moved_previously[0];
    this.slide_y = this.distance_moved_previously[1];

    this.slide_x *= 1-((1-friction_factor)*timeFix);
    this.slide_y *= 1-((1-friction_factor)*timeFix);

    this.d_x *= timeFix;
    this.d_y *= timeFix;

    this.d_x += this.slide_x;
    this.d_y += this.slide_y;

    this.abs_d_x = Math.abs(this.d_x);
    this.abs_d_y = Math.abs(this.d_y);

    if(this.shouldCentMove()){
      if(this.abs_d_x > this.cent_max_distance && !this.slippery){
        this.d_x *= this.cent_max_distance / this.abs_d_x;
      }
      if(this.abs_d_y > this.cent_max_distance && !this.slippery){
        this.d_y *= this.cent_max_distance / this.abs_d_y;
      }
    } else {
      if(this.abs_d_x>this.distance_movement&&!this.slippery){
        this.d_x *= this.distance_movement / this.abs_d_x;
      }
      if(this.abs_d_y>this.distance_movement&&!this.slippery){
        this.d_y *= this.distance_movement / this.abs_d_y;
      }
    }

    let prvLead = this.leadTimeLeft;
    this.leadTimeLeft = Math.max(0,this.leadTimeLeft-time);
    if (this.leadTimeLeft !== prvLead && this.leadTimeLeft === 0){
      this.cent_input_ready = true;
      this.cent_accelerating = false;
      this.cent_is_moving = false;
    }
    
    this.prevSlippery = this.slippery;
    if (this.abs_d_x<0.001) {
      this.d_x = 0;
    }
    if (this.abs_d_y<0.001) {
      this.d_y = 0;
    }
    this.distance_moved_previously = [this.d_x,this.d_y]
    this.vel = new Vector(this.d_x,this.d_y)

    if (Math.atan2(this.vel.y,this.vel.x)!= 0 || this.moving) {
      this.previousAngle = Math.atan2(this.vel.y,this.vel.x);
    }

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
    }
    this.blocking = false;
    this.firstAbilityCooldown -= time;
    this.secondAbilityCooldown -= time;
    this.firstAbilityCooldown += (Math.abs(this.firstAbilityCooldown) - this.firstAbilityCooldown) / 2;
    this.secondAbilityCooldown += (Math.abs(this.secondAbilityCooldown) - this.secondAbilityCooldown) / 2;
    if (!settings.cooldown) {
      this.energy = this.maxEnergy;
      this.firstAbilityCooldown = 0;
      this.secondAbilityCooldown = 0;
      this.firstPellet = 0;
      this.secondPellet = 0;
    }
    this.tempColor=this.color;
    this.disabling = false;
    var vel;
    var magneticSpeed = (this.vertSpeed == -1) ? 10 : this.vertSpeed;
    var yaxis = (this.vel.y>=0)?1:-1;
    if(!this.magnet){magneticSpeed*=yaxis;}
    if(this.magnetDirection == "Up"){magneticSpeed=-magneticSpeed}
    if((this.magnet||this.vertSpeed != -1)&&!this.safeZone){vel = new Vector(this.vel.x, magneticSpeed);}
    else{vel = new Vector(this.vel.x, this.vel.y);}
    this.vertSpeed = -1;
    if (!this.wasFrozen) {
      this.pos.x += vel.x / 32 * timeFix;
      this.pos.y += vel.y / 32 * timeFix;
    }
    if(this.frozen&&this.magnet){this.pos.y += vel.y / 32 * timeFix;}
    //this.vel.x*=friction_factor;//(this.vel.x+this.vel.x*friction_factor)/2;
    //this.vel.y*=friction_factor//(this.vel.y+this.vel.y*friction_factor)/2;
    this.speedMultiplier = 1;
    this.speedAdditioner = 0;
    this.regenAdditioner = 0;
    this.speed = this.statSpeed;

    if(this.sweetToothTimer==15000){
      this.energy += this.maxEnergy/2;
      if(this.energy>this.maxEnergy){this.energy = this.maxEnergy}
    }
    if(this.sweetToothConsumed){
      this.speedAdditioner=5;
      this.regenAdditioner=5;
      this.sweetToothTimer-=time;
    }
    if(this.sweetToothTimer <= 0){
      this.sweetToothTimer = 0;
      this.sweetToothConsumed = false;
    }
    if(this.god&&this.isDead){this.isDead=false;}
    else if(this.deathTimer<=0&&this.isDead){death(this);}
    else if(this.isDead)this.deathTimer-=time;
    if(this.invicible_time>=0){
      this.invicible_time-=time;
      if(this.invicible_time<=0){
        this.invicible = false;
      }
    }
  }
  abilities(time, area, bound) {

  }
  knockback_player(time,enemy,push_time,radius,offset){
    const timeFix = time / (1000 / 30);
    this.knockback = true;
    this.knockback_push_time = push_time;
    this.knockback_enemy_pos = new Vector(enemy.pos.x+offset.x,enemy.pos.y+offset.y);
    this.knockback_enemy_radius = radius;
    this.knockback_multiplayer = this.effectImmune / this.effectReplayer;
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
}
class Basic extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#FF0000", "Basic");
    this.hasAB = true; this.ab1L = 0; this.ab2L = 0; this.firstTotalCooldown = 0; this.secondTotalCooldown = 6000;
  }
}
class Jotunn extends Player {
  constructor(pos, speed) {
    super(pos, 1, speed, "#5cacff", "Jötunn");
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 0; this.secondTotalCooldown = 6000;
  }
  abilities(time, area, offset) {
    for (var i in area.entities) {
      for (var j in area.entities[i]) {
        var entity = area.entities[i][j];
        if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (170 / 32) + entity.radius) {
          if (!area.entities[i][j].imune) {
            area.entities[i][j].speedMultiplier *= 0.6;
            area.entities[i][j].decayed = true;
          }
        }
      }
    }
    if (this.secondAbility && this.energy >= 30 && this.secondAbilityCooldown == 0) {
      this.energy -= 30;
      this.secondAbilityCooldown = 6000;
      for (var i in area.entities) {
        for (var j in area.entities[i]) {
          var entity = area.entities[i][j];
          if (area.entities[i][j].decayed) {
            area.entities[i][j].shatterTime = 4000;
          }
        }
      }
    }
  }
}
class Burst extends Player {
  constructor(pos, speed) {
    super(pos, 2, speed, "#AA3333", "Burst");
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.energy > 5 && this.firstAbilityCooldown == 0) {
      this.energy -= 5;
      this.firstAbilityCooldown = 500;
      var vx = 1;
      var vy = 0;
      var dist = distance(this.pos, this.previousPos);
      if (dist !== 0) {
        vx = (this.pos.x - this.previousPos.x) / dist;
        vy = (this.pos.y - this.previousPos.y) / dist;
      }
      var dyna = new Dynamite(new Vector(this.pos.x - offset.x, this.pos.y - offset.y), new Vector(vx * 50, vy * 50), this.id);
      area.addEntity("dynamites", dyna)
    }
    if (this.secondAbility && this.energy > 20 && this.secondAbilityCooldown == 0) {
      this.energy -= 20;
      this.secondAbilityCooldown = 1000;
      var newDynamites = [];
      for (var i in area.entities["dynamites"]) {
        if (area.entities["dynamites"][i].owner == this.id) {
          for (var j in area.entities) {
            for (var k in area.entities[j]) {
              if (distance(area.entities["dynamites"][i].pos, area.entities[j][k].pos) < 9 && !area.entities[j][k].imune && area.entities[j][k].isEnemy) {
                var bfvelX = area.entities[j][k].vel.x;
                var bfvelY = area.entities[j][k].vel.y;
                var dirX = area.entities[j][k].pos.x - area.entities["dynamites"][i].pos.x;
                var dirY = area.entities[j][k].pos.y - area.entities["dynamites"][i].pos.y;
                area.entities[j][k].vel.x = Math.sqrt(bfvelX * bfvelX + bfvelY * bfvelY) * dirX / Math.sqrt(dirX * dirX + dirY * dirY);
                area.entities[j][k].vel.y = Math.sqrt(bfvelX * bfvelX + bfvelY * bfvelY) * dirY / Math.sqrt(dirX * dirX + dirY * dirY)
              }
            }
          }
          var particle = new ExplosionParticle(new Vector(area.entities["dynamites"][i].pos.x, area.entities["dynamites"][i].pos.y));
          area.addEntity("explosionParticle", particle);
        } else {
          newDynamites.push(area.entities["dynamites"][i])
        }
      }
      area.entities["dynamites"] = newDynamites;
    }
  }
}
class Dynamite extends Entity {
  constructor(pos, vel, id) {
    super(pos, 1 / 3, "#A33");
    this.vel = new Vector(vel.x, vel.y);
    this.friction = 0.1;
    this.owner = id;
    this.collide = false;
    this.no_collide = true;
  }
}
class ExplosionParticle extends Entity {
  constructor(pos) {
    super(pos, 1 / 3, null);
    this.g = 255;
    this.a = 1;
    this.color = "rgba(255," + this.g + ",0," + this.a + ")";
    this.collide = false;
  }
  behavior(time, area, offset, players) {
    this.g -= time / 2;
    this.a -= time / 800;
    this.radius += time / 100;
    this.fixedRadius = this.radius;
    this.color = "rgba(255," + this.g + ",0," + this.a + ")"
  }
}
class Lantern extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#008000", "Lantern");
    this.firstTime=0;
    this.secondTime=0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
    }
    if (this.secondAbility) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
    }
    if (this.firstAbilityActivated) {
      this.firstTime += time / 1000
      this.energy -= 12 * time / 1000;
      if (this.energy < 0) {
        this.energy = 0;
        this.firstAbilityActivated = false;
      }
      if (this.firstTime > 0.005) {
        var follower = new Follower(new Vector(this.pos.x - offset.x, this.pos.y - offset.y))
        area.addEntity("follower", follower);
        this.firstTime = 0;
      }
    }
    if (this.secondAbilityActivated) {
      this.secondTime += time / 1000
      this.energy -= 12 * time / 1000;
      if (this.energy < 0) {
        this.energy = 0;
        this.secondAbilityActivated = false;
      }
      if (this.secondTime > 0.01) {
        var shrinker = new Shrinker(new Vector(this.pos.x - offset.x, this.pos.y - offset.y))
        area.addEntity("shrinker", shrinker);
        this.secondTime = 0;
      }
    }
  }
}
class Shade extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#826565", "Shade");
    this.firstTime=0;
    this.secondTime=0;
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 7000; this.secondTotalCooldown = 1000;
  }
  abilities(time, area, offset) {
    if (this.firstAbility) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      if(this.energy>=30&&this.firstAbilityCooldown==0){
        this.energy-=30;
        this.firstAbilityCooldown+=7000;
        this.night = true;
        this.shadeNight = 7000;
      }
    }
    if(this.night){
      this.speedAdditioner+=5;
    }
    if(this.night && this.shadeNight > 0){
      this.shadeNight-=time;
    } else if(this.shadeNight <= 0 && this.night){
      this.night = false;
      this.speedAdditioner=0;
    } else {this.shadeNight = 0}

    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 5) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.secondAbilityCooldown+=1000;
      this.energy-=5;

      area.addEntity(0, new shadeVengeance(new Vector(this.pos.x - offset.x, this.pos.y - offset.y),this.mouseActive ? this.mouse_angle : this.previousAngle, 1.3, 58, this.id))
    }
  }
}

class shadeVengeance extends Entity {
  constructor(pos,angle,radius,speed,owner) {
    super(pos, radius, "brown");
    this.speed=speed;
    this.owner = owner;
    this.collide = true;
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
        if ((area.entities[j][k].isEnemy||area.entities[j][k].weak)&&!area.entities[j][k].imune) {
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
  colide() {
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
    this.ab2L = 5;
    this.firstTotalCooldown = 4000;
    this.secondTotalCooldown = 10000;
  }
  abilities(time, area, offset) {
    if(this.reaperShade){this.speed = 11;}
    if (this.secondAbility) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      if(this.energy>=30&&this.secondAbilityCooldown==0){
        this.energy-=30; this.secondAbilityCooldown+=10000; var oldSpeed = this.speed+0;
        this.speed = 11; this.reaperShade=true; this.god = true; setTimeout(()=>{this.reaperShade=false;this.god=false;this.speed=oldSpeed},3500)
      }
    }
  }
}
class Cent extends Player {
  constructor(pos, speed) {
    super(pos, 3, speed, "#727272", "Cent");
    this.firstTime=0;
    this.secondTime=0;
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 1000; this.secondTotalCooldown = 10000;
  }
  abilities(time, area, offset) {
    if(this.fusion){this.invicible = true; this.speedMultiplier*=0.7}
    if(this.mortarTime)if(this.mortarTime>0){this.mortarTime-=time; this.speedMultiplier*=0; this.invicible = true;}
    if(this.firstAbility){
      if(this.energy>=5&&this.firstAbilityCooldown==0){
        this.energy-=5;
        this.fusion = true;
        this.fusionTime = 700;
        this.firstAbilityCooldown=1000;
        this.mortarTime = 0;
      }
    }
    if (this.secondAbility||this.onDeathSecondAb) {
      if(this.energy>=20&&this.secondAbilityCooldown==0){
        this.onDeathSecondAb = false;
        this.secondAbilityCooldown=10000;
        this.energy-=20;
        this.mortarTime = 4000;
      }
    }
    if(this.god) this.mortarTime = 0;
    if(this.fusionTime>0||this.mortarTime>0){this.invicible = true}else{this.invicible = false;}
    if(this.fusionTime>0){this.fusionTime-=time;if(this.fusionTime<=0){this.fusion = false;}}
  }
}
class Follower extends Entity {
  constructor(pos) {
    super(pos, 1.2, "rgba(0,200,0,0.1)");
    this.clock = 0;
    this.collide = false;
  }
  behavior(time, area, offset, players) {
    this.clock += 1 * time / 1000;
    if (this.clock > 1) {
      this.toRemove = true;
    }
    for (var i in area.entities) {
      for (var j in area.entities[i]) {
        if (area.entities[i][j].isEnemy) {
          if (distance(this.pos, area.entities[i][j].pos) < this.radius + area.entities[i][j].fixedRadius) {
            area.entities[i][j].radiusMultiplier = 0.5;
          }
        }
      }
    }
  }
}
class Shrinker extends Entity {
  constructor(pos) {
    super(pos, 1.8, "rgba(0,0,200,0.05)");
    this.clock = 0;
    this.collide = false;
  }
  behavior(time, area, offset, players) {
    this.clock += 1 * time / 1000;
    if (this.clock > 3) {
      this.toRemove = true;
    }
    for (var i in players) {
      if (distance(new Vector(this.pos.x + offset.x, this.pos.y + offset.y), players[i].pos) < this.radius + players[i].fixedRadius) {
        players[i].radiusMultiplier = 0.5;
      }
    }
  }
}
class Pole extends Player {
  constructor(pos, speed) {
    super(pos, 4, speed, "#955CF1", "Pole");
  }
  abilities(time, area, offset) {
    for (var i in area.entities) {
      for (var j in area.entities[i]) {
        var entity = area.entities[i][j];
        if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (150 / 32) + entity.radius) {
          if (!area.entities[i][j].imune) {
            this.gravity = 4/32
            var dx = entity.pos.x - (this.pos.x - offset.x);
            var dy = entity.pos.y - (this.pos.y - offset.y);
            var dist = distance(new Vector(0, 0), new Vector(dx, dy));
            var attractionAmplitude = Math.pow(1.5, -(dist / (100 / 32)));
            var moveDist = this.gravity * attractionAmplitude;
            var angleToEnemy = Math.atan2(dy, dx);
            entity.pos.x += (moveDist * Math.cos(angleToEnemy)) * (time / (1000 / 30))
            entity.pos.y += (moveDist * Math.sin(angleToEnemy)) * (time / (1000 / 30))
            entity.repelled = true;
          }
        }
      }
    }
    if (this.secondAbility && this.energy >= 30 && this.secondAbilityCooldown == 0) {
      this.energy -= 30;
      this.secondAbilityCooldown = 6000;
      var vx = 1;
      var vy = 0;
      var dist = distance(this.pos, this.previousPos);
      if (dist !== 0) {
        vx = (this.pos.x - this.previousPos.x) / dist;
        vy = (this.pos.y - this.previousPos.y) / dist;
      }
      var pole = new MonoPole(new Vector(this.pos.x - offset.x, this.pos.y - offset.y), new Vector(vx * 50, vy * 50));
      area.addEntity("monoPole", pole)
    }
  }
}
class MonoPole extends Entity {
  constructor(pos, vel) {
    super(pos, 2 / 5, null);
    this.vel = new Vector(vel.x, vel.y);
    this.friction = 0.125;
    this.collide = false;
    this.clock = 0;
    this.gravity = 5/32;
    this.a = 1;
    this.color = "rgba(243,64,64," + this.a + ")";
  }
  behavior(time, area, offset, players) {
    this.clock += 1 * time / 1000;
    if (this.clock > 2) {
      this.a -= time / 800;
      this.color = "rgba(243,64,64," + this.a + ")";
    }
    if (this.clock > 3) {
      this.toRemove = true;
    }
    for (var i in area.entities) {
      for (var j in area.entities[i]) {
        var entity = area.entities[i][j];
        if (distance(entity.pos, new Vector(this.pos.x, this.pos.y)) < (130 / 32) + entity.radius) {
          if (!area.entities[i][j].imune) {
            var dx = entity.pos.x - this.pos.x;
            var dy = entity.pos.y - this.pos.y;
            var dist = distance(new Vector(0, 0), new Vector(dx, dy));
            var attractionAmplitude = Math.pow(0.5, -(dist / (100 / 32)));
            var moveDist = this.gravity * attractionAmplitude;
            var angleToEnemy = Math.atan2(dy, dx);
            entity.pos.x -= (moveDist * Math.cos(angleToEnemy)) * (time / (1000 / 30))
            entity.pos.y -= (moveDist * Math.sin(angleToEnemy)) * (time / (1000 / 30))
          }
        }
      }
    }
  }
}
class Rameses extends Player {
  constructor(pos, speed) {
    super(pos, 5, speed, "#989b4a", "Rameses");
    this.bandage = false;
    this.stand = false;
    this.hasAB = true; this.ab1L = 5; this.ab2L = 0; this.firstTotalCooldown = 8000; this.secondTotalCooldown = 6000;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.energy >= 50 && this.firstAbilityCooldown == 0 && !this.bandage) {
      this.energy -= 50;
      this.firstAbilityCooldown = (this.safeZone) ? 4000 : 8000;
      this.stand = true;
    }
    if (this.firstAbilityCooldown<=0&&this.stand) {
      this.stand = false;
      this.bandage = true;
    }
    if (this.stand) {
      this.speedMultiplier/=2;
    }
  }
}
class Magmax extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#FF0000", "Magmax");
    this.harden = false;
    this.flow = false;
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 0; this.secondTotalCooldown = 250;
  }
  abilities(time, area, offset) {
    if (this.firstAbility) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.flow = !this.flow;
      if (this.flow && this.harden) {
        this.harden = false;
        this.secondAbilityCooldown = this.secondTotalCooldown;
      }
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.harden = !this.harden;
      if(this.harden == false){this.secondAbilityCooldown = this.secondTotalCooldown;}
      if (this.harden) {
        this.flow = false;
      }
    }

    if(this.harden){
      this.tempColor = "rgb(200, 70, 0)"
      this.invicible = true;
      this.speedMultiplier = 0;
      this.d_x = 0;
      this.d_y = 0;
      this.energy -= 12 * time / 1000;
    } else {
      this.invicible = false;
    }
    if(this.flow){
      this.tempColor = "rgb(255, 80, 10)"
      this.speedAdditioner+=6;
      this.energy -= 2 * time / 1000;
    }
    if (this.energy <= 0) {
      this.harden = false;
      this.flow = false;
      this.energy = 0;
    }
  }
}

class Rime extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#3333ff", "Rime");
    this.paralysis = false;
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 5;
    this.firstTotalCooldown = 300;
    this.secondTotalCooldown = 0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 5) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.firstAbilityCooldown = 300;
      if(this.mouseActive){
        this.pos.x += 160/32*Math.cos(this.mouse_angle)
        this.pos.y += 160/32*Math.sin(this.mouse_angle)
      } else {
        var directionX = 0;
        var directionY = 0;
        if(this.oldPos.x-this.pos.x<0){directionX = 1;}
        else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
        if(this.oldPos.y-this.pos.y<0){directionY = 1;}
        else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
        this.pos.x += 160/32*directionX;
        this.pos.y += 160/32*directionY;
      }
      this.energy -= 5;
      game.worlds[game.players[0].world].collisionPlayer(game.players[0].area, game.players[0]);
    }
    if (this.secondAbility) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      if(this.aura&&this.energy>=15){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (210 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].freeze = 2000;
              }
            }
          }
        }
        this.aura = false;
        this.auraType = -1;
        this.energy -= 15;
      } else {this.aura = true; this.auraType = 1;}
    }
  }
}

class Aurora extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#ff7f00", "Aurora");
    this.distort = false;
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 0;
    this.firstTotalCooldown = 0;
    this.secondTotalCooldown = 0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.energy >= 1) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.distort = !this.distort;
      if(!this.distort){this.aura = false;}
    }

    if(this.distort){
      this.energy -= 7 * time / 1000;
      if(this.energy <= 0){
        this.distort = false;
        this.aura = false;
      }
      else{
        this.aura = true;
        this.auraType = 2;
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (230 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].speedMultiplier *= 0.45;
              }
            }
          }
        }
      }
    }
  }
}

class Chrono extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#00b270", "Chrono");
    this.rewind = false;
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 5;
    this.firstTotalCooldown = 5500;
    this.secondTotalCooldown = 5000;
    this.teleportPosition = [];
  }
  abilities(time, area, offset) {
    const timeFix = time / (1000 / 30);
    this.teleportPosition.push(new Vector(this.pos.x,this.pos.y));
    if(this.teleportPosition.length>Math.round(75/timeFix)){this.teleportPosition.shift();}

    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 30) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.firstAbilityCooldown = this.firstTotalCooldown;
      this.pos = this.teleportPosition[0];
      this.energy -= 30;
      if(this.isDead){
        this.deathTimer+=2500+time;
        if(Math.ceil(this.deathTimer)>=60000){
          this.isDead = false;
        } else {this.deathTimer = 200}
      }
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0) {
      if(this.aura && this.energy>=20){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (150 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].HarmlessEffect = 3000;
                area.entities[i][j].Harmless = true;
                if(area.entities[i][j].teleportPosition.length > 0)area.entities[i][j].pos = area.entities[i][j].teleportPosition[0];
              }
            }
          }
        }
        this.aura = false;
        this.auraType = -1;
        this.energy -= 20;
        this.secondAbilityCooldown = this.secondTotalCooldown;
      } else {this.aura = true; this.auraType = 4;}
    }
  }
}

class Brute extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#9b5800", "Brute");
    this.stomp = false;
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 5;
    this.staticRadius = 18;
    this.fixedRadius = 18/32;
    this.firstTotalCooldown = 1000;
    this.secondTotalCooldown = 0;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      if(this.stomp&&this.energy>=10){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (190 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].freeze = 4000;
                var timeFix = time / (1000 / 30);
                var enemy = area.entities[i][j];
                var bfvelX = area.entities[i][j].vel.x;
                var bfvelY = area.entities[i][j].vel.y;
                var prevVel = {x:enemy.vel.x,y:enemy.vel.y}
                var dirX = area.entities[i][j].pos.x - (this.pos.x-game.worlds[this.world].pos.x-game.worlds[this.world].areas[this.area].pos.x);
                var dirY = area.entities[i][j].pos.y - (this.pos.y-game.worlds[this.world].pos.y-game.worlds[this.world].areas[this.area].pos.y);
                area.entities[i][j].vel.x = Math.sqrt(bfvelX * bfvelX + bfvelY * bfvelY) * dirX / Math.sqrt(dirX * dirX + dirY * dirY);
                area.entities[i][j].vel.y = Math.sqrt(bfvelX * bfvelX + bfvelY * bfvelY) * dirY / Math.sqrt(dirX * dirX + dirY * dirY);
                var angle = Math.atan2(enemy.vel.y,enemy.vel.x)
                var startPos = {x:(this.pos.x-game.worlds[this.world].pos.x-game.worlds[this.world].areas[this.area].pos.x),y:(this.pos.y-game.worlds[this.world].pos.y-game.worlds[this.world].areas[this.area].pos.y)};
                var endPos = {x:startPos.x+((((190+enemy.radius*32)/32))*Math.cos(angle)),
                y:startPos.y+((((190+enemy.radius*32)/32))*Math.sin(angle))};
                enemy.pos.x = endPos.x; enemy.pos.y = endPos.y;
                var boundary = area.getActiveBoundary();
                if (area.entities[i][j].collide && !area.entities[i][j].no_collide) {
                  var fixed = closestPointToRectangle(area.entities[i][j].pos, {
                    x: boundary.x + area.entities[i][j].radius,
                    y: boundary.y + area.entities[i][j].radius
                  }, {
                    x: boundary.w - area.entities[i][j].radius * 2,
                    y: boundary.h - area.entities[i][j].radius * 2
                  })
                  area.entities[i][j].pos = fixed;
                }
                enemy.vel = prevVel;
              }
              this.stomp = false;
              this.aura = false;
              this.firstAbilityCooldown = 1000;
            }
          }
        }
        this.energy -= 10;
      } else {this.stomp = true; this.aura = true; this.auraType = 3;}
    }
  }
}

class Morfe extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#00dd00", "Morfe");
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 5;
    this.firstTotalCooldown = 3000;
    this.secondTotalCooldown = 1500;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 10) {
      this.energy -= 10;
      this.firstAbilityCooldown = this.firstTotalCooldown;
      this.spawnBullet(area,'reverse_projectile')
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 10) {
      this.energy -= 10;
      this.secondAbilityCooldown = this.secondTotalCooldown;
      this.spawnBullet(area,'minimize_projectile')
    }
  }
  spawnBullet(area,bulletType){
    let projectile_amount = (bulletType == 'reverse_projectile') ? 5 : 6;
    let static_shooting_angle = 90;
    let shooting_angle = static_shooting_angle/(projectile_amount+1);
    for(let i = 0; i < projectile_amount; i++){
      let angle;
      if(this.mouseActive){
        angle = this.mouse_angle
      } else {
        var directionX = 0;
        var directionY = 0;
        if(this.oldPos.x-this.pos.x<0){directionX = 1;}
        else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
        if(this.oldPos.y-this.pos.y<0){directionY = 1;}
        else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
        angle = Math.atan2(directionY, directionX);
      }
      angle = radians_to_degrees(angle)-static_shooting_angle/2;
      angle += shooting_angle*(i+1);
      angle = degrees_to_radians(angle);
      const world = game.worlds[this.world];
      const bullet = (bulletType == 'reverse_projectile') ? new ReverseProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle) : new MinimizeProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle)
      if(!area.entities[bulletType]){area.entities[bulletType] = []}
      area.entities[bulletType].push(bullet);
    }
  }
}

class Mirage extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#020fa2", "Mirage");
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 5;
    this.firstTotalCooldown = 14000;
    this.secondTotalCooldown = 2500;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 30) {
      this.energy -= 30;
      this.firstAbilityCooldown = this.firstTotalCooldown;
      //this.spawnBullet(area,'reverse_projectile')
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 15) {
      this.energy -= 15;
      this.secondAbilityCooldown = this.secondTotalCooldown;
      this.spawnBullet(area,'obscure_projectile')
    }
  }
  spawnBullet(area,bulletType){
      let angle;
      if(this.mouseActive){
        angle = this.mouse_angle
      } else {
        var directionX = 0;
        var directionY = 0;
        if(this.oldPos.x-this.pos.x<0){directionX = 1;}
        else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
        if(this.oldPos.y-this.pos.y<0){directionY = 1;}
        else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
        angle = Math.atan2(directionY, directionX);
      }
      const world = game.worlds[this.world];
      const bullet = new ObscureProjectile(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),angle)
      if(!area.entities[bulletType]){area.entities[bulletType] = []}
      area.entities[bulletType].push(bullet);
    
  }
}

class Necro extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#FF00FF", "Necro");
    this.hasAB = true;
    this.ab1L = 1;
    this.ab2L = 0;
    this.firstPelletTotal = 75;
    this.firstPellet = 0;
    this.resurrectAvailable = true;
    this.usesPellets = 1; // 1 - firstPellet | 2 - secondPellet | 3 - bothPellet
    this.ab1ML = 1;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstPellet == 0 && this.energy >= 0 && this.resurrectAvailable && this.isDead) {
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
    this.hasAB = true; this.ab1L = 5; this.ab2L = 5; this.firstTotalCooldown = 4000; this.secondTotalCooldown = 5000;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0 && this.energy >= 15) {
      this.firstAbilityActivated = !this.firstAbilityActivated;
      this.sugar_rush = true;
      this.firstAbilityCooldown = 4000;
      this.energy-=15;
      this.sugarRushing = 2000;
    }
    if (this.secondAbility && this.secondAbilityCooldown == 0 && this.energy >= 5) {
      this.secondAbilityActivated = !this.secondAbilityActivated;
      this.energy-=5;
      let candy = new Vector(this.pos.x,this.pos.y);
      let distance = 64 / 32;

      if(this.mouseActive){
        candy.x += distance*Math.cos(this.mouse_angle)
        candy.y += distance*Math.sin(this.mouse_angle)
      } else {
        var directionX = 0;
        var directionY = 0;
        if(this.oldPos.x-this.pos.x<0){directionX = 1;}
        else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
        if(this.oldPos.y-this.pos.y<0){directionY = 1;}
        else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
        candy.x += distance*directionX;
        candy.y += distance*directionY;
      }
      area.addEffect(0,new Vector(candy.x-offset.x,candy.y-offset.y));
      this.secondAbilityCooldown = 5000;
    }
    if(this.sugar_rush){
      this.aura = true;
      this.auraType = 0;
      for (var i in area.entities) {
        for (var j in area.entities[i]) {
          var entity = area.entities[i][j];
          if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < ((100+Math.abs(greaterMax(this))*5) / 32) + entity.radius) {
            if (!area.entities[i][j].imune) {
              area.entities[i][j].sugar_rush = 2000;
            }
          }
        }
      }
    } else {this.aura = false; this.auraType = -1;}
    if(this.sugarRushing <= 0){this.sugar_rush = false}
    else{this.sugarRushing-=time}
  }
}
class Clown extends Player {
  constructor(pos, speed) {
    super(pos, 6, speed, "#ffb8c6", "Clown");
    this.hasAB = true;
    this.ab1L = 5;
    this.ab2L = 1;
    this.ab2ML = true;
    this.firstTotalCooldown = 5000;
    this.secondTotalCooldown = 0;
    this.fixedRadius = 20/32
    this.maxSpeed = 17;
    this.maxUpgradableEnergy = 200;
    this.maxRegen = 5;
    this.effectReplayer = 0.5;
    this.prevColor = 0;
  }
  abilities(time, area, offset) {
    const colors = ["rgb(2, 135, 4, .8)","rgb(228, 122, 42, .8)","rgb(255, 219, 118, .8)","rgb(4, 70, 255, .8)", "rgb(216, 48, 162, .8)"]
    if (this.firstAbility && this.firstAbilityCooldown == 0 && (this.energy >= 20 || this.clownBall)) {
      const world = game.worlds[this.world];
      if(this.clownBall){
        const velocity = {x:0,y:0,angle:0}
        if(this.mouseActive){
          velocity.x = 12*Math.cos(this.mouse_angle)
          velocity.y = 12*Math.sin(this.mouse_angle)
        } else {
          var directionX = 0;
          var directionY = 0;
          if(this.oldPos.x-this.pos.x<0){directionX = 1;}
          else if(this.oldPos.x-this.pos.x>0){directionX = -1;}
          if(this.oldPos.y-this.pos.y<0){directionY = 1;}
          else if(this.oldPos.y-this.pos.y>0){directionY = -1;}
          velocity.x = 12*directionX;
          velocity.y = 12*directionY;
        }
        velocity.angle = Math.atan2(velocity.y, velocity.x);
        const ball = new ClownTrail(new Vector(this.pos.x-world.pos.x-area.pos.x,this.pos.y-world.pos.y-area.pos.y),this.clownBallSize/32,velocity.angle,colors[this.prevColor]);
        if(!area.entities["clown_trail"]){area.entities["clown_trail"] = []}
        area.entities["clown_trail"].push(ball);
        this.clownBall = false
        this.clownBallSize = 20;
        this.firstAbilityCooldown = 5000;
      } else {
        this.clownBall=true;
        this.clownBallSize = 20;
        this.energy-=20;
        let color = this.prevColor;
        while(color == this.prevColor){
          color = Math.floor(Math.random()*5);
        }
        this.prevColor = color;
      }
    }
    if(this.clownBall){
      this.clownBallSize+=time/1000*30;
      if(this.clownBallSize>92){
        death(this);
        this.clownBallSize = 20;
        this.clownBall = false;
      }
    }

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
      this.radiusMultiplier = 0.95;
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
    this.collide = false;
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
class Enemy extends Entity {
  constructor(pos, type, radius, speed, angle, color, aura, auraColor, auraSize) {
    super(pos, radius, color);
    this.renderFirst = false;
    this.outline = true;
    this.type = type;
    this.aura = aura;
    this.auraColor = auraColor;
    this.auraSize = auraSize
    this.auraStaticSize = auraSize+0;
    if(angle||angle==0){
      this.angle = angle;
      this.speed = speed;
      this.angleToVel();
    } else {
      angle = Math.random();
      let xvel = Math.cos(angle * Math.PI * 2) * speed;
      let yvel = Math.sin(angle * Math.PI * 2) * speed;
      this.vel = new Vector(xvel, yvel);
    }
    this.decayed = false;
    this.repelled = false;
    this.shatterTime = 0;
    this.imune = false;
    this.isEnemy = true;
    this.self_destruction = false;
  }
  update(time) {
    this.radius = this.fixedRadius;
    if(this.color != "#7e7cd6"){
      this.velToAngle();
      this.angleToVel();
    }
    if(this.healing > 0){
      this.healing -= time;
    }
    if(this.minimized > 0){
      this.radiusMultiplier*=0.5;
      this.minimized -= time;
    }
    if(this.HarmlessEffect > 0){
      this.HarmlessEffect -= time;
      this.Harmless = true;
      if(this.HarmlessEffect <= 0)this.Harmless = false;
    } 
    var timeFix = time / (1000 / 30);
    if(game.players[0].className == "Chrono"){
      this.teleportPosition.push(new Vector(this.pos.x,this.pos.y));
      if(this.teleportPosition.length>Math.round(75/timeFix)){this.teleportPosition.shift();}
    }
    var vel = new Vector(this.vel.x * this.speedMultiplier, this.vel.y * this.speedMultiplier)
    this.speedMultiplier = 1;
    this.radius *= this.radiusMultiplier;
    this.auraSize = this.auraStaticSize * this.radiusMultiplier;
    this.radiusMultiplier = 1;

    if (this.slowdown_time>0) {
      this.slowdown_time -= time;
      this.speedMultiplier *= this.slowdown_amount;
    }
    if (this.slowdown_time<0) {
      this.slowdown_time=0
    }

    if(this.sugar_rush>0){
      this.speedMultiplier*=0.05;
      this.sugar_rush-=time;
    }
    if(!this.freeze>0){
      this.pos.x += vel.x / 32 * timeFix;
      this.pos.y += vel.y / 32 * timeFix;
    }
    else {this.freeze -= time;}
    if(this.freeze < 0){this.freeze = 0;}
    var dim = 1 - this.friction*timeFix;
    this.vel.x *= dim;
    this.vel.y *= dim;
    this.decayed = false;
    this.repelled = false;
    this.shatterTime -= time;
    if (this.shatterTime < 0) {
      this.shatterTime = 0;
    }
  }
  interact(player, worldPos, time) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune)
    if (this.aura && !player.god && !player.isDead && player.effectImmune != 0) {
      if(!player.safeZone)this.auraEffect(player, worldPos, time)
    }
  }
  auraEffect(player, worldPos) {

  }
}
class Unknown extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("unknown") - 1, radius, speed, angle, "purple");
  }
}
class Normal extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("normal") - 1, radius, speed, angle, "#939393");
  }
}

class Corrosive extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("corrosive") - 1, radius, speed, angle, "#00eb00");
    this.corrosive = true;
  }
}

class Wall extends Enemy {
  constructor(pos, radius, speed, boundary, wallIndex, count, move_clockwise = true, initial_side) {
    super(pos, entityTypes.indexOf("wall") - 1, radius, speed, undefined,"#222222");
    this.speed = speed;
    this.wall = true;
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
    this.imune = true;
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
    super(pos, entityTypes.indexOf("dasher") - 1, radius, speed, angle, "#003c66");
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
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("homing") - 1, radius, speed, angle, "#966e14");
    this.velToAngle();
    this.targetAngle = this.angle;
    this.homing = true;
  }
  behavior(time, area, offset, players) {
    var min = 5.625;
    var index;
    for (var i in players) {
      if(!players[i].safeZone&&!players[i].night&&!players[i].god&&!players[i].isDead)if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min) {
        min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
        index = i;
      }
    }
    this.velToAngle();
    if (index != undefined) {
      var dX = (players[index].pos.x - offset.x) - this.pos.x;
      var dY = (players[index].pos.y - offset.y) - this.pos.y;
      this.targetAngle = Math.atan2(dY, dX);
    }
    var dif = this.targetAngle - this.angle;
    var angleDif = Math.atan2(Math.sin(dif), Math.cos(dif));
    var angleIncrement = 0.04
    if (Math.abs(angleDif) >= angleIncrement) {
      if (angleDif < 0) {
        this.angle -= angleIncrement * (time / 30)
      } else {
        this.angle += angleIncrement * (time / 30)
      }
    }
    this.angleToVel();
  }
}
class Slowing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("slowing") - 1, radius, speed, angle, "#ff0000", true, "rgba(255, 0, 0, 0.15)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.slowing = true;
    }
  }
}

class Reducing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 140) {
    super(pos, entityTypes.indexOf("reducing") - 1, radius, speed, angle, "rgb(45, 50, 55)", true, "rgba(45, 50, 55, 0.15)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.reducing = true;
    }
  }
}

class Blocking extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("blocking") - 1, radius, speed, angle, "#bf5213", true, "rgba(191, 82, 19, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.blocking = true;
    }
  }
}

class Quicksand extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, push_direction, strength = 5) {
    super(pos, entityTypes.indexOf("quicksand") - 1, radius, speed, angle, "#6c541e", true, "rgba(108, 84, 30, 0.3)", auraRadius / 32);
    this.quicksand = push_direction;
    this.quicksand_strength = strength;
    var player = game.players[0];
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
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.quicksand = {angle: this.quicksand, strength: this.quicksand_strength};
    }
  }
}

class Defender extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("defender") - 1, radius, speed, angle, "#312f40", true, "rgba(0, 0, 0, 0.2)", auraRadius / 32);
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    for (var i in area.entities) {
      for (var j in area.entities[i]) {
        var entity = area.entities[i][j];
        if (distance(entity.pos, new Vector(this.pos.x, this.pos.y)) < entity.radius + this.auraSize) {
          if (!entity.imune || entity.defended) {
            entity.defended = true;
            entity.curDefend = true;
            entity.imune = true;
          }
        }
      }
    }
  }
}
class Draining extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("draining") - 1, radius, speed, angle, "#0000ff", true, "rgba(0, 0, 255, 0.15)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.draining = true;
    }
  }
}
class Oscillating extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("oscillating") - 1, radius, speed, angle, "#869e0f");
    this.clock = 0;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > 1000) {
      this.vel.x = -this.vel.x;
      this.vel.y = -this.vel.y;
    }
    this.clock = this.clock % 1000;
  }
}
class Turning extends Enemy {
  constructor(pos, radius, speed, angle, circleSize = 150) {
    super(pos, entityTypes.indexOf("turning") - 1, radius, speed, angle, "#336600");
    this.dir = speed / circleSize;
    this.turning = true;
  }
  behavior(time, area, offset, players) {
    this.velToAngle();
    this.angle += this.dir * (time / 30);
    this.angleToVel();
  }
}
class Liquid extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("liquid") - 1, radius, speed, angle, "#6789ef");
  }
  behavior(time, area, offset, players) {
    const activationDistance = 160;
    for (var i in players) {
      if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < activationDistance / 32&&!players[i].night&&!players[i].god&&!players[i].safeZone&&!players[i].isDead) {
        this.speedMultiplier *= 5;
      }
    }
  }
}
class Sizing extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sizing") - 1, radius, speed, angle, "#f27743");
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
    super(pos, entityTypes.indexOf("switch") - 1, radius, speed, angle, "#565656");
    this.disabled = false;
    if (index >= count / 2) {
      this.disabled = true;
    }
    this.clock = 2800;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > 3000) {
      this.disabled = !this.disabled;
    }
    if (this.disabled) {
      this.Harmless = true;
    } else {
      this.Harmless = false;
    }
    if(this.clownHarm){this.Harmless = true}
    this.clock = this.clock % 3000;
  }
}
class Sniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sniper") - 1, radius, speed, angle, "#a05353");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(0, this.pos, Math.atan2(dY, dX), this.radius / 2, 10)
        this.clock = 0;
      }
    }
  }
}

class SniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#a05353");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune);
  }
}

class Stalactite extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("stalactite") - 1, radius, speed, angle, "#302519");
    this.collision = false;
    this.speed = speed;
    this.pos = pos;
    this.radius = radius;
    this.clock = 0;
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    if (this.collision){
      if(this.clock == 0) area.addSniperBullet(15, this.pos, undefined, this.radius / 2);
      this.clock += time;
      if (this.clock > 1000) {
        this.collision = false;
        this.clock = 0;
      } else {
        this.speedMultiplier = 0;
      }
    }
  }
  colide(boundary){
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius).col)this.collision = true;
  }
}

class StalactiteProjectile extends Entity {
  constructor(pos, radius) {
    super(pos, radius, "#614c37");
    let angle = Math.random();
    let speed = 3;
    let xvel = Math.cos(angle * Math.PI * 2) * speed;
    let yvel = Math.sin(angle * Math.PI * 2) * speed;
    this.angle = angle;
    this.vel = new Vector(xvel, yvel);
    this.clock = 0;
    this.outline = true;
    this.renderFirst = false;
    this.decayed = false;
    this.imune = false;
    this.shatterTime = 0;
    this.isEnemy = true;
    this.repelled = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    this.decayed = false;
    this.repelled = false;
    this.shatterTime -= time;
    if (this.shatterTime < 0) {
      this.shatterTime = 0;
    }
    if (this.clock > 1500){
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune);
  }
}

class ForceSniperA extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("force_sniper_a") - 1, radius, speed, angle, "#0a5557");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[index].night&&!players[index].god&&!players[index].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(17, this.pos, Math.atan2(dY, dX), this.radius / 2, 12)
        this.clock = 0;
      }
    }
  }
}
class ForceSniperABullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#0a5557");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.imune = true;
    this.touched = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>3000){
      this.toRemove = true;
    }
  }
  interact(player,worldPos,time){
    if(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !this.touched) {
      const world = game.worlds[player.world];
      const area = world.areas[player.area];
      player.firstAbility = true;
      player.abilities(time,area,{x: area.pos.x + worldPos.x,y: area.pos.y + worldPos.y});
      this.touched = true;
    }
  }
}

class ForceSniperB extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("force_sniper_b") - 1, radius, speed, angle, "#914d83");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[index].night&&!players[index].god&&!players[index].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(18, this.pos, Math.atan2(dY, dX), this.radius / 2, 12)
        this.clock = 0;
      }
    }
  }
}
class ForceSniperBBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#914d83");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.imune = true;
    this.touched = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if(this.clock>3000){
      this.toRemove = true;
    }
  }
  interact(player,worldPos,time){
    if(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !this.touched) {
      const world = game.worlds[player.world];
      const area = world.areas[player.area];
      player.secondAbility = true;
      player.abilities(time,area,{x: area.pos.x + worldPos.x,y: area.pos.y + worldPos.y});
      this.touched = true;
    }
  }
}

class WindSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("wind_sniper") - 1, radius, speed, angle, "#9de3c6");
    this.releaseTime = 1000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(13, this.pos, Math.atan2(dY, dX), this.radius / 2, 16)
        this.clock = 0;
      }
    }
  }
}
class WindSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#82c2a5");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.imune = true;
    this.gravity = 64 / 32;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
  }
  interact(player,worldPos,time){
    const timeFix = time / (1000 / 30);
    while(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (this.radius/2)));
      var moveDist = this.gravity * attractionAmplitude;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x += (moveDist * Math.cos(angleToPlayer)) * timeFix;
      player.pos.y += (moveDist * Math.sin(angleToPlayer)) * timeFix;
      game.worlds[game.players[0].world].collisionPlayer(game.players[0].area, game.players[0]);
    }
  }
}

class Radar extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("radar") - 1, radius, speed, angle, "#c90000", true, "rgba(153, 153, 153, 0.2)", auraRadius / 32);
    this.releaseTime = 250;
    this.clock = Math.random() * this.releaseTime;
    this.auraRadius = auraRadius / 32;
    this.radius = radius;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    if (this.clock > this.releaseTime) {
      var min = this.auraRadius;
      var index;
      var boundary = area.getActiveBoundary();
      for (var i in players) {
        const player = players[i]
        if ((player.d_x!==0||player.d_y!==0)&&distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min && pointInRectangle(new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
          min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
          index = i;
        }
      }
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(12, this.pos, Math.atan2(dY, dX), this.auraRadius, this.radius / 3, this.speed + 5, this)
        this.clock = 0;
      }
    }
  }
}

class RadarBullet extends Entity {
  constructor(pos, angle, auraOfSpawner, radius, speed, spawner) {
    super(pos, radius, "#c90000");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.auraOfSpawner = auraOfSpawner;
    this.spawner = spawner;
    this.radius = radius;
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    this.posOfSpawner = this.spawner.pos;
    if (distance(this.posOfSpawner, this.pos) > this.auraOfSpawner) {
      this.toRemove = true;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune);
  }
}

class CorrosiveSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("corrosive_sniper") - 1, radius, speed, angle, "#61ff61");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(5, this.pos, Math.atan2(dY, dX), this.radius / 2, 10)
        this.clock = 0;
      }
    }
  }
}

class CorrosiveSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#61ff61");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.outline = true;
    this.renderFirst = false;
    this.decayed = false;
    this.imune = false;
    this.shatterTime = 0;
    this.isEnemy = true;
    this.repelled = false;
    this.corrosive = true;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    this.decayed = false;
    this.repelled = false;
    this.shatterTime -= time;
    if (this.shatterTime < 0) {
      this.shatterTime = 0;
    }
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune);
  }
}

class Freezing extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 100) {
    super(pos, entityTypes.indexOf("freezing") - 1, radius, speed, angle, "#64c1b9", true, "rgba(58, 117, 112, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.freezing = true;
    }
  }
}

class Web extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 110) {
    super(pos, entityTypes.indexOf("web") - 1, radius, speed, angle, "#4a4a4a", true, "rgba(255, 255, 255, 0.6)", auraRadius / 32);
    this.imune = true;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize && !player.god ) {
      player.web = true;
    }
  }
}

class Cobweb extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("cobweb") - 1, radius, speed, angle, "#e4e4e4");
    this.Harmless = true;
    this.imune = true;
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
    super(pos, entityTypes.indexOf("teleporting") - 1, radius, speed, angle,"#ecc4ef");
    this.clock = 0;
  }
  update(time) {
    this.radius = this.fixedRadius;
    this.velToAngle();
    this.angleToVel();
    var timeFix = time / (1000 / 30);
    if(this.sugar_rush>0){
      this.speedMultiplier*=0.05;
      this.sugar_rush-=time;
    }
    var vel = new Vector(this.vel.x * this.speedMultiplier, this.vel.y * this.speedMultiplier)
    this.speedMultiplier = 1;
    this.radius *= this.radiusMultiplier;
    this.radiusMultiplier = 1;
    if(!this.freeze){this.pos.x += vel.x / 32;
    this.pos.y += vel.y / 32;}
    else{this.freeze -= time}
    if(this.freeze < 0)this.freeze = 0;
    var dim = 1 - this.friction;
    this.vel.x *= dim;
    this.vel.y *= dim;
    this.decayed = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time
    this.speedMultiplier = 0
    if (this.clock > 1000) {
      this.speedMultiplier = 1;
    }
    this.clock = this.clock % 1000;
  }
}

class Star extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("star") - 1, radius, speed, angle, "#faf46e");
    this.clock = 0;
    this.starPos = true;
    this.imune = false;
  }
  update(time) {
    this.radius = this.fixedRadius;
    this.velToAngle();
    this.angleToVel();
    if(this.sugar_rush>0){
      this.speedMultiplier*=0.05;
      this.sugar_rush-=time;
    }
    if(this.starPos){
      var vel = new Vector(Math.abs(this.vel.x) * this.speedMultiplier*2, Math.abs(this.vel.y) * this.speedMultiplier*2)
    } else {
      var vel = new Vector((-Math.abs(this.vel.x)) * this.speedMultiplier*2, (-Math.abs(this.vel.y)) * this.speedMultiplier*2)
    }
    this.speedMultiplier = 1;
    this.radius *= this.radiusMultiplier;
    this.radiusMultiplier = 1;
    if(!this.freeze){this.pos.x += vel.x / 32;
    this.pos.y += vel.y / 32;}
    else{this.freeze -= time}
    if(this.freeze < 0)this.freeze = 0;
    var dim = 1 - this.friction;
    this.vel.x *= dim;
    this.vel.y *= dim;
    this.decayed = false;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
    this.speedMultiplier = 0
    if (this.clock > 400) {
      this.speedMultiplier = 1;
      this.starPos = !this.starPos;
      this.clock = this.clock % 400;
    }
  }
}

class Immune extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("immune") - 1, radius, speed, angle, "#000000");
    this.imune = true;
  }
}
class IceSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("ice_sniper") - 1, radius, speed, angle, "#8300ff");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(1, this.pos, Math.atan2(dY, dX), 10 / 32, 16)
        this.clock = 0;
      }
    }
  }
}

class Ice extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("ice_ghost") - 1, radius, speed, angle, "#be89ff");
    this.imune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
        player.frozen = true;
        player.frozenTimeLeft = 150*player.effectImmune/player.effectReplayer;
        player.frozenTime = 0
    }
  }
}

class PositiveMagneticGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("positive_magnetic_ghost") - 1, radius, speed, angle, "#e3001e");
    this.imune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
        player.magnetDirection = "Up";
    }
  }
}

class NegativeMagneticGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("negative_magnetic_ghost") - 1, radius, speed, angle, "#6f59ff");
    this.imune = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
        player.magnetDirection = "Down";
    }
  }
}

class IceSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#8300ff");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
        player.frozen = true;
        player.frozenTimeLeft = 1000*player.effectImmune/player.effectReplayer;
        player.frozenTime = 0
    }
  }
}
class PoisonSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("poison_sniper") - 1, radius, speed, angle, "#8c01b7");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(6, this.pos, Math.atan2(dY, dX), 10 / 32, 16)
        this.clock = 0;
      }
    }
  }
}
class PoisonSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#8c01b7");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
        player.poison = true;
        player.poisonTimeLeft = 1000*player.effectImmune/player.effectReplayer;
        player.poisonTime = 0;
    }
  }
}
class Disabling extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("disabling") - 1, radius, speed, angle, "#a87c86", true, "rgba(255, 191, 206, 0.5)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.disabling = true;
    }
  }
}

class DisablingGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("disabling_ghost") - 1, radius, speed, angle, "rgba(255, 191, 206, 0.5)");
    this.Harmless = true;
    this.imune = true;
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
    super(pos, entityTypes.indexOf("toxic") - 1, radius, speed, angle, "#00c700", true, "rgba(0, 199, 0, 0.2)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      const corrosive = (0.7*player.effectReplayer)*player.maxEnergy;
      if(player.energy>corrosive){player.energy=corrosive}
    }
  }
}

class Enlarging extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("toxic") - 1, radius, speed, angle, "#4d0163", true, "rgba(77, 1, 99, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.enlarging = true;
    }
  }
}

class Icicle extends Enemy {
  constructor(pos, radius, speed, angle, horizontal) {
    super(pos, entityTypes.indexOf("icicle") - 1, radius, speed, angle, "#adf8ff");
    this.clock = 0
    this.wallHit = false;
    if(angle !== undefined){
      this.angle = angle;
    } else if (horizontal) {
      this.vel.x = (Math.floor(Math.random() * 2) * 2 - 1) * speed;
      this.vel.y = 0
    } else {
      this.vel.x = 0;
      this.vel.y = (Math.floor(Math.random() * 2) * 2 - 1) * speed
    }
  }
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius).col)this.wallHit=true;
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
    super(pos, entityTypes.indexOf("spiral") - 1, radius, speed, angle, "#e8b500");
    this.angleIncrement = 0.15;
    this.angleIncrementChange = 0.004;
    this.angleAdd = false;
    this.dir = 1
    this.turning = true;
  }
  behavior(time, area, offset, players) {
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
      this.angleIncrement += this.angleIncrementChange * (time / (1000 / 30));
    } else {
      this.angleIncrement -= this.angleIncrementChange * (time / (1000 / 30));
    }
    this.velToAngle();
    this.angle += this.angleIncrement * this.dir * (time / (1000 / 30));
    this.angleToVel();
  }
}
class Gravity extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, gravity = 6) {
    super(pos, entityTypes.indexOf("gravity") - 1, radius, speed, angle, "#78148c", true, "rgba(60, 0, 115, 0.15)", auraRadius / 32);
    this.gravity = gravity / 32;
  }
  auraEffect(player, worldPos, time) {
    if (!invulnerable(player) && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
      var moveDist = (this.gravity * attractionAmplitude*player.effectImmune)/player.effectReplayer;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x -= (moveDist * Math.cos(angleToPlayer)) * (time / (1000 / 30))
      player.pos.y -= (moveDist * Math.sin(angleToPlayer)) * (time / (1000 / 30))
    }
  }
}

class Gravity_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("gravity_ghost") - 1, radius, speed, angle, "#78148c");
    this.gravity = 12 / 32;
    this.radius = radius;
    this.Harmless = true;
  }
  interact(player, worldPos, time) {
    if (player.effectImmune != 0 && !invulnerable(player) && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
      var moveDist = (this.gravity * attractionAmplitude*player.effectImmune)/player.effectReplayer;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x -= (moveDist * Math.cos(angleToPlayer)) * (time / (1000 / 30))
      player.pos.y -= (moveDist * Math.sin(angleToPlayer)) * (time / (1000 / 30))
    }
  }
}

class Repelling extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150, repulsion = 6) {
    super(pos, entityTypes.indexOf("repelling") - 1, radius, speed, angle, "#7b9db2", true, "rgba(210, 228, 239, 0.2)", auraRadius / 32);
    this.gravity = repulsion / 32;
  }
  auraEffect(player, worldPos, time) {
    if (!invulnerable(player) && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
      var moveDist = (this.gravity * attractionAmplitude*player.effectImmune)/player.effectReplayer;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x += (moveDist * Math.cos(angleToPlayer)) * (time / (1000 / 30))
      player.pos.y += (moveDist * Math.sin(angleToPlayer)) * (time / (1000 / 30))
      game.worlds[game.players[0].world].collisionPlayer(game.players[0].area, game.players[0]);
    }
  }
}

class Repelling_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("repelling_ghost") - 1, radius, speed, angle, "#7b9db2");
    this.gravity = 12 / 32;
    this.radius = radius;
    this.Harmless = true;
  }
  interact(player, worldPos, time) {
    if (player.effectImmune != 0 && !invulnerable(player) && distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (100 / 32)));
      var moveDist = (this.gravity * attractionAmplitude*player.effectImmune)/player.effectReplayer;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x += (moveDist * Math.cos(angleToPlayer)) * (time / (1000 / 30))
      player.pos.y += (moveDist * Math.sin(angleToPlayer)) * (time / (1000 / 30))
      game.worlds[game.players[0].world].collisionPlayer(game.players[0].area, game.players[0]);
    }
  }
}
class Wavy extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("wavy") - 1, radius, speed, angle, "#dd2606");
    this.velToAngle();
    this.angle = Math.PI / 2;
    this.angleToVel();
    this.circleSize = 100;
    this.dir = 1;
    this.switchInterval = 800;
    this.switchTime = 400;
    this.angleIncrement = (this.speed + 6) / this.circleSize;
    this.turning = true;
  }
  behavior(time, area, offset, players) {
    if (this.switchTime > 0) {
      this.switchTime -= time
    } else {
      this.switchTime = this.switchInterval
      this.dir *= -1;
    }
    this.velToAngle();
    this.angle += this.angleIncrement * this.dir * (time / (1000 / 30));
    this.angleToVel();
  }
}
class Zigzag extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("zigzag") - 1, radius, speed, angle, "#b371f2");
    this.switchInterval = 500;
    this.switchTime = 500;
    this.switchAdd = false;
    this.turnAngle = Math.PI / 2
  }
  behavior(time, area, offset, players) {
    if (this.switchTime > 0) {
      this.switchTime -= time
    } else {
      this.switchTime = this.switchInterval
      if (!this.switchAdd) {
        this.velToAngle();
        this.angle -= this.turnAngle
        this.angleToVel();
        this.switchAdd = true;
      } else {
        this.velToAngle();
        this.angle += this.turnAngle
        this.angleToVel();
        this.switchAdd = false;
      }
    }
  }
}
class Zoning extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("zoning") - 1, radius, speed, angle, "#a03811");
    this.switchInterval = 1000;
    this.switchTime = Math.random() * this.switchInterval;
    this.turnAngle = Math.PI / 2
    this.turnAngle *= (Math.floor(Math.random() * 2) * 2) - 1
  }
  behavior(time, area, offset, players) {
    if (this.switchTime > 0) {
      this.switchTime -= time
    } else {
      this.switchTime = this.switchInterval
      this.velToAngle();
      this.angle += this.turnAngle
      this.angleToVel();
    }
  }
}
class Radiating extends Enemy {
  constructor(pos, radius, speed, angle, releaseInterval = 4000, releaseTime) {
    super(pos, entityTypes.indexOf("radiating_bullets") - 1, radius, speed, angle, "#d3134f");
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
    if(interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune).inDistance){
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
    super(pos, entityTypes.indexOf("frost_giant") - 1, radius, speed, angle,"#7e7cd6");
    this.imune = immune;
    this.entityAngle = angle;
    this.angle = angle;
    this.tick_time = 1000/30;
    this.rotation = false;
    this.precise_movement = precise_movement;
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
    this.reset_parameters();
  }
  behavior(time, area, offset, players) {
    this.fps_stabilizer+=time;
    if(!this.rotation&&this.fps_stabilizer>=this.tick_time){
      this.generate_entities(area);
      this.fps_stabilizer -= this.tick_time;
    }
    if(this.rotation){
      this.velToAngle();
      this.angle += 2*((this.turn_speed / this.tick_time) * time * this.direction);
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
    if(this.pause_interval!=0){
      if(this.pause_cooldown <= 0){
        this.shot_interval = this.initial_shot_interval;
        this.turn_speed = this.initial_turn_speed;
        this.pause_time -= this.tick_time;
        if(this.pause_time<0){
          this.pause_cooldown = this.pause_interval;
          this.pause_time = this.pause_duration;
        }
      return false;
      } else {
          this.pause_cooldown -= this.tick_time;
        }
    }
    this.shot_cooldown -= this.tick_time;
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
  generate_entities(area){
    this.angle += this.turn_speed * this.direction;
    this.shot_interval -= this.shot_acceleration;
    this.turn_speed += this.turn_acceleration;
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
    this.imune = false;
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
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune)
  }
}

class Fire_Trail extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("fire_trail") - 1, radius, speed, angle, "#cf5504");
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
    if(!area.entities["fire_trail"]){area.entities["fire_trail"] = []}
    area.entities["fire_trail"].push(trail);
  }
}

class Trail extends Enemy {
  constructor(pos, radius) {
    super(pos, entityTypes.indexOf("fire_trail") - 1, radius, 0, undefined,"#cf5504");
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
    super(pos, entityTypes.indexOf("tree") - 1, radius, speed, angle, "#4e2700");
    this.release_interval = 4400;
    this.release_time = Math.random() * this.release_interval;
    this.clock = 0;
  }
  behavior(time, area, offset, players) {
    if(!this.freeze){
      this.release_time += time;
      this.clock += time;
    }
    if (this.release_time > this.release_interval) {
      var count = Math.floor(Math.random()*6)+2
      for (var i = 0; i < count; i++) {
        area.addSniperBullet(10, this.pos, i * Math.PI / (count/2), 12 / 32, 6)
      }
      this.release_time %= this.release_interval;
    }
    if(this.shotTimer>this.release_interval*0.9){
      this.speedMultiplier = Math.sin(this.movementTimer/20)
    } else {
      this.speedMultiplier = Math.max(Math.sin(this.movementTimer/200),0)
    }
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
    this.imune = true;
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
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune)
  }
}

class Pumpkin extends Enemy {
  constructor(pos, radius, speed) {
    super(pos, entityTypes.indexOf("pumpkin") - 1, radius, speed, undefined,"#e26110");
    this.texture = "pumpkinOff"
    this.staticVel = {x:this.vel.x,y:this.vel.y}
    this.nextAngle = 0;
    this.clock = 0;
    this.nextAngleDetected = false;
    this.staticSpeed = speed + 0;
    this.isLight = false;
    this.lightCount = this.radius*32+30;
    this.outline = true;
  }
  behavior(time,area,offset,players){
    if(this.texture=="pumpkinOff"){
      this.vel.x = 0; this.vel.y = 0;
      this.isLight = false;
    }
    var min = 7.5;
    var index;
    var boundary = area.getActiveBoundary();
    for (var i in players) {
      if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min &&!players[i].god&&!players[i].isDead&&!players[i].night && pointInRectangle(new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y), new Vector(boundary.x, boundary.y), new Vector(boundary.w, boundary.h))) {
        min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
        index = i;
      }
    }
    if (index != undefined) {
      this.texture = "pumpkinOn"
    }
    if(this.texture == "pumpkinOn"){
      this.isLight = true;
      this.clock+=time;
      if(this.clock>3000){
        this.texture = "pumpkinOff";
        this.nextAngleDetected = false;
        this.clock = 0;
      }
      if(this.clock<1000){
        this.angle = Math.random()
        let xvel = Math.cos(this.angle * Math.PI * 2) * 4
        let yvel = Math.sin(this.angle * Math.PI * 2) * 4
        this.vel = new Vector(xvel, yvel);
      } else {
        if(!this.nextAngleDetected){
          var dX = (players[0].pos.x - offset.x) - this.pos.x;
          var dY = (players[0].pos.y - offset.y) - this.pos.y;
          this.nextAngle = Math.atan2(dY, dX);
          this.nextAngleDetected = true;
          let xvel = Math.cos(this.nextAngle) * this.staticSpeed;
          let yvel = Math.sin(this.nextAngle) * this.staticSpeed;
          this.vel = new Vector(xvel, yvel);
        }
      }
    }
  }
}
class FakePumpkin extends Entity {
  constructor(pos, radius) {
    super(pos, radius, "#e26110");
    this.texture = "pumpkinOff";
    this.Harmless = true;
    this.no_collide = true;
    this.outline = true;
  }
}

class SpeedGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("speed_ghost") - 1, radius, speed, angle, "#fca330");
    this.Harmless = true;
    this.imune = true;
    this.radius = radius;
  }
  interact(player, worldPos, time) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius+this.radius && !invulnerable(player)) {
      player.speedghost = true;
    }
  }
}

class RegenGhost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("regen_ghost") - 1, radius, speed, angle, "#32e3ae");
    this.Harmless = true;
    this.imune = true;
    this.radius = radius;
  }
  interact(player, worldPos, time) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius+this.radius && !invulnerable(player)) {
      player.regenghost = true;
    }
  }
}

class SpeedSniper extends Enemy {
  constructor(pos, radius, speed, angle, speedLoss = 1) {
    super(pos, entityTypes.indexOf("speed_sniper") - 1, radius, speed, angle, "#ff9000");
    this.releaseTime = 2500;
    this.speedLoss = speedLoss;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(3, this.pos, Math.atan2(dY, dX), 10 / 32, 16, this.speedLoss)
        this.clock = 0;
      }
    }
  }
}

class SpeedSniperBullet extends Entity {
  constructor(pos, angle, radius, speed, speedLoss) {
    super(pos, radius, "#d6885c");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
    this.speedLoss = speedLoss;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      if(player.speed>5){
        player.speed-=(this.speedLoss*player.effectImmune)/player.effectReplayer;
        if(!settings.no_points)player.points+=Math.round(this.speedLoss*2);
      }if(player.speed<5){player.speed = 5;}
      this.toRemove = true;
    }
  }
}
class RegenSniper extends Enemy {
  constructor(pos, radius, speed, angle, regenLoss = 0.4) {
    super(pos, entityTypes.indexOf("regen_sniper") - 1, radius, speed, angle, "#00cc8e");
    this.releaseTime = 3000;
    this.regenLoss = regenLoss;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(4, this.pos, Math.atan2(dY, dX), 10 / 32, 16, this.regenLoss)
        this.clock = 0;
      }
    }
  }
}
class RegenSniperBullet extends Entity {
  constructor(pos, angle, radius, speed, regenLoss) {
    super(pos, radius, "#00a875");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
    this.regenLoss = regenLoss;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      player.regen-=(this.regenLoss*player.effectImmune)/player.effectReplayer;
      if(!settings.no_points)player.points+=Math.round(this.regenLoss*5);
      if(player.regen<1){player.regen = 1;}
      this.vel.x = Math.cos(0) * this.speed;
      this.vel.y = Math.sin(0) * this.speed;
      this.toRemove = true;
    }
  }
}
class Snowman extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("snowman") - 1, radius, speed, angle, "#ffffff");
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
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.radius).col)this.wallHit=true;
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
    super(pos, entityTypes.indexOf("slippery") - 1, radius, speed, angle, "#1aacbf", true, "rgba(33, 161, 165, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.slippery = true;
      
    }
  }
}

class MagneticReduction extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 125) {
    super(pos, entityTypes.indexOf("magnetic_reduction") - 1, radius, speed, angle, "#bd67d2", true, "rgba(189, 103, 210, 0.25)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      if(player.vertSpeed!=0){player.vertSpeed = (10-5*player.effectImmune)*player.effectReplayer;}
    }
  }
}

class MagneticNullification extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 125) {
    super(pos, entityTypes.indexOf("magnetic_nullification") - 1, radius, speed, angle, "#642374", true, "rgba(100, 35, 116, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.vertSpeed = 0;
    }
  }
}

class PositiveMagneticSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("positive_magnetic_sniper") - 1, radius, speed, angle, "#ff3852");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(7, this.pos, Math.atan2(dY, dX), 10 / 32, 16)
        this.clock = 0;
      }
    }
  }
}
class PositiveMagneticSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#e3001e");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      this.toRemove = true;
      if(player.effectImmune!=0)player.magnetDirection = "Up"
    }
  }
}

class NegativeMagneticSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("negative_magnetic_sniper") - 1, radius, speed, angle, "#a496ff");
    this.releaseTime = 3000;
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        area.addSniperBullet(8, this.pos, Math.atan2(dY, dX), 10 / 32, 16)
        this.clock = 0;
      }
    }
  }
}
class NegativeMagneticSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#6f59ff");
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.weak = true;
    this.Harmless = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      if(player.effectImmune!=0)player.magnetDirection = "Down"
      this.toRemove = true;
    }
  }
}

class ExperienceDraining extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("experience_draining") - 1, radius, speed, angle, "#b19cd9", true, "rgba(60, 0, 0, 0.2)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.experienceDraining=true;
    }
  }
}
class Wind extends Enemy {
  constructor(pos, radius, speed, angle, ignore_invulnerability = false) {
    super(pos, entityTypes.indexOf("wind_ghost") - 1, radius, speed, angle, "#cfffeb");
    this.Harmless = true;
    this.imune = true;
    this.gravity = 16 / 32;
    this.ignore_invulnerability = ignore_invulnerability;
  }
  interact(player,worldPos,time){
    if(!invulnerable(player)||this.ignore_invulnerability)while(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      var dx = player.pos.x - (this.pos.x + worldPos.x);
      var dy = player.pos.y - (this.pos.y + worldPos.y);
      var dist = distance(new Vector(0, 0), new Vector(dx, dy));
      var attractionAmplitude = Math.pow(2, -(dist / (this.radius/2)));
      var moveDist = this.gravity * attractionAmplitude;
      var angleToPlayer = Math.atan2(dy, dx);
      player.pos.x += (moveDist * Math.cos(angleToPlayer)) * (time / (1000 / 30))
      player.pos.y += (moveDist * Math.sin(angleToPlayer)) * (time / (1000 / 30))
      game.worlds[game.players[0].world].collisionPlayer(game.players[0].area, game.players[0]);
    }
  }
}

class Grass extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("grass") - 1, radius, speed, angle, "#75eb26");
    this.active = false;
    this.activation_complete = false;
    this.canKill = false;
    this.alpha = 0.5;
    this.clock = 0;
  }
  behavior(time,area,offset,players){
    const player = players[0];

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
    if(interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,!this.canKill).dead){
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
    super(pos, entityTypes.indexOf("glowy") - 1, radius, speed, angle, "#ede658");
    this.invisible_timing = 500;
    this.brightness = 1;
    this.mode = true;
    this.timer = this.invisible_timing;
    this.brightness_tick = 0.06;
    this.isLight = true;
  }
  behavior(time,area,offset){
    const timeFix = time / (1000 / 30);
    this.lightCount=3*this.radius*this.brightness*32;

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

    if (this.timer>0){
      this.timer -= time;
    }

    this.alpha = this.brightness;
  }
}

class Firefly extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("firefly") - 1, radius, speed, angle, "#f0841f");
    this.invisible_timing = 500;
    this.brightness = Math.random();
    this.mode = true;
    this.timer = this.invisible_timing;
    this.brightness_tick = 0.06;
    this.isLight = true;
  }
  behavior(time,area,offset){
    const timeFix = time / (1000 / 30);
    this.lightCount=3*this.radius*this.brightness*32

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

    if (this.timer>0){
      this.timer -= time;
    }

    this.alpha = this.brightness;
  }
}

class Mist extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("mist") - 1, radius, speed, angle, "#b686db");
    this.brightness = 1;
    this.mode = true;
    this.visibility_radius = 200;
    this.brightness_tick = 0.05;
    this.isLight = true;
  }
  behavior(time,area,offset,players){
    const timeFix = time / (1000 / 30);
    this.lightCount=3*this.radius*this.brightness*32;

    const player = players[0];
    const worldPos = game.worlds[player.world].pos;
    const position = {x: worldPos.x+area.pos.x, y: worldPos.y+area.pos.y}
    let close_enough = false;

    if(distance(player.pos, new Vector(this.pos.x + position.x, this.pos.y + position.y)) < player.radius + this.visibility_radius / 32) {
      close_enough = true;
    }

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

    this.alpha = this.brightness;
  }
}

class Phantom extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("phantom") - 1, radius, speed, angle, "#86d7db");
    this.brightness = 0;
    this.mode = true;
    this.visibility_radius = 300;
    this.brightness_tick = 0.05;
    this.isLight = true;
  }
  behavior(time,area,offset,players){
    const timeFix = time / (1000 / 30);
    this.lightCount=3*this.radius*this.brightness*32;
    
    const player = players[0];
    const worldPos = game.worlds[player.world].pos;
    const position = {x: worldPos.x+area.pos.x, y: worldPos.y+area.pos.y}
    let close_enough = false;

    if(distance(player.pos, new Vector(this.pos.x + position.x, this.pos.y + position.y)) < player.radius + this.visibility_radius / 32) {
      close_enough = true;
    }

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

    this.alpha = this.brightness;
  }
}

class Poison_Ghost extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("poison_ghost") - 1, radius, speed, angle, "#590174");
    this.Harmless = true;
    this.imune = true;
  }
  interact(player,worldPos,time){
    if(distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius) {
      player.poison = true;
      player.poisonTime = 0;
      player.poisonTimeLeft = 150*player.effectImmune/player.effectReplayer;
    }
  }
}

class Burning extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 120) {
    super(pos, entityTypes.indexOf("burning") - 1, radius, speed, angle, "#FFA500", true, "rgba(255, 165, 0, 0.3)", auraRadius / 32);
    this.isLight = true;
    this.lightCount = auraRadius+60;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.burning = true;
    }
  }
}

class Lava extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 150) {
    super(pos, entityTypes.indexOf("lava") - 1, radius, speed, angle, "#f78306", true, "rgba(247, 131, 6, 0.3)", auraRadius / 32);
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.charging = true;
    }
  }
}

class Barrier extends Enemy {
  constructor(pos, radius, speed, angle, auraRadius = 100) {
    super(pos, entityTypes.indexOf("barrier") - 1, radius, speed, angle, "#29ffc6", true, "rgba(41, 255, 198, 0.3)", auraRadius / 32);
    this.imune = true;
  }
  auraEffect(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.auraSize) {
      player.inEnemyBarrier = true;
    }
  }
}

class Lunging extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("lunging") - 1, radius, speed, angle, "#c88250");
    this.base_speed = speed;
    this.reset_parameters();
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
    var min = 250/32;
    var dX;
    var dY;
    for (var i in players) {
      if(!players[i].safeZone && !players[i].night && !players[i].god && !players[i].isDead) if (distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y)) < min) {
        min = distance(this.pos, new Vector(players[i].pos.x - offset.x, players[i].pos.y - offset.y));
        closest_entity = i;
        dX = (players[closest_entity].pos.x - offset.x) - this.pos.x;
        dY = (players[closest_entity].pos.y - offset.y) - this.pos.y;
        closest_entity_distance = dX ** 2 + dY ** 2;
      }
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
      if(closest_entity != undefined){
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
    this.vel.x = Math.cos(this.angle) * this.base_speed;
    this.vel.y = Math.sin(this.angle) * this.base_speed;
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
    super(pos, entityTypes.indexOf("sand") - 1, radius, speed, angle, "#d5ae7f");
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
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius).col)this.collision=true;
  }
}

class Sandrock extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sandrock") - 1, radius, speed, angle, "#a57a6d");
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
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius).col)this.collision=true;
  }
}

class Crumbling extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("crumbling") - 1, radius, speed, angle, "#bd9476");
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
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.vel,this.pos,this.realRadius).col)this.collision=true;
  }
}

class Residue extends Enemy {
  constructor(pos, angle, radius, speed) {
    super(pos, entityTypes.indexOf("residue") - 1, radius, speed, angle, "#675327");
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
  constructor(pos, radius, speed, angle, growthMultiplayer) { 
    super(pos, entityTypes.indexOf("flower") - 1, radius, speed, angle, "#e8e584");
    this.id = 1;
    this.growthMultiplayer = growthMultiplayer
  }
  behavior(time, area, offset, players) {
    while(this.id<=5){
      this.spawnFlower(area,this.id);
      this.id++;
    }
  }
  spawnFlower(area, id){
    const flower_projectile = new FlowerProjectile(new Vector(this.pos.x,this.pos.y),this.radius,id,this,this.growthMultiplayer);
    if(!area.entities["flower_projectile"]){area.entities["flower_projectile"] = []}
    area.entities["flower_projectile"].push(flower_projectile);
  }
}

class FlowerProjectile extends Entity {
  constructor(pos, radius, id, spawner, growthMultiplayer = 1) {
    super(pos, radius, "#e084e8");
    this.id = id;
    this.spawner = spawner;
    this.no_collide = true;
    this.triggerZone = 150/32;
    this.radiusRatio = 1;
    this.growthMultiplayer = growthMultiplayer;
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    const timeFix = time / (1000 / 30);
    const growth = this.radius/20*this.growthMultiplayer;
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
    if(this.spawner.Harmless){this.Harmless = true;}
    else{this.Harmless = false;}
    if (distance(players[0].pos, new Vector(this.spawner.pos.x + offset.x, this.spawner.pos.y + offset.y)) < players[0].radius + this.triggerZone && !players[0].safeZone && !players[0].night) {
      this.radiusRatio -= growth / 2 * timeFix;
    } else {
      this.radiusRatio += growth / 2 * timeFix;
    }
    if(this.radiusRatio>1){
      this.radiusRatio = 1;
    }
    this.radius *= this.radiusRatio;
  }
  interact(player, worldPos) {
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
  }
  newPosition(x,y){
    return new Vector(this.spawner.pos.x+x*this.radius,this.spawner.pos.y+y*this.radius)
  }
}

class Seedling extends Enemy {
  constructor(pos, radius, speed, angle, growthMultiplayer) { 
    super(pos, entityTypes.indexOf("seedling") - 1, radius, speed, angle, "#259c55");
    this.spawnedProjectile = false;
    this.imune = true;
  }
  behavior(time, area, offset, players) {
    if(!this.spawnedProjectile){
      this.spawnedProjectile = true;
      const seedling_projectile = new SeedlingProjectile(new Vector(this.pos.x,this.pos.y),this.radius,this.speed,this);
      if(!area.entities["seedling_projectile"]){area.entities["seedling_projectile"] = []}
      area.entities["seedling_projectile"].push(seedling_projectile);
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
    this.imune = true;
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
    interactionWithEnemy(player,this,worldPos,true,this.corrosive,this.imune,false,true)
  }
  newPosition(x,y){
    return new Vector(this.spawner.pos.x+x,this.spawner.pos.y+y)
  }
}

class Cactus extends Enemy {
  constructor(pos, radius, speed, angle) { 
    super(pos, entityTypes.indexOf("cactus") - 1, radius, speed, angle, "#5b8e28");
    this.imune = true;
    this.push_time = 200;
    this.staticRadius = this.realRadius = radius;
  }
  interact(player,offset,time){
    var timeFix = time / (1000 / 30);
    this.realRadius += timeFix * this.staticRadius / 2 / 2000 * 30;
    if(this.realRadius > this.staticRadius) this.realRadius = this.staticRadius;
    this.radius = this.realRadius;
    if(invulnerable(player)) return
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
    super(pos, entityTypes.indexOf("charging") - 1, radius, speed, angle, "#374037");
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
  colide(boundary) {
    if(collisionEnemy(this,boundary,this.realVel,this.pos,this.radius).col) {
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

class LeadSniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("lead_sniper") - 1, radius, speed, angle, "#788898");
    this.releaseTime = 3000;
    this.clock = Math.random() * this.releaseTime;
    this.radius = radius;
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
      if (index != undefined&&!players[index].night&&!players[index].god&&!players[index].isDead) {
        var dX = (players[index].pos.x - offset.x) - this.pos.x;
        var dY = (players[index].pos.y - offset.y) - this.pos.y;
        var bulletRadius = Math.floor(this.radius / 1.5 * 32) / 32;
        area.addSniperBullet(16, this.pos, Math.atan2(dY, dX), bulletRadius, 10)
        this.clock = 0;
      }
    }
  }
}

class LeadSniperBullet extends Entity {
  constructor(pos, angle, radius, speed) {
    super(pos, radius, "#788898");
    this.radius = radius;
    this.vel.x = Math.cos(angle) * speed;
    this.vel.y = Math.sin(angle) * speed;
    this.clock = 0;
    this.weak = true;
    this.power = 3500;
  }
  behavior(time, area, offset, players) {
    this.clock += time;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      //lead effect goes here
      if (player.leadTimeLeft <= 0){
        player.cent_input_ready = true;
        player.cent_accelerating = false;
        player.cent_is_moving = false;
      }
      player.leadTimeLeft = player.leadTime = this.power*player.effectImmune/player.effectReplayer;
      this.toRemove = true;
    }
  }
}
// custom

class StickySniper extends Enemy {
  constructor(pos, radius, speed, angle) {
    super(pos, entityTypes.indexOf("sticky_sniper") - 1, radius, speed, angle, "#000037");
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
      if (index != undefined&&!players[0].night&&!players[0].god&&!players[0].isDead) {
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
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      player.stickness = 1000*player.effectImmune/player.effectReplayer;
      this.toRemove = true;
    }
  }
}

class StickyTrail extends Enemy {
  constructor(pos) {
    super(pos, entityTypes.indexOf("sticky_trail") - 1, 0, 0, undefined,"rgb(0,0,69,0.5)");
    this.clock = 0;
    this.alpha = 1;
    this.radius = 8/32;
    this.imune = true;
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
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius && !invulnerable(player)) {
      player.sticky = true;
    }
  }
}

class ClownTrail extends Enemy {
  constructor(pos,radius,angle,color) {
    super(pos, entityTypes.indexOf("clown_trail") - 1, radius, 12, undefined,color);
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
    this.radius = this.radius - (this.clock/1000)/5;
    this.clock += time;
    this.alpha -= time/1500;
    if(this.alpha<=0){this.alpha=0.001}
    if(this.clock>=1500){
      this.toRemove = true;
    }
    for(var i in area.entities){
      const entities = area.entities[i];
      for(var j in entities){
        const entity = entities[j];
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.imune && !entity.Harmless && !entity.clown) {
          entity.Harmless = true;
          entity.clownHarm = true;
          setTimeout(()=>{entity.Harmless = false;entity.clownHarm = false;},1500)
        }
      }
    }
  }
  interact(){}
}

// non-enemies

class SweetTooth extends Entity {
  constructor(pos) {
    super(pos, 0.4,"#e26110");
    this.texture = "sweet_tooth_item";
    this.Harmless = true;
    this.no_collide = true;
  }
  interact(player, worldPos) {
    if (distance(player.pos, new Vector(this.pos.x + worldPos.x, this.pos.y + worldPos.y)) < player.radius + this.radius*1.5) {
      player.sweetToothConsumed = true;
      player.sweetToothTimer = 15000;
      this.no_collide = false;
      this.weak = true;
      this.toRemove = true;
    }
  }
}

class ReverseProjectile extends Enemy {
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("reverse_projectile") - 1, 30/32, undefined, undefined, "#00dd00");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.imune = true;
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
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.imune) {
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
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("obscure_projectile") - 1, 15/32, undefined, undefined, "#020fa2");
    this.clock = 0;
    this.angle = angle;
    this.imune = true;
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
          player.invicible_time = 1000;
          player.invicible = true;
          this.toRemove = true;
        }
      }
    }
  }
  interact(){}
}

class MinimizeProjectile extends Enemy {
  constructor(pos,angle) {
    super(pos, entityTypes.indexOf("minimize_projectile") - 1, 11/32, undefined, undefined, "#ff0000");
    this.clock = 0;
    this.angle = angle;
    this.no_collide = true;
    this.imune = true;
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
        if (distance(this.pos, new Vector(entity.pos.x, entity.pos.y)) < this.radius + entity.radius && !entity.imune) {
          entity.minimized = 4000;
        }
      }
    }
  }
  interact(){}
}
