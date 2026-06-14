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

// Opens a full preview of the document in a new tab with a Print / Save-as-PDF toolbar.
// Uses a Blob URL (not about:blank) so the browser footer doesn't show "about:blank".
export function generateDocument(docType, data, mode){
  const docHtml = buildDocumentHTML(docType, data);

  // If a specific mode is forced (legacy callers), honor it via hidden iframe for print.
  if(mode==='print'){
    const iframe=document.createElement('iframe');
    iframe.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const d=iframe.contentWindow.document; d.open(); d.write(docHtml); d.close();
    iframe.onload=()=>{ setTimeout(()=>{ iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(()=>iframe.remove(),1500); },250); };
    return;
  }

  // Default: open a preview page with a toolbar.
  const previewHtml = buildPreviewPage(docHtml);
  const blob = new Blob([previewHtml], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if(!win){ alert('Please allow pop-ups for this site to preview and save the document.'); URL.revokeObjectURL(url); return; }
  // revoke shortly after load to free memory
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

// Wraps the document in a preview shell with a floating toolbar (Print / Save as PDF).
function buildPreviewPage(docHtml){
  // strip the doc's <html>/<head>/<body> wrappers and inline its <style> + body
  const styleMatch = docHtml.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch  = docHtml.match(/<body>([\s\S]*?)<\/body>/);
  const docStyle = styleMatch ? styleMatch[1] : '';
  const docBody  = bodyMatch ? bodyMatch[1] : docHtml;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title> </title>
  <style>
    ${docStyle}
    /* preview shell */
    @media screen{
      body{background:#3a3d44;padding:30px 16px 60px;}
      .sheet{background:#fff;max-width:8.5in;margin:0 auto;padding:0.5in;box-shadow:0 8px 40px rgba(0,0,0,.4);}
      .pv-bar{position:fixed;top:0;left:0;right:0;height:56px;background:#16181d;border-bottom:1px solid #414a5c;display:flex;align-items:center;justify-content:center;gap:12px;z-index:1000;box-shadow:0 2px 12px rgba(0,0,0,.3);}
      .pv-bar .t{position:absolute;left:20px;color:#c4cad6;font-family:Arial,sans-serif;font-size:13px;font-weight:600;}
      .pv-btn{font-family:Arial,sans-serif;font-size:13.5px;font-weight:700;padding:10px 20px;border-radius:8px;cursor:pointer;border:1px solid #414a5c;background:#1f2229;color:#eef0f4;}
      .pv-btn:hover{border-color:#9098a8;}
      .pv-btn.primary{background:#f4f6fb;color:#15171c;border-color:#f4f6fb;}
      .pv-btn.primary:hover{filter:brightness(.95);}
      body{padding-top:86px;}
    }
    /* when printing, hide the shell entirely — only the sheet prints */
    @media print{
      .pv-bar{display:none !important;}
      body{background:#fff;padding:0;}
      .sheet{box-shadow:none;max-width:none;margin:0;padding:0;}
    }
  </style></head>
  <body>
    <div class="pv-bar">
      <span class="t">Preview — review before saving or printing</span>
      <button class="pv-btn primary" onclick="window.print()">Save as PDF / Print</button>
      <button class="pv-btn" onclick="window.close()">Close</button>
    </div>
    <div class="sheet">${docBody}</div>
  </body></html>`;
}