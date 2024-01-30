
class Game {
  constructor() {
    this.worlds = [];
    this.players = [];
  }
  inputPlayer(player, input) {
    this.players[player].input(input);
  }
  update(time) {
    var loaded = []
    for (var i in this.worlds) {
      loaded[i] = []
    }
    for (var i in this.players) {
      this.players[i].update(time, this.worlds[this.players[i].world].friction, this.worlds[this.players[i].world].magnet);
      if(!this.players[i].wallGod)this.teleport(this.players[i]);
      if(!this.players[i].wallGod)this.worlds[this.players[i].world].collisionPlayer(this.players[i].area, this.players[i]);
      loaded[this.players[i].world][this.players[i].area] = true;
    }
    for (var i in loaded) {
      for (var j in loaded[i]) {
        if (loaded[i][j]) {
          var players = []
          for (var k in this.players) {
            if (this.players[k].world == i && this.players[k].area == j) {
              players.push(this.players[k])
            }
          }
          this.worlds[i].update(j, time, players)
        }
      }
    }
  }
  teleport(player) {
    var area = this.worlds[player.world].areas[player.area];
    var onTele = false;
    for (var i in area.zones) {
      if(area.zones[i].type == 5){
        var pos1 = new Vector(this.worlds[player.world].pos.x + area.pos.x + area.zones[i].pos.x, this.worlds[player.world].pos.y + area.pos.y + area.zones[i].pos.y)
        var pos2 = new Vector(area.zones[i].size.x, area.zones[i].size.y)
        var teleporter = closestPointToRectangle(player.pos, pos1, pos2)
        var dist = distance(player.pos, teleporter)
        if (dist < player.radius) {
          player.world = 0;
          player.area = 0;
          player.pos = new Vector(6,9);
          if(settings.dev){
            player.victoryTimer = 30000;
          }
        }
      }
      else if (area.zones[i].type == 2) {
        var pos1 = new Vector(this.worlds[player.world].pos.x + area.pos.x + area.zones[i].pos.x, this.worlds[player.world].pos.y + area.pos.y + area.zones[i].pos.y)
        var pos2 = new Vector(area.zones[i].size.x, area.zones[i].size.y)
        var teleporter = closestPointToRectangle(player.pos, pos1, pos2)
        var dist = distance(player.pos, teleporter)
        if (dist< player.radius) {
          onTele = true;
        }
        if (dist < player.radius && !player.onTele) {
          var max = Math.pow(10, 1000);
          var maxArea = 0;
          var targetPoint = new Vector(player.pos.x + area.zones[i].translate.x, player.pos.y + area.zones[i].translate.y);
          for (var j in this.worlds[player.world].areas) {
            var rect = this.worlds[player.world].areas[j].getBoundary();
            rect.x += this.worlds[player.world].areas[j].pos.x;
            rect.y += this.worlds[player.world].areas[j].pos.y;
            rect.x += this.worlds[player.world].pos.x;
            rect.y += this.worlds[player.world].pos.y;
            var closest = closestPointToRectangle(targetPoint, new Vector(rect.x, rect.y), new Vector(rect.w, rect.h))
            var dist = distance(targetPoint, closest)
            if (dist < max) {
              max = dist;
              maxArea = j;
            }
          }
          player.area = maxArea;
          player.pos = targetPoint;
          this.worlds[player.world].areas[player.area].load();
          player.dyingPos = new Vector(targetPoint.x,targetPoint.y);
        }
      }
      if (area.zones[i].type == 3) {
        var pos1 = new Vector(this.worlds[player.world].pos.x + area.pos.x + area.zones[i].pos.x, this.worlds[player.world].pos.y + area.pos.y + area.zones[i].pos.y)
        var pos2 = new Vector(area.zones[i].size.x, area.zones[i].size.y)
        var teleporter = closestPointToRectangle(player.pos, pos1, pos2)
        var dist = distance(player.pos, teleporter)
        if (dist< player.radius) {
          onTele = true;
        }
        if (dist < player.radius && !player.onTele) {
          var min = Math.pow(10, 1000);
          var minWorld = 0;
          var targetPoint = new Vector(player.pos.x + area.zones[i].translate.x, player.pos.y + area.zones[i].translate.y);
          for (var j in this.worlds) {
            var rect = this.worlds[j].areas[0].getBoundary();
            rect.x += this.worlds[j].pos.x;
            rect.y += this.worlds[j].pos.y;
            var closest = closestPointToRectangle(targetPoint, new Vector(rect.x, rect.y), new Vector(rect.w, rect.h))
            var dist = distance(targetPoint, closest)
            if (dist < min) {
              min = dist;
              minWorld = j;
            }
          }
          player.world = minWorld;
          player.pos = targetPoint;
          this.worlds[player.world].areas[player.area].load();
          player.dyingPos = new Vector(targetPoint.x,targetPoint.y);
          player.onTele = true;
        }
      }
    }
    player.onTele = onTele;
  }
  getStates(index) {
    var player = this.players[index];
    var obj = {}
    var area = this.worlds[player.world].areas[player.area]
    obj.name = this.worlds[player.world].name;
    obj.zones = area.zones;
    obj.assets = area.assets;
    obj.entities = area.entities;
    obj.background_color = area.background_color;
    obj.lighting = area.lighting;
    obj.texture = area.texture||0;
    obj.variables = area.variables;
    obj.pattern_amount = area.pattern_amount;
    obj.text = area.text;
    obj.pos = new Vector(area.pos.x + this.worlds[player.world].pos.x, area.pos.y + this.worlds[player.world].pos.y);
    obj.boundary = area.getBoundary();
    obj.magnetism = area.magnetism;
    obj.partial_magnetism = area.partial_magnetism;
    obj.applies_lantern = area.applies_lantern;
    obj.pellet_count = area.pellet_count;
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
    this.magnet = false;
    this.pellet_count = 25;
    this.fromJson(map)
  }
  update(area, time, players) {
    this.areas[area].update(time, players, this.pos)
  }
  collisionPlayer(area, players) {
    this.areas[area].collisionPlayer(players, this.pos)
  }
  fromJson(json) {
    this.name = json.name
    var areas = json.areas;
    var properties = json.properties
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
      if (properties.magnetism !== undefined) {
        this.magnet = properties.magnetism;
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
      if (properties.texture !== undefined) {
        switch(properties.texture){
          case "leaves": this.texture = 1
            break;
          case "wooden": this.texture = 2
            break;
          case "baguette": this.texture = 3
            break;
          case "ice": this.texture = 4
            break;
          default: this.texture = 0
        }
      }
    }
    var xBase = areas[0].x;
    var yBase = areas[0].y;
    if (areas[0].x == "var x") {
      xBase = 0;
    }
    if (areas[0].y == "var y") {
      yBase = 0;
    }
    var last_height;
    var last_width;
    var last_right;
    var last_y;
    for (var i = 0; i < areas.length; i++) {
      var areaName = "Area "+(i+1);
      if (areas[i].name!==undefined) {
        areaName = areas[i].name
      }
      var areaPosX = areas[i].x - xBase;
      var areaPosY = areas[i].y - yBase;
      var zones = areas[i].zones;
      var assets = areas[i].assets;
      var propertiesC = areas[i].properties;
      if (areas[i].x == "var x") {
        areaPosX = 0;
      }
      if (areas[i].y == "var y") {
        areaPosY = 0;
      }
      if (areas[i].x.toString().startsWith("last_right")) {
        areaPosX = last_right;
      }
      if (areas[i].y.toString().startsWith("last_y")) {
        areaPosY = last_y;
      }
      if (areas[i].y.toString().startsWith("last_bottom")) {
        areaPosY = last_y;
      }
      var area = new Area(new Vector(areaPosX / 32, areaPosY / 32));
      area.name = areaName;
      area.background_color = this.background_color;
      area.title_stroke_color = this.title_stroke_color;
      area.text = areas[i].text;
      area.lighting = this.lighting;
      area.pellet_count = this.pellet_count;
      area.texture = this.texture;
      if (propertiesC) {
        if (propertiesC.background_color) {
          var colorC = propertiesC.background_color
          area.background_color = "rgba(" + colorC[0] + "," + colorC[1] + "," + colorC[2] + "," + colorC[3] / 255 + ")"
          area.color = true;
        }
        if (propertiesC.title_stroke_color) {
          var colorC = propertiesC.title_stroke_color;
          area.title_stroke_color = colorC;
        }
        if (propertiesC.lighting !== undefined) {
          area.lighting = propertiesC.lighting;
        }
        if (propertiesC.variables !== undefined){
          area.variables = propertiesC.variables
        }
        if (propertiesC.pattern_amount !== undefined){
          area.pattern_amount = propertiesC.pattern_amount
        }
        if(propertiesC.magnetism) {
          area.magnetism = true;
        }
        if(propertiesC.partial_magnetism) {
          area.partial_magnetism = true;
        }
        if(propertiesC.applies_lantern) {
          area.applies_lantern = true;
        }
        if(propertiesC.pellet_count) {
          area.pellet_count = propertiesC.pellet_count;
        }
      }
      for (var j = 0; j < zones.length; j++) {
        var type = 0;
        if (zones[j].type == "active") {
          type = 0;
        }
        if (zones[j].type == "safe") {
          type = 1;
        }
        if (zones[j].type == "exit") {
          type = 2;
        }
        if (zones[j].type == "teleport") {
          type = 3;
        }
        if (zones[j].type == "victory") {
          type = 4;
        }
        if (zones[j].type == "removal") {
          type = 5;
        }
        var areax = zones[j].x;
        var areay = zones[j].y;
        if (areax.toString().startsWith("last_right")) {
          areax = last_right - areaPosX;
        }
        if (areay.toString().startsWith("last_y")) {
          areay = last_y;
        }
        if (areay.toString().startsWith("last_bottom")) {
          areay = last_y;
        }
        var xPos = areaPosX + areax;
        var yPos = areaPosY + areay;
        var spawner = zones[j].spawner;
        var widthSize = zones[j].width;
        var heightSize = zones[j].height

        if (heightSize.toString().startsWith("last_height")) {
          heightSize = last_height;
        }
        if (widthSize.toString().startsWith("last_width")) {
          widthSize = last_width;
        }
        var block = new Zone(new Vector(xPos / 32 - areaPosX / 32, yPos / 32 - areaPosY / 32), new Vector(widthSize / 32, heightSize / 32), type);
        block.background_color = area.background_color
        if (zones[j].properties!==undefined) {
          if (zones[j].properties.background_color!==undefined) {
            var colorC = zones[j].properties.background_color
            block.color = true;
            block.background_color = "rgba(" + colorC[0] + "," + colorC[1] + "," + colorC[2] + "," + colorC[3] / 255 + ")"
          }
          if(zones[j].properties.minimum_speed!==undefined){
            block.minimum_speed=zones[j].properties.minimum_speed;
          }
        }
        else if(zones.type == 4){
          //block.color = true;
          //block.background_color = "rgb(255,244,108,255)";
        }
        if (zones[j].type == "teleport" || zones[j].type == "exit") {
          block.translate = new Vector(zones[j].translate.x / 32, zones[j].translate.y / 32);
        }

        for (var k in spawner) {
          var values = spawner[k];
          var count = values.count
          if (count==undefined) {
            count = 1;
          }
          var object = {
            type: values.types,
            radius: values.radius,
            speed: values.speed,
            count: count,//Math.round(count*1.15),
            x:values.x,
            y:values.y,
            angle:values.angle
          }

          if(values[object.type+"_radius"] != undefined){
            object.auraRadius = values[object.type+"_radius"];
          }

          if(object.type == "quicksand"){
            object.push_direction = values.push_direction;
          }

          if(object.type == "flower"){
            object.growth_multiplayer = values.growth_multiplayer;
          }

          if(object.type == "wind" || object.type == "wind_ghost"){
            object.ignore_invulnerability = values.ignore_invulnerability;
          }

          if(object.type == "frost_giant"){
            object.angle = values.angle;
            object.direction = values.direction;
            object.turn_speed = values.turn_speed;
            object.shot_interval = values.shot_interval;
            object.cone_angle = values.cone_angle;
            object.pause_interval = values.pause_interval;
            object.pause_duration = values.pause_duration;
            object.turn_acceleration = values.turn_acceleration;
            object.shot_acceleration = values.shot_acceleration;
            object.pattern = values.pattern;
            object.immune = values.immune;
            object.projectile_duration = values.projectile_duration;
            object.projectile_radius = values.projectile_radius;
            object.projectile_speed = values.projectile_speed;
            object.precise_movement = values.precise_movement;
          }
          if (values.move_clockwise!==undefined) {
            object.move_clockwise = values.move_clockwise;
          }
          if (values.horizontal!==undefined) {
            object.horizontal = values.horizontal;
          }
          if (values.pattern_id!==undefined){
            object.pattern_id = values.pattern_id;
          }
          area.preset.push(object);
        }
        area.preset.sort((a,b)=>{return b.radius-a.radius})
        area.zones.push(block);
        last_y = areay;
        last_right = xPos + widthSize;
        last_height = heightSize;
        last_width = widthSize;
      }
      for (var k in assets) {
        var type = 0;
        var texture;
        if (assets[k].type == "wall") {
          type = 1
          if (assets[k].texture=="normal") {
            texture = 0
          }
          if (assets[k].texture=="leaves") {
            texture = 1
          }
          if (assets[k].texture=="wooden") {
            texture = 2
          }
          if (assets[k].texture=="baguette") {
            texture = 3
          }
          if (assets[k].texture=="ice") {
            texture = 4
          }
        }
        if (assets[k].type == "light_region") {
          type = 4;
        }
        if (assets[k].type == "flashlight_spawner") {
          type = 5;
        }
        if (assets[k].type == "torch") {
          type = 6;
        }
        if (assets[k].type == "gate") {
          type = 7;
        }
        if (assets[k].type == "torch"&&assets[k].upside_down) {
          type = 8;
        }
        var areax = assets[k].x;
        var areay = assets[k].y;
        var xPos = areaPosX + areax;
        var yPos = areaPosY + areay;
        var widthSize = assets[k].width;
        var heightSize = assets[k].height;
        var block = new Asset(new Vector(xPos / 32 - areaPosX / 32, yPos / 32 - areaPosY / 32), new Vector(widthSize / 32, heightSize / 32), type);
        if (texture!==undefined) {
          block.texture = texture
        }
        if (type!==0) {
          area.assets.push(block);
        }
      }
      this.areas.push(area);
    }
  }
}
class Area {
  constructor(pos) {
    this.pos = pos;
    this.zones = [];
    this.assets = [];
    this.entities = {};
    this.preset = [];
    this.background_color = "rgba(255,255,255,0)";
    this.name = "undefined";
    this.lighting = 1;
    this.magnetism = false;
  }
  update(time, players, worldPos) {
    var boundary = this.getActiveBoundary();
    var areaBoundary = this.getBoundary();
    //update entities
    for (var i in this.entities) {
      for (var j in this.entities[i]) {
        this.entities[i][j].update(time);
        this.entities[i][j].colide(boundary);
        if(this.entities[i][j].defended){
          if(!this.entities[i][j].curDefend){
            this.entities[i][j].defended = false;
            this.entities[i][j].imune = false;
          }
          this.entities[i][j].curDefend = false;
        }
        for (var v in this.assets) {
          if (this.assets[v].type==1) {
            var rect = {x:this.assets[v].pos.x,y:this.assets[v].pos.y,w:this.assets[v].size.x,h:this.assets[v].size.y,t:false,wall:true}
            this.entities[i][j].colide(rect);
          }}
        if(this.eng == 3){for(var v in this.zones){
          if(this.zones[v].type==1){
            var rect = {x:this.zones[v].pos.x,y:this.zones[v].pos.y,w:this.zones[v].size.x,h:this.zones[v].size.y,t:false,wall:true}
            this.entities[i][j].colide(rect);
          }
        }}
        this.entities[i][j].behavior(time, this, {
          x: this.pos.x + worldPos.x,
          y: this.pos.y + worldPos.y
        }, players)
      }
    }
    //reemove toRemove
    var newEntities = {}
    for (var i in this.entities) {
      newEntities[i] = []
      for (var j in this.entities[i]) {
        if (this.entities[i][j].toRemove) {} else {
          newEntities[i].push(this.entities[i][j]);
        }
      }
    }
    this.entities = newEntities
    //remove weaks one
    var newEntities = {}
    for (var i in this.entities) {
      newEntities[i] = []
      for (var j in this.entities[i]) {
        if(this.entities[i][j].area_collide){boundary = areaBoundary}
        var inside = pointInRectangle(this.entities[i][j].pos, {
          x: boundary.x + this.entities[i][j].radius,
          y: boundary.y + this.entities[i][j].radius
        }, {
          x: boundary.w - this.entities[i][j].radius * 2,
          y: boundary.h - this.entities[i][j].radius * 2
        })
        if (!inside && this.entities[i][j].weak) {} else {
          newEntities[i].push(this.entities[i][j]);
        }
      }
    }
    this.entities = newEntities
    //teleport them inside the area
    for (var i in this.entities) {
      for (var j in this.entities[i]) {
        if (this.entities[i][j].collide && !this.entities[i][j].no_collide) {
          var fixed = closestPointToRectangle(this.entities[i][j].pos, {
            x: boundary.x + this.entities[i][j].radius,
            y: boundary.y + this.entities[i][j].radius
          }, {
            x: boundary.w - this.entities[i][j].radius * 2,
            y: boundary.h - this.entities[i][j].radius * 2
          })
          this.entities[i][j].pos = fixed;
        }
      }
    }
    //colide with players
    for (var i in players) {
      players[i].abilities(time, this, {x: this.pos.x + worldPos.x,y: this.pos.y + worldPos.y})
      for (var j in this.entities) {
        for (var k in this.entities[j]) {
          this.entities[j][k].interact(players[i],{
            x: this.pos.x + worldPos.x,
            y: this.pos.y + worldPos.y
          },time)
        }
      }
    }
  }
  getBoundary() {
    var minx;
    var miny;
    var maxx;
    var maxy;
    for (var i in this.zones) {
      var zone = this.zones[i];
      if (minx == undefined) {
        minx = zone.pos.x;
      }
      if (miny == undefined) {
        miny = zone.pos.y;
      }
      if (maxx == undefined) {
        maxx = zone.pos.x + zone.size.x;
      }
      if (maxy == undefined) {
        maxy = zone.pos.y + zone.size.y;
      }
      if (zone.pos.x < minx) {
        minx = zone.pos.x;
      }
      if (zone.pos.y < miny) {
        miny = zone.pos.y;
      }
      if (zone.pos.x + zone.size.x > maxx) {
        maxx = zone.pos.x + zone.size.x;
      }
      if (zone.pos.y + zone.size.y > maxy) {
        maxy = zone.pos.y + zone.size.y;
      }
    }
    return {
      x: minx,
      y: miny,
      w: maxx - minx,
      h: maxy - miny
    }
  }
  getActiveBoundary() {
    var minx;
    var miny;
    var maxx;
    var maxy;
    var wasv;
    for (var i in this.zones) {
      if(this.zones[i].type == 4){wasv = true}
      if (this.zones[i].type == 0||this.zones[i].type == 4) {
        var zone = this.zones[i];
        if (minx == undefined) {
          minx = zone.pos.x;
        }
        if (miny == undefined) {
          miny = zone.pos.y;
        }
        if (maxx == undefined) {
          maxx = zone.pos.x + zone.size.x;
        }
        if (maxy == undefined) {
          maxy = zone.pos.y + zone.size.y;
        }
        if (zone.pos.x < minx) {
          minx = zone.pos.x;
        }
        if (zone.pos.y < miny) {
          miny = zone.pos.y;
        }
        if (zone.pos.x + zone.size.x > maxx) {
          maxx = zone.pos.x + zone.size.x;
        }
        if (zone.pos.y + zone.size.y > maxy) {
          maxy = zone.pos.y + zone.size.y;
        }
      }
    }
    return {
      x: minx,
      y: miny,
      w: maxx - minx,
      h: maxy - miny,
      t: (wasv) ? true : false
    }
  }
  collisionPlayer(player, worldPos) {
    var boundary = this.getBoundary();
    boundary.x += this.pos.x;
    boundary.y += this.pos.y;
    boundary.x += worldPos.x;
    boundary.y += worldPos.y;
    var fixed = closestPointToRectangle(player.pos, new Vector(boundary.x + player.radius, boundary.y + player.radius), new Vector(boundary.w - player.radius * 2, boundary.h - player.radius * 2));
    if (Math.abs(fixed.x-player.pos.x)+Math.abs(fixed.y-player.pos.y)!==0) {
      player.vel = new Vector(0,0);
      player.collides = true;
    } else {player.collides = false;}
    player.pos.x = fixed.x;
    player.pos.y = fixed.y;
    for (var i in this.assets) {
      if (this.assets[i].type==1) {
        var rectHalfSizeX = this.assets[i].size.x / 2;
        var rectHalfSizeY = this.assets[i].size.y / 2;
        var rectCenterX = this.assets[i].pos.x + this.pos.x + worldPos.x + rectHalfSizeX;
        var rectCenterY = this.assets[i].pos.y + this.pos.y + worldPos.y + rectHalfSizeY;
        var distX = Math.abs(player.pos.x - rectCenterX);
        var distY = Math.abs(player.pos.y - rectCenterY);
        if ((distX < rectHalfSizeX + player.radius) && (distY < rectHalfSizeY + player.radius)) {
          player.collides = true;
          // Collision
          var relX = (player.pos.x - rectCenterX) / rectHalfSizeX;
          var relY = (player.pos.y - rectCenterY) / rectHalfSizeY;
          if (Math.abs(relX) > Math.abs(relY)) {
            // Horizontal collision.
            if (relX > 0) {
              // Right collision
              player.pos.x = rectCenterX + rectHalfSizeX + player.radius;
              player.vel.x = 0;
            } else {
              // Left collision
              player.pos.x = rectCenterX - rectHalfSizeX - player.radius;
              player.vel.x = 0;
            }
          } else {
            // Vertical collision
            if (relY < 0) {
              // Up collision
              player.pos.y = rectCenterY - rectHalfSizeY - player.radius;
              player.vel.y = 0;
            } else {
              // Bottom collision
              player.pos.y = rectCenterY + rectHalfSizeY + player.radius;
              player.vel.y = 0;
            }
          }
        }
      }
    }
  }
  load() {
    this.entities = {}
    var boundary = this.getActiveBoundary();
    var variables = this.variables;
    var currentVariables = [];
    var hashVariables = [];
    for(let i in variables){
      let variable = variables[i].toString();
      let pushableVariable;
      if(variable.includes("#")){
        const id = i;
        const hashId = parseInt(variable.split("#")[1]);
        if(!hashVariables[hashId]){
          hashVariables[hashId] = [];
        }
        if(!hashVariables[hashId][id]){
          hashVariables[hashId][id] = [];
        }

        if(isNaN(this.pattern_amount[hashId])){
          console.error("Pattern-amount is NaN.");
          return;
        }

        for(let j = 0; j<this.pattern_amount[hashId]; j++){
          let xVariable = process_variable(variable);
          xVariable = math_module(variable,xVariable);
          hashVariables[hashId][id].push(xVariable);
        }
      }
      pushableVariable = process_variable(variable);
      pushableVariable = math_module(variable,pushableVariable);
      currentVariables.push(pushableVariable);
    }
    for (var i in this.preset) {
      let pattern_amount = (this.pattern_amount) ? this.pattern_amount.slice() : NaN;
      do {
        if(pattern_amount)pattern_amount[this.preset[i].pattern_id]--;
        if (!this.entities[this.preset[i].type]) {
          this.entities[this.preset[i].type] = []
        }
        var pattern_id = this.preset[i].pattern_id;
        var auraRadius = this.preset[i].auraRadius;
        var count = this.preset[i].count;
        var radius = this.preset[i].radius;
        var speed = this.preset[i].speed;
        var x = this.preset[i].x;
        var y = this.preset[i].y;
        var angle = undefined;
        console.log(this.preset)

        if(typeof this.preset[i].angle === "string" && currentVariables.length>0){
          if(this.preset[i].angle.startsWith("var")){
            angle = (Math.PI * find_variable(this.preset[i].angle,currentVariables,hashVariables,pattern_id,pattern_amount)) / 180;
          }
        } else if(this.preset[i].angle !== undefined) {
          angle = (Math.PI * this.preset[i].angle) / 180;
        }

        if(typeof count === "string" && currentVariables.length>0){
          if(count.startsWith("var")){
            count = find_variable(this.preset[i].count,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if(typeof radius === "string" && currentVariables.length>0){
          if(radius.startsWith("var")){
            radius = find_variable(this.preset[i].radius,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if(typeof speed === "string" && currentVariables.length>0){
          if(speed.startsWith("var")){
            speed = find_variable(this.preset[i].speed,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if(typeof x === "string" && currentVariables.length>0){
          if(x.startsWith("var")){
            x = find_variable(this.preset[i].x,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if(typeof y === "string" && currentVariables.length>0){
          if(y.startsWith("var")){
            y = find_variable(this.preset[i].y,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if(typeof auraRadius === "string" && currentVariables.length>0){
          if(auraRadius.startsWith("var")){
            auraRadius = find_variable(this.preset[i].auraRadius,currentVariables,hashVariables,pattern_id,pattern_amount)
          }
        }

        if (count==undefined) {
          count = 1;
        }

        for (var j = 0; j < count; j++) {
          var posX = Math.random() * (boundary.w-radius / 16) + boundary.x + radius / 32;
          var posY = Math.random() * (boundary.h-radius / 16) + boundary.y + radius / 32;
          if (x!==undefined) {
            var posX = x/32;
          }
          if (y!==undefined) {
            var posY = y/32;
          }

          if(radius<0){radius = 0;}
          var rand = Math.floor(Math.random() * this.preset[i].type.length);
          var enemy = new Unknown(new Vector(posX, posY), radius / 32, speed,angle)
          if (this.preset[i].type[rand] == "normal") {
            enemy = new Normal(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "wall") {
            enemy = new Wall(new Vector(posX, posY), radius / 32, speed, this.getActiveBoundary(), j, count,this.preset[i].move_clockwise)
          }
          if (this.preset[i].type[rand] == "dasher") {
            enemy = new Dasher(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "homing") {
            enemy = new Homing(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "slowing") {
            enemy = new Slowing(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "draining") {
            enemy = new Draining(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "oscillating") {
            enemy = new Oscillating(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "turning") {
            enemy = new Turning(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "liquid") {
            enemy = new Liquid(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "sizing") {
            enemy = new Sizing(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "switch") {
            enemy = new Switch(new Vector(posX, posY), radius / 32, speed, angle, j, count)
          }
          if (this.preset[i].type[rand] == "sniper") {
            enemy = new Sniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "freezing") {
            enemy = new Freezing(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "web") {
            enemy = new Web(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "cobweb") {
            enemy = new Cobweb(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "teleporting") {
            enemy = new Teleporting(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "star") {
            enemy = new Star(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "immune") {
            enemy = new Immune(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "ice_sniper") {
            enemy = new IceSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "disabling") {
            enemy = new Disabling(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "toxic") {
            enemy = new Toxic(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "icicle") {
            enemy = new Icicle(new Vector(posX, posY), radius / 32, speed, angle, this.preset[i].horizontal)
          }
          if (this.preset[i].type[rand] == "spiral") {
            enemy = new Spiral(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "gravity") {
            enemy = new Gravity(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "repelling") {
            enemy = new Repelling(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "gravity_ghost") {
            enemy = new Gravity_Ghost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "repelling_ghost") {
            enemy = new Repelling_Ghost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "wavy") {
            enemy = new Wavy(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "zigzag") {
            enemy = new Zigzag(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "zoning") {
            enemy = new Zoning(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "radiating_bullets") {
            enemy = new Radiating(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "frost_giant") {
            enemy = new FrostGiant(new Vector(posX, posY), radius / 32, (speed) ? speed : 0, angle,this.preset[i].direction,this.preset[i].turn_speed,this.preset[i].shot_interval,this.preset[i].cone_angle,this.preset[i].pause_interval,this.preset[i].pause_duration,this.preset[i].turn_acceleration,this.preset[i].shot_acceleration,this.preset[i].pattern,this.preset[i].immune,this.preset[i].projectile_duration,this.preset[i].projectile_radius,this.preset[i].projectile_speed,this.preset[i].precise_movement)
          }
          if (this.preset[i].type[rand] == "speed_sniper") {
            enemy = new SpeedSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "regen_sniper") {
            enemy = new RegenSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "snowman") {
            enemy = new Snowman(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "slippery") {
            enemy = new Slippery(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "corrosive") {
            enemy = new Corrosive(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "corrosive_sniper") {
            enemy = new CorrosiveSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "enlarging") {
            enemy = new Enlarging(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "poison_sniper") {
            enemy = new PoisonSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "magnetic_reduction") {
            enemy = new MagneticReduction(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "magnetic_nullification") {
            enemy = new MagneticNullification(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "positive_magnetic_sniper") {
            enemy = new PositiveMagneticSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "negative_magnetic_sniper") {
            enemy = new NegativeMagneticSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "tree") {
            enemy = new Tree(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "pumpkin") {
            enemy = new Pumpkin(new Vector(posX, posY), radius / 32, speed)
          }
          if (this.preset[i].type[rand] == "fake_pumpkin") {
            enemy = new FakePumpkin(new Vector(posX, posY), radius / 32)
          }
          if (this.preset[i].type[rand] == "experience_draining") {
            enemy = new ExperienceDraining(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "fire_trail") {
            enemy = new Fire_Trail(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "wind" || this.preset[i].type[rand] == "wind_ghost") {
            enemy = new Wind(new Vector(posX, posY), radius / 32, speed, angle, this.preset[i].ignore_invulnerability)
          }
          if (this.preset[i].type[rand] == "lava") {
            enemy = new Lava(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "burning") {
            enemy = new Burning(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "sticky_sniper") {
            enemy = new StickySniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "ice_ghost") {
            enemy = new Ice(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "positive_magnetic_ghost") {
            enemy = new PositiveMagneticGhost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "negative_magnetic_ghost") {
            enemy = new NegativeMagneticGhost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "poison_ghost") {
            enemy = new Poison_Ghost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "grass") {
            enemy = new Grass(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "defender") {
            enemy = new Defender(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "glowy") {
            enemy = new Glowy(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "firefly") {
            enemy = new Firefly(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "mist") {
            enemy = new Mist(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "phantom") {
            enemy = new Phantom(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "lunging") {
            enemy = new Lunging(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "barrier") {
            enemy = new Barrier(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "quicksand") {
            enemy = new Quicksand(new Vector(posX, posY), radius / 32, speed, angle, auraRadius, this.preset[i].push_direction)
          }
          if (this.preset[i].type[rand] == "radar") {
            enemy = new Radar(new Vector(posX, posY), radius / 32, speed, angle, auraRadius)
          }
          if (this.preset[i].type[rand] == "wind_sniper") {
            enemy = new WindSniper(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "disabling_ghost") {
            enemy = new DisablingGhost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "sand") {
            enemy = new Sand(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "sandrock") {
            enemy = new Sandrock(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "crumbling") {
            enemy = new Crumbling(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "flower") {
            enemy = new Flower(new Vector(posX, posY), radius / 32, speed, angle, this.preset[i].growth_multiplayer)
          }
          if (this.preset[i].type[rand] == "seedling") {
            enemy = new Seedling(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "cactus") {
            enemy = new Cactus(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "speed_ghost") {
            enemy = new SpeedGhost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          if (this.preset[i].type[rand] == "regen_ghost") {
            enemy = new RegenGhost(new Vector(posX, posY), radius / 32, speed, angle)
          }
          enemy.isSpawned = true;
          this.entities[this.preset[i].type].push(enemy)
        }
      } while ((pattern_amount[this.preset[i].pattern_id])>0);
    }
    this.entities["pellet"] = []
    var pelletsAtZone = this.pellet_count;
    if(boundary.t){pelletsAtZone = 200}
    for (var i = 0; i < pelletsAtZone; i++) {
      var posX = Math.random() * boundary.w + boundary.x;
      var posY = Math.random() * boundary.h + boundary.y;
      var pellet = new Pellet(new Vector(posX, posY))
      this.entities["pellet"].push(pellet)
    }
  }
  addEffect(type,pos){
    if(type == 0){
      if(!this.entities["SweetTooth"]){this.entities["SweetTooth"] = []}
      var effect = new SweetTooth(new Vector(pos.x,pos.y))
      this.entities["SweetTooth"].push(effect)
    }
  }
  addSniperBullet(type, pos, angle, radius, speed, duration = 4000, spawner) {
    switch (type) {
      case 0:
        if (!this.entities["SniperProjectile"]) {
          this.entities["SniperProjectile"] = [];
        }
        var bullet = new SniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["SniperProjectile"].push(bullet);
        break;
      case 1:
        if (!this.entities["IceSniperProjectile"]) {
          this.entities["IceSniperProjectile"] = [];
        }
        var bullet = new IceSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["IceSniperProjectile"].push(bullet);
        break;
      case 2:
        if (!this.entities["RadiatingProjectile"]) {
          this.entities["RadiatingProjectile"] = [];
        }
        var bullet = new RadiatingBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["RadiatingProjectile"].push(bullet);
        break;
      case 3:
        if (!this.entities["SpeedProjectile"]) {
          this.entities["SpeedProjectile"] = [];
        }
        var bullet = new SpeedSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["SpeedProjectile"].push(bullet);
        break;
      case 4:
        if (!this.entities["RegenProjectile"]) {
          this.entities["RegenProjectile"] = [];
        }
        var bullet = new RegenSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["RegenProjectile"].push(bullet);
        break;
      case 5:
        if (!this.entities["CorrosiveSniperProjectile"]) {
          this.entities["CorrosiveSniperProjectile"] = [];
        }
        var bullet = new CorrosiveSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["CorrosiveSniperProjectile"].push(bullet);
        break;
      case 6:
        if (!this.entities["PoisonSniperProjectile"]) {
          this.entities["PoisonSniperProjectile"] = [];
        }
        var bullet = new PoisonSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["PoisonSniperProjectile"].push(bullet);
        break;
      case 7:
        if (!this.entities["PositiveMagneticSniperProjectile"]) {
          this.entities["PositiveMagneticSniperProjectile"] = [];
        }
        var bullet = new PositiveMagneticSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["PositiveMagneticSniperProjectile"].push(bullet);
        break;
      case 8:
        if (!this.entities["NegativeMagneticSniperProjectile"]) {
          this.entities["NegativeMagneticSniperProjectile"] = [];
        }
        var bullet = new NegativeMagneticSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["NegativeMagneticSniperProjectile"].push(bullet);
        break;
      case 9:
        if (!this.entities["frost_giant_ice_projectile"]) {
          this.entities["frost_giant_ice_projectile"] = [];
        }
        var bullet = new frost_giant_ice_bullet(new Vector(pos.x,pos.y), angle, radius, speed, duration);
        this.entities["frost_giant_ice_projectile"].push(bullet);
        break;
      case 10:
        if (!this.entities["leaf_projectile"]) {
          this.entities["leaf_projectile"] = [];
        }
        var bullet = new leaf_projectile(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["leaf_projectile"].push(bullet);
        break;
      case 11:
        if (!this.entities["sticky_projectile"]) {
          this.entities["sticky_projectile"] = [];
        }
        var bullet = new StickySniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["sticky_projectile"].push(bullet);
        break;
      case 12:
        if (!this.entities["radar_projectile"]) {
          this.entities["radar_projectile"] = [];
        }
        var bullet = new RadarBullet(new Vector(pos.x,pos.y), angle, radius, speed, duration, spawner);
        this.entities["radar_projectile"].push(bullet);
        break;
      case 13:
        if (!this.entities["WindSniperProjectile"]) {
          this.entities["WindSniperProjectile"] = [];
        }
        var bullet = new WindSniperBullet(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["WindSniperProjectile"].push(bullet);
        break;
      case 14:
        if (!this.entities["Residue"]) {
          this.entities["Residue"] = [];
        }
        var bullet = new Residue(new Vector(pos.x,pos.y), angle, radius, speed);
        this.entities["Residue"].push(bullet);
        break;
    }
  }
  addEntity(entityName,entity){
    if (this.entities[entityName]==undefined) {
      this.entities[entityName] = []
    }
    this.entities[entityName].push(entity);
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
