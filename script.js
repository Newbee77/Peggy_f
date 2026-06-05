async function loadText(file, containerId){
  try{
    const res = await fetch(file);
    if(!res.ok) throw new Error('Inget innehåll');
    const text = await res.text();
    document.getElementById(containerId).innerHTML = renderMarkdown(text);
  }catch(e){
    document.getElementById(containerId).innerHTML = '<p>Inget innehåll. Skapa filen: '+file+'</p>';
  }
}

function renderMarkdown(md){
  // Mycket enkel markdown -> HTML (rubriker, paragraf, listor, tabeller)
  let html = '';
  let inList = false;
  let inTable = false;
  let tableLines = [];
  let paragraphLines = [];

  const applyInlineFormatting = (text) => {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>');
  };

  const renderTable = (lines) => {
    if(!lines.length) return '';
    const rows = lines.map(line => line.replace(/^\||\|$/g, '').split('|').map(cell => applyInlineFormatting(cell.trim())));
    let bodyStart = 1;
    const dividerRow = rows.length > 1 ? rows[1] : [];
    const isDivider = dividerRow.length && dividerRow.every(cell => /^:?-+:?$/.test(cell));
    if(isDivider) bodyStart = 2;

    let tableHtml = '<table><thead><tr>';
    rows[0].forEach(cell => { tableHtml += `<th>${cell}</th>`; });
    tableHtml += '</tr></thead><tbody>';

    for(let i = bodyStart; i < rows.length; i++){
      const row = rows[i];
      if(row.every(cell => cell === '')) continue;
      tableHtml += '<tr>';
      row.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
      tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';
    return tableHtml;
  };

  const closeTable = () => {
    if(inTable){
      html += renderTable(tableLines);
      tableLines = [];
      inTable = false;
    }
  };

  const closeList = () => {
    if(inList){ html += '</ul>'; inList = false; }
  };

  const flushParagraph = () => {
    if(paragraphLines.length){
      html += '<p>'+applyInlineFormatting(paragraphLines.join('<br>'))+'</p>';
      paragraphLines = [];
    }
  };

  md.split('\n').forEach(line => {
    const trimmed = line.trim();
    if(!trimmed){
      closeTable();
      closeList();
      flushParagraph();
      return;
    }

    const isTableLine = trimmed.includes('|') && trimmed.split('|').length >= 3;
    if(isTableLine){
      closeList();
      flushParagraph();
      inTable = true;
      tableLines.push(trimmed);
      return;
    }

    if(inTable){
      closeTable();
    }

    if(trimmed.startsWith('# ')){
      closeList();
      flushParagraph();
      html += '<h1>'+applyInlineFormatting(trimmed.slice(2).trim())+'</h1>';
      return;
    }

    if(trimmed.startsWith('## ')){
      closeList();
      flushParagraph();
      html += '<h2>'+applyInlineFormatting(trimmed.slice(3).trim())+'</h2>';
      return;
    }

    const listMatch = trimmed.match(/^[-*] (.*)$/);
    if(listMatch){
      flushParagraph();
      if(!inList){ html += '<ul>'; inList = true; }
      html += '<li>'+applyInlineFormatting(listMatch[1].trim())+'</li>';
      return;
    }

    closeList();
    paragraphLines.push(trimmed);
  });

  closeTable();
  closeList();
  flushParagraph();
  return html;
}

function escapeHtml(s){return s.replace(/[&<>]/g,ch=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[ch]))}

async function loadGallery(){
  // gallery.html genereras av build_gallery.py
  try{
    const res = await fetch('gallery.html');
    if(!res.ok) throw new Error('Ingen gallery.html');
    const html = await res.text();
    document.getElementById('gallery-content').innerHTML = html;
  }catch(e){
    document.getElementById('gallery-content').innerHTML = '<p>Galleriet saknas. Kör `python3 build_gallery.py --src ../Gallery_img --out .` för att generera.</p>';
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  loadText('about.md','about-content');
  loadText('menu.md','menu-content');
  loadText('contact.md','contact-content');
  loadGallery();

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  if(navToggle && nav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>{
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

// Lightbox: attach after gallery loaded
async function attachLightbox(){
  // wait for gallery-content to exist
  const container = document.getElementById('gallery-content');
  if(!container) return;
  // small delay if gallery is generated asynchronously
  await new Promise(r=>setTimeout(r,150));
  container.querySelectorAll('img').forEach(img=>{
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', ()=>openLightbox(img.src, img.alt));
  });
}

function openLightbox(src, alt){
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<img src="${src}" alt="${escapeHtml(alt||'')}">`;
  lb.addEventListener('click', ()=> lb.remove());
  document.body.appendChild(lb);
}

// Re-run attach when gallery loads
const obs = new MutationObserver((m)=>{
  if(document.getElementById('gallery-content')) attachLightbox();
});
obs.observe(document.getElementById('gallery-content') || document.body, {childList:true, subtree:true});
