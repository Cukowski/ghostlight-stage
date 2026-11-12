import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, sanitizeConfig, geometry, StageSimulation, MotionDriver, cylinderClearance, yawForHead } from '../dist/js/physics.js';
const advance=(sim,seconds,dt=1/120)=>{for(let i=0;i<seconds/dt;i++)sim.step(dt);};

test('configuration rejects nonfinite values and preserves feasible geometry',()=>{
  const c=sanitizeConfig({rigHeight:4,topHeight:9,bottomHeight:8,initialHeight:-3,boomLength:1,headMass:Infinity,ledColor:'javascript:bad',mechanism:'bad'});
  assert.ok(c.topHeight<=c.rigHeight-.65*c.headScale);assert.ok(c.bottomHeight<c.topHeight);assert.ok(c.initialHeight>=c.bottomHeight);assert.equal(c.headMass,DEFAULTS.headMass);assert.equal(c.ledColor,DEFAULTS.ledColor);assert.equal(c.mechanism,'vertical');
});
test('vertical target aligns microphone capsule with pitched mouth',()=>{
  const c=sanitizeConfig();for(const h of [c.topHeight,3.5,c.bottomHeight]){const g=geometry(c,h);assert.equal(g.head.x,c.headX);assert.ok(g.micTarget.y<h+.2);assert.ok(g.headAnchor.y>g.head.y);}
});
test('boom keeps arm length and exhibits an arc with matched upper X',()=>{
  const c=sanitizeConfig({mechanism:'boom'});
  const top=geometry(c,c.topHeight),mid=geometry(c,(c.topHeight+c.bottomHeight)/2);
  assert.ok(Math.abs(top.head.x-c.headX)<1e-10);assert.ok(mid.head.x>top.head.x+.3);
  for(let h=c.bottomHeight;h<=c.topHeight;h+=.1){const g=geometry(c,h);assert.ok(Math.abs(Math.hypot(g.headAnchor.x-g.pivot.x,g.headAnchor.y-g.pivot.y)-c.boomLength)<1e-10);}
});
test('drive obeys speed, height limits, return cue and stop latch',()=>{
  const c=sanitizeConfig({downSpeed:.08,upSpeed:.2,initialHeight:5.3});const d=new MotionDriver(c);d.command('down');
  for(let i=0;i<15000;i++){d.step(1/120,c);assert.ok(Math.abs(d.velocity)<=.2+1e-8);assert.ok(d.height>=c.bottomHeight&&d.height<=c.topHeight);}
  assert.equal(d.height,c.bottomHeight);assert.equal(d.phase,'hold');d.command('up');for(let i=0;i<1000;i++)d.step(1/120,c);
  const h=d.height;d.emergency();assert.equal(d.command('down'),false);for(let i=0;i<120;i++)d.step(1/120,c);assert.equal(d.height,h);d.rearm();assert.equal(d.phase,'hold');assert.equal(d.command('up'),true);
});
test('automatic cue descends, dwells, and returns without exceeding limits',()=>{
  const c=sanitizeConfig({downSpeed:.08,upSpeed:.2,holdDuration:2,initialHeight:5.3});const d=new MotionDriver(c);const phases=new Set();d.command('cycle');
  for(let i=0;i<120*90;i++){d.step(1/120,c);phases.add(d.phase);assert.ok(d.height>=c.bottomHeight&&d.height<=c.topHeight);}
  assert.ok(phases.has('down')&&phases.has('dwell')&&phases.has('up'));assert.equal(d.height,c.topHeight);assert.equal(d.phase,'hold');
});
test('resting payloads carry gravitational load and retain height alignment',()=>{
  const sim=new StageSimulation(DEFAULTS);advance(sim,10);const m=sim.metrics();
  assert.ok(Math.abs(m.tension-(sim.config.headMass+sim.config.micMass)*sim.config.gravity)<.02);assert.ok(Math.abs(m.heightError)<.001);assert.ok(m.sway<.001);
});
test('disturbed payload stays on its rope and damping dissipates sway',()=>{
  const sim=new StageSimulation({...DEFAULTS,damping:.45});sim.head.impulse(.38,.14);let early=0,late=0;
  for(let i=0;i<120*22;i++){sim.step(1/120);const p=sim.head,dist=Math.hypot(p.p.x-p.anchor.x,p.p.y-p.anchor.y,p.p.z-p.anchor.z);assert.ok(dist<=p.length+1e-5);assert.ok(Number.isFinite(p.tension));if(i<120*5)early=Math.max(early,p.sway());if(i>120*17)late=Math.max(late,p.sway());}
  assert.ok(early>.3);assert.ok(late<early*.15);
});
test('a performer under the head causes contact and prevents gross interpenetration',()=>{
  const sim=new StageSimulation({...DEFAULTS,initialHeight:1.7,actorX:-.85,actorZ:0});advance(sim,3);
  assert.ok(sim.contacts>0);assert.ok(cylinderClearance(sim.head.p,sim.head.radius,sim.config)>-.03);
});
test('slow motion remains aligned across changing head pitch',()=>{
  const sim=new StageSimulation({...DEFAULTS,initialHeight:5.3,downSpeed:.08,collisions:false});sim.driver.command('down');advance(sim,50);
  assert.equal(sim.driver.height,sim.config.bottomHeight);assert.ok(Math.abs(sim.metrics().heightError)<.002);
});
test('boom disturbances and movement remain finite for a complete cycle',()=>{
  const sim=new StageSimulation({...DEFAULTS,mechanism:'boom',initialHeight:5.3,downSpeed:.08,upSpeed:.2,holdDuration:1});sim.driver.command('cycle');sim.head.impulse(.1,.04);advance(sim,85);
  assert.equal(sim.driver.phase,'hold');assert.equal(sim.driver.height,sim.config.topHeight);for(const p of [sim.head,sim.mic])for(const v of Object.values(p.p))assert.ok(Number.isFinite(v));assert.ok(sim.peakTension<200);
});

