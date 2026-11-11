import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const c=vm.createContext({});
vm.runInContext(html.split('/*CORE-START*/')[1].split('/*CORE-END*/')[0],c);
const options={sum:true,numbers:true,header:true,notes:true,border:true,sort:true};
const heads=['Nabywca','NIP nabywcy','Sprzedawca','NIP sprzedawcy','Waluta','Netto','VAT','Brutto','Data wystawienia'];
const invoice=(currency,net,vat,gross)=>['Klient','1234567890','Dostawca','9876543210',currency,net,vat,gross,'2026-10-01'];
const table=(rows,kind='zakup',headers=heads)=>({name:'Faktury',kind,rows:[headers,...rows].map(r=>r.map(v=>v==null?null:({k:typeof v==='number'?'n':'s',v})))});
const plain=value=>JSON.parse(JSON.stringify(value));
const rows=xml=>[...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(m=>m[1]);
const values=row=>[...row.matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g)].map(m=>{
  const value=m[1].match(/<v>(.*?)<\/v>/);if(value)return Number(value[1]);
  return m[1].match(/<t[^>]*>(.*?)<\/t>/)?.[1]||'';
});
const source=table([invoice('PLN',100,23,123),invoice(' eur ',20,4.6,24.6),invoice('EUR',-5,-1.15,-6.15),invoice('pln',0.1,0.02,0.12),invoice('',7,0,7)]);
const p=c.prepare(source,options);
assert.equal(p.sumRow,true);
assert.equal(p.info.gross,null,'No total may combine different currencies');
assert.deepEqual(plain(p.info.currencyTotals),[
  {currency:'',count:1,net:7,vat:0,gross:7},
  {currency:'EUR',count:2,net:15,vat:3.45,gross:18.45},
  {currency:'PLN',count:2,net:100.1,vat:23.02,gross:123.12}
]);
const sheet=c.sheetXml(p,options,new c.Styles()).xml;
const sums=rows(sheet).filter(r=>r.includes('Razem'));
assert.equal(sums.length,3);
assert.deepEqual(sums.map(values),[
  ['Razem (brak waluty)',7,0,7],['Razem EUR',15,3.45,18.45],['Razem PLN',100.1,23.02,123.12]
]);
assert.ok(sheet.includes('SUMIF(D5:D9,&quot;EUR&quot;,E5:E9)'), 'Formula must use currency column after client columns are removed');
assert.ok(sheet.includes('SUMIF(D5:D9,&quot;&quot;,E5:E9)'), 'Unknown currency must have its own sum');
assert.ok(!sheet.includes('<f>SUM('));

// Combined workbook: distinct amounts and invoice counts for every side and currency.
const sale=table([invoice('USD',30,6.9,36.9),invoice('EUR',10,2.3,12.3)],'sprzedaż');
const result=c.formatReports([source,sale],options);
const summary=result.parts['xl/worksheets/sheet3.xml'];
assert.deepEqual(rows(summary).map(values).filter(r=>r[0]==='Zakup'||r[0]==='Sprzedaż'),[
  ['Zakup','Brak waluty',1,7,0,7],['Zakup','EUR',2,15,3.45,18.45],['Zakup','PLN',2,100.1,23.02,123.12],
  ['Sprzedaż','EUR',1,10,2.3,12.3],['Sprzedaż','USD',1,30,6.9,36.9]
]);
assert.ok(summary.includes('<dimension ref="A1:F9"/>'));
assert.ok(!summary.includes('sumy łączą'));

// No currency column: retain a single SUM; single foreign currency is still labelled.
const noCurrency=table([invoice('PLN',5,1,6).filter((_,i)=>i!==4)],'zakup',heads.filter((_,i)=>i!==4));
const np=c.prepare(noCurrency,options);
assert.equal(np.currencyGroups.length,1);
assert.ok(c.sheetXml(np,options,new c.Styles()).xml.includes('<f>SUM('));
const ep=c.prepare(table([invoice('EUR',20,4.6,24.6)]),options);
assert.equal(ep.info.gross,24.6);
assert.ok(c.sheetXml(ep,options,new c.Styles()).xml.includes('Razem EUR'));
for(const overrides of [{sum:false},{numbers:false}]){
  const opts={...options,...overrides},prepared=c.prepare(source,opts);
  assert.equal(prepared.sumRow,false);
  assert.ok(!c.sheetXml(prepared,opts,new c.Styles()).xml.includes('Razem'));
}
const strings=c.prepare(source,{...options,numbers:false});
assert.ok(strings.info.currencyTotals.every(g=>g.gross===null));

// Formula criteria must treat wildcard and quote characters literally and remain XML-safe.
const special=c.prepare(table([invoice('a*?"&',1,0,1)]),options);
const specialXml=c.sheetXml(special,options,new c.Styles()).xml;
assert.ok(specialXml.includes('A~*~?&quot;&quot;&amp;'));
console.log('Currency checks passed: per-currency sums/formulas, summary counts, corrections, normalization, unknown currencies and options.');
