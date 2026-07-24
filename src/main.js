import * as THREE from "three";
import {WaterSimulation} from "./water/WaterSimulation.js";
import {NormalPass} from "./water/NormalPass.js";


const scene = new THREE.Scene();


const camera =
new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0,
    10
);



const renderer =
new THREE.WebGLRenderer({
    antialias:true
});


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


document.body.appendChild(
    renderer.domElement
);



// simulation

const simulation =
new WaterSimulation(
    renderer,
    256
);


// normal calculation

const normals =
new NormalPass(
    renderer,
    256
);



// create first ripple

simulation.addDrop(
    0.5,
    0.5,
    0.15,
    1.0
);



// click creates waves

window.addEventListener(
"click",
(e)=>{

    const x =
    e.clientX / window.innerWidth;

    const y =
    1 -
    e.clientY / window.innerHeight;


    simulation.addDrop(
        x,
        y,
        0.05,
        0.8
    );

});




// WATER MATERIAL

const waterMaterial =
new THREE.ShaderMaterial({

    uniforms:{

        heightMap:{
            value:null
        },

        normalMap:{
            value:null
        }

    },


    vertexShader:`

        varying vec2 vUv;


        void main(){

            vUv = uv;


            gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position,1.0);

        }

    `,


    fragmentShader:`

        uniform sampler2D heightMap;
        uniform sampler2D normalMap;


        varying vec2 vUv;



        void main(){


            vec3 normal =
            texture2D(
                normalMap,
                vUv
            ).rgb;


            // convert 0-1 texture to -1,+1 normal

            normal =
            normal * 2.0 - 1.0;



            vec3 light =
            normalize(
                vec3(
                    -0.5,
                    1.0,
                    0.8
                )
            );



            float lighting =
            dot(
                normal,
                light
            );


            lighting =
            max(
                lighting,
                0.0
            );



            vec3 waterColor =
            vec3(
                0.0,
                0.25,
                0.55
            );



            // fake sky reflection

            float fresnel =
            pow(
                1.0-normal.y,
                3.0
            );


            waterColor =
            mix(
                waterColor,
                vec3(
                    0.7,
                    0.9,
                    1.0
                ),
                fresnel
            );



            waterColor *=
            lighting + 0.25;



            gl_FragColor =
            vec4(
                waterColor,
                1.0
            );


        }

    `

});




// water plane

const water =
new THREE.Mesh(
    new THREE.PlaneGeometry(
        2,
        2
    ),
    waterMaterial
);


scene.add(water);





function animate(){


    requestAnimationFrame(
        animate
    );



    const heightTexture =
    simulation.update();



    const normalTexture =
    normals.update(
        heightTexture
    );



    waterMaterial.uniforms.heightMap.value =
        heightTexture;


    waterMaterial.uniforms.normalMap.value =
        normalTexture;



    renderer.render(
        scene,
        camera
    );

}


animate();