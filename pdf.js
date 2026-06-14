// ============================================================
// York Region Trophy — Document generator (jsPDF based)
// Produces a REAL .pdf file that downloads to the user's computer.
// No browser print header/footer/URL ever appears.
//   makePDF(docType, data)  -> downloads a real .pdf
//   printDoc(docType, data) -> opens browser print dialog (HTML version)
// ============================================================

const YRT = {
  name: 'YORK REGION TROPHY & PROMOTION',
  addr: 'UNIT 6 - 7777 KEELE STREET, CONCORD. ON. L4K 1Y7. TEL: 905-660 9952, EMAIL: yrtrophy@bellnet.ca',
  web:  'www.yorkregiontrophy.com',
  gst:  'GST / HST No.: 702433319',
  div:  'Div. of Silver Springs Investments Corp.'
};
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function fmtLong(d){ if(!d) return ''; const x=new Date(d+'T00:00:00'); return DOW[x.getDay()]+', '+String(x.getDate()).padStart(2,'0')+' '+MON[x.getMonth()]+', '+x.getFullYear(); }
function money(n){ return Number(n||0).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2}); }

let _jspdfPromise=null;
function loadJsPDF(){
  if(window.jspdf&&window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(_jspdfPromise) return _jspdfPromise;
  _jspdfPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=()=>resolve(window.jspdf.jsPDF);
    s.onerror=()=>reject(new Error('Could not load PDF library'));
    document.head.appendChild(s);
  });
  return _jspdfPromise;
}

