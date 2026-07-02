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

const suitTabs = document.querySelectorAll('.suit-tab');
const suitLines = document.querySelectorAll('.suit-line');

function showSuitLine(linea){
    suitLines.forEach(line=>{
        line.classList.toggle('active', line.dataset.lineaContent === linea);
    });

    suitTabs.forEach(tab=>{
        tab.classList.toggle('active', tab.dataset.linea === linea);
    });
}

suitTabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
        showSuitLine(tab.dataset.linea);
    });
});

showSuitLine('linea1');

const lightbox = document.getElementById('imageLightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxClose = lightbox.querySelector('.lightbox-close');

document.querySelectorAll('.suit-gallery-compact img').forEach(img=>{
    img.addEventListener('click', ()=>{
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
    });
});

lightboxClose.addEventListener('click', ()=>{
    lightbox.classList.remove('active');
});

lightbox.addEventListener('click', e=>{
    if(e.target === lightbox){
        lightbox.classList.remove('active');
    }
});


});