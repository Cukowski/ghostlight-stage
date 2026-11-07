import * as THREE from 'three';

// Procedural foam mannequin: facial relief is sculpted into one continuous shell.
// Dimensions and the mouth reference match the existing motion study.
const PROFILE=[
  [.28,.002,.002,-.025],[.255,.105,.105,-.025],[.21,.164,.148,-.025],
  [.14,.193,.176,-.025],[.07,.196,.182,-.024],[.015,.192,.174,-.020],
  [-.045,.183,.162,-.012],[-.105,.161,.146,-.003],[-.17,.137,.125,.003],
  [-.225,.100,.098,.010],[-.265,.051,.063,.012],[-.28,.002,.003,.012]
];
const gaussian=(x,y,cx,cy,sx,sy,a)=>a*Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
function profile(y){
  const n=PROFILE.length;let i=0;while(i<n-2&&y<PROFILE[i+1][0])i++;
  const a=PROFILE[i],b=PROFILE[i+1],span=b[0]-a[0],t=THREE.MathUtils.clamp((y-a[0])/span,0,1);
  const result=[];
  for(let k=1;k<4;k++){
    const prev=PROFILE[Math.max(0,i-1)],next=PROFILE[Math.min(n-1,i+2)];
    const ma=(b[k]-prev[k])/(b[0]-prev[0]),mb=(next[k]-a[k])/(next[0]-a[0]);
    result.push((2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*span*ma+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*span*mb);
  }
  return result;
}
function sculpt(x,y){
  let z=0;
  for(const sign of [-1,1]){
    z+=gaussian(x,y,sign*.084,.065,.065,.023,.011); // brow bone
    z+=gaussian(x,y,sign*.083,.032,.044,.024,-.024); // inset eye sockets
    z+=gaussian(x,y,sign*.103,-.018,.059,.037,.018); // cheekbones
    z+=gaussian(x,y,sign*.030,-.034,.017,.017,.019); // nose wings
    z+=gaussian(x,y,sign*.064,-.079,.018,.041,-.006);
  }
  z+=gaussian(x,y,0,.022,.025,.070,.029); // nose bridge
  z+=gaussian(x,y,0,-.027,.028,.025,.060); // rounded nose tip
  z+=gaussian(x,y,0,-.060,.010,.014,-.005); // philtrum
  z+=gaussian(x,y,0,-.076,.066,.009,.012); // upper lip
  z+=gaussian(x,y,0,-.102,.065,.011,.014); // lower lip
  z+=gaussian(x,y,0,-.205,.087,.040,.015); // chin
  return z;
}
export function faceDepth(x,y){const [w,d,cz]=profile(y),cos=Math.sqrt(Math.max(0,1-(x/w)**2));return cz+d*cos+sculpt(x,y)*cos**4;}
export function mannequinGeometry(top,bottom,radial=64,rings=48,hinge=null){
  const positions=[],indices=[];
  for(let j=0;j<=rings;j++){
    const y=top+(bottom-top)*j/rings,[width,depth,cz]=profile(y);
    for(let i=0;i<=radial;i++){
      const angle=2*Math.PI*i/radial,x=Math.sin(angle)*Math.max(.001,width),cos=Math.cos(angle);
      const z=cz+cos*Math.max(.001,depth)+sculpt(x,y)*Math.max(0,cos)**4;
      positions.push(x-(hinge?.x||0),y-(hinge?.y||0),z-(hinge?.z||0));
    }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<radial;i++){
    const a=j*(radial+1)+i,b=a+radial+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
function eyeShape(view,sign,material,parent){
  const shape=new THREE.Shape();shape.moveTo(-.043,0);shape.quadraticCurveTo(-.018,.014,.005,.012);shape.quadraticCurveTo(.029,.010,.043,0);shape.quadraticCurveTo(.013,-.009,-.008,-.008);shape.quadraticCurveTo(-.031,-.006,-.043,0);
  const geometry=new THREE.ShapeGeometry(shape,12),points=geometry.attributes.position;
  for(let i=0;i<points.count;i++){const x=points.getX(i)+sign*.083,y=points.getY(i)+.032;points.setXYZ(i,x,y,faceDepth(x,y)+.0015);}
  geometry.computeVertexNormals();view.mesh(geometry,material,parent);
}
export function buildMannequin(view,c){
  const root=view.empty(),pitch=view.empty(root);root.scale.setScalar(c.headScale);
  const shell=view.material(view.software?'#b8b8b0':'#e5e1d7',{roughness:.94}),inside=view.material('#393c3c',{roughness:1}),metal=view.material('#83908f',{metalness:.55,roughness:.46});
  const radial=view.software?32:72,rings=view.software?26:56;
  const headShell=view.mesh(mannequinGeometry(.28,-.085,radial,rings),shell,pitch);
  headShell.name='Foam mannequin upper head';
  const hinge=new THREE.Vector3(0,-.075,-.04),jaw=view.empty(pitch);jaw.position.copy(hinge);
  const lower=view.mesh(mannequinGeometry(-.091,-.28,radial,Math.round(rings*.6),hinge),shell,jaw);lower.name='Hinged mannequin jaw';
  // A small recessed cavity shows through the lip seam when the jaw opens.
  const cavity=view.sphere(.12,inside,pitch);cavity.scale.set(1.08,.24,.54);cavity.position.set(0,-.086,.045);
  const neck=view.mesh(new THREE.CylinderGeometry(.066,.080,.085,24),shell,pitch);neck.position.set(0,-.294,-.021);
  for(const sign of [-1,1]){
    const ear=view.sphere(.039,shell,pitch);ear.scale.set(.44,1,.64);ear.position.set(sign*.196,-.007,-.006);
    const earInset=view.sphere(.022,view.material('#c9c7bd',{roughness:1}),pitch);earInset.scale.set(.29,1,.56);earInset.position.set(sign*.212,-.006,.000);
    view.rod({x:sign*.252,y:.33,z:0},{x:sign*.252,y:0,z:0},.009,metal,root);
    view.rod({x:sign*.252,y:0,z:0},{x:sign*.211,y:0,z:0},.018,metal,root);
    const nostril=view.sphere(.008,inside,pitch);nostril.scale.set(1,.40,.30);nostril.position.set(sign*.018,-.045,faceDepth(sign*.018,-.045)+.001);
  }
  view.rod({x:-.252,y:.33,z:0},{x:.252,y:.33,z:0},.009,metal,root);
  const ledMaterial=new THREE.MeshStandardMaterial({color:'#bccdc4',emissive:c.ledColor,emissiveIntensity:.18,roughness:.95,side:THREE.DoubleSide});
  eyeShape(view,-1,ledMaterial,pitch);eyeShape(view,1,ledMaterial,pitch);
  const headLight=new THREE.PointLight(c.ledColor,.35,1.6,2);headLight.position.set(0,.04,.24);root.add(headLight);
  const internals=view.empty(pitch);
  view.rod({x:-.21,y:0,z:0},{x:.21,y:0,z:0},.008,metal,internals);
  const spine=view.box(.035,.28,.028,metal,internals);spine.position.set(0,.015,-.10);
  const servo=view.box(.065,.085,.07,view.material('#3d6b79'),internals);servo.position.set(.065,-.01,-.095);
  const ring=view.mesh(new THREE.TorusGeometry(.125,.006,6,40),ledMaterial,internals);ring.rotation.x=Math.PI/2;ring.position.set(0,.06,-.01);
  return {headRoot:root,headPitch:pitch,jaw,ledMaterial,headLight,internals,headShell,foamMaterial:shell};
}