export async function makePDF(docType, data){
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit:'pt', format:'letter' });
  const PW = 612, M = 40, RIGHT = PW - M;
  let y = 44;

  doc.setFont('helvetica','bolditalic'); doc.setFontSize(19); doc.setTextColor(17,17,17);
  doc.text(YRT.name, PW/2, y, {align:'center'}); y += 16;
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(34,34,34);
  doc.text(YRT.addr, PW/2, y, {align:'center'}); y += 11;
  doc.text(YRT.web, PW/2, y, {align:'center'}); y += 10;
  doc.setDrawColor(17,17,17); doc.setLineWidth(1.6); doc.line(M, y, RIGHT, y); y += 22;

  const metaTop = y;
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(17,17,17);
  doc.text(data.client?.company||'', M, y);
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(40,40,40);
  let ly = y + 14;
  (data.client?.lines||[]).forEach(l=>{ doc.text(String(l), M, ly); ly += 12; });
  if(data.client?.tel){ doc.text(String(data.client.tel), M, ly); ly += 12; }
  if(data.client?.email){ doc.text(String(data.client.email), M, ly); ly += 12; }

  doc.setFont('helvetica','bold'); doc.setFontSize(19); doc.setTextColor(17,17,17);
  doc.text(docType, RIGHT, metaTop+4, {align:'right'});
  const meta = [['Number', String(data.number||'')],['Date', fmtLong(data.date)],['Serviced By', data.servicedBy||'']];
  if(docType==='INVOICE' && data.dueDate) meta.push(['Due', fmtLong(data.dueDate)]);
  if(data.clientContact) meta.push(['Client Contact', data.clientContact]);
  meta.push(['Page', String(data.pageNo||1)]);
  let my = metaTop + 22;
  const metaLabelX = RIGHT - 150, metaValX = RIGHT;
  doc.setFontSize(9.5);
  meta.forEach(([k,v])=>{
    doc.setFont('helvetica','normal'); doc.setTextColor(70,70,70);
    doc.text(k, metaLabelX, my, {align:'left'});
    doc.setFont('helvetica','bold'); doc.setTextColor(17,17,17);
    doc.text(String(v), metaValX, my, {align:'right'});
    my += 15;
  });
  y = Math.max(ly, my) + 14;

  const cols = { item:M, code:M+78, desc:M+150, qty:M+322, unit:M+352, price:M+430, amount:RIGHT };
  doc.setDrawColor(17,17,17); doc.setLineWidth(1.2); doc.line(M, y, RIGHT, y); y += 13;
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(17,17,17);
  doc.text('ITEM', cols.item, y); doc.text('CODE', cols.code, y); doc.text('DESCRIPTION', cols.desc, y);
  doc.text('QTY', cols.qty, y, {align:'right'}); doc.text('UNIT', cols.unit, y);
  doc.text('UNIT PRICE', cols.price, y, {align:'right'}); doc.text('AMOUNT', cols.amount, y, {align:'right'});
  y += 6; doc.setLineWidth(0.6); doc.setDrawColor(120,120,120); doc.line(M, y, RIGHT, y); y += 14;

  const descWidth = cols.qty - cols.desc - 12;
  let grossTotal = 0, discTotal = 0;
  (data.items||[]).forEach(it=>{
    const gross = Number(it.amount)||0; grossTotal += gross;
    const discPct = parseFloat(it.discountPct)||0;
    const waived = gross*(discPct/100); discTotal += waived;
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(26,26,26);
    const descLines = doc.splitTextToSize(String(it.description||''), descWidth);
    const rowH = Math.max(descLines.length*11, 12);
    doc.setFont('helvetica','bold'); doc.text(String(it.category||''), cols.item, y);
    doc.setFont('courier','normal'); doc.setFontSize(8.5); doc.setTextColor(51,51,51);
    doc.text(String(it.code||''), cols.code, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(26,26,26);
    doc.text(descLines, cols.desc, y);
    doc.text(String(it.qty!=null?it.qty:''), cols.qty, y, {align:'right'});
    doc.text(String(it.unit||''), cols.unit, y);
    doc.text(money(it.unitPrice), cols.price, y, {align:'right'});
    doc.text(money(gross), cols.amount, y, {align:'right'});
    y += rowH + 4;
    if(discPct>0){
      doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(70,70,70);
      doc.text('Discount', cols.item, y);
      doc.text('Special Discount '+discPct.toFixed(2)+'%', cols.desc, y);
      doc.setTextColor(160,0,0); doc.setFont('helvetica','normal');
      doc.text('-'+money(waived), cols.amount, y, {align:'right'});
      y += 14;
    }
    doc.setDrawColor(216,216,216); doc.setLineWidth(0.4); doc.line(M, y-4, RIGHT, y-4);
  });

  y += 16;
  const tLabelX = RIGHT - 150, tValX = RIGHT;
  const totalRow = (label,val,opts={})=>{
    doc.setFont('helvetica', opts.bold?'bold':'normal');
    doc.setFontSize(opts.big?13:10);
    doc.setTextColor(opts.muted?85:17, opts.muted?85:17, opts.muted?85:17);
    doc.text(label, tLabelX, y); doc.text(val, tValX, y, {align:'right'});
    y += opts.big?20:15;
  };
  if(discTotal>0){ totalRow('Total', '$'+money(grossTotal), {muted:true}); totalRow('Discount', '-$'+money(discTotal), {muted:true}); }
  totalRow('Sub Total', '$'+money(data.subtotal), {bold:true});
  totalRow('G.S.T. / H.S.T.', '$'+money(data.hst), {bold:true});
  doc.setDrawColor(17,17,17); doc.setLineWidth(1.4); doc.line(tLabelX, y-6, RIGHT, y-6); y += 6;
  totalRow('Grand Total CAD', '$'+money(data.grandTotal), {bold:true, big:true});

  const fy = 792 - 40;
  doc.setDrawColor(150,150,150); doc.setLineWidth(0.5); doc.line(M, fy-12, RIGHT, fy-12);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(85,85,85);
  doc.text(YRT.gst, M, fy); doc.text(YRT.div, M, fy+10);
  doc.text(YRT.name, RIGHT, fy, {align:'right'}); doc.text(YRT.web, RIGHT, fy+10, {align:'right'});

  const fname = (docType==='INVOICE'?'Invoice':docType==='PURCHASE ORDER'?'PurchaseOrder':'Quotation')+'-'+(data.number||'doc')+'.pdf';
  doc.save(fname);
}

export function printDoc(docType, data){
  const html = buildPrintHTML(docType, data);
  const iframe = document.createElement('iframe');
  iframe.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const d=iframe.contentWindow.document; d.open(); d.write(html); d.close();
  iframe.onload=()=>{ setTimeout(()=>{ iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(()=>iframe.remove(),1500); },250); };
}

function buildPrintHTML(docType, data){
  const grossTotal=(data.items||[]).reduce((s,it)=>s+(Number(it.amount)||0),0);
  const discTotal=(data.items||[]).reduce((s,it)=>s+((Number(it.amount)||0)*((parseFloat(it.discountPct)||0)/100)),0);
  const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML;};
  const rows=(data.items||[]).map(it=>{
    const gross=Number(it.amount)||0;const dp=parseFloat(it.discountPct)||0;const w=gross*(dp/100);
    let r=`<tr><td><b>${esc(it.category||'')}</b></td><td style="font-family:monospace">${esc(it.code||'')}</td><td>${esc(it.description||'')}</td><td style="text-align:right">${it.qty??''}</td><td>${esc(it.unit||'')}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(gross)}</td></tr>`;
    if(dp>0)r+=`<tr><td style="font-style:italic;color:#555">Discount</td><td></td><td style="font-style:italic;color:#555">Special Discount ${dp.toFixed(2)}%</td><td></td><td></td><td></td><td style="text-align:right;color:#a00">-${money(w)}</td></tr>`;
    return r;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset=utf-8><title> </title><style>
    @page{size:letter;margin:0.5in;}*{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,sans-serif;color:#1a1a1a;font-size:11px;}
    .h{text-align:center;border-bottom:2.5px solid #111;padding-bottom:10px;margin-bottom:20px;}
    .co{font-size:23px;font-weight:800;font-style:italic;}.ad{font-size:9px;font-weight:700;margin-top:4px;}
    .mr{display:flex;justify-content:space-between;margin-bottom:6px;}
    .bn{font-weight:800;font-size:12px;}.dt{font-size:21px;font-weight:800;text-align:right;}
    .mt td{padding:2px 0;font-size:10px;}.mt .l{color:#444;padding-right:14px;}.mt .v{font-weight:700;text-align:right;}
    table.it{width:100%;border-collapse:collapse;margin-top:16px;}
    table.it th{font-size:8px;text-transform:uppercase;border-bottom:1.5px solid #111;padding:6px 5px;text-align:left;}
    table.it td{padding:7px 5px;font-size:10px;border-bottom:.5px solid #ddd;vertical-align:top;}
    .tot{margin-top:20px;margin-left:auto;width:280px;}.tot td{padding:5px 8px;font-size:11px;}
    .tot .v{text-align:right;font-weight:700;}.tot .g td{font-size:13px;font-weight:800;border-top:2px solid #111;}
    .ft{position:fixed;bottom:.35in;left:.5in;right:.5in;border-top:1px solid #999;padding-top:6px;display:flex;justify-content:space-between;font-size:8px;color:#555;}
  </style></head><body>
    <div class="h"><div class="co">${esc(YRT.name)}</div><div class="ad">${esc(YRT.addr)}</div><div class="ad">${esc(YRT.web)}</div></div>
    <div class="mr"><div><div class="bn">${esc(data.client?.company||'')}</div>${(data.client?.lines||[]).map(l=>`<div>${esc(l)}</div>`).join('')}${data.client?.tel?`<div>${esc(data.client.tel)}</div>`:''}${data.client?.email?`<div>${esc(data.client.email)}</div>`:''}</div>
    <div style="min-width:250px"><div class="dt">${docType}</div><table class="mt" style="width:100%;margin-top:8px">
      <tr><td class="l">Number</td><td class="v">${esc(data.number||'')}</td></tr>
      <tr><td class="l">Date</td><td class="v">${esc(fmtLong(data.date))}</td></tr>
      <tr><td class="l">Serviced By</td><td class="v">${esc(data.servicedBy||'')}</td></tr>
      ${data.clientContact?`<tr><td class="l">Client Contact</td><td class="v">${esc(data.clientContact)}</td></tr>`:''}
      <tr><td class="l">Page</td><td class="v">${data.pageNo||1}</td></tr>
    </table></div></div>
    <table class="it"><thead><tr><th>Item</th><th>Code</th><th>Description</th><th style="text-align:right">Qty</th><th>Unit</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <table class="tot">${discTotal>0?`<tr><td>Total</td><td class="v">$${money(grossTotal)}</td></tr><tr><td>Discount</td><td class="v">-$${money(discTotal)}</td></tr>`:''}
      <tr><td>Sub Total</td><td class="v">$${money(data.subtotal)}</td></tr>
      <tr><td>G.S.T. / H.S.T.</td><td class="v">$${money(data.hst)}</td></tr>
      <tr class="g"><td>Grand Total CAD</td><td class="v">$${money(data.grandTotal)}</td></tr></table>
    <div class="ft"><div>${esc(YRT.gst)}<br>${esc(YRT.div)}</div><div style="text-align:right">${esc(YRT.name)}<br>${esc(YRT.web)}</div></div>
  </body></html>`;
}

export function generateDocument(docType, data, mode){
  if(mode==='print') return printDoc(docType, data);
  return makePDF(docType, data);
}