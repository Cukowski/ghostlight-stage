import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { SVGRenderer } from '../vendor/SVGRenderer.js';
import { geometry, pitchForHeight } from './physics.js';

const Y=new THREE.Vector3(0,1,0);
export class StageView {
  constructor(container,config){
    this.container=container;this.config=config;this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color('#14191f');this.scene.fog=new THREE.FogExp2('#14191f',0.026);
    this.camera=new THREE.PerspectiveCamera(42,1,0.05,150);this.camera.position.set(10,7.8,13.8);
    const canvas=document.createElement('canvas');const context=canvas.getContext('webgl2',{antialias:true,preserveDrawingBuffer:true});
    this.software=!context;
    if(context){this.renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
    else{this.renderer=new SVGRenderer();this.renderer.setQuality('low');document.querySelector('.model-note').textContent='Software 3D · simplified lighting · concept physics';}
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;
    this.controls.dampingFactor=0.08;this.controls.target.set(0,2.9,0);this.controls.maxDistance=35;
    this.controls.minDistance=0.7;this.controls.maxPolarAngle=Math.PI*0.49;
    this.world=new THREE.Group();this.scene.add(this.world);this.labels={};
    new ResizeObserver(()=>this.resize()).observe(container);this.build(config);this.resize();
  }
  material(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:0.78,...opts});}
  mesh(geo,mat,parent=this.stage){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(x,y,z,mat,parent=this.stage){return this.mesh(new THREE.BoxGeometry(x,y,z),mat,parent);}
  sphere(r,mat,parent=this.stage){return this.mesh(new THREE.SphereGeometry(r,this.software?12:24,this.software?8:16),mat,parent);}
  rod(a,b,r,mat,parent=this.stage){const m=this.mesh(new THREE.CylinderGeometry(r,r,1,8),mat,parent);this.setRod(m,a,b);return m;}
  setRod(m,a,b){const av=new THREE.Vector3(a.x,a.y,a.z),bv=new THREE.Vector3(b.x,b.y,b.z),d=bv.clone().sub(av);m.position.copy(av).add(bv).multiplyScalar(0.5);m.scale.y=Math.max(0.001,d.length());m.quaternion.setFromUnitVectors(Y,d.normalize());}
  empty(parent=this.stage){const g=new THREE.Group();parent.add(g);return g;}
  disposeWorld(){this.world.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});this.world.clear();}
  build(c){
    this.config=c;this.dirty=true;this.disposeWorld();
    const metal=this.material('#687079',{metalness:0.7,roughness:0.34}),dark=this.material('#20262d'),black=this.material('#101318');
    const floor=this.material('#373b3d',{roughness:0.93}),seam=this.material('#272c2e'),warm=this.material('#a57853');
    this.stage=this.empty(this.world);this.stage.position.y=c.deckHeight;
    const room=this.box(50,0.12,50,this.material('#101418'),this.world);room.position.y=-0.09;
    const deck=this.box(c.stageWidth,Math.max(c.deckHeight,0.08),c.stageDepth,floor);deck.position.y=-Math.max(c.deckHeight,0.08)/2;
    for(let i=0;i<=c.stageWidth/0.55;i++){const line=this.box(0.008,0.002,c.stageDepth-0.03,seam);line.position.set(-c.stageWidth/2+i*.55,0.004,0);}
    const apron=this.box(c.stageWidth+0.06,0.12,0.1,black);apron.position.set(0,-.08,c.stageDepth/2);
    const lip=this.box(c.stageWidth,0.014,0.025,warm);lip.position.set(0,0.005,c.stageDepth/2);
    const steps=Math.max(1,Math.ceil(c.deckHeight/0.2));
    for(let i=0;i<steps;i++){const s=this.box(1.2,(i+1)*c.deckHeight/steps,0.32,dark,this.world);s.position.set(c.stageWidth/2-.8,s.geometry.parameters.height/2,c.stageDepth/2+.32*(steps-i));}
    // Proscenium and pleated stage drapery.
    this.masking=this.empty();
    const frameMat=this.material('#29282b',{roughness:.92}),velvet=this.material('#552a39',{roughness:1,side:THREE.DoubleSide});
    for(const side of [-1,1]){const p=this.box(.65,c.rigHeight+1.1,.6,frameMat,this.masking);p.position.set(side*(c.stageWidth/2+.3),(c.rigHeight+1.1)/2,c.stageDepth/2+.15);}
    const header=this.box(c.stageWidth+1.3,.85,.65,frameMat,this.masking);header.position.set(0,c.rigHeight+.65,c.stageDepth/2+.15);
    const curtain=(w,h,x,z)=>{const geo=new THREE.PlaneGeometry(w,h,Math.round(w*26),2);const positions=geo.attributes.position;
      for(let i=0;i<positions.count;i++)positions.setZ(i,.10*Math.sin(positions.getX(i)*23)+.035*Math.sin(positions.getX(i)*46));
      geo.computeVertexNormals();const m=this.mesh(geo,velvet,this.masking);m.position.set(x,h/2,z);return m;};
    curtain(c.stageWidth+0.3,c.rigHeight,0,-c.stageDepth/2-.05);
    for(const sign of [-1,1]){curtain(1.0,c.rigHeight,sign*(c.stageWidth/2-.32),c.stageDepth/2-.1);for(let j=0;j<3;j++){const wing=curtain(.75,c.rigHeight,sign*(c.stageWidth/2-.12),c.stageDepth/2-1.5-j*1.6);wing.rotation.y=sign*.65;}}
    // Truss geometry; diagonal braces are visual reference geometry.
    const truss=(z)=>{const y=c.rigHeight+.12;for(const oy of [-.15,.15])for(const oz of [-.15,.15])this.rod({x:-c.stageWidth/2,y:y+oy,z:z+oz},{x:c.stageWidth/2,y:y+oy,z:z+oz},.025,metal);
      const n=Math.ceil(c.stageWidth/.65);for(let j=0;j<n;j++){const x=-c.stageWidth/2+j*c.stageWidth/n,xx=x+c.stageWidth/n;
        for(const zz of [-.15,.15])this.rod({x,y:y-.15,z:z+zz},{x:xx,y:y+.15,z:z+zz},.012,metal);}
    };truss(0);truss(-c.stageDepth/2+.35);truss(c.stageDepth/2-.65);
    for(const s of [-1,1]){this.rod({x:s*(c.stageWidth/2-.12),y:0,z:-c.stageDepth/2+.35},{x:s*(c.stageWidth/2-.12),y:c.rigHeight,z:-c.stageDepth/2+.35},.04,dark);}
    // Auditorium reference seating.
    const chairMat=this.material('#322b32',{roughness:.95});
    for(let row=0;row<3;row++)for(let col=0;col<10;col++){const x=(col-4.5)*.72,z=c.stageDepth/2+2+row*.9;
      const seat=this.box(.51,.12,.48,chairMat,this.world);seat.position.set(x,.4,z);
      const back=this.box(.51,.55,.1,chairMat,this.world);back.position.set(x,.72,z+.23);back.rotation.x=.08;}
    this.grid=new THREE.GridHelper(Math.max(c.stageWidth,c.stageDepth),Math.max(c.stageWidth,c.stageDepth)*2,'#677d80','#39484d');this.grid.position.y=.012;this.grid.material.transparent=true;this.grid.material.opacity=.45;this.stage.add(this.grid);
    this.makeActor(c);this.makeRig(c,metal,dark,black);this.makeHead(c);this.makeMicrophone();
    this.lights=this.empty(this.world);
    this.ambient=this.software?new THREE.AmbientLight('#b8c5d0',.8):new THREE.HemisphereLight('#b8d6ea','#433b36',.8);this.lights.add(this.ambient);
    const fill=new THREE.DirectionalLight('#9bb6d1',1.1);fill.position.set(6,8,9);this.lights.add(fill);
    this.spots=[];
    const spot=(x,z,color,intensity)=>{const light=new THREE.SpotLight(color,intensity,22,.56,.65,1.4);light.position.set(x,c.rigHeight+c.deckHeight,z);light.target.position.set(x*.2,c.deckHeight+1.3,0);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.0003;this.lights.add(light,light.target);this.spots.push(light);
      const housing=this.mesh(new THREE.CylinderGeometry(.15,.20,.34,16),black,this.stage);housing.position.set(x,c.rigHeight-.18,z);housing.rotation.x=-.42;
      const lens=this.mesh(new THREE.CircleGeometry(.13,24),new THREE.MeshBasicMaterial({color}),this.stage);lens.position.set(x,c.rigHeight-.34,z+.06);lens.rotation.x=Math.PI/2+.42;
    };
    spot(-2.8,c.stageDepth/2-.9,'#ffcfa1',100);spot(2.7,c.stageDepth/2-.9,'#a8d9f5',100);spot(0,-c.stageDepth/2+.4,'#a38ee7',110);
    this.setLighting(c.lightPreset);this.setVisibility(c);
    this.scene.updateMatrixWorld(true);
  }
  makeActor(c){
    this.actor=this.empty();this.actor.position.set(c.actorX,0,c.actorZ);
    this.actorMat=this.material('#63767b',{roughness:.85});const m=this.actorMat;
    const scale=c.actorHeight/1.78;this.actor.scale.setScalar(scale);
    const torso=this.mesh(new THREE.CapsuleGeometry(.20,.43,5,12),m,this.actor);torso.position.y=1.16;
    const head=this.sphere(.125,m,this.actor);head.scale.y=1.22;head.position.y=1.64;
    for(const side of [-1,1]){
      this.rod({x:side*.12,y:.9,z:0},{x:side*.14,y:.12,z:.035},.073,m,this.actor);
      const shoe=this.box(.14,.10,.27,m,this.actor);shoe.position.set(side*.14,.05,.08);
      this.rod({x:side*.25,y:1.37,z:0},{x:side*.31,y:.83,z:.06},.055,m,this.actor);
      const hand=this.sphere(.062,m,this.actor);hand.position.set(side*.31,.80,.06);
    }
    const ringGeo=new THREE.RingGeometry(.38,.39,64);this.actorRing=this.mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#829d9d',side:THREE.DoubleSide,transparent:true,opacity:.65}),this.actor);this.actorRing.rotation.x=-Math.PI/2;this.actorRing.position.y=.015;
  }
  makeRig(c,metal,dark,black){
    const g=geometry(c,c.initialHeight);this.boom=this.empty();this.boom.position.copy(new THREE.Vector3(g.pivot.x,0,g.pivot.z));
    const base=this.box(1.35,.12,1.25,dark,this.boom);base.position.y=.06;
    for(const s of [-1,1]){const outrig=this.box(1.65,.06,.09,metal,this.boom);outrig.position.set(0,.045,s*.57);}
    this.rod({x:0,y:.15,z:0},{x:0,y:g.pivot.y,z:0},.065,metal,this.boom);
    for(const s of [-1,1])this.rod({x:0,y:1.2,z:0},{x:s*.55,y:.15,z:0},.025,metal,this.boom);
    this.arm=this.empty(this.boom);this.arm.position.y=g.pivot.y;
    const axle=this.mesh(new THREE.CylinderGeometry(.13,.13,.26,24),dark,this.arm);axle.rotation.x=Math.PI/2;
    const arm=this.box(c.boomLength,.07,.08,metal,this.arm);arm.position.x=c.boomLength/2;
    const rear=this.box(.95,.075,.08,metal,this.arm);rear.position.x=-.475;
    const weight=this.box(.36,.43,.36,black,this.arm);weight.position.x=-.83;
    const badge=this.box(.10,.23,.375,this.material('#b38d62'),this.arm);badge.position.x=-.83;
    this.pulley=this.empty();this.pulley.position.set(c.micX,c.rigHeight,c.micZ);
    for(const x of [c.headX,c.micX]){const block=this.box(.18,.25,.12,dark);block.position.set(x,c.rigHeight-.05,x===c.headX?c.headZ:c.micZ);const wheel=this.mesh(new THREE.TorusGeometry(.075,.018,8,20),metal);wheel.position.set(x,c.rigHeight-.09,x===c.headX?c.headZ:c.micZ);}
    const winch=this.box(.42,.58,.36,dark);winch.position.set(-c.stageWidth/2+.45,.5,-.9);
    const cover=this.box(.43,.25,.035,this.material('#b28559'));cover.position.set(winch.position.x,.53,-.71);
    this.cableMaterial=new THREE.MeshStandardMaterial({color:'#b0b7b8',metalness:.6,roughness:.5});
    this.headCable=this.rod(g.headAnchor,g.head,.006,this.cableMaterial);
    this.micCable=this.rod(g.micAnchor,g.micTarget,.006,this.cableMaterial);
    this.controlTether=this.rod(g.headAnchor,g.head,.009,this.material('#252c31'));
    // Dashed reference line joins mouth level and microphone capsule.
    this.alignmentGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)]);
    this.alignmentLine=new THREE.Line(this.alignmentGeometry,new THREE.LineDashedMaterial({color:'#e8b58e',dashSize:.06,gapSize:.07,transparent:true,opacity:.6}));this.stage.add(this.alignmentLine);
  }
  makeHead(c){
    this.headRoot=this.empty();this.headRoot.scale.setScalar(c.headScale);this.headPitch=this.empty(this.headRoot);
    const shell=this.material('#e2ded2',{roughness:.67}),inner=this.material('#262b31'),bracket=this.material('#909b9b',{metalness:.65,roughness:.38});
    const cranium=this.mesh(new THREE.SphereGeometry(.25,this.software?16:36,this.software?12:26,0,Math.PI*2,0,Math.PI*.79),shell,this.headPitch);cranium.scale.set(.92,1.12,.86);
    const brow=this.sphere(.12,shell,this.headPitch);brow.scale.set(1.65,.47,.64);brow.position.set(0,.025,.17);
    const nose=this.mesh(new THREE.ConeGeometry(.04,.11,5),shell,this.headPitch);nose.rotation.x=Math.PI/2;nose.position.set(0,-.01,.23);
    this.ledMaterial=new THREE.MeshStandardMaterial({color:c.ledColor,emissive:c.ledColor,emissiveIntensity:2,roughness:.3});
    for(const sign of [-1,1]){
      const socket=this.sphere(.055,inner,this.headPitch);socket.scale.set(1,.60,.4);socket.position.set(sign*.09,.038,.192);
      const eye=this.sphere(.027,this.ledMaterial,this.headPitch);eye.scale.set(1,.65,.55);eye.position.set(sign*.09,.038,.213);
      const ear=this.sphere(.047,shell,this.headPitch);ear.scale.set(.5,1,.65);ear.position.set(sign*.229,-.005,0);
      this.rod({x:sign*.28,y:.26,z:0},{x:sign*.28,y:0,z:0},.012,bracket,this.headRoot);
      this.rod({x:sign*.28,y:0,z:0},{x:sign*.23,y:0,z:0},.025,bracket,this.headRoot);
    }
    this.rod({x:-.28,y:.26,z:0},{x:.28,y:.26,z:0},.012,bracket,this.headRoot);
    this.neckAxle=this.rod({x:-.27,y:0,z:0},{x:.27,y:0,z:0},.009,bracket,this.headPitch);
    const mouth=this.box(.23,.055,.035,inner,this.headPitch);mouth.position.set(0,-.083,.174);
    this.jaw=this.empty(this.headPitch);this.jaw.position.set(0,-.075,-.04);
    const mandible=this.sphere(.17,shell,this.jaw);mandible.scale.set(1.02,.42,.82);mandible.position.set(0,-.065,.14);
    for(let i=0;i<6;i++){const tooth=this.box(.028,.022,.02,shell,this.jaw);tooth.position.set((i-2.5)*.031,-.012,.245);}
    const halo=this.mesh(new THREE.TorusGeometry(.238,.010,8,64),this.ledMaterial,this.headPitch);halo.rotation.x=Math.PI/2;halo.position.y=.12;
    this.headLight=new THREE.PointLight(c.ledColor,1.5,2,2);this.headLight.position.set(0,0,.26);this.headRoot.add(this.headLight);
    this.internals=this.empty(this.headPitch);
    const servo=this.box(.07,.095,.10,this.material('#3b6f83'),this.internals);servo.position.set(.08,-.01,-.13);
    const spine=this.box(.05,.32,.035,bracket,this.internals);spine.position.set(0,.01,-.14);
    this.headShell=cranium;
  }
  makeMicrophone(){
    this.micRoot=this.empty();const m=this.material('#272b30',{metalness:.5,roughness:.45});
    const handle=this.mesh(new THREE.CylinderGeometry(.031,.025,.20,20),m,this.micRoot);handle.position.y=.13;
    const basket=this.mesh(new THREE.SphereGeometry(.052,20,14),this.material('#7c8588',{metalness:.72,roughness:.7}),this.micRoot);basket.scale.y=1.3;
    const band=this.mesh(new THREE.TorusGeometry(.045,.006,6,24),m,this.micRoot);band.rotation.x=Math.PI/2;band.position.y=.037;
    const collar=this.mesh(new THREE.CylinderGeometry(.022,.025,.05,16),m,this.micRoot);collar.position.y=.25;
  }
  setLighting(preset){
    const modes={midnight:{ambient:.65,colors:['#ffd1ac','#a2d8f5','#9e8cdb'],intensity:[125,105,125],exposure:1.1},warm:{ambient:.8,colors:['#ffcc91','#ffe0ad','#faac88'],intensity:[140,110,85],exposure:1.15},worklight:{ambient:1.8,colors:['#eaf4ff','#eaf4ff','#d5e3f1'],intensity:[125,125,125],exposure:1.3}};
    const p=modes[preset]||modes.midnight;this.ambient.intensity=p.ambient;this.spots.forEach((s,i)=>{s.color.set(p.colors[i]);s.intensity=p.intensity[i];});this.renderer.toneMappingExposure=p.exposure;
  }
  setVisibility(c){this.grid.visible=c.grid;this.masking.visible=!c.engineering;this.boom.visible=c.mechanism==='boom';this.actor.visible=c.actorVisible;this.internals.visible=c.engineering;this.headShell.material.transparent=c.engineering;this.headShell.material.opacity=c.engineering?.40:1;this.alignmentLine.visible=c.engineering;}
  update(sim,jawOpen=0){
    if(this.followHead&&this.previousHead){const current=new THREE.Vector3(sim.head.p.x,sim.head.p.y+sim.config.deckHeight,sim.head.p.z),delta=current.clone().sub(this.previousHead);this.camera.position.add(delta);this.controls.target.add(delta);this.previousHead.copy(current);}
    this.controls.update();
    const stamp=performance.now();
    if(this.software&&this.lastDraw&&stamp-this.lastDraw<100)return;
    const key=[...this.camera.position.toArray(),...this.camera.quaternion.toArray(),sim.head.p.x,sim.head.p.y,sim.head.p.z,sim.mic.p.x,sim.mic.p.y,sim.mic.p.z,sim.driver.height,jawOpen,sim.config.ledBrightness,sim.config.colorCycle?sim.time:0,sim.config.ledColor,sim.metrics().contact].map(x=>typeof x==='number'?Math.round(x*10000):x).join(',');
    if(this.software&&!this.dirty&&key===this.lastKey)return;
    this.lastKey=key;this.lastDraw=stamp;this.dirty=false;
    const c=sim.config,g=geometry(c,sim.driver.height);this.headRoot.position.copy(sim.head.p);this.micRoot.position.copy(sim.mic.p);
    this.headPitch.rotation.x=pitchForHeight(c,sim.head.p.y);this.jaw.rotation.x=jawOpen*c.jawAngle*Math.PI/180;
    this.arm.rotation.z=g.boomAngle;
    const endpoint={x:sim.head.p.x,y:sim.head.p.y+.27*c.headScale,z:sim.head.p.z};this.setRod(this.headCable,g.headAnchor,endpoint);
    this.setRod(this.controlTether,{x:g.headAnchor.x+.035,y:g.headAnchor.y,z:g.headAnchor.z-.04},{x:endpoint.x+.035,y:endpoint.y,z:endpoint.z-.04});
    this.setRod(this.micCable,g.micAnchor,{x:sim.mic.p.x,y:sim.mic.p.y+.275,z:sim.mic.p.z});
    const col=new THREE.Color(c.ledColor);if(c.colorCycle)col.setHSL((sim.time*.008+.44)%1,.65,.57);
    this.ledMaterial.color.copy(col);this.ledMaterial.emissive.copy(col);this.ledMaterial.emissiveIntensity=c.ledBrightness*2.5;this.headLight.color.copy(col);this.headLight.intensity=c.ledBrightness*1.5;
    const metric=sim.metrics();this.actorMat.color.set(metric.contact?'#bd7959':'#63767b');this.actorRing.material.color.set(metric.clearance<.15?'#ed9567':'#829d9d');
    this.scene.updateMatrixWorld(true);
    const mouth=this.headPitch.localToWorld(new THREE.Vector3(0,-.075,.20));
    const mic=new THREE.Vector3(sim.mic.p.x,sim.mic.p.y+c.deckHeight,sim.mic.p.z);
    const a=mouth.clone();a.y-=c.deckHeight;const b=mic.clone();b.y-=c.deckHeight;
    this.alignmentGeometry.setFromPoints([a,b]);this.alignmentLine.computeLineDistances();
    this.renderer.render(this.scene,this.camera);this.projectLabels(sim);
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.dirty=true;}
  cameraView(name,sim){
    const c=sim.config,h=sim.head.p,deck=c.deckHeight;
    const views={audience:{p:[c.stageWidth*.95,c.rigHeight+1, c.stageDepth*1.9],t:[0,2.6+deck,0]},front:{p:[0,3+deck,c.stageDepth*2.3],t:[0,2.9+deck,0]},side:{p:[c.stageWidth*1.6,3.5+deck,0.1],t:[0,2.9+deck,0]},top:{p:[.01,c.rigHeight*2.7,.01],t:[0,0,0]},head:{p:[h.x+1.1,h.y+deck+.45,h.z+1.9],t:[h.x,h.y+deck,h.z]}};
    const v=views[name]||views.audience;this.followHead=name==='head';this.previousHead=new THREE.Vector3(h.x,h.y+deck,h.z);this.camera.position.set(...v.p);this.controls.target.set(...v.t);
    if(name==='audience'&&this.camera.aspect<1){this.camera.position.sub(this.controls.target).multiplyScalar(Math.min(1.8,1/this.camera.aspect)).add(this.controls.target);}
    this.controls.update();
  }
  attachLabels(elements){this.labels=elements;}
  projectLabels(sim){
    const c=sim.config,w=this.container.clientWidth,h=this.container.clientHeight;
    const points={head:new THREE.Vector3(sim.head.p.x-.4,sim.head.p.y+c.deckHeight+.25,sim.head.p.z),mic:new THREE.Vector3(sim.mic.p.x+.18,sim.mic.p.y+c.deckHeight+.20,sim.mic.p.z),actor:new THREE.Vector3(c.actorX,c.actorHeight+c.deckHeight+.14,c.actorZ)};
    for(const [key,el]of Object.entries(this.labels)){const p=points[key].project(this.camera);const visible=c.labels&&p.z<1&&p.z>-1&&Math.abs(p.x)<.93&&Math.abs(p.y)<.9&&(key!=='actor'||c.actorVisible);el.hidden=!visible;if(visible){el.style.left=`${(p.x+1)*.5*w}px`;el.style.top=`${(1-p.y)*.5*h}px`;}}
  }
  async exportGLB(progress=()=>{}){
    progress('Loading the 3D exporter…');
    const {GLTFExporter}=await import('../vendor/GLTFExporter.js');
    progress('Converting the visible scene to GLB…');
    const exporter=new GLTFExporter();
    const snapshot=new THREE.Scene();snapshot.add(this.world.clone(true));snapshot.updateMatrixWorld(true);
    const unsupported=[];
    snapshot.traverse(o=>{
      if(o.isHemisphereLight||o.isAmbientLight)unsupported.push(o);
      if(o.isSpotLight||o.isDirectionalLight){const target=o.target.getWorldPosition(new THREE.Vector3());o.lookAt(target);const localTarget=new THREE.Object3D();localTarget.position.set(0,0,-1);o.add(localTarget);o.target=localTarget;if(o.isSpotLight)o.decay=2;}
    });
    for(const light of unsupported)light.removeFromParent();snapshot.updateMatrixWorld(true);
    return new Promise((resolve,reject)=>exporter.parse(snapshot,resolve,reject,{binary:true,onlyVisible:true}));
  }
  async capturePNG(){
    if(!this.software)return new Promise(resolve=>this.renderer.domElement.toBlob(resolve));
    const xml=new XMLSerializer().serializeToString(this.renderer.domElement),url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'}));
    try{
      const image=new Image();image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=this.container.clientWidth*2;canvas.height=this.container.clientHeight*2;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#14191f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
      return await new Promise(resolve=>canvas.toBlob(resolve));
    }finally{URL.revokeObjectURL(url);}
  }
}
