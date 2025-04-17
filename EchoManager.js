class EchoManager{
	constructor(region,properties_class,hard=false){
		this.region=region
		this.properties_class=properties_class;
		this.loaded_area_indexes=[true];
		this.hard=hard;
	}
	create_areas(map_new_areas,index){
		let new_areas = this.check_index(index)
		for(let new_area in new_areas){
			map_new_areas.push(new_area)
		}
	}
	check_index(index){
		let result=[];
		function _check_index(index){
			if(!this.loaded_area_indexes[index]){
				this.loaded_area_indexes[index]=true;
				result.push(this.generate_area(index))
			}
		}
		_check_index=_check_index.bind(this);
		if(index>0)_check_index(index-1);
		_check_index(index);
		_check_index(index+1);
		return result;
	}
	generate_area(index){
		let area_x_position = (!this.hard?(3200*index):(-3200*index)),
		area_y_position=0,area_width=3200,area_height=480,
		//area_bounding_box=Rectangle(area_x_position,area_y_position,area_width,area_height),
		zone_dicts;
		if(index%40==0){ // Check victory area
			zone_dicts=[
				{x:0,width:64,type:"exit",translate:{x:-160,y:0}},
				{x:64,width:3072,type:"victory"},
				{x:3136,width:64,type:"exit",translate:{x:160,y:0}},
			]
		}else{
			zone_dicts=[
				{x:0,width:64,type:"exit",translate:{x:-160,y:0}},
				{x:64,width:256,type:"safe"},
				{x:320,width:2560,type:"active"},
				{x:2880,width:256,type:"safe"},
				{x:3136,width:64,type:"exit",translate:{x:160,y:0}},
			]
		}
		//if(this.hard)zone_dicts.reverse(); if this was uncommented, it may cause impossiblity to go to the new area.
		let zones=[];
		for(let zone_dict of zone_dicts){
			let zone_definition={
				x:zone_dict.x,
				y:zone_dict.y??0,
				width:zone_dict.width,
				height:zone_dict.height??480,
				type:zone_dict.type,
				translate:zone_dict.translate,
				spawner:[],
			}
			var zone=new Zone(
				new Vector(zone_definition.x/32,zone_definition.y/32),
				new Vector(zone_definition.width/32,zone_definition.height/32),
				zoneTypeToId(zone_definition.type),
			)
			if(zone_definition.type=="exit"||zone_definition.type=="teleport"){
				zone.translate=new Vector(zone_definition.translate.x/32,zone_definition.translate.y/32);
			}
			//zone_properties.override(zone_dicts.properties??{});
			zones.push(zone)
		}
		var new_area=new Area(new Vector(area_x_position/32,area_y_position/32));
		var regionColor=game.worlds.filter(e=>e.name=="Endless Echo"+(this.hard?" Hard":""))[0].background_color
		zones.map(e=>(e.background_color=regionColor,e.color=true));
		new_area.index=index;
		new_area.pellet_count=25;
		new_area.name=`Area ${index+1}`;
		new_area.zones=[...zones];
		game.worlds.filter(e=>e.name=="Endless Echo"+(this.hard?" Hard":""))[0].areas[index]=new_area;
	}
}
function choose(array,rng){
	return array[Math.floor(rng()*array.length)];
}
class RandomEnemyGenerator{
	constructor(area,hard=false){
		area.index??=0;
		this.area=area;
		this.area_index=area.index;
		this.hard=hard;
		this.normal_enemy_types=[];
		this.aura_enemy_types=[];
		this.sniper_enemy_types=[];
		this.minor_enemy_types=[];
		this.boss_enemy_types=[];
		this.ghost_enemy_types=[];
		this.enemy_classes={};
		this.possible_group_counts=[];
		this.area_styles=[];
		this.ghost_type_compensation_coeffs={
			wind_ghost:1,
			ice_ghost:0.5,
			poison_ghost:1,
			gravity_ghost:0.75,
			repelling_ghost:1,
			disabling_ghost:1,
			speed_ghost:0.5,
			regen_ghost:0.5,
			positive_magnetic_ghost:1,
			negative_magnetic_ghost:1,
		}
		this.generate_random_enemy_types(this.area_index);
		this.generate_possible_group_counts(this.area_index);
		this.generate_area_styles(this.area_index);
	}
	generate_random_enemies(area_index,zone,get_new_id,generate_enemies,generate_wall_enemies,entity_config_class){
		let area_style=choose(this.area_styles,Math.random);
		if(this.area.getActiveBoundary().t)return;//Return if the area is the victory area.
		this.area.preset=[];
		if(area_style=="normal"){
			let group_count=choose(this.possible_group_counts,Math.random);
			if(area_index > 199){
				this.area.preset.push(this.generate_ghost_group(area_index,entity_config_class));
			}
			for(let i in new Array(group_count).fill(0)){
				for(let group of this.generate_group(
					area_index,
					group_count,
					this.normal_enemy_types,
					entity_config_class,
					1*this.early_area_count_control_function(area_index),
				)){
					this.area.preset.push(group)
				}
			}
		}else if(area_style=="aura"){
			for(let group of this.generate_group(
				area_index,
				2,
				this.aura_enemy_types,
				entity_config_class,
				/*count*/1,/*radius*/0.5,/*speed*/0.25
				
			)){
					this.area.preset.push(group)
			}
			
			for(let group of this.generate_group(
				area_index,
				2,
				this.normal_enemy_types,
				entity_config_class
			)){
					this.area.preset.push(group)
			}
		}else if(area_style=="sniper"){
			for(let group of this.generate_group(
				area_index,
				1,
				this.sniper_enemy_types,
				entity_config_class,
				/*count*/0.8,/*radius*/1.5,/*speed*/0.25
				
			)){
					this.area.preset.push(group)
			}
		}else if(area_style=="boss"){
			let enemy_type=choose(this.boss_enemy_types,Math.random),
			enemy_class=this.enemy_classes[enemy_type],
			boss_speed=0;
			if(enemy_type!="cactus")boss_speed=this.boss_speed_function(area_index);
			this.area.preset.push({type:[enemy_type],count:4,radius:30*this.boss_radius_multiplier_function(area_index),speed:boss_speed})
			for(let group of this.generate_group(
				area_index,
				1,
				this.minor_enemy_types,
				entity_config_class
			)){
					this.area.preset.push(group)
			}
		}else if(area_style=="size"){
			let group_count=choose(this.possible_group_counts,Math.random);
			if(area_index > 199){
				this.area.preset.push(this.generate_ghost_group(area_index,entity_config_class));
			}
			for(let i in new Array(group_count).fill(0)){
				for(let group of this.generate_group(
					area_index,
					group_count,
					this.normal_enemy_types,
					entity_config_class,
					1.6+this.size_style_function(area_index),
					0.7,
				)){
					this.area.preset.push(group)
				}
			}
		}else if(area_style=="speed"){
			let group_count=choose(this.possible_group_counts,Math.random);
			if(area_index > 199){
				this.area.preset.push(this.generate_ghost_group(area_index,entity_config_class));
			}
			for(let i in new Array(group_count).fill(0)){
				for(let group of this.generate_group(
					area_index,
					group_count,
					this.normal_enemy_types,
					entity_config_class,
					0.6,
					2,
				)){
					this.area.preset.push(group)
				}
			}
		}else if(area_style=="cycling"){
			let group_count=choose([1,2,3,4,5,6,7,8,9,10],Math.random);
			for(let i in new Array(group_count).fill(0)){
				for(let group of this.generate_group(
					area_index,group_count,["cycling"],entity_config_class,
				)){
					this.area.preset.push(group)
				}
			}
		}
		if(area_index > 1)
			this.area.preset.push({type:["wall"],count:6,speed:Math.min(2/3*(6+(1+area_index/40)*Math.sin(area_index/3)+area_index/20),26),radius:30})
	}
	generate_group(area_index,group_count,enemy_types,entity_config_class,count_multiplier,radius_multiplier,speed_multiplier){
		let group_data=this.generate_random_group(area_index,group_count,enemy_types,count_multiplier,radius_multiplier,speed_multiplier);
		let groups=[],gd={...group_data};
		//Use sandbox spawner preset
		groups.push({type:gd.enemy_type,count:gd.count,radius:gd.radius,speed:gd.speed})
		if(gd.extra_normal_enemy_count > 0){
			groups.push({type:["normal"],count:gd.extra_normal_enemy_count,radius:gd.radius,speed:gd.speed})
		}
		return groups;		
	}
	generate_ghost_group(area_index,entity_config_class){
		let enemy_type=choose(this.ghost_enemy_types,Math.random),
		ghost_type_compensation_coeff=this.ghost_type_compensation_coeffs[enemy_type]
		return {
			type:[enemy_type],
			count:12,//count?
			radius:Math.min(((area_index-200)/8)+5,80)*ghost_type_compensation_coeff,//radius
			speed:Math.min(((area_index-200)/24)*5,30)*ghost_type_compensation_coeff//speed
    }
	}
	speed_function(x){
		if(this.hard&&x>20&&(this.area.magnetism||this.area.partial_magnetism))
			return 0.5*2/3*Math.log2(x**2+1)+x/40+2;
		return 2/3*Math.log2(x**2+1)+x/40+2;
	}
	count_function(x){
		if(this.hard&&(this.area.magnetism||this.area.partial_magnetism))
			return 0.5*Math.log2(x+1)*3/2+x/8+1;
		return Math.log2(x+1)*3/2+x/8+1;
	}
	radius_function(x){
		return Math.log2(x+1)*2/3+x/8+1+this.hard;
	}
	size_style_function(x){
		return (Math.min(1+((x-60)/100),3)/5)-0.2;
	}
	boss_speed_function(x){
		return Math.min(4+((x+1)/45),12);
	}
	boss_radius_multiplier_function(x){
		return Math.min(1+((x+1)/150),3)
	}
	early_area_count_control_function(x){
		return Math.min(0.5*((x/10)+1),1)
	}
	generate_random_group(area_index,group_count,enemy_types,count_multiplier,radius_multiplier,speed_multiplier){
		const speed_constant=2,count_constant=10,radius_constant=6;
		let difficulty=(area_index+1)/40,
		speed_ratio=this.speed_function(difficulty),
		count_distribution=Math.random()/4,
		radius_distribution=Math.random()/4,
		speed_distribution=1-count_distribution-radius_distribution,
		count_ratio=this.count_function(speed_ratio*count_distribution),
		radius_ratio=this.radius_function(speed_ratio*speed_distribution);
		speed_ratio*=speed_distribution;
		let speed_output=speed_ratio*speed_constant,
		count_output=count_ratio*count_constant,
		radius_output=radius_ratio*radius_constant;
		count_output/=group_count;
		const deviation=0.1*((area_index+1)%10);
		radius_output*=1+deviation;
		speed_output/=0.5+deviation;
		let enemy_type=choose(enemy_types,Math.random),
		enemy_class=this.enemy_classes[enemy_type];
		let extra_normal_enemy_count;
		[count_output,radius_output,speed_output,extra_normal_enemy_count]=this.apply_type_compensations(
			enemy_type,count_output,radius_output,speed_output
		)
		if(count_multiplier!=void 0)
			count_output*=count_multiplier;
		if(radius_multiplier!=void 0)
			radius_output*=radius_multiplier;
		if(speed_multiplier!=void 0)
			speed_output*=speed_multiplier;
		if(radius_output>180)
			radius_output=180;
		else if(enemy_type=="sizing"&&radius_output>83)
			radius_output=83;
		else if(enemy_type=="seedling"&&radius_output>90)
			radius_output=90;
		else if(enemy_type=="flower"&&radius_output>100)
			radius_output=100;
		//speed_output*=30;
		return {
			enemy_type:[enemy_type],
			enemy_class:[enemy_class],
			count:Math.floor(count_output),
			speed:speed_output,
			radius:Math.floor(radius_output),
			extra_normal_enemy_count
		}
	}
	apply_type_compensations(enemy_type,count_output,radius_output,speed_output){
		let extra_normal_enemy_count=0;
		if(this.sniper_enemy_types.indexOf(enemy_type)!=-1)
			speed_output/=2;
		else if(enemy_type=="liquid")speed_output/=5;
		else if(enemy_type=="snowman")radius_output=Math.floor(radius_output/2);
		else if(enemy_type=="seedling")
			radius_output=Math.floor(radius_output/1.5),
			speed_output=Math.floor(speed_output/1.5);
		else if(enemy_type=="cactus")
			speed_output=0;
		else if(
			enemy_type=="wavy"
			||enemy_type=="zigzag"
			||enemy_type=="zoning"
			||enemy_type=="oscillating"
			||enemy_type=="sand"
		)
			speed_output*=.5;
		else if(enemy_type=="teleporting"||enemy_type=="star")
			speed_output*=8;
		else if(enemy_type=="switch")
			count_output*=2;
		else if(enemy_type=="grass")
			count_output*=3;
		else if(enemy_type=="slippery")
			extra_normal_enemy_count = count_output - Math.floor(count_output/4),
			count_output=Math.floor(count_output/4);
		else if(
			enemy_type=="fire_trail"
			||enemy_type=="gravity"
			||enemy_type=="ice_sniper"
		)
			extra_normal_enemy_count = count_output - Math.floor(count_output/3),
			count_output=Math.floor(count_output/3);
		else if(
			enemy_type=="radiating_bullets"
			||enemy_type=="freezing"
			||enemy_type=="tree"
			||enemy_type=="radar"
		)
			extra_normal_enemy_count = count_output - Math.floor(count_output/2),
			count_output=Math.floor(count_output/2);
		else if(enemy_type=="repelling"||enemy_type=="quicksand")
			extra_normal_enemy_count = count_output - Math.floor(count_output/1.5),
			count_output=Math.floor(count_output/1.5);
		if(this.hard)
			count_output*=1.05,
			radius_output*=1.15,
			speed_output*=1.1,
			extra_normal_enemy_count = Math.floor(extra_normal_enemy_count * 1.5)
		return [count_output,radius_output,speed_output,extra_normal_enemy_count]
	}
	enemy_type_offset_handler(area_index){
		if(this.hard)return Math.max(Math.ceil(area_index*0.8-10),0)
		return area_index;
	}
	generate_random_enemy_types(area_index){
		let new_types=["normal","dasher","slowing","draining"],
		//new_classes=[NormalEnemy,DasherEnemy,SlowingEnemy,DrainingEnemy],
		new_classes=[],
		all_new_types=[...new_types],
		all_new_classes=[...new_classes];
		this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
		this.aura_enemy_types=[...this.aura_enemy_types,...["slowing","draining"]];
		this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
		this.boss_enemy_types=[...this.boss_enemy_types,...["normal","dasher"]];
		if(area_index>=this.enemy_type_offset_handler(10)){
			new_types=["sizing","turning","liquid","icicle","homing"]
			//new_classes=[SizingEnemy,TurningEnemy,LiquidEnemy,HomingEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
			this.boss_enemy_types=[...this.boss_enemy_types,...["turning","icicle","homing"]];
		}
		if(area_index>=this.enemy_type_offset_handler(20)){
			new_types=["pumpkin","disabling","snowman"]
			//new_classes=[PumpkinEnemy,DisablingEnemy,SnowmanEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.aura_enemy_types=[...this.aura_enemy_types,...["disabling"]];
			this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
			this.boss_enemy_types=[...this.boss_enemy_types,...["pumpkin"]];
		}
		if(area_index>=this.enemy_type_offset_handler(30)){
			new_types=["teleporting","fire_trail","grass","flower"]
			//new_classes=[TeleportingEnemy,FireTrailEnemy,GrassEnemy,FlowerEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.minor_enemy_types=[...this.minor_enemy_types,...["grass","teleporting"]];
		}
		if(area_index>=this.enemy_type_offset_handler(40)){
			new_types=["corrosive","toxic","enlarging","lunging"]
			//new_classes=[CorrosiveEnemy,ToxicEnemy,EnlargingEnemy,LungingEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.aura_enemy_types=[...this.aura_enemy_types,...["toxic","enlarging"]];
			this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
			this.boss_enemy_types=[...this.boss_enemy_types,...["corrosive","lunging"]];
		}
		if(area_index>=this.enemy_type_offset_handler(50)){
			new_types=["freezing","slippery","switch","radar"]
			//new_classes=[FreezingEnemy,SlipperyEnemy,SwitchEnemy,RadarEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.aura_enemy_types=[...this.minor_enemy_types,...["radar"]];
		}
		if(area_index>=this.enemy_type_offset_handler(60)){
			new_types=["wavy","zigzag","spiral","zoning","oscillating"]
			//new_classes=[WavyEnemy,ZigzagEnemy,SpiralEnemy,ZoningEnemy,OscillatingEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
			this.boss_enemy_types=[...this.boss_enemy_types,...new_types];
		}
		if(area_index>=this.enemy_type_offset_handler(70)){
			new_types=["gravity","repelling","immune","seedling"]
			//new_classes=[GravityEnemy,RepellingEnemy,ImmuneEnemy,SeedlingEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.aura_enemy_types=[...this.aura_enemy_types,...["gravity","repelling"]];
			this.minor_enemy_types=[...this.minor_enemy_types,...["gravity","immune","immune"]];
			this.boss_enemy_types=[...this.boss_enemy_types,...["immune"]];
		}
		if(area_index>=this.enemy_type_offset_handler(80)){
			new_types=["sniper","corrosive_sniper","tree","ice_sniper","poison_sniper"]
			//new_classes=[SniperEnemy,CorrosiveSniperEnemy,TreeEnemy,IceSniperEnemy,PoisonSniperEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.sniper_enemy_types=[...this.sniper_enemy_types,...["sniper","corrosive_sniper","poison_sniper"]];
			this.boss_enemy_types=[...this.boss_enemy_types,...["sniper","corrosive_sniper","poison_sniper"]];
		}
		if(area_index>=this.enemy_type_offset_handler(90)){
			new_types=["crumbling","quicksand","sand","sandrock","wind_sniper"]
			//new_classes=[CrumblingEnemy,QuicksandEnemy,SandEnemy,SandrockEnemy,WindSniperEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.aura_enemy_types=[...this.aura_enemy_types,...["quicksand"]];
			this.sniper_enemy_types=[...this.sniper_enemy_types,...["wind_sniper"]];
			this.boss_enemy_types=[...this.boss_enemy_types,...["crumbling","sand","sandrock","wind_sniper"]];
		}
		if(area_index>=this.enemy_type_offset_handler(100)){
			new_types=["radiating_bullets","speed_sniper","regen_sniper","star"]
			//new_classes=[RadiatingBulletsEnemy,SpeedSniperEnemy,RegenSniperEnemy,StarEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.sniper_enemy_types=[...this.sniper_enemy_types,...["speed_sniper","regen_sniper"]];
			this.boss_enemy_types=[...this.boss_enemy_types,...["speed_sniper","regen_sniper","star"]];
		}
		if(area_index>=this.enemy_type_offset_handler(110)){
			new_types=["mist"]
			//new_classes=[MistEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...new_types];
			this.minor_enemy_types=[...this.minor_enemy_types,...new_types];
		}
		if(area_index>=this.enemy_type_offset_handler(200)){
			new_types=["wind_ghost","poison_ghost","repelling_ghost","disabling_ghost"]
			//new_classes=[WindGhostEnemy,PoisonGhostEnemy,RepellingGhostEnemy,DisablingGhostEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.ghost_enemy_types=[...this.ghost_enemy_types,...new_types];
		}
		if(area_index>=this.enemy_type_offset_handler(240)){
			new_types=["cactus","cycling"]
			//new_classes=[CactusEnemy,CyclingEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.normal_enemy_types=[...this.normal_enemy_types,...["cactus"]];
		}
		if(area_index>=this.enemy_type_offset_handler(280)){
			new_types=["ice_ghost","gravity_ghost","speed_ghost","regen_ghost"]
			//new_classes=[IceGhostEnemy,GravityGhostEnemy,SpeedGhostEnemy,RegenGhostEnemy]
			all_new_types=[...all_new_types,...new_types];
			all_new_classes=[...all_new_classes,...new_classes];
			this.ghost_enemy_types=[...this.ghost_enemy_types,...new_types];
		}
		if(this.hard){
			if(area_index>=600){
				this.boss_enemy_types=[...this.boss_enemy_types,...["cactus"]];
			}
		}
		for(let i in all_new_types){
			this.enemy_classes[all_new_types[i]]=all_new_classes[i];
		}
	}
	generate_possible_group_counts(area_index){
		this.possible_group_counts=[1,2];
		if(area_index>=10)
			this.possible_group_counts=[...this.possible_group_counts,...[1,1,2,2,3,3]];
		if(area_index>=20)
			this.possible_group_counts=[...this.possible_group_counts,...[1,2,3,4]];
		if(area_index>=40)
			this.possible_group_counts=[...this.possible_group_counts,...[5,6]];
		if(area_index>=80)
			this.possible_group_counts=[...this.possible_group_counts,...[1,2,3,4,5,6,7,8,9,10]],
			this.possible_group_counts=this.possible_group_counts.filter(e=>{
				return e != 1;
			});
		if(area_index>=160)
			this.possible_group_counts=this.possible_group_counts.filter(e=>{
				return e != 2;
			});
		if(area_index>=240)
			this.possible_group_counts=this.possible_group_counts.filter(e=>{
				return e != 3;
			});
		if(area_index>=320)
			this.possible_group_counts=this.possible_group_counts.filter(e=>{
				return e != 4;
			});
	}
	generate_area_styles(area_index){
		this.area_styles=["normal"];
		if((area_index+1)%10==0)this.area_styles=["boss"];
		else{
			if(area_index>=20)
				this.area_styles=["aura","normal","normal","normal"];
			if(area_index>=60)
				this.area_styles=["size","speed","aura","aura","normal","normal","normal","normal"];
			if(area_index>=80)
				this.area_styles=["sniper","size","speed","aura","aura","normal","normal","normal","normal"];
			if(area_index>=200)
				this.area_styles=["size","speed","aura","normal","normal","normal"];
			if(area_index>=240)
				this.area_styles=["cycling","size","size","aura","aura","normal","normal","normal","normal","normal","normal"];
		}
	}
}

function GenerateEnemiesOnLoad(player)
{
    // Generate random enemies on load
    this.echoManagers[this.worlds[player.world].name.endsWith("Hard")?"hard":"normal"].create_areas([],player.area);
    new RandomEnemyGenerator(this.worlds[player.world].areas[player.area],this.worlds[player.world].name.endsWith("Hard")).generate_random_enemies(player.area);
}