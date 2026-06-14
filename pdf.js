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
  let y = 40;

  // ---- address line FIRST (top), then centered company name ----
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(20,20,20);
  doc.text(YRT.addr, PW/2, y, {align:'center'}); y += 16;
  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(0,0,0);
  doc.text(YRT.name, PW/2, y, {align:'center'}); y += 13;
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(20,20,20);
  doc.text(YRT.web, PW/2, y, {align:'center'}); y += 18;

  // ---- bill-to (left) + doc meta (right) ----
  const metaTop = y;
  // right-side title
  doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor(0,0,0);
  doc.text(docType, RIGHT, metaTop, {align:'right'});

  // left: client block
  doc.setFont('helvetica','bold'); doc.setFontSize(10.5); doc.setTextColor(0,0,0);
  doc.text(data.client?.company||'', M, metaTop);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,30,30);
  let ly = metaTop + 13;
  (data.client?.lines||[]).forEach(l=>{ doc.text(String(l), M, ly); ly += 11; });
  if(data.client?.tel){ doc.text(String(data.client.tel), M, ly); ly += 11; }
  if(data.client?.email){ doc.text(String(data.client.email), M, ly); ly += 11; }

  // right: meta rows (label : value), values right-aligned with underline like FileMaker
  const meta = [
    ['Number:', String(data.number||'')],
    ['Date:', fmtLong(data.date)],
    ['Serviced By:', data.servicedBy||''],
  ];
  if(docType==='INVOICE' && data.dueDate) meta.push(['Due:', fmtLong(data.dueDate)]);
  if(data.clientContact) meta.push(['Client Contact:', data.clientContact]);
  meta.push(['Page #:', String(data.pageNo||1)]);
  let my = metaTop + 16;
  doc.setFontSize(9);
  meta.forEach(([k,v])=>{
    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.text(k, RIGHT-130, my, {align:'left'});
    doc.setFont('helvetica','bold');
    doc.text(String(v), RIGHT, my, {align:'right'});
    my += 13;
  });

  y = Math.max(ly, my) + 10;

  // ---- items table header ----
  const cols = { item:M, code:M+82, desc:M+150, qty:M+340, unit:M+372, price:M+438, amount:RIGHT };
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(0,0,0);
  doc.text('Item', cols.item, y);
  doc.text('Code', cols.code, y);
  doc.text('Description', cols.desc, y);
  doc.text('Qty', cols.qty, y, {align:'right'});
  doc.text('Unit', cols.unit, y);
  doc.text('Unit Price', cols.price, y, {align:'right'});
  doc.text('Amount', cols.amount, y, {align:'right'});
  y += 4; doc.setDrawColor(0,0,0); doc.setLineWidth(0.6); doc.line(M, y, RIGHT, y); y += 14;

  // ---- items ----
  const descWidth = cols.qty - cols.desc - 14;
  let grossTotal = 0, discTotal = 0;
  doc.setFontSize(9);
  (data.items||[]).forEach(it=>{
    const gross = Number(it.amount)||0; grossTotal += gross;
    const discPct = parseFloat(it.discountPct)||0;
    const waived = gross*(discPct/100); discTotal += waived;
    const descLines = doc.splitTextToSize(String(it.description||''), descWidth);
    const rowH = Math.max(descLines.length*10.5, 11);

    doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.text(String(it.category||''), cols.item, y);
    doc.text(String(it.code||''), cols.code, y);
    doc.text(descLines, cols.desc, y);
    doc.text(String(it.qty!=null?it.qty:''), cols.qty, y, {align:'right'});
    doc.text(money(it.unitPrice), cols.price, y, {align:'right'});
    doc.text(money(gross), cols.amount, y, {align:'right'});
    // unit sits just under qty area like the reference
    doc.text(String(it.unit||''), cols.unit, y + (rowH>11? 11 : 0) );
    y += rowH + 3;

    if(discPct>0){
      doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
      doc.text('Discount', cols.item, y);
      doc.text('Special Discount '+discPct.toFixed(2)+'%', cols.desc, y);
      doc.text('-'+money(waived), cols.amount, y, {align:'right'});
      y += 12;
    }
    y += 4;
  });

  // ---- totals block (right) ----
  y += 10;
  const tValX = RIGHT, tLabelX = RIGHT - 200;
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,0,0);
  doc.text('Sub Total:', tLabelX, y, {align:'left'}); doc.text('$'+money(data.subtotal), tValX, y, {align:'right'}); y += 15;
  doc.text('G.S.T. / H.S.T.:', tLabelX, y, {align:'left'}); doc.text('$'+money(data.hst), tValX, y, {align:'right'}); y += 15;
  doc.text('Grand Total CAD:', tLabelX, y, {align:'left'}); doc.text('$'+money(data.grandTotal), tValX, y, {align:'right'}); y += 24;

  // ---- Customer's Acceptance ----
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(0,0,0);
  doc.text("Customer's Acceptance", M, y); 
  doc.setDrawColor(0,0,0); doc.setLineWidth(0.4); doc.line(M+130, y, M+300, y);
  y += 20;

  // ---- Total / Discount summary line (like the reference bottom) ----
  if(discTotal>0){
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(0,0,0);
    doc.text('Total: $'+money(grossTotal)+'    Discount: $-'+money(discTotal), M, y);
  }

  // ---- footer ----
  const fy = 792 - 36;
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(0,0,0);
  doc.text(YRT.gst, M, fy);
  doc.text(YRT.div, M, fy+10);

  const fname = (docType==='INVOICE'?'Invoice':docType==='PURCHASE ORDER'?'PurchaseOrder':'Quotation')+'.pdf';
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