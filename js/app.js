document.addEventListener("DOMContentLoaded",()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

/* HEADER */
const header=$(".header");
if(header){
  const toggleHeader=()=>header.classList.toggle("scrolled",window.scrollY>80);
  toggleHeader();
  window.addEventListener("scroll",toggleHeader,{passive:true});
}

/* WHATSAPP */
const whatsappDropdown=$(".whatsapp-dropdown");
const whatsappToggle=$(".whatsapp-toggle");
const whatsappMenu=$(".whatsapp-menu");
if(whatsappDropdown&&whatsappToggle&&whatsappMenu){
  whatsappToggle.addEventListener("click",e=>{
    e.stopPropagation();
    whatsappDropdown.classList.toggle("active");
  });
  whatsappMenu.addEventListener("click",e=>e.stopPropagation());
  document.addEventListener("click",()=>whatsappDropdown.classList.remove("active"));
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape")whatsappDropdown.classList.remove("active");
  });
}

/* TABS DE LÍNEAS */
const suitTabs=$$(".suit-tab");
const suitLines=$$(".suit-line");
const showSuitLine=linea=>{
  suitLines.forEach(line=>line.classList.toggle("active",line.dataset.lineaContent===linea));
  suitTabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.linea===linea));
};
if(suitTabs.length&&suitLines.length){
  suitTabs.forEach(tab=>tab.addEventListener("click",()=>showSuitLine(tab.dataset.linea)));
  showSuitLine("linea1");
}

/* LIGHTBOX */
const lightbox=$("#imageLightbox");
if(lightbox){
  const lightboxImg=lightbox.querySelector("img");
  const lightboxClose=lightbox.querySelector(".lightbox-close");
  $$(".suit-gallery-compact img").forEach(img=>{
    img.addEventListener("click",()=>{
      lightboxImg.src=img.src;
      lightboxImg.alt=img.alt;
      lightbox.classList.add("active");
    });
  });
  lightboxClose?.addEventListener("click",()=>lightbox.classList.remove("active"));
  lightbox.addEventListener("click",e=>{
    if(e.target===lightbox)lightbox.classList.remove("active");
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape")lightbox.classList.remove("active");
  });
}

/* EDITOR 2D LIMPIO */
const editor2dCanvas=$("#editor2dCanvas");
const suitStage=$("#suitStage");
const textLayer=$("#editorTextLayer")||$(".editor-text-layer",editor2dCanvas);
const customLayer=$("#editorCustomLayer")||$(".editor-custom-layer",editor2dCanvas);
const selectedPieceName=$("#selectedPieceName");
const pieceColor=$("#pieceColor");
const riderName=$("#riderName");
const riderNumber=$("#riderNumber");
const currentViewLabel=$("#editorCurrentViewLabel");
const logoUpload=$("#logoUpload");
const addLogoBtn=$("#addLogoBtn");
const addTextBtn=$("#addTextBtn");
const exportDesignBtn=$("#exportDesignBtn");

let currentView="front";
let selectedPiece=null;
let hoveredPiece=null;
let selectedDesignItem=null;
let renderedPieces=[];
let customItems=[];
const pieceColors={};

const viewLabels={front:"Frontal",back:"Trasero",perfil:"Perfil"};

const cleanName=name=>String(name||"Pieza").replace(/[-_]/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,c=>c.toUpperCase());

const hexToHue=hex=>{
  const value=String(hex||"").replace("#","");
  if(value.length!==6)return 0;
  const r=parseInt(value.slice(0,2),16)/255;
  const g=parseInt(value.slice(2,4),16)/255;
  const b=parseInt(value.slice(4,6),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d===0)h=0;
  else if(max===r)h=60*(((g-b)/d)%6);
  else if(max===g)h=60*(((b-r)/d)+2);
  else h=60*(((r-g)/d)+4);
  return Math.round(h<0?h+360:h);
};

const colorFilter=color=>{
  if(!color||color==="#ffffff")return "";
  if(color==="#111111"||color==="#000000")return "brightness(.18) contrast(1.45) saturate(.7)";
  return `sepia(1) saturate(7) hue-rotate(${hexToHue(color)}deg) brightness(.9) contrast(1.08)`;
};

const imageCandidates=(view,piece)=>{
  const names=[piece.file,piece.src,piece.name&&`${piece.name}.png`,piece.name&&`${piece.name}.webp`].filter(Boolean);
  const unique=[...new Set(names)];
  const paths=[];
  unique.forEach(name=>{
    paths.push(`images/${view}/${name}`);
    paths.push(`images/${name}`);
    paths.push(`images/piezas/${view}/${name}`);
    paths.push(`images/piezas/${name}`);
  });
  return [...new Set(paths)];
};

