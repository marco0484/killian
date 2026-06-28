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

});