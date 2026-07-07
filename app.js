document.addEventListener("DOMContentLoaded",()=>{

const header=document.querySelector(".header");

if(header){
    const toggleHeader=()=>{
        header.classList.toggle("scrolled",window.scrollY>80);
    };

    toggleHeader();
    window.addEventListener("scroll",toggleHeader,{passive:true});
}

const whatsappDropdown=document.querySelector(".whatsapp-dropdown");
const whatsappToggle=document.querySelector(".whatsapp-toggle");
const whatsappMenu=document.querySelector(".whatsapp-menu");

if(whatsappDropdown&&whatsappToggle&&whatsappMenu){
    whatsappToggle.addEventListener("click",(e)=>{
        e.stopPropagation();
        whatsappDropdown.classList.toggle("active");
    });

    whatsappMenu.addEventListener("click",(e)=>{
        e.stopPropagation();
    });

    document.addEventListener("click",()=>{
        whatsappDropdown.classList.remove("active");
    });

    document.addEventListener("keydown",(e)=>{
        if(e.key==="Escape"){
            whatsappDropdown.classList.remove("active");
        }
    });
}

const suitTabs=document.querySelectorAll(".suit-tab");
const suitLines=document.querySelectorAll(".suit-line");

const showSuitLine=(linea)=>{
    suitLines.forEach(line=>{
        line.classList.toggle("active",line.dataset.lineaContent===linea);
    });

    suitTabs.forEach(tab=>{
        tab.classList.toggle("active",tab.dataset.linea===linea);
    });
};

if(suitTabs.length&&suitLines.length){
    suitTabs.forEach(tab=>{
        tab.addEventListener("click",()=>{
            showSuitLine(tab.dataset.linea);
        });
    });

    showSuitLine("linea1");
}

const lightbox=document.getElementById("imageLightbox");

if(lightbox){
    const lightboxImg=lightbox.querySelector("img");
    const lightboxClose=lightbox.querySelector(".lightbox-close");

    document.querySelectorAll(".suit-gallery-compact img").forEach(img=>{
        img.addEventListener("click",()=>{
            if(!lightboxImg)return;

            lightboxImg.src=img.src;
            lightboxImg.alt=img.alt;
            lightbox.classList.add("active");
        });
    });

    if(lightboxClose){
        lightboxClose.addEventListener("click",()=>{
            lightbox.classList.remove("active");
        });
    }

    lightbox.addEventListener("click",(e)=>{
        if(e.target===lightbox){
            lightbox.classList.remove("active");
        }
    });

    document.addEventListener("keydown",(e)=>{
        if(e.key==="Escape"){
            lightbox.classList.remove("active");
        }
    });
}

const editor2dCanvas=document.getElementById("editor2dCanvas");
const selectedPieceName=document.getElementById("selectedPieceName");
const pieceColor=document.getElementById("pieceColor");

let selectedPiece=null;

const clearSelectedPiece=()=>{
    document.querySelectorAll(".editable-piece").forEach(piece=>{
        piece.classList.remove("active");
    });
};

const selectPiece=(piece,name)=>{
    clearSelectedPiece();

    selectedPiece=piece;
    selectedPiece.classList.add("active");

    if(selectedPieceName){
        selectedPieceName.textContent=name||selectedPiece.dataset.piece||"Pieza";
    }
};

const applyColorToPiece=(piece,color)=>{
    if(!piece)return;

    piece.style.filter=`
        sepia(1)
        saturate(6)
        hue-rotate(${hexToHue(color)}deg)
        brightness(.92)
        drop-shadow(0 0 12px rgba(91,212,59,.75))
    `;
};

const hexToHue=(hex)=>{
    const r=parseInt(hex.slice(1,3),16)/255;
    const g=parseInt(hex.slice(3,5),16)/255;
    const b=parseInt(hex.slice(5,7),16)/255;

    const max=Math.max(r,g,b);
    const min=Math.min(r,g,b);
    const delta=max-min;

    let hue=0;

    if(delta===0){
        hue=0;
    }else if(max===r){
        hue=60*(((g-b)/delta)%6);
    }else if(max===g){
        hue=60*(((b-r)/delta)+2);
    }else{
        hue=60*(((r-g)/delta)+4);
    }

    if(hue<0){
        hue+=360;
    }

    return Math.round(hue);
};

if(editor2dCanvas&&Array.isArray(window.KILLIAN_PIECES)){
    editor2dCanvas.innerHTML="";

    window.KILLIAN_PIECES.forEach((piece,index)=>{
        const img=document.createElement("img");

        img.src=`images/${piece.file}`;
        img.alt=piece.name||`Pieza ${index+1}`;
        img.className="suit-piece editable-piece";
        img.dataset.piece=piece.name||`Pieza ${index+1}`;
        img.loading="lazy";
        img.style.zIndex=index+1;

        img.addEventListener("click",()=>{
            selectPiece(img,img.dataset.piece);
        });

        editor2dCanvas.appendChild(img);
    });
}else{
    document.querySelectorAll(".editable-piece").forEach(piece=>{
        piece.addEventListener("click",()=>{
            selectPiece(piece,piece.dataset.piece);
        });
    });
}

if(pieceColor){
    pieceColor.addEventListener("input",()=>{
        if(!selectedPiece)return;

        applyColorToPiece(selectedPiece,pieceColor.value);
    });
}

document.querySelectorAll(".option-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".option-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");

        const colorBySuit={
            verde:"#5bd43b",
            negro:"#111111",
            rojo:"#c1121f"
        };

        const color=colorBySuit[btn.dataset.suit];

        if(pieceColor&&color){
            pieceColor.value=color;
        }

        if(selectedPiece&&color){
            applyColorToPiece(selectedPiece,color);
        }
    });
});

document.querySelectorAll(".view-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".view-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
    });
});

});