const loadWithFallback=(img,paths,index=0)=>{
  if(index>=paths.length){
    img.dataset.missing="true";
    console.warn("No se encontró imagen:",img.alt,paths);
    return;
  }
  img.onerror=()=>loadWithFallback(img,paths,index+1);
  img.src=paths[index];
};

const buildAlphaCtx=img=>{
  const c=document.createElement("canvas");
  c.width=img.naturalWidth||1;
  c.height=img.naturalHeight||1;
  const ctx=c.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,c.width,c.height);
  return ctx;
};

const getImageDrawRect=img=>{
  const canvasRect=editor2dCanvas.getBoundingClientRect();
  const iw=img.naturalWidth||1;
  const ih=img.naturalHeight||1;
  const cw=canvasRect.width;
  const ch=canvasRect.height;
  const scale=Math.min(cw/iw,ch/ih);
  const w=iw*scale;
  const h=ih*scale;
  const x=(cw-w)/2;
  const y=(ch-h)/2;
  return {x,y,w,h,scale,cw,ch,iw,ih};
};

const pointOnImage=(e,img)=>{
  const rect=editor2dCanvas.getBoundingClientRect();
  const d=getImageDrawRect(img);
  const x=e.clientX-rect.left-d.x;
  const y=e.clientY-rect.top-d.y;
  if(x<0||y<0||x>d.w||y>d.h)return null;
  return {
    x:Math.max(0,Math.min(d.iw-1,Math.floor(x/d.w*d.iw))),
    y:Math.max(0,Math.min(d.ih-1,Math.floor(y/d.h*d.ih)))
  };
};

const hitTest=e=>{
  for(let i=renderedPieces.length-1;i>=0;i--){
    const item=renderedPieces[i];
    if(item.editable===false||!item.alphaCtx||!item.el.complete)continue;
    const p=pointOnImage(e,item.el);
    if(!p)continue;
    const alpha=item.alphaCtx.getImageData(p.x,p.y,1,1).data[3];
    if(alpha>12)return item;
  }
  return null;
};

const clearActivePieces=()=>renderedPieces.forEach(p=>p.el.classList.remove("active"));
const clearHover=()=>renderedPieces.forEach(p=>p.el.classList.remove("hovered"));

const selectPiece=item=>{
  clearActivePieces();
  selectedPiece=item;
  if(!item){
    if(selectedPieceName)selectedPieceName.textContent="Ninguna";
    return;
  }
  item.el.classList.add("active");
  if(selectedPieceName)selectedPieceName.textContent=cleanName(item.name||item.id);
  if(pieceColor)pieceColor.value=pieceColors[item.id]||"#ffffff";
};

const applyColor=(item,color)=>{
  if(!item||!color)return;
  pieceColors[item.id]=color;
  item.color=color;
  item.el.style.filter=colorFilter(color);
  if(pieceColor)pieceColor.value=color;
};

const renderTextOverlays=()=>{
  if(!textLayer)return;
  textLayer.innerHTML="";
  const name=(riderName?.value||"").trim().toUpperCase();
  const num=(riderNumber?.value||"").trim();

  if(name){
    const el=document.createElement("div");
    el.className="editor-name-text";
    el.textContent=name;
    textLayer.appendChild(el);
  }

  if(num&&(currentView==="back"||currentView==="perfil")){
    const el=document.createElement("div");
    el.className="editor-number-text";
    el.textContent=num;
    textLayer.appendChild(el);
  }
};

const renderEditorView=view=>{
  if(!editor2dCanvas||!suitStage||!window.KILLIAN_PIECES)return;
  currentView=view;
  selectedPiece=null;
  hoveredPiece=null;
  renderedPieces=[];
  suitStage.innerHTML="";
  editor2dCanvas.dataset.view=view;
  if(currentViewLabel)currentViewLabel.textContent=viewLabels[view]||view;
  if(selectedPieceName)selectedPieceName.textContent="Ninguna";

  const pieces=window.KILLIAN_PIECES[view]||[];
  pieces.forEach((piece,index)=>{
    const img=document.createElement("img");
    img.alt=piece.name||piece.id||`pieza-${index}`;
    img.className=`suit-piece ${piece.editable===false?"support-piece":"editable-piece"}`;
    img.dataset.id=piece.id||`${view}_${index}`;
    img.draggable=false;
    img.loading="eager";
    img.style.zIndex=index+1;

    const item={...piece,id:img.dataset.id,el:img,alphaCtx:null,color:pieceColors[img.dataset.id]||"#ffffff"};

    if(item.editable!==false&&item.color&&item.color!=="#ffffff")img.style.filter=colorFilter(item.color);

    img.addEventListener("load",()=>{
      try{item.alphaCtx=buildAlphaCtx(img);}
      catch(err){console.warn("No se pudo leer alpha:",img.alt,err);}
    });

    renderedPieces.push(item);
    suitStage.appendChild(img);
    loadWithFallback(img,imageCandidates(view,piece));
  });

  renderTextOverlays();
};

