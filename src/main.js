import * as THREE from "three";
import {WaterSimulation} from "./water/WaterSimulation.js";
import {NormalPass} from "./water/NormalPass.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";


const scene = new THREE.Scene();


const ambientLight =
new THREE.AmbientLight(
    0xffffff,
    1
);

scene.add(ambientLight);


const sun =
new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    0,
    1,
    3
);

scene.add(sun);

const camera =
new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
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

const base = import.meta.env.BASE_URL;

const skyTexture = cubeLoader.load([
    base + "textures/skybox/Daylight Box_Right.bmp",
    base + "textures/skybox/Daylight Box_Left.bmp",
    base + "textures/skybox/Daylight Box_Top.bmp",
    base + "textures/skybox/Daylight Box_Bottom.bmp",
    base + "textures/skybox/Daylight Box_Front.bmp",
    base + "textures/skybox/Daylight Box_Back.bmp"
]);

scene.background = skyTexture;

const sandTexture =
new THREE.TextureLoader().load(
    import.meta.env.BASE_URL + "textures/sand.jpg"
);


sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;

sandTexture.repeat.set(4,4);

//floating stuff//
const floatingObjects = [];
const clock = new THREE.Clock();



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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


window.addEventListener(
"click",
(e)=>{


    mouse.x =
    (e.clientX / window.innerWidth)*2-1;


    mouse.y =
    -(e.clientY / window.innerHeight)*2+1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const hits =
    raycaster.intersectObjects(
        links
    );


    if(hits.length>0){

        window.location.href =
        hits[0].object.userData.url;

        return;
    }


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
    depthWrite:false,
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
                0.65,
                0.85
            );

            vec3 deep =
            vec3(
                0.0,
                0.08,
                0.2
            );


            // get wave height

            float h =
            texture2D(
                heightMap,
                vUv
            ).r;


            // distort sand underneath

            vec2 distortedUV =
            vUv + normal.xz * 0.08;


            vec3 sand =
            texture2D(
                sandMap,
                distortedUV
            ).rgb;


            // mix sand and water

            vec3 waterColor =
            mix(
                sand,
                shallow,
                0.25
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
            0.8 + lighting * 0.4;



            gl_FragColor =
            vec4(
                waterColor,
                0.45
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


// -----------------------------
// Floating water links
// -----------------------------

const links = [];

const fontLoader = new FontLoader();

fontLoader.load(
    import.meta.env.BASE_URL + "fonts/helvetiker_regular.typeface.json",
    (font)=>{
        createLink(
            "PROJECTS",
            0,
            0,
            "/projects.html",
            font
        );

        // createLink(
        //     "PROJECTS",
        //     -0.5,
        //     0.2,
        //     "/projects.html",
        //     font
        // );


        // createLink(
        //     "ABOUT",
        //     0.5,
        //     -0.2,
        //     "/about.html",
        //     font
        // );


    }
);


function createLink(text,x,y,url,font){

    const group = new THREE.Group();


    const spacing = 0.09;


    [...text].forEach((char,index)=>{


        // wooden block

        const wood =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.08,
                0.08,
                0.025
            ),
            new THREE.MeshStandardMaterial({
                color:0x8b4513
            })
        );


        wood.position.x =
        (index - text.length/2)
        * spacing;



        // letter

        const geometry =
        new TextGeometry(
            char,
            {
                font:font,
                size:0.055,
                depth:0.005
            }
        );


        geometry.center();


        const letter =
        new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
                color:0xffffff
            })
        );


        letter.position.z = 0.02;


        wood.add(letter);


        group.add(wood);
        floatingObjects.push({

            object:wood,

            // water coordinates
            waterX:
                0.5 + (x + wood.position.x) * 0.25,

            waterY:
                0.5 + y * 0.25,

            offset:
                Math.random()*10,

            baseZ:
                0.15,

            speed:
                1 + Math.random(),

        });

    });



    group.position.set(
        x,
        y,
        0
    );


    group.userData.url=url;


    scene.add(group);


    links.push(group);


    // floatingObjects.push({
    //     object:group,
    //     offset:Math.random()*10
    // });

}
// const testCube =
// new THREE.Mesh(
//     new THREE.BoxGeometry(0.1,0.1,0.1),
//     new THREE.MeshBasicMaterial({
//         color:0xff0000
//     })
// );

// testCube.position.set(0,0,1);

// scene.add(testCube);


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

    const time =
    clock.getElapsedTime();


    floatingObjects.forEach(
    (item)=>{


        const wave =
        Math.sin(
            time*2 + item.offset
        );


        item.object.position.z =
        item.baseZ +
        wave * 0.02;


        item.object.rotation.z =
        wave * 0.15;


    });






    renderer.render(
        scene,
        camera
    );

}


animate();
