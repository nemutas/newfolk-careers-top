import gsap from 'gsap'
import * as THREE from 'three'
import { RawShaderMaterial } from './core/ExtendedMaterials'
import { Three } from './core/Three'
import cardFs from './shader/card.fs'
import cardVs from './shader/card.vs'

export class Canvas extends Three {
  private cards = new THREE.Group()
  private cardMaterial!: RawShaderMaterial
  private cardTextures!: THREE.Texture[]
  private cardCounter = 2
  private cardBgColors = ['#eef319', '#baed02', '#76f361', '#ff4444', '#c448ff', '#2fe6c6']

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.init()

    this.loadAssets().then((assets) => {
      this.cardTextures = assets
      this.cardMaterial = this.createCardMaterial(assets)
      this.createCards(this.cardMaterial)
      this.createFirstAnimation()
      window.addEventListener('resize', this.resize.bind(this))
      this.renderer.setAnimationLoop(this.anime.bind(this))
    })
  }

  private async loadAssets() {
    const loader = new THREE.TextureLoader()

    return await Promise.all(
      ['face1', 'face2', 'face3', 'face4', 'face5'].map(async (filename) => {
        const texture = await loader.loadAsync(`${import.meta.env.BASE_URL}images/${filename}.webp`)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.userData.aspect = texture.source.data.width / texture.source.data.height
        return texture
      }),
    )
  }

  private init() {
    this.camera.userData.posZ0 = 0.01
    this.camera.userData.posZ1 = 0.8
    this.camera.position.set(0, 0.05, this.camera.userData.posZ0)
    // this.camera.position.set(0, 3, 4)
    // this.controls.enabled = true
    // this.scene.add(new THREE.AxesHelper())
  }

  private createCardMaterial(images: THREE.Texture[]) {
    const material = new RawShaderMaterial({
      uniforms: {
        uCurrent: { value: images[0] },
        uNext: { value: images[1] },
        uAspect: { value: images[0].userData.aspect },
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uPositionRadius: { value: 0 },
        uBgColor: { value: new THREE.Color(this.cardBgColors[Math.trunc(Math.random() * this.cardBgColors.length)]).convertLinearToSRGB() },
        uResolution: { value: [this.size.width, this.size.height] },
        uStartProgress: { value: 0 },
      },
      vertexShader: cardVs,
      fragmentShader: cardFs,
      glslVersion: '300 es',
      transparent: true,
      // wireframe: true,
    })

    return material
  }

  private createCards(material: RawShaderMaterial) {
    const cardWrapper = new THREE.Group()

    this.scene.add(cardWrapper)
    cardWrapper.add(this.cards)

    const aspect = material.uniforms.uAspect.value
    const segment = 10
    const amount = 20
    const mat4 = new THREE.Matrix4()
    const radius = (0.5 * aspect) / Math.tan(0.5 * ((Math.PI * 2.0) / amount)) + 0.1
    for (let i = 0; i < amount; i++) {
      const geometry = new THREE.PlaneGeometry(aspect, 1, Math.trunc(segment * aspect), segment)
      const angle = (i / amount) * Math.PI * 2.0 - Math.PI * 0.5
      geometry.applyMatrix4(mat4.makeRotationAxis(new THREE.Vector3(0, 1, 0), -angle - Math.PI * 0.5))
      geometry.applyMatrix4(mat4.makeTranslation(radius * Math.cos(angle), 0, radius * Math.sin(angle)))
      const mesh = new THREE.Mesh(geometry, material)
      this.cards.add(mesh)
    }

    this.cardMaterial.uniforms.uPositionRadius.value = radius

    cardWrapper.position.z = radius - 1
    cardWrapper.rotation.z = -Math.PI * 0.03

    this.cards.userData.rotStartSpeed = 0
  }

  private resize() {
    this.cardMaterial.uniforms.uResolution.value = [this.size.width, this.size.height]
  }

  private createFirstAnimation() {
    const tl = gsap.timeline({ delay: 0.5 })
    tl.to(this.cardMaterial.uniforms.uStartProgress, { value: 1, ease: 'power1.in', duration: 0.8 })
    tl.to(this.camera.position, { z: this.camera.userData.posZ1, ease: 'power1.out', duration: 2.5 }, '<')
    tl.to(this.cards.userData, { rotStartSpeed: 5, ease: 'power1.in', duration: 1 }, '<15%')
    tl.to(this.cards.userData, { rotStartSpeed: 0, ease: 'power4.out', duration: 3 }, '<100%')

    tl.eventCallback('onComplete', () => this.createLoopAnimation())
  }

  private createLoopAnimation() {
    gsap.fromTo(
      this.cardMaterial.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        ease: 'none',
        delay: 2,
        duration: 1.6,
        repeat: -1,
        repeatDelay: 2,
        onRepeat: () => {
          this.cardMaterial.uniforms.uCurrent.value = this.cardMaterial.uniforms.uNext.value
          this.cardMaterial.uniforms.uNext.value = this.cardTextures[this.cardCounter++ % this.cardTextures.length]
        },
      },
    )
  }

  private anime() {
    this.updateTime()

    this.cards.rotation.y += this.time.delta * (0.06 + this.cards.userData.rotStartSpeed)
    this.cardMaterial.uniforms.uTime.value -= this.time.delta * (0.5 + this.cards.userData.rotStartSpeed * 40.0)

    this.render()
  }
}