const setActiveViewButton=view=>{
  $$(".view-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
};

if(editor2dCanvas&&suitStage&&window.KILLIAN_PIECES){
  renderEditorView("front");

  editor2dCanvas.addEventListener("click",e=>{
    if(e.target.closest(".design-item"))return;
    selectPiece(hitTest(e));
  });

  editor2dCanvas.addEventListener("mousemove",e=>{
    const item=hitTest(e);
    if(item===hoveredPiece)return;
    clearHover();
    hoveredPiece=item;
    editor2dCanvas.classList.toggle("can-select",!!item);
    if(item)item.el.classList.add("hovered");
  });

  editor2dCanvas.addEventListener("mouseleave",()=>{
    clearHover();
    hoveredPiece=null;
    editor2dCanvas.classList.remove("can-select");
  });
}

pieceColor?.addEventListener("input",()=>selectedPiece&&applyColor(selectedPiece,pieceColor.value));
riderName?.addEventListener("input",renderTextOverlays);
riderNumber?.addEventListener("input",renderTextOverlays);

$$(".view-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const view=btn.dataset.view||"front";
    setActiveViewButton(view);
    renderEditorView(view);
  });
});

$$(".option-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    $$(".option-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const colorBySuit={verde:"#5bd43b",negro:"#111111",rojo:"#c1121f"};
    const color=colorBySuit[btn.dataset.suit]||"#ffffff";
    if(pieceColor)pieceColor.value=color;
    if(selectedPiece)applyColor(selectedPiece,color);
  });
});

/* LOGOS Y TEXTOS ARRASTRABLES */
const selectDesignItem=el=>{
  customItems.forEach(item=>item.el.classList.remove("selected"));
  selectedDesignItem=el||null;
  if(selectedDesignItem)selectedDesignItem.classList.add("selected");
};

const makeDraggable=el=>{
  let startX=0,startY=0,left=0,top=0,dragging=false;

  const move=e=>{
    if(!dragging)return;
    const p=e.touches?e.touches[0]:e;
    const rect=editor2dCanvas.getBoundingClientRect();
    const nx=left+(p.clientX-startX)/rect.width*100;
    const ny=top+(p.clientY-startY)/rect.height*100;
    el.style.left=`${Math.max(0,Math.min(92,nx))}%`;
    el.style.top=`${Math.max(0,Math.min(92,ny))}%`;
  };

  const end=()=>{
    dragging=false;
    document.removeEventListener("mousemove",move);
    document.removeEventListener("mouseup",end);
    document.removeEventListener("touchmove",move);
    document.removeEventListener("touchend",end);
  };

  el.addEventListener("mousedown",e=>{
    e.preventDefault();
    selectDesignItem(el);
    dragging=true;
    startX=e.clientX;
    startY=e.clientY;
    left=parseFloat(el.style.left)||50;
    top=parseFloat(el.style.top)||50;
    document.addEventListener("mousemove",move);
    document.addEventListener("mouseup",end);
  });

  el.addEventListener("touchstart",e=>{
    selectDesignItem(el);
    dragging=true;
    const t=e.touches[0];
    startX=t.clientX;
    startY=t.clientY;
    left=parseFloat(el.style.left)||50;
    top=parseFloat(el.style.top)||50;
    document.addEventListener("touchmove",move,{passive:false});
    document.addEventListener("touchend",end);
  },{passive:false});
};

const addCustomText=(text="TEXTO")=>{
  if(!customLayer)return;
  const el=document.createElement("div");
  el.className="design-item design-text";
  el.textContent=text;
  el.style.left="42%";
  el.style.top="48%";
  el.style.width="18%";
  el.style.height="8%";
  customLayer.appendChild(el);
  customItems.push({type:"text",el});
  makeDraggable(el);
  selectDesignItem(el);
};

