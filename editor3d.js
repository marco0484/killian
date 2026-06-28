import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container=document.getElementById("viewer3d");

console.log("viewer3d:",container);
console.log("editor3d cargado");

if(container){

    const scene=new THREE.Scene();

    const camera=new THREE.PerspectiveCamera(
        35,
        container.clientWidth/container.clientHeight,
        .1,
        100
    );

    camera.position.set(0,1.4,5);

    const renderer=new THREE.WebGLRenderer({
        antialias:true,
        alpha:true
    });

    renderer.setSize(container.clientWidth,container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);

    const ambientLight=new THREE.HemisphereLight(0xffffff,0x222222,2.5);
    scene.add(ambientLight);

    const frontLight=new THREE.DirectionalLight(0xffffff,2);
    frontLight.position.set(3,5,4);
    scene.add(frontLight);

    const backLight=new THREE.DirectionalLight(0x5bd43b,1.2);
    backLight.position.set(-3,2,-4);
    scene.add(backLight);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.enablePan=false;
    controls.minDistance=2.5;
    controls.maxDistance=7;
    controls.target.set(0,1,0);
let model=null;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

    loader.load(
        "models/traje.glb",
        gltf=>{
            model=gltf.scene;
            model.position.set(0,-1,0);
            model.scale.set(1.6,1.6,1.6);
            scene.add(model);
        },
        undefined,
        error=>{
            console.error("Error cargando modelo GLB:",error);
        }
    );

    document.querySelectorAll(".view-btn").forEach(btn=>{
        btn.addEventListener("click",()=>{
            document.querySelectorAll(".view-btn").forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");

            if(!model)return;

            if(btn.dataset.view==="frontal"){
                model.rotation.y=0;
            }

            if(btn.dataset.view==="trasero"){
                model.rotation.y=Math.PI;
            }
        });
    });

    document.querySelectorAll(".option-btn").forEach(btn=>{
        btn.addEventListener("click",()=>{
            document.querySelectorAll(".option-btn").forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");

            const colorBySuit={
                verde:"#5bd43b",
                negro:"#111111",
                rojo:"#c1121f"
            };

            const selectedColor=colorBySuit[btn.dataset.suit];

            if(!model||!selectedColor)return;

            model.traverse(child=>{
                if(child.isMesh&&child.material){
                    child.material.color.set(selectedColor);
                }
            });
        });
    });

    const animate=()=>{
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene,camera);
    };

    animate();

    window.addEventListener("resize",()=>{
        camera.aspect=container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth,container.clientHeight);
    });

}