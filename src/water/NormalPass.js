import * as THREE from "three";


export class NormalPass {


    constructor(renderer,size=256){

        this.renderer=renderer;


        this.target =
        new THREE.WebGLRenderTarget(
            size,
            size,
            {
                minFilter:THREE.LinearFilter,
                magFilter:THREE.LinearFilter,
                type:THREE.FloatType,
                depthBuffer:false
            }
        );


        this.camera =
        new THREE.OrthographicCamera(
            -1,1,1,-1,0,1
        );


        this.scene =
        new THREE.Scene();



        this.material =
        new THREE.ShaderMaterial({

            uniforms:{

                heightMap:{
                    value:null
                },

                delta:{
                    value:new THREE.Vector2(
                        1/size,
                        1/size
                    )
                }

            },


            vertexShader:`

                varying vec2 vUv;

                void main(){

                    vUv=uv;
                    gl_Position=
                    vec4(position,1.0);

                }

            `,


            fragmentShader:`

                uniform sampler2D heightMap;
                uniform vec2 delta;

                varying vec2 vUv;


                void main(){

                    float h =
                    texture2D(
                        heightMap,
                        vUv
                    ).r;


                    float hx =
                    texture2D(
                        heightMap,
                        vUv+vec2(delta.x,0)
                    ).r-h;


                    float hy =
                    texture2D(
                        heightMap,
                        vUv+vec2(0,delta.y)
                    ).r-h;


                    vec3 normal =
                    normalize(
                        vec3(
                            -hx,
                            0.2,
                            -hy
                        )
                    );


                    gl_FragColor =
                    vec4(
                        normal*0.5+0.5,
                        1.0
                    );

                }

            `

        });



        this.scene.add(
            new THREE.Mesh(
                new THREE.PlaneGeometry(2,2),
                this.material
            )
        );


    }


    update(heightTexture){

        this.material.uniforms.heightMap.value =
            heightTexture;


        this.renderer.setRenderTarget(
            this.target
        );


        this.renderer.render(
            this.scene,
            this.camera
        );


        this.renderer.setRenderTarget(null);


        return this.target.texture;

    }
    // getNormal(x,y){

    //     const pixel =
    //     new Float32Array(4);


    //     this.renderer.readRenderTargetPixels(
    //         this.target,
    //         Math.floor(x * this.target.width),
    //         Math.floor(y * this.target.height),
    //         1,
    //         1,
    //         pixel
    //     );


    //     // convert 0-1 back to -1 to +1
    //     return {
    //         x: pixel[0] * 2 - 1,
    //         y: pixel[1] * 2 - 1,
    //         z: pixel[2] * 2 - 1
    //     };

    // }
}