const addCustomLogo=src=>{
  if(!customLayer)return;
  const el=document.createElement("div");
  el.className="design-item design-logo";
  el.style.left="42%";
  el.style.top="34%";
  el.style.width="18%";
  el.style.height="12%";
  const img=document.createElement("img");
  img.src=src;
  img.alt="Logo";
  el.appendChild(img);
  customLayer.appendChild(el);
  customItems.push({type:"logo",el,img});
  makeDraggable(el);
  selectDesignItem(el);
};

addTextBtn?.addEventListener("click",()=>{
  const text=prompt("Texto para agregar:","KILLIAN");
  if(text&&text.trim())addCustomText(text.trim().toUpperCase());
});

addLogoBtn?.addEventListener("click",()=>logoUpload?.click());
logoUpload?.addEventListener("change",()=>{
  const file=logoUpload.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>addCustomLogo(reader.result);
  reader.readAsDataURL(file);
  logoUpload.value="";
});

document.addEventListener("keydown",e=>{
  if((e.key==="Delete"||e.key==="Backspace")&&selectedDesignItem&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
    selectedDesignItem.remove();
    customItems=customItems.filter(item=>item.el!==selectedDesignItem);
    selectedDesignItem=null;
  }
});

/* EXPORT PNG */
const drawImageCoverContain=(ctx,img,canvasW,canvasH)=>{
  const iw=img.naturalWidth||1;
  const ih=img.naturalHeight||1;
  const scale=Math.min(canvasW/iw,canvasH/ih);
  const w=iw*scale;
  const h=ih*scale;
  const x=(canvasW-w)/2;
  const y=(canvasH-h)/2;
  ctx.drawImage(img,x,y,w,h);
};

const exportDesign=()=>{
  if(!editor2dCanvas)return;
  const rect=editor2dCanvas.getBoundingClientRect();
  const scale=2;
  const c=document.createElement("canvas");
  c.width=Math.max(900,Math.round(rect.width*scale));
  c.height=Math.max(520,Math.round(rect.height*scale));
  const ctx=c.getContext("2d");

  ctx.fillStyle="#050505";
  ctx.fillRect(0,0,c.width,c.height);

  renderedPieces.forEach(item=>{
    if(!item.el.complete||item.el.dataset.missing==="true")return;
    ctx.save();
    ctx.filter=item.editable===false?"none":colorFilter(item.color||pieceColors[item.id]||"#ffffff");
    drawImageCoverContain(ctx,item.el,c.width,c.height);
    ctx.restore();
  });

  ctx.save();
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.shadowColor="rgba(0,0,0,.85)";
  ctx.shadowBlur=10;
  ctx.font=`${Math.round(c.width*.04)}px Impact, Arial Black, sans-serif`;
  const name=(riderName?.value||"").trim().toUpperCase();
  if(name)ctx.fillText(name,c.width*.5,c.height*.31);

  const num=(riderNumber?.value||"").trim();
  if(num&&(currentView==="back"||currentView==="perfil")){
    ctx.font=`${Math.round(c.width*.095)}px Impact, Arial Black, sans-serif`;
    ctx.fillText(num,c.width*.5,c.height*.43);
  }
  ctx.restore();

  const promises=customItems.map(item=>new Promise(resolve=>{
    const el=item.el;
    const x=parseFloat(el.style.left||"0")/100*c.width;
    const y=parseFloat(el.style.top||"0")/100*c.height;
    const w=parseFloat(el.style.width||"16")/100*c.width;
    const h=parseFloat(el.style.height||"10")/100*c.height;

    if(item.type==="text"){
      ctx.save();
      ctx.fillStyle="#fff";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.shadowColor="rgba(0,0,0,.9)";
      ctx.shadowBlur=8;
      ctx.font=`${Math.round(h*.75)}px Impact, Arial Black, sans-serif`;
      ctx.fillText(el.textContent,x+w/2,y+h/2);
      ctx.restore();
      resolve();
      return;
    }

    const img=item.img||el.querySelector("img");
    if(!img){resolve();return;}
    if(img.complete){
      ctx.drawImage(img,x,y,w,h);
      resolve();
    }else{
      img.onload=()=>{ctx.drawImage(img,x,y,w,h);resolve();};
      img.onerror=resolve;
    }
  }));

  Promise.all(promises).then(()=>{
    const a=document.createElement("a");
    a.href=c.toDataURL("image/png");
    a.download=`killian-diseno-${currentView}.png`;
    a.click();
  });
};

exportDesignBtn?.addEventListener("click",exportDesign);
});