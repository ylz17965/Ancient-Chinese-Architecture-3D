import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'

// --- 初始化场景 ---
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000)
const canvas = document.querySelector('canvas.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



// --- 无限制轨道控制器 ---
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.screenSpacePanning = true
controls.enablePan = true
controls.enableRotate = true
controls.enableZoom = true
controls.minDistance = 0.1
controls.maxDistance = Infinity

// --- 基础光照 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)
const dirLight = new THREE.DirectionalLight(0xffffff, 1)
dirLight.position.set(2, 5, 3)
scene.add(dirLight)
const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
backLight.position.set(-2, 1, -3)
scene.add(backLight)

// 网格辅助
let gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444)
scene.add(gridHelper)



// --- 调试参数对象 ---
const debug = {
    // 模型位置（扩大范围以适应大模型）
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    
    // 模型旋转
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    
    // 模型缩放（扩大范围以适应大模型）
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    
    // 光照强度
    ambientLight: 0.5,
    dirLight: 1,
    backLight: 0.5,
    
    // 场景设置
    showGrid: true,
    

}

// --- 创建GUI ---
const gui = new dat.GUI()

// 模型控制文件夹（调整控制范围）
const modelFolder = gui.addFolder('模型控制')
modelFolder.add(debug, 'positionX', -2000, 2000).step(20).name('位置 X').onChange(updateModelTransform)
modelFolder.add(debug, 'positionY', -2000, 2000).step(20).name('位置 Y').onChange(updateModelTransform)
modelFolder.add(debug, 'positionZ', -2000, 2000).step(20).name('位置 Z').onChange(updateModelTransform)

modelFolder.add(debug, 'rotationX', -Math.PI * 5, Math.PI * 5).step(0.1).name('旋转 X').onChange(updateModelTransform)
modelFolder.add(debug, 'rotationY', -Math.PI * 5, Math.PI * 5).step(0.1).name('旋转 Y').onChange(updateModelTransform)
modelFolder.add(debug, 'rotationZ', -Math.PI * 5, Math.PI * 5).step(0.1).name('旋转 Z').onChange(updateModelTransform)

modelFolder.add(debug, 'scaleX', 0, 2).step(0.05).name('缩放 X').onChange(updateModelTransform)
modelFolder.add(debug, 'scaleY', 0, 2).step(0.05).name('缩放 Y').onChange(updateModelTransform)
modelFolder.add(debug, 'scaleZ', 0, 2).step(0.05).name('缩放 Z').onChange(updateModelTransform)

// 光照控制文件夹
const lightFolder = gui.addFolder('光照控制')
lightFolder.add(debug, 'ambientLight', 0, 2).step(0.1).name('环境光强度').onChange(updateLights)
lightFolder.add(debug, 'dirLight', 0, 3).step(0.1).name('主光强度').onChange(updateLights)
lightFolder.add(debug, 'backLight', 0, 2).step(0.1).name('背光强度').onChange(updateLights)



// 场景设置文件夹
const sceneFolder = gui.addFolder('场景设置')
sceneFolder.add(debug, 'showGrid').name('显示网格').onChange((value) => {
    gridHelper.visible = value
})

// 重置按钮
const actions = {
    resetModel: () => {
        debug.positionX = 0
        debug.positionY = 0
        debug.positionZ = 0
        debug.rotationX = 0
        debug.rotationY = 0
        debug.rotationZ = 0
        debug.scaleX = 1
        debug.scaleY = 1
        debug.scaleZ = 1
        
        // 更新所有控制器
        modelFolder.__controllers.forEach(controller => {
            controller.updateDisplay()
        })
        
        updateModelTransform()
    },
    resetLights: () => {
        debug.ambientLight = 0.5
        debug.dirLight = 1
        debug.backLight = 0.5
        
        // 更新所有控制器
        lightFolder.__controllers.forEach(controller => {
            controller.updateDisplay()
        })
        
        updateLights()
    },

    resetAll: () => {
        actions.resetModel()
        actions.resetLights()
        actions.resetCamera()
        debug.showGrid = true
        gridHelper.visible = true
        
        // 更新场景设置控制器
        sceneFolder.__controllers.forEach(controller => {
            controller.updateDisplay()
        })
    }
}

const actionFolder = gui.addFolder('操作')
actionFolder.add(actions, 'resetModel').name('重置模型')
actionFolder.add(actions, 'resetLights').name('重置光照')

actionFolder.add(actions, 'resetAll').name('重置所有')

// 打开所有文件夹
modelFolder.open()
lightFolder.open()

sceneFolder.open()
actionFolder.open()

let currentModel = null

// --- 更新模型变换 ---
function updateModelTransform() {
    if (currentModel) {
        currentModel.position.set(debug.positionX, debug.positionY, debug.positionZ)
        currentModel.rotation.set(debug.rotationX, debug.rotationY, debug.rotationZ)
        currentModel.scale.set(debug.scaleX, debug.scaleY, debug.scaleZ)
    }
}

// --- 更新光照 ---
function updateLights() {
    ambientLight.intensity = debug.ambientLight
    dirLight.intensity = debug.dirLight
    backLight.intensity = debug.backLight
}

// --- 加载模型 ---
const loader = new GLTFLoader()
const modelPath = '/glbfile.glb'

loader.load(
    modelPath,
    (gltf) => {
        currentModel = gltf.scene
        scene.add(currentModel)

        // 计算模型尺寸，用于调整相机距离
        const box = new THREE.Box3().setFromObject(currentModel)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)

        // 自动调整相机距离，确保大模型完整可见
        const distance = maxDim * 3
        camera.position.set(distance, distance * 0.8, distance)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()

        // 更新网格大小
        scene.remove(gridHelper)
        gridHelper = new THREE.GridHelper(maxDim * 2, 20, 0x888888, 0x444444)
        scene.add(gridHelper)

        console.log('模型加载成功，尺寸:', size)
        console.log('键盘控制说明:')
        console.log('W/S: 前进/后退')
        console.log('A/D: 左移/右移')
        console.log('Q/E: 上升/下降')
        console.log('Shift: 加速移动')
    },
    (progress) => {
        console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`)
    },
    (error) => {
        console.error('模型加载失败:', error)
        
        // 加载失败时显示备用模型
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)
        currentModel = cube
        
        camera.position.set(3, 3, 3)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
    }
)

// --- 动画循环 ---
const animate = () =>
{
    // 更新控制器
    controls.update()
    

    

    
    // 渲染
    renderer.render(scene, camera)
    
    // 调用下一帧
    window.requestAnimationFrame(animate)
}

// --- 窗口自适应 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// --- 启动 ---
animate()