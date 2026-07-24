import * as THREE from "three";


export class WaterSimulation {

    constructor(renderer, size = 256) {

        this.renderer = renderer;
        this.size = size;


        const options = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false
        };


        // Ping-pong textures
        this.read = new THREE.WebGLRenderTarget(
            size,
            size,
            options
        );

        this.write = new THREE.WebGLRenderTarget(
            size,
            size,
            options
        );


        // initialize textures
        this.renderer.setRenderTarget(this.read);
        this.renderer.clear();

        this.renderer.setRenderTarget(this.write);
        this.renderer.clear();

        this.renderer.setRenderTarget(null);



        this.camera =
            new THREE.OrthographicCamera(
                -1,
                1,
                1,
                -1,
                0,
                1
            );


        this.scene = new THREE.Scene();



        // Wave simulation shader
        this.material =
            new THREE.ShaderMaterial({

                uniforms: {

                    uTexture:{
                        value:null
                    },

                    delta:{
                        value:new THREE.Vector2(
                            1 / size,
                            1 / size
                        )
                    }

                },


                vertexShader:`

                    varying vec2 vUv;

                    void main(){

                        vUv = uv;

                        gl_Position =
                        vec4(position,1.0);

                    }

                `,


                fragmentShader:`

                    uniform sampler2D uTexture;
                    uniform vec2 delta;

                    varying vec2 vUv;


                    void main(){

                        vec4 info =
                        texture2D(
                            uTexture,
                            vUv
                        );


                        vec2 dx =
                        vec2(delta.x,0.0);

                        vec2 dy =
                        vec2(0.0,delta.y);


                        float average =
                        (
                            texture2D(uTexture,vUv-dx).r +
                            texture2D(uTexture,vUv+dx).r +
                            texture2D(uTexture,vUv-dy).r +
                            texture2D(uTexture,vUv+dy).r

                        ) * 0.25;


                        // wave equation

                        info.g +=
                        (average-info.r)*2.0;


                        // damping

                        info.g *=0.995;


                        // position update

                        info.r += info.g;


                        gl_FragColor = info;

                    }

                `

            });



        this.mesh =
        new THREE.Mesh(
            new THREE.PlaneGeometry(2,2),
            this.material
        );


        this.scene.add(this.mesh);



        // Drop shader

        this.dropMaterial =
        new THREE.ShaderMaterial({

            uniforms:{

                uTexture:{
                    value:null
                },

                center:{
                    value:new THREE.Vector2()
                },

                radius:{
                    value:0.05
                },

                strength:{
                    value:0.5
                }

            },


            vertexShader:`

                varying vec2 vUv;

                void main(){

                    vUv=uv;

                    gl_Position =
                    vec4(position,1.0);

                }

            `,


            fragmentShader:`

                uniform sampler2D uTexture;

                uniform vec2 center;
                uniform float radius;
                uniform float strength;

                varying vec2 vUv;


                void main(){

                    vec4 info =
                    texture2D(
                        uTexture,
                        vUv
                    );


                    float drop =
                    max(
                        0.0,
                        1.0 -
                        distance(
                            center,
                            vUv
                        ) / radius
                    );


                    drop =
                    0.5 -
                    cos(drop * 3.14159)
                    *0.5;


                    info.r +=
                    drop * strength;


                    gl_FragColor =
                    info;

                }

            `

        });


        this.dropScene = new THREE.Scene();

        this.dropScene.add(
            new THREE.Mesh(
                new THREE.PlaneGeometry(2,2),
                this.dropMaterial
            )
        );


    }



    update(){

        this.material.uniforms.uTexture.value =
            this.read.texture;


        this.renderer.setRenderTarget(
            this.write
        );


        this.renderer.render(
            this.scene,
            this.camera
        );


        this.renderer.setRenderTarget(null);


        this.swap();


        return this.read.texture;

    }



    addDrop(
        x,
        y,
        radius = 0.05,
        strength = 0.5
    ){

        this.dropMaterial.uniforms.uTexture.value =
            this.read.texture;


        this.dropMaterial.uniforms.center.value.set(
            x,
            y
        );


        this.dropMaterial.uniforms.radius.value =
            radius;


        this.dropMaterial.uniforms.strength.value =
            strength;



        this.renderer.setRenderTarget(
            this.write
        );


        this.renderer.render(
            this.dropScene,
            this.camera
        );


        this.renderer.setRenderTarget(null);


        this.swap();

    }



    swap(){

        const temp = this.read;

        this.read = this.write;

        this.write = temp;

    }

}