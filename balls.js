var ParticleRadius = 0.18;
var WorldGravity = 15;
var resolution = 2.2;
var scale = 60000/Math.min(window.innerWidth,window.innerHeight);
scale/=10;
var mouse = new Vec2();
var clock = new Clock();
var down = false;
clock.add('t1',2);
b2PolygonShape.prototype.draw = function(t){
	t.beginShape();
	for (var k = this.vertices.length - 1; k >= 0; k--) {
		var t2 = this.vertices[k];
		t.vertex(t2);
	}
	t.vertex(this.vertices[this.vertices.length-1]);
	t.endShape();
}
b2ChainShape.prototype.draw = function(t) {
	tool.noFill();
	t.strokeWeight(Math.max(this.radius,1)/scale);
	t.beginShape();
	for (var k = this.vertices.length - 1; k >= 0; k--) {
		var t2 = this.vertices[k];
		t.vertex(t2);
	}
	t.endShape();
};
b2EdgeShape.prototype.draw = function(t) {
	t.beginShape();
	t.strokeWeight(0.1);
	for (var k = 0; k < 4; k++) {
		var t2 = eval('this.vertex'+k);
		t.vertex(t2);
	}
	t.vertex(this.vertex0);
	t.endShape();
};
b2CircleShape.prototype.draw = function(t){
	t.ellipse(this.position.x,this.position.y,this.radius,this.radius);
	t.line(this.position.x,this.position.y,this.position.x+this.radius,this.position.y)
}
b2PolygonShape.prototype.draw = function(t){
	t.beginShape();
	for (var k = this.vertices.length - 1; k >= 0; k--) {
		var t2 = this.vertices[k];
		t.vertex(t2);
	}
	t.vertex(this.vertices[this.vertices.length-1]);
	t.endShape();
}
b2ParticleSystem.prototype.draw = function(t) {
	var particles = this.GetPositionBuffer();
	var color = this.GetColorBuffer();
	for (var i = 0, c = 0; i < particles.length; i += 2, c += 4) {
		t.fill(color[c],color[c+1],color[c+2],color[c+3]);
		t.ellipse(particles[i],particles[i+1],this.radius,this.radius);
	}
};
b2World.prototype.CreateBox = function(def) {
	var fd = new b2FixtureDef();
	var bd = new b2BodyDef();
	var box = new b2Box();
	bd.type = b2_dynamicBody;
	fd.friction = def.friction;
	fd.density = def.density;
	fd.restitution = def.restitution;
	bd.position = def.position;
	bd.angle = def.angle;
	var body = this.CreateBody(bd);
	var shape = new b2PolygonShape();
	shape.SetAsBoxXYCenterAngle(def.length,def.thickness,new b2Vec2(0,-def.thickness),0);
	fd.shape = shape;
	body.CreateFixtureFromDef(fd);
	var shape = new b2PolygonShape();
	shape.SetAsBoxXYCenterAngle(def.thickness,def.height,new b2Vec2(-def.length,-def.thickness-def.height),0);
	fd.shape = shape;
	body.CreateFixtureFromDef(fd);
	var shape = new b2PolygonShape();
	shape.SetAsBoxXYCenterAngle(def.thickness,def.height,new b2Vec2(def.length,-def.thickness-def.height),0);
	fd.shape = shape;
	body.CreateFixtureFromDef(fd);

	var body1 = this.CreateBody(bd);
	var shape = new b2CircleShape();
	shape.radius = def.wheelSize;
	fd.shape = shape;
	body1.CreateFixtureFromDef(fd);

	var body2 = this.CreateBody(bd);
	var shape = new b2CircleShape();
	shape.radius = def.wheelSize;
	fd.shape = shape;
	body2.CreateFixtureFromDef(fd);

	var jd = new b2WheelJointDef();
	jd.collideConnected = true;
	jd.enableMotor = true;
	jd.maxMotorTorque = Infinity;
	jd.bodyA = body;
	jd.bodyB = body1;
	jd.localAnchorA.Set(3.5/4*-def.length,def.wheelSize);
	box.joint1 = this.CreateJoint(jd);
	jd.bodyB = body2;
	jd.localAnchorA.Set(3.5/4*def.length,def.wheelSize);
	box.joint2 = this.CreateJoint(jd);
	box.body = body;
	box.wheel1 = body1;
	box.wheel2 = body2;
	box.setFrequency(20);
	return box;
};
function b2Box(){}
Object.assign(b2Box.prototype, {
	setSpeed: function(s){
		this.joint1.SetMotorSpeed(s);
		this.joint2.SetMotorSpeed(s);
	},
	setFrequency: function(hz){
		this.joint1.SetSpringFrequencyHz(hz);
		this.joint2.SetSpringFrequencyHz(hz);
	}
});
function b2BoxDef(size){
	size = size != undefined ? size : 1;
	this.length = 2.5*size;
	this.height = size;
	this.thickness = 0.08*size;
	this.friction = 5;
	this.restitution = 0;
	this.density = 2;
	this.angle = 0;
	this.wheelSize = 1/2*size;
	this.position = new b2Vec2();
}
function ArrowDef(size){
	size = size != undefined ? size : 1;
	this.length = 2.5*size;
	this.width = size;
	this.friction = 1;
	this.restitution = 0;
	this.density = 2;
	this.angle = 0;
	this.velocity = 3;
	this.position = new b2Vec2();
}
function ShooterDef(){
}
var world = new b2World(new b2Vec2(0,WorldGravity));
var shape, body;
var tool;
var c1 = document.getElementById('main');
var ww = window.innerWidth*resolution, hh = window.innerHeight*resolution;
function init(){
	c1.width = ww, c1.height = hh;
	c1.style.width = ww/resolution+"px", c1.style.height = hh/resolution+"px";
	tool = new Draw(c1);
	tool.scl = scale;
	tool.center.set(ww/2,hh/2);
}
var psd = new b2ParticleSystemDef();
var pgd = new b2ParticleGroupDef();
pgd.color.Set(0,0,255,56);
psd.radius = ParticleRadius;
var ps1 = world.CreateParticleSystem(psd);

function addGroup(shape,f){
	pgd.shape = shape;
	if(f)f(pgd);
	ps1.CreateParticleGroup(pgd);
}
function addCircularGroup(x=0,y=0,r=100/scale,f){
	var circle = new b2CircleShape();
	circle.position.Set(x,y);
	circle.radius = r;
	pgd.shape = circle;
	if(f)f(pgd);
	ps1.CreateParticleGroup(pgd);
}
init();
var fd = new b2FixtureDef();
var bd = new b2BodyDef();
var ground = world.CreateBody(bd);
bd.type = b2_dynamicBody;
function addChainShape(v,r){
	shape = new b2ChainShape();
	shape.vertices = v;
	shape.radius = r != undefined ? r : 1/scale;
	fd.shape = shape;
	ground.CreateFixtureFromDef(fd);
}
function addBody(v,f,d,c){
	shape = new b2PolygonShape();
	shape.vertices = v;
	fd.shape = shape;
	fd.density = d == undefined ? 1 : d;
	fd.friction = f == undefined ? 0.2 : f;
	fd.restitution = c == undefined ? 0.05 : c;
	body = world.CreateBody(bd);
	body.CreateFixtureFromDef(fd);
}
function addRectBody(x=0,y=0,f,d,w=60/scale,h=60/scale,a=0,c){
	shape = new b2PolygonShape();
	shape.SetAsBoxXYCenterAngle(w,h,new b2Vec2(x,y),a);
	fd.shape = shape;
	fd.density = d == undefined ? 1 : d;
	fd.friction = f == undefined ? 0.2 : f;
	fd.restitution = c == undefined ? 0.05 : c;
	body = world.CreateBody(bd);
	body.CreateFixtureFromDef(fd);
	return body;
}
function addCircularBody(x=0,y=0,f,d,r=100/scale,a=0,c){
	shape = new b2CircleShape();
	shape.position.Set(x,y);
	shape.radius = r;
	fd.shape = shape;
	fd.density = d == undefined ? 1 : d;
	fd.friction = f == undefined ? 0.2 : f;
	fd.restitution = c == undefined ? 0.05 : c;
	body = world.CreateBody(bd);
	body.CreateFixtureFromDef(fd);
}
function getMouse(event){
	var x = (event.offsetX*resolution-tool.center.x)/tool.scl-tool.pos.x;
	var y = (event.offsetY*resolution-tool.center.y)/tool.scl-tool.pos.y;
	return new Vec2(x,y);
}
addChainShape([new b2Vec2(-10,-10),new b2Vec2(0,0),new b2Vec2(40,-10),new b2Vec2(60,-25),new b2Vec2(120,-25),new b2Vec2(200,0),]);
window.addEventListener('mousedown',function(event){
	mouse = getMouse(event);
	down = true;
},false);
window.addEventListener('mousemove',function(event){
	var p = getMouse(event);
	if(down){
		var d = mouse.clone().sub(p);
		tool.pos.sub(d);
	}
	p = getMouse(event);
	mouse = p;
},false);
window.addEventListener('mouseup',function(event){
	down = false;
},false);
function Step(){
	world.Step(1/60,8,3);
}
function draw(){
	var bodies = world.bodies;
	tool.noFill();
	tool.stroke();
	for (var i = bodies.length - 1; i >= 0; i--) {
		tool.strokeWeight(1/scale);
		var fixtures = bodies[i].fixtures;
		var t = bodies[i].GetTransform();
		var a1 = new b2Vec2(), a2 = new b2Vec2();
		var a = Math.atan2(t.q.s,t.q.c);
		tool.translate(t.p);
		tool.rotate(a);
		for (var j = fixtures.length - 1; j >= 0; j--) {
			var shape = fixtures[j].shape;
			if(shape.draw) shape.draw(tool);
		}
		tool.pop();
	}
	tool.noStroke();
	for (var i = world.particleSystems.length - 1; i >= 0; i--) {
		var ps = world.particleSystems[i];
		ps.draw(tool);
	}
}
window.addEventListener('resize',function(){
	ww = window.innerWidth*resolution, hh = window.innerHeight*resolution;
	tool.center.set(ww/2,hh/2);
	draw();
}, false);
var title = new Text("Balls",0,-50);
title.size = 30;
title.strokedText = true;
title.ls = 0.2;
var keys = [];
window.addEventListener('keydown', function(e){keys[e.key] = true;}, false);
window.addEventListener('keyup', function(e){keys[e.key] = false;}, false);
function run(){
	tool.fill(235);
	tool.rectMode('corner');
	tool.noStroke();
	tool.rect(-tool.center.x/scale-tool.pos.x,-tool.center.y/scale-tool.pos.y,ww/scale,hh/scale);
	title.draw(tool);
	Step();
	draw();
	if(keys['q']){
		addCircularGroup(mouse.x,mouse.y,0.4);
	}
	if(keys['x']){
		tool.scl/=1.05;
		scale = tool.scl;
	}
	if(keys['z']){
		tool.scl*=1.05;
		scale = tool.scl;
	}
	if(clock.is('t1') && clock.getTime()<25){
		var bd = new b2BoxDef();
		bd.position.Set(10,-10);
		var box = world.CreateBox(bd);
		box.setSpeed(16);
		addRectBody(10,-11,1,1,2,1);
	}
	requestAnimationFrame(run);
}
run();