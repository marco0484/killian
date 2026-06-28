document.addEventListener("DOMContentLoaded",()=>{

    const reveals=document.querySelectorAll(".reveal");

    if(reveals.length){
        const observer=new IntersectionObserver(entries=>{
            entries.forEach(entry=>{
                if(entry.isIntersecting){
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });
        },{threshold:.15});

        reveals.forEach(el=>observer.observe(el));
    }

    const riderName=document.getElementById("riderName");
    const riderNumber=document.getElementById("riderNumber");
    const previewName=document.getElementById("previewName");
    const previewNumber=document.getElementById("previewNumber");

    if(riderName&&previewName){
        riderName.addEventListener("input",()=>{
            previewName.textContent=riderName.value.trim()||"MARCO";
        });
    }

    if(riderNumber&&previewNumber){
        riderNumber.addEventListener("input",()=>{
            previewNumber.textContent=riderNumber.value.trim()||"99";
        });
    }

    const colors=document.querySelectorAll(".color");

    colors.forEach(btn=>{
        btn.addEventListener("click",()=>{
            colors.forEach(color=>color.classList.remove("active"));
            btn.classList.add("active");
        });
    });

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