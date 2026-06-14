// ============================================================
// York Region Trophy — Document PDF generator
// Corporate quotation / invoice on YRT letterhead.
// generateDocument(docType, data, mode)  mode = 'print' | 'pdf'
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
function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }

export function buildDocumentHTML(docType, data){
  const itemRows = (data.items||[]).map(it=>{
    const discPct = parseFloat(it.discountPct)||0;
    const gross = it.amount!=null ? Number(it.amount) : 0;
    const waived = gross*(discPct/100);
    let rows = `
    <tr>
      <td class="c-item">${esc(it.category||'')}</td>
      <td class="c-code">${esc(it.code||'')}</td>
      <td class="c-desc">${esc(it.description||'')}</td>
      <td class="c-qty">${it.qty!=null?esc(String(it.qty)):''}</td>
      <td class="c-unit">${esc(it.unit||'')}</td>
      <td class="c-price">${it.unitPrice!=null?money(it.unitPrice):''}</td>
      <td class="c-amt">${money(gross)}</td>
    </tr>`;
    if(discPct>0){
      rows += `
    <tr class="disc-row">
      <td class="c-item">Discount</td>
      <td class="c-code"></td>
      <td class="c-desc">Special Discount ${discPct.toFixed(2)}%</td>
      <td class="c-qty"></td><td class="c-unit"></td><td class="c-price"></td>
      <td class="c-amt">−${money(waived)}</td>
    </tr>`;
    }
    return rows;
  }).join('');

  const grossTotal = (data.items||[]).reduce((s,it)=>s+(Number(it.amount)||0),0);
  const discTotal  = (data.items||[]).reduce((s,it)=>s+((Number(it.amount)||0)*((parseFloat(it.discountPct)||0)/100)),0);

  const clientLines = (data.client?.lines||[]).map(l=>`<div>${esc(l)}</div>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title> </title>
  <style>
    @page { size: letter; margin: 0.5in; }
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:11px;line-height:1.4;}

    /* ---- centered corporate letterhead ---- */
    .head{text-align:center;border-bottom:2.5px solid #111;padding-bottom:11px;margin-bottom:22px;}
    .co{font-size:25px;font-weight:800;letter-spacing:.4px;font-style:italic;color:#111;}
    .co-addr{font-size:9.5px;font-weight:700;margin-top:5px;color:#222;letter-spacing:.1px;}
    .co-web{font-size:9.5px;font-weight:700;margin-top:2px;color:#222;}

    /* ---- meta row: client block left, doc info right ---- */
    .meta-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
    .bill{font-size:11px;line-height:1.55;}
    .bill .b-name{font-weight:800;font-size:12.5px;margin-bottom:2px;}
    .doc-meta{min-width:260px;}
    .doc-title{font-size:22px;font-weight:800;text-align:right;letter-spacing:1px;margin-bottom:10px;color:#111;}
    .doc-meta table{border-collapse:collapse;width:100%;}
    .doc-meta td{padding:3px 0;font-size:11px;}
    .doc-meta td.l{color:#444;text-align:left;font-weight:600;padding-right:14px;white-space:nowrap;}
    .doc-meta td.v{font-weight:700;text-align:right;color:#111;}

    /* ---- items ---- */
    table.items{width:100%;border-collapse:collapse;margin-top:20px;}
    table.items thead th{text-align:left;font-size:9.5px;border-bottom:1.5px solid #111;padding:7px 6px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#111;}
    table.items thead th.c-qty,table.items thead th.c-price,table.items thead th.c-amt{text-align:right;}
    table.items tbody td{padding:8px 6px;font-size:10.5px;vertical-align:top;border-bottom:.5px solid #d8d8d8;}
    .c-item{font-weight:600;}
    .c-qty,.c-price,.c-amt{text-align:right;white-space:nowrap;}
    .c-code{font-family:'Courier New',monospace;font-size:10px;color:#333;}
    .c-desc{width:40%;}
    tr.disc-row td{color:#444;font-style:italic;font-size:10px;border-bottom:.5px solid #d8d8d8;padding-top:2px;}
    tr.disc-row .c-amt{color:#a00;font-style:normal;}
    .totals tr.pre td{font-size:10.5px;color:#555;padding:3px 10px;}

    /* ---- totals ---- */
    .totals{margin-top:26px;display:flex;justify-content:flex-end;}
    .totals table{border-collapse:collapse;min-width:280px;}
    .totals td{padding:6px 10px;font-size:11px;}
    .totals td.l{text-align:left;font-weight:600;color:#444;}
    .totals td.v{text-align:right;font-weight:700;color:#111;min-width:100px;}
    .totals tr.sub td,.totals tr.tax td{border-bottom:1px solid #ddd;}
    .totals tr.grand td{font-size:14px;font-weight:800;border-top:2px solid #111;padding-top:10px;color:#111;}

    /* ---- footer ---- */
    .foot{position:fixed;bottom:0.35in;left:0.5in;right:0.5in;border-top:1px solid #999;padding-top:7px;display:flex;justify-content:space-between;font-size:9px;color:#555;}
    .foot .r{text-align:right;}
  </style></head>
  <body>
    <div class="head">
      <div class="co">${esc(YRT.name)}</div>
      <div class="co-addr">${esc(YRT.addr)}</div>
      <div class="co-web">${esc(YRT.web)}</div>
    </div>

    <div class="meta-row">
      <div class="bill">
        <div class="b-name">${esc(data.client?.company||'')}</div>
        ${clientLines}
        ${data.client?.tel?`<div>${esc(data.client.tel)}</div>`:''}
        ${data.client?.email?`<div>${esc(data.client.email)}</div>`:''}
      </div>
      <div class="doc-meta">
        <div class="doc-title">${docType}</div>
        <table>
          <tr><td class="l">Number</td><td class="v">${esc(data.number||'')}</td></tr>
          <tr><td class="l">Date</td><td class="v">${esc(fmtLong(data.date))}</td></tr>
          ${docType==='INVOICE'&&data.dueDate?`<tr><td class="l">Due</td><td class="v">${esc(fmtLong(data.dueDate))}</td></tr>`:''}
          <tr><td class="l">Serviced By</td><td class="v">${esc(data.servicedBy||'')}</td></tr>
          ${data.clientContact?`<tr><td class="l">Client Contact</td><td class="v">${esc(data.clientContact)}</td></tr>`:''}
          <tr><td class="l">Page</td><td class="v">${esc(String(data.pageNo||1))}</td></tr>
        </table>
      </div>
    </div>

    <table class="items">
      <thead><tr>
        <th class="c-item">Item</th><th class="c-code">Code</th><th class="c-desc">Description</th>
        <th class="c-qty">Qty</th><th class="c-unit">Unit</th><th class="c-price">Unit Price</th><th class="c-amt">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      <table>
        ${discTotal>0?`<tr class="pre"><td class="l">Total</td><td class="v">$${money(grossTotal)}</td></tr>
        <tr class="pre"><td class="l">Discount</td><td class="v">−$${money(discTotal)}</td></tr>`:''}
        <tr class="sub"><td class="l">Sub Total</td><td class="v">$${money(data.subtotal)}</td></tr>
        <tr class="tax"><td class="l">G.S.T. / H.S.T.</td><td class="v">$${money(data.hst)}</td></tr>
        <tr class="grand"><td class="l">Grand Total CAD</td><td class="v">$${money(data.grandTotal)}</td></tr>
      </table>
    </div>

    <div class="foot">
      <div>${esc(YRT.gst)}<br>${esc(YRT.div)}</div>
      <div class="r">${esc(YRT.name)}<br>${esc(YRT.web)}</div>
    </div>
  </body></html>`;
}

// Renders the document and opens the print dialog directly (no preview page).
// Uses a hidden iframe so the browser footer shows a clean/empty URL (not a blob: address).
export function generateDocument(docType, data, mode){
  const html = buildDocumentHTML(docType, data);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const d = iframe.contentWindow.document;
  d.open(); d.write(html); d.close();
  iframe.onload = ()=>{
    setTimeout(()=>{
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(()=>iframe.remove(), 1500);
    }, 250);
  };
}