test('head yaw faces microphone positions and applies a manual offset', () => {
  const head = { x: 2, z: -1 };
  const cases = [
    [{ x: 2, z: 4 }, 0],
    [{ x: 6, z: -1 }, 90],
    [{ x: -2, z: -1 }, -90],
    [{ x: 2, z: -5 }, 180]
  ];
  for (const [mic, degrees] of cases) {
    const yaw = yawForHead(DEFAULTS, head, mic);
    assert.ok(Math.abs(Math.sin(yaw) - Math.sin(degrees * Math.PI / 180)) < 1e-10);
    assert.ok(Math.abs(Math.cos(yaw) - Math.cos(degrees * Math.PI / 180)) < 1e-10);
  }
  const config = sanitizeConfig({ headYaw: 45 });
  assert.ok(Math.abs(yawForHead(config, head, { x: 3, z: 0 }) - Math.PI / 2) < 1e-10);
  const coincident = yawForHead(config, head, head);
  assert.ok(Math.abs(coincident - Math.PI / 4) < 1e-10);
});

test('manual head direction survives saved settings and keeps vertical mic alignment', () => {
  const config = sanitizeConfig({ headFacing: 'manual', headYaw: -125 });
  const restored = sanitizeConfig(JSON.parse(JSON.stringify(config)));
  assert.equal(restored.headFacing, 'manual');
  assert.equal(restored.headYaw, -125);
  assert.ok(Math.abs(yawForHead(restored, { x: 0, z: 0 }, { x: 8, z: 1 }) + 125 * Math.PI / 180) < 1e-10);
  assert.equal(sanitizeConfig({ headYaw: Infinity }).headYaw, 0);
  assert.equal(sanitizeConfig({ headYaw: 999 }).headYaw, 180);
  assert.equal(sanitizeConfig({ headFacing: 'bad' }).headFacing, 'microphone');
  for (const height of [config.topHeight, 3.6, config.bottomHeight]) {
    assert.equal(geometry(config, height).micTarget.y, geometry(DEFAULTS, height).micTarget.y);
  }
  const sim = new StageSimulation(config);
  assert.ok(Math.abs(sim.sample().yaw + 125) < 1e-10);
});
