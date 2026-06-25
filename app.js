const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){
entry.target.classList.add('show');
}

});

});

reveals.forEach(el => observer.observe(el));

const riderName = document.getElementById('riderName');
const riderNumber = document.getElementById('riderNumber');

const previewName = document.getElementById('previewName');
const previewNumber = document.getElementById('previewNumber');

riderName.addEventListener('input', () => {
previewName.textContent = riderName.value || 'MARCO';
});

riderNumber.addEventListener('input', () => {
previewNumber.textContent = riderNumber.value || '99';
});

document.querySelectorAll('.color').forEach(btn=>{

btn.addEventListener('click',()=>{

document
.querySelectorAll('.color')
.forEach(b=>b.classList.remove('active'));

btn.classList.add('active');

});

});

window.addEventListener('scroll',()=>{

const header=document.querySelector('.header');

if(window.scrollY > 80){
header.style.background='rgba(0,0,0,.85)';
}else{
header.style.background='rgba(0,0,0,.4)';
}

});