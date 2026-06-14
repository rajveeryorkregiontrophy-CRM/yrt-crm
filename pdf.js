// ============================================================
// York Region Trophy — Document PDF generator
// Reproduces the YRT letterhead quotation / invoice exactly.
// Uses the browser's print-to-PDF via a styled hidden iframe.
// Shared by order.html (Quotation) and invoice.html (Invoice).
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

/**
 * docType: 'QUOTATION' or 'INVOICE'
 * data: {
 *   number, date, servicedBy, clientContact, pageNo,
 *   client: { company, lines:[address lines], tel, email },
 *   items: [{category, code, description, qty, unit, unitPrice, amount}],
 *   subtotal, hst, grandTotal, dueDate (invoice only)
 * }
 */
export function generateDocument(docType, data){
  const itemRows = (data.items||[]).map(it=>`
    <tr>
      <td class="c-item">${esc(it.category||'')}</td>
      <td class="c-code">${esc(it.code||'')}</td>
      <td class="c-desc">${esc(it.description||'')}</td>
      <td class="c-qty">${it.qty!=null?esc(String(it.qty)):''}</td>
      <td class="c-unit">${esc(it.unit||'')}</td>
      <td class="c-price">${it.unitPrice!=null?money(it.unitPrice):''}</td>
      <td class="c-amt">${it.amount!=null?money(it.amount):''}</td>
    </tr>`).join('');

  const clientLines = (data.client?.lines||[]).map(l=>`<div>${esc(l)}</div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docType} ${esc(data.number||'')}</title>
  <style>
    @page { size: letter; margin: 0.5in; }
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11px;line-height:1.35;}
    .head{border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:14px;}
    .co{font-size:23px;font-weight:800;letter-spacing:.5px;font-style:italic;}
    .co-addr{font-size:10px;font-weight:700;margin-top:3px;}
    .co-web{font-size:10px;font-weight:700;text-align:center;margin-top:2px;}
    .meta-row{display:flex;justify-content:space-between;margin-top:14px;}
    .bill{font-size:11px;line-height:1.5;}
    .bill .b-name{font-weight:700;}
    .doc-meta{text-align:right;}
    .doc-title{font-size:20px;font-weight:800;margin-bottom:8px;}
    .doc-meta table{border-collapse:collapse;margin-left:auto;}
    .doc-meta td{padding:2px 0;font-size:11px;}
    .doc-meta td.l{color:#333;text-align:right;padding-right:10px;font-weight:600;}
    .doc-meta td.v{font-weight:700;border-bottom:1px solid #999;min-width:120px;text-align:right;}
    table.items{width:100%;border-collapse:collapse;margin-top:18px;}
    table.items thead th{text-align:left;font-size:10px;border-bottom:1.5px solid #111;padding:6px 5px;text-transform:none;font-weight:700;}
    table.items thead th.c-qty,table.items thead th.c-price,table.items thead th.c-amt{text-align:right;}
    table.items tbody td{padding:7px 5px;font-size:10.5px;vertical-align:top;border-bottom:.5px solid #ddd;}
    .c-qty,.c-price,.c-amt{text-align:right;white-space:nowrap;}
    .c-code{font-family:monospace;}
    .c-desc{width:42%;}
    .totals{margin-top:24px;display:flex;justify-content:flex-end;}
    .totals table{border-collapse:collapse;min-width:260px;}
    .totals td{padding:5px 8px;font-size:11px;}
    .totals td.l{text-align:right;font-weight:600;color:#333;}
    .totals td.v{text-align:right;font-weight:700;border-bottom:1px solid #999;min-width:90px;}
    .totals tr.grand td{font-size:13px;font-weight:800;border-top:2px solid #111;border-bottom:none;padding-top:8px;}
    .foot{position:fixed;bottom:0.4in;left:0;right:0;border-top:1px solid #111;padding-top:6px;display:flex;justify-content:space-between;font-size:9.5px;color:#333;}
    .accept{font-size:10px;}
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
          <tr><td class="l">Number:</td><td class="v">${esc(data.number||'')}</td></tr>
          <tr><td class="l">Date:</td><td class="v">${esc(fmtLong(data.date))}</td></tr>
          ${docType==='INVOICE'&&data.dueDate?`<tr><td class="l">Due:</td><td class="v">${esc(fmtLong(data.dueDate))}</td></tr>`:''}
          <tr><td class="l">Serviced By:</td><td class="v">${esc(data.servicedBy||'')}</td></tr>
          ${data.clientContact?`<tr><td class="l">Client Contact:</td><td class="v">${esc(data.clientContact)}</td></tr>`:''}
          <tr><td class="l">Page #:</td><td class="v">${esc(String(data.pageNo||1))}</td></tr>
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
        <tr><td class="l">Sub Total:</td><td class="v">$${money(data.subtotal)}</td></tr>
        <tr><td class="l">G.S.T. / H.S.T.:</td><td class="v">$${money(data.hst)}</td></tr>
        <tr class="grand"><td class="l">Grand Total CAD:</td><td class="v">$${money(data.grandTotal)}</td></tr>
      </table>
    </div>

    <div class="accept" style="margin-top:40px;">Customer's Acceptance: ____________________________</div>

    <div class="foot">
      <div>${esc(YRT.gst)}<br>${esc(YRT.div)}</div>
      <div style="text-align:right;">${esc(YRT.name)}<br>${esc(YRT.web)}</div>
    </div>
  </body></html>`;

  // Render into a hidden iframe and trigger print (user picks Save as PDF)
  const iframe = document.createElement('iframe');
  iframe.style.position='fixed'; iframe.style.right='0'; iframe.style.bottom='0';
  iframe.style.width='0'; iframe.style.height='0'; iframe.style.border='0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  iframe.onload = ()=>{
    setTimeout(()=>{
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(()=>document.body.removeChild(iframe), 1000);
    }, 250);
  };
}