import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { setLanguage, getLanguage, t, formatNumber } from '../dist/js/i18n.js';

const source=readFileSync(new URL('../dist/js/i18n.js',import.meta.url),'utf8');
const start=source.indexOf('const MESSAGES = [')+'const MESSAGES = '.length;
const end=source.indexOf('\n];',start)+2;
const rows=vm.runInNewContext('('+source.slice(start,end)+')');
const messages=new Map(rows.map(row=>[row[0],row]));
test('every catalog message has complete German and Korean translations and matching placeholders',()=>{
  assert.equal(messages.size,rows.length);
  for(const row of rows){
    assert.equal(row.length,3);
    for(const text of row)assert.ok(typeof text==='string'&&text.trim(),row[0]);
    const placeholders=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
    assert.deepEqual(placeholders(row[0]),placeholders(row[1]),row[0]);
    assert.deepEqual(placeholders(row[0]),placeholders(row[2]),row[0]);
  }
});
test('all annotated website labels and accessible names exist in the catalog',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-title|-label|-placeholder)?="([^"]+)"/g)){
    const key=match[1].replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'");
    assert.ok(messages.has(key),'Missing website translation: '+key);
  }
});
test('all settings headings, notes, fields and choices are translated',()=>{
  const app=readFileSync(new URL('../dist/js/app.js',import.meta.url),'utf8');
  const start=app.indexOf('const PANELS=')+'const PANELS='.length;
  const end=app.indexOf('\nfunction fieldHTML',start);
  const helpers={number:(key,label)=>({key,label}),toggle:(key,label)=>({key,label}),select:(key,label,options)=>({key,label,options})};
  const panels=vm.runInNewContext('('+app.slice(start,end).trim().replace(/;$/,'')+')',helpers);
  for(const groups of Object.values(panels))for(const group of groups){
    for(const text of [group.title,group.note].filter(Boolean))assert.ok(messages.has(text),'Missing setting text: '+text);
    for(const field of group.fields||[]){assert.ok(messages.has(field.label),field.label);for(const [,label]of field.options||[])assert.ok(messages.has(label),label);}
  }
});
test('language switching supports localized numbers and dynamic operator messages',()=>{
  setLanguage('de');assert.equal(getLanguage(),'de');assert.equal(formatNumber(3.6,2),'3,60');assert.equal(t('Hide performer'),'Figur ausblenden');
  assert.match(t('PERFORMER · {height} m',{height:formatNumber(1.78)}),/1,78/);
  setLanguage('ko');assert.equal(formatNumber(3.6,2),'3.60');assert.equal(t('Hide performer'),'인물 숨기기');assert.equal(t('Stage'),'무대');
  setLanguage('en');assert.equal(t('Unknown future label'),'Unknown future label');
});
