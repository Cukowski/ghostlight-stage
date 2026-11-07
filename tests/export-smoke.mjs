// Full-scene GLB serialization check without a graphics context.
// node --loader ./tests/vendor-loader.mjs tests/export-smoke.mjs
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from '../dist/vendor/three.module.js';
import { StageView } from '../dist/js/scene.js';
import { DEFAULTS, StageSimulation } from '../dist/js/physics.js';

globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
};
const view=Object.create(StageView.prototype);
view.scene=new THREE.Scene();view.world=new THREE.Group();view.scene.add(view.world);
view.software=false;view.renderer={render(){}};view.controls={update(){}};
view.camera=new THREE.PerspectiveCamera(42,1.5,.05,150);view.camera.position.set(10,8,14);
view.container={clientWidth:1000,clientHeight:700};view.labels={};
const sim=new StageSimulation(DEFAULTS);view.build(sim.config);view.update(sim,.3);
const buffer=await view.exportGLB();const header=new DataView(buffer);
assert.equal(header.getUint32(0,true),0x46546C67);assert.equal(header.getUint32(4,true),2);assert.equal(header.getUint32(8,true),buffer.byteLength);
const jsonSize=header.getUint32(12,true);const data=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonSize)).trim());
assert.ok(data.nodes.length>200);assert.ok(data.meshes.length>100);assert.ok(!data.images?.length);
await mkdir(new URL('../dist/examples/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/examples/ghostlight-stage.glb',import.meta.url),Buffer.from(buffer));
await writeFile(new URL('../dist/examples/suspended-study.json',import.meta.url),JSON.stringify({schema:'ghostlight-stage/v1',config:DEFAULTS},null,2));
await writeFile(new URL('../dist/examples/boom-study.json',import.meta.url),JSON.stringify({schema:'ghostlight-stage/v1',config:{...DEFAULTS,mechanism:'boom',engineering:true}},null,2));
console.log(JSON.stringify({glb:'valid',bytes:buffer.byteLength,nodes:data.nodes.length,meshes:data.meshes.length,embeddedTextures:0}));
