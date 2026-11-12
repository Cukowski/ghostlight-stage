/** SI units, Y up, deck top Y=0. Fixed-step, tension-only point-payload model. */
export const DEFAULTS = Object.freeze({
  stageWidth: 10, stageDepth: 7, deckHeight: 0.6, rigHeight: 6.5,
  topHeight: 5.3, bottomHeight: 1.7, initialHeight: 3.6,
  mechanism: 'vertical', headX: -0.85, headZ: 0, micX: 0.65, micZ: 0,
  boomLength: 3.2, headScale: 1, headMass: 1.2, micMass: 0.35, micOffset: 0,
  downSpeed: 0.003, upSpeed: 0.04, acceleration: 0.025, holdDuration: 12,
  gravity: 9.81, damping: 0.22, collisions: true,
  actorVisible: true, actorX: 0, actorZ: 1.3, actorHeight: 1.78,
  topTilt: -22, bottomTilt: 32, jawAngle: 24,
  headFacing: 'microphone', headYaw: 0,
  ledColor: '#70e5d4', ledBrightness: 0.8, colorCycle: false,
  lightPreset: 'midnight', grid: false, engineering: false, labels: true,
  previewSpeed: 20
});
const LIMITS = {
  stageWidth:[6,18],stageDepth:[4,14],deckHeight:[0,1.5],rigHeight:[3.5,10],
  topHeight:[1,9.4],bottomHeight:[0.65,8.8],initialHeight:[0.65,9.4],
  headX:[-7,7],headZ:[-5,5],micX:[-7,7],micZ:[-5,5],
  boomLength:[1,7],headScale:[0.6,1.8],headMass:[0.2,8],micMass:[0.05,2],micOffset:[-0.7,0.7],
  downSpeed:[0.001,0.08],upSpeed:[0.005,0.2],acceleration:[0.005,0.2],holdDuration:[0,120],
  gravity:[1,15],damping:[0,2],actorX:[-7,7],actorZ:[-5,5],actorHeight:[1,2.2],
  topTilt:[-60,30],bottomTilt:[-20,70],jawAngle:[0,45],headYaw:[-180,180],ledBrightness:[0,1],previewSpeed:[1,100]
};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const approach=(x,target,d)=>x<target?Math.min(x+d,target):Math.max(x-d,target);
export function sanitizeConfig(input={}) {
  const out={...DEFAULTS};
  for (const key of Object.keys(DEFAULTS)) {
    if(!(key in input))continue;
    if(key in LIMITS){const n=Number(input[key]);if(Number.isFinite(n))out[key]=clamp(n,...LIMITS[key]);}
    else if(typeof DEFAULTS[key]==='boolean')out[key]=input[key]===true;
  }
  if(['microphone','manual'].includes(input.headFacing))out.headFacing=input.headFacing;
  if(['vertical','boom'].includes(input.mechanism))out.mechanism=input.mechanism;
  if(['midnight','warm','worklight'].includes(input.lightPreset))out.lightPreset=input.lightPreset;
  if(/^#[a-f\d]{6}$/i.test(input.ledColor||''))out.ledColor=input.ledColor;
  out.topHeight=Math.min(out.topHeight,out.rigHeight-0.65*out.headScale);
  out.bottomHeight=clamp(out.bottomHeight,0.65,out.topHeight-0.3);
  out.initialHeight=clamp(out.initialHeight,out.bottomHeight,out.topHeight);
  out.boomLength=Math.max(out.boomLength,(out.topHeight-out.bottomHeight)/2+0.25);
  return out;
}
export const vec=(x=0,y=0,z=0)=>({x,y,z});
const length=v=>Math.hypot(v.x,v.y,v.z);
export function pitchForHeight(c,h) {
  const p=clamp((c.topHeight-h)/(c.topHeight-c.bottomHeight),0,1);
  const smooth=p*p*(3-2*p);
  return (c.topTilt+(c.bottomTilt-c.topTilt)*smooth)*Math.PI/180;
}
// Yaw turns around world up before the local pitch and jaw rotations.
export function yawForHead(config, head, microphone) {
  let angle = config.headYaw * Math.PI / 180;
  const dx = microphone.x - head.x;
  const dz = microphone.z - head.z;
  if (config.headFacing === 'microphone' && Math.hypot(dx, dz) > 1e-6) {
    angle += Math.atan2(dx, dz);
  }
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
export function mouthOffset(c,h){const a=pitchForHeight(c,h);return c.headScale*(-0.075*Math.cos(a)-0.20*Math.sin(a));}
export function geometry(c,h) {
  const center=(c.topHeight+c.bottomHeight)/2;
  const horizontal=Math.sqrt(Math.max(0.01,c.boomLength**2-(h-center)**2));
  const topHorizontal=Math.sqrt(Math.max(0.01,c.boomLength**2-(c.topHeight-center)**2));
  const pivot=vec(c.headX-topHorizontal,center+0.65,c.headZ);
  const head=vec(c.mechanism==='boom'?pivot.x+horizontal:c.headX,h,c.headZ);
  const headAnchor=c.mechanism==='boom'?vec(head.x,h+0.65,c.headZ):vec(c.headX,c.rigHeight,c.headZ);
  const micTarget=vec(c.micX,h+mouthOffset(c,h)+c.micOffset,c.micZ);
  return {head,headAnchor,micTarget,micAnchor:vec(c.micX,c.rigHeight,c.micZ),pivot,
    boomAngle:Math.asin(clamp((h-center)/c.boomLength,-1,1)),horizontal};
}
export class MotionDriver {
  constructor(c){this.reset(c);}
  reset(c){this.height=c.initialHeight;this.velocity=0;this.mode='hold';this.phase='hold';this.phaseTime=0;this.latched=false;this.elapsed=0;}
  command(mode){if(this.latched)return false;this.mode=mode;this.phase=mode==='cycle'?'down':mode;this.phaseTime=0;return true;}
  emergency(){this.latched=true;this.mode='hold';this.phase='hold';this.velocity=0;}
  rearm(){this.latched=false;this.mode='hold';this.phase='hold';this.velocity=0;}
  seek(h,c){this.height=clamp(h,c.bottomHeight,c.topHeight);this.velocity=0;this.mode='hold';this.phase='hold';}
  step(dt,c){
    this.elapsed+=dt;
    if(this.latched)return;
    if(this.mode==='cycle'&&this.phase==='dwell'){
      this.phaseTime+=dt;
      if(this.phaseTime>=c.holdDuration){this.phase='up';this.phaseTime=0;}
    }
    const phase=this.phase;
    const direction=phase==='down'?-1:phase==='up'?1:0;
    const target=direction<0?c.bottomHeight:c.topHeight;
    const remaining=Math.abs(target-this.height);
    const maxSpeed=direction<0?c.downSpeed:c.upSpeed;
    const desired=direction*Math.min(maxSpeed,Math.sqrt(2*c.acceleration*remaining));
    this.velocity=approach(this.velocity,desired,c.acceleration*dt);
    const next=this.height+this.velocity*dt;
    if(direction&&((direction<0&&next<=target)||(direction>0&&next>=target)||remaining<1e-7)){
      this.height=target;this.velocity=0;
      if(this.mode==='cycle'&&phase==='down'){this.phase='dwell';this.phaseTime=0;}
      else{this.mode='hold';this.phase='hold';}
    }else{this.height=clamp(next,c.bottomHeight,c.topHeight);}
  }
}
export class Payload {
  constructor(p,mass,radius,anchor){this.p={...p};this.v=vec();this.mass=mass;this.radius=radius;this.anchor={...anchor};this.lastAnchor={...anchor};this.length=length(vec(p.x-anchor.x,p.y-anchor.y,p.z-anchor.z));this.tension=mass*9.81;}
  integrate(dt,c,anchor,newLength){
    const old={...this.p};
    this.v.y-=c.gravity*dt;
    const drag=Math.exp(-c.damping*dt);
    this.v.x*=drag;this.v.y*=drag;this.v.z*=drag;
    this.p.x+=this.v.x*dt;this.p.y+=this.v.y*dt;this.p.z+=this.v.z*dt;
    this.lastAnchor=this.anchor;this.anchor={...anchor};this.length=Math.max(0.3,newLength);
    this.constrain();
    // Corrected velocity includes payout and moving-anchor motion.
    this.v.x=(this.p.x-old.x)/dt;this.v.y=(this.p.y-old.y)/dt;this.v.z=(this.p.z-old.z)/dt;
    const d=vec(this.p.x-anchor.x,this.p.y-anchor.y,this.p.z-anchor.z),dist=length(d)||1;
    const n=vec(d.x/dist,d.y/dist,d.z/dist);
    const av=vec((anchor.x-this.lastAnchor.x)/dt,(anchor.y-this.lastAnchor.y)/dt,(anchor.z-this.lastAnchor.z)/dt);
    const rv=vec(this.v.x-av.x,this.v.y-av.y,this.v.z-av.z);
    const radial=rv.x*n.x+rv.y*n.y+rv.z*n.z;
    const tangentSq=Math.max(0,rv.x**2+rv.y**2+rv.z**2-radial**2);
    this.tension=dist>=this.length-0.002?Math.max(0,this.mass*(c.gravity*(-n.y)+tangentSq/this.length)):0;
  }
  constrain(){
    const d=vec(this.p.x-this.anchor.x,this.p.y-this.anchor.y,this.p.z-this.anchor.z),dist=length(d);
    if(dist>this.length&&dist>0){const ratio=this.length/dist;this.p=vec(this.anchor.x+d.x*ratio,this.anchor.y+d.y*ratio,this.anchor.z+d.z*ratio);}
  }
  impulse(x,z){this.v.x+=x/this.mass;this.v.z+=z/this.mass;}
  sway(){return Math.atan2(Math.hypot(this.p.x-this.anchor.x,this.p.z-this.anchor.z),this.anchor.y-this.p.y)*180/Math.PI;}
}
export function cylinderClearance(p,r,c){
  const radial=Math.hypot(p.x-c.actorX,p.z-c.actorZ)-0.27;
  const vertical=Math.abs(p.y-c.actorHeight/2)-c.actorHeight/2;
  return Math.hypot(Math.max(radial,0),Math.max(vertical,0))+Math.min(Math.max(radial,vertical),0)-r;
}
export class StageSimulation {
  constructor(input){this.config=sanitizeConfig(input);this.driver=new MotionDriver(this.config);this.resetPayloads();this.time=0;this.lastContact=-100;this.contacts=0;this.trace=[];this.nextSample=0;this.peakTension=0;}
  resetPayloads(){const c=this.config,g=geometry(c,this.driver.height);this.head=new Payload(g.head,c.headMass,0.28*c.headScale,g.headAnchor);this.mic=new Payload(g.micTarget,c.micMass,0.075,g.micAnchor);}
  configure(input){this.config=sanitizeConfig(input);this.driver.seek(this.driver.height,this.config);this.resetPayloads();}
  seek(h){this.driver.seek(h,this.config);this.resetPayloads();}
  reset(){this.driver.reset(this.config);this.resetPayloads();this.time=0;this.lastContact=-100;this.contacts=0;this.trace=[];this.nextSample=0;this.peakTension=0;}
  step(dt){
    const c=this.config;this.driver.step(dt,c);this.time+=dt;
    const g=geometry(c,this.driver.height);
    this.head.integrate(dt,c,g.headAnchor,g.headAnchor.y-g.head.y);
    this.mic.integrate(dt,c,g.micAnchor,g.micAnchor.y-g.micTarget.y);
    if(c.collisions){
      const oldH={...this.head.p},oldM={...this.mic.p};let hit=false;
      for(let j=0;j<4;j++){
        for(const payload of [this.head,this.mic]){
          if(payload.p.y<payload.radius){payload.p.y=payload.radius;hit=true;}
          if(c.actorVisible){
            const clearance=cylinderClearance(payload.p,payload.radius,c);
            if(clearance<0){
              const dx=payload.p.x-c.actorX,dz=payload.p.z-c.actorZ,dist=Math.hypot(dx,dz);
              const topGap=Math.abs(payload.p.y-c.actorHeight);
              if(payload.p.y>=c.actorHeight&&topGap<(-clearance+0.08))payload.p.y=c.actorHeight+payload.radius;
              else{const nx=dist>1e-6?dx/dist:1,nz=dist>1e-6?dz/dist:0;payload.p.x+=nx*(-clearance+0.0001);payload.p.z+=nz*(-clearance+0.0001);}
              hit=true;
            }
          }
          payload.constrain();
        }
        const d=vec(this.head.p.x-this.mic.p.x,this.head.p.y-this.mic.p.y,this.head.p.z-this.mic.p.z),dist=length(d),min=this.head.radius+this.mic.radius;
        if(dist<min){const n=dist>1e-8?vec(d.x/dist,d.y/dist,d.z/dist):vec(1,0,0);const correction=min-dist;const sum=this.head.mass+this.mic.mass;
          for(const [p,factor] of [[this.head,this.mic.mass/sum],[this.mic,-this.head.mass/sum]]){p.p.x+=n.x*correction*factor;p.p.y+=n.y*correction*factor;p.p.z+=n.z*correction*factor;}hit=true;}
      }
      for(const [p,old] of [[this.head,oldH],[this.mic,oldM]]){p.v.x+=(p.p.x-old.x)/dt;p.v.y+=(p.p.y-old.y)/dt;p.v.z+=(p.p.z-old.z)/dt;}
      if(hit){if(this.time-this.lastContact>0.15)this.contacts++;this.lastContact=this.time;}
    }
    this.peakTension=Math.max(this.peakTension,this.head.tension+this.mic.tension);
    if(this.time>=this.nextSample){this.nextSample=this.time+0.1;this.trace.push(this.sample());if(this.trace.length>36000)this.trace.shift();}
  }
  sample(){return {time:this.time,commandHeight:this.driver.height,headX:this.head.p.x,headY:this.head.p.y,headZ:this.head.p.z,micX:this.mic.p.x,micY:this.mic.p.y,micZ:this.mic.p.z,headTension:this.head.tension,micTension:this.mic.tension,sway:this.head.sway(),yaw:yawForHead(this.config,this.head.p,this.mic.p)*180/Math.PI,pitch:pitchForHeight(this.config,this.head.p.y)*180/Math.PI};}
  metrics(){const c=this.config;const g=geometry(c,this.driver.height);const clearance=c.actorVisible?Math.min(cylinderClearance(this.head.p,this.head.radius,c),cylinderClearance(this.mic.p,this.mic.radius,c)):Infinity;
    const outside=Math.abs(this.head.p.x)+this.head.radius>c.stageWidth/2||Math.abs(this.head.p.z)+this.head.radius>c.stageDepth/2||Math.abs(this.mic.p.x)>c.stageWidth/2||Math.abs(this.mic.p.z)>c.stageDepth/2;
    return {heightError:this.head.p.y+mouthOffset(c,this.head.p.y)+c.micOffset-this.mic.p.y,clearance,outside,sway:this.head.sway(),contact:this.time-this.lastContact<0.6,tension:this.head.tension+this.mic.tension,payloadMoment:c.headMass*c.gravity*g.horizontal};}
}
