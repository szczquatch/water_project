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

camera.position.set(
    0,
    0,
    5
);

camera.lookAt(
    0,
    0,
    0
);

const renderer =
new THREE.WebGLRenderer({
    antialias:true
});
//renderer.setClearColor(0x87ceeb,1);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


document.body.appendChild(
    renderer.domElement
);

const cubeLoader = new THREE.CubeTextureLoader();

const skyTexture = cubeLoader.load([
    "/textures/skybox/posx.jpg",
    "/textures/skybox/negx.jpg",
    "/textures/skybox/posy.jpg",
    "/textures/skybox/negy.jpg",
    "/textures/skybox/posz.jpg",
    "/textures/skybox/negz.jpg"
]);

scene.background = skyTexture;

const sandTexture =
new THREE.TextureLoader().load(
    "/textures/sand.jpg"
);


sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;

sandTexture.repeat.set(4,4);





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
    transparent: true,
    uniforms:{

        heightMap:{
            value:null
        },

        normalMap:{
            value:null
        },
        sandMap:{
            value:sandTexture
        },

        skyMap:{
            value:skyTexture
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
        uniform samplerCube skyMap;
        uniform sampler2D sandMap;
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



            vec3 shallow =
            vec3(
                0.1,
                0.7,
                0.9
            );

            vec3 deep =
            vec3(
                0.0,
                0.05,
                0.2
            );

            float h =
            texture2D(
                heightMap,
                vUv
            ).r;

            vec3 waterColor =
            mix(
                deep,
                shallow,
                h*0.5+0.5
            );

            float foam =
            smoothstep(
                0.25,
                0.5,
                length(normal.xz)
            );

            waterColor =
            mix(
                waterColor,
                vec3(1.0),
                foam*0.3
            );
            // fake sky reflection

            float fresnel =
            pow(
                1.0-abs(normal.z),
                3.0
            );


            vec3 viewDir =
            normalize(
                cameraPosition
            );

            vec3 reflectDir =
            reflect(
                -viewDir,
                normalize(normal)
            );

            vec3 sky =
            textureCube(
                skyMap,
                reflectDir
            ).rgb;

            waterColor =
            mix(
                waterColor,
                sky,
                fresnel
            );



            waterColor *=
            lighting + 0.25;



            gl_FragColor =
            vec4(
                waterColor,
                0.65
            );


        }

    `

});




const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2,2),
    new THREE.MeshBasicMaterial({
        map:sandTexture
    })
);


// keep it facing camera
floor.position.z = -0.1;


scene.add(floor);

// water plane

const water =
new THREE.Mesh(
    new THREE.PlaneGeometry(
        2,
        2
    ),
    waterMaterial
);

water.position.z = 0;
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