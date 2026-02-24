import React, { useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Text, Html } from '@react-three/drei';
import { Physics, usePlane, useBox, useCompoundBody } from '@react-three/cannon';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import LuckyStar3D from './3d/LuckyStar3D';
import gsap from 'gsap';

// 瓶子交互组件 (物理+视觉+交互)
const InteractiveJar = () => {
  // 生成瓶身 LatheGeometry 的点
  const lathePoints = useMemo(() => {
    const points = [];
    const baseRadius = 1.45; 
    const shoulderRadius = 1.6; 
    const neckRadius = 1.0;
    const wallThickness = 0.15; 
    const bottomThickness = 0.5; 

    // --- 外轮廓 (Outer Profile) ---
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(baseRadius - 0.2, 0)); 
    points.push(new THREE.Vector2(baseRadius, 0.2)); 
    points.push(new THREE.Vector2(shoulderRadius, 2.5)); 
    const shoulderSteps = 10;
    for (let i = 1; i <= shoulderSteps; i++) {
      const t = i / shoulderSteps;
      const x = (1 - t) * (1 - t) * shoulderRadius + 2 * (1 - t) * t * shoulderRadius + t * t * neckRadius;
      const y = (1 - t) * (1 - t) * 2.5 + 2 * (1 - t) * t * 3.5 + t * t * 3.5;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(neckRadius, 4.0));
    points.push(new THREE.Vector2(neckRadius + 0.1, 4.05));
    points.push(new THREE.Vector2(neckRadius + 0.1, 4.15));

    // --- 内轮廓 (Inner Profile) ---
    points.push(new THREE.Vector2(neckRadius - 0.1, 4.15));
    points.push(new THREE.Vector2(neckRadius - 0.1, 4.05)); 
    points.push(new THREE.Vector2(neckRadius - wallThickness, 3.5));
    points.push(new THREE.Vector2(shoulderRadius - wallThickness, 2.5));
    points.push(new THREE.Vector2(baseRadius - wallThickness, bottomThickness)); 
    points.push(new THREE.Vector2(0, bottomThickness));

    return points;
  }, []);

  // 物理形状定义 (相对于瓶子中心 [0, -1.5, 0])
  const jarShapes = useMemo(() => {
    const shapes = [];
    
    // 1. 瓶底 (Box) - Offset +0.7 (from -1.5 to -0.8)
    shapes.push({
      type: 'Box',
      position: [0, 0.7, 0],
      rotation: [0, 0, 0], // Box is already aligned? usePlane was rotated. Box doesn't need -PI/2 if dimensions are correct.
      // usePlane rotated -PI/2 to face up. Box is solid.
      // We need a floor. A flat box [width, thickness, depth].
      // Radius 2.3 -> Width/Depth ~4.6?
      // Let's use existing wall logic for consistency? No, floor is a single slab.
      args: [3.5, 0.2, 3.5] // Approx size for floor
    });

    // 2. 瓶壁 (Compound Boxes)
    const wallCount = 16;
    // Body Walls - Offset +3.5
    const bodyRadius = 2.3;
    const bodyHeight = 6.0;
    const bodyY = 3.5;
    
    for (let i = 0; i < wallCount; i++) {
        const angle = (i / wallCount) * Math.PI * 2;
        const width = (2 * Math.PI * bodyRadius) / wallCount;
        shapes.push({
            type: 'Box',
            position: [Math.sin(angle) * bodyRadius, bodyY, Math.cos(angle) * bodyRadius],
            rotation: [0, angle, 0],
            args: [width * 1.1, bodyHeight, 0.4]
        });
    }

    // Neck Walls - Offset +7.5
    const neckRadius = 1.4;
    const neckHeight = 3.0;
    const neckY = 7.5;

    for (let i = 0; i < wallCount; i++) {
        const angle = (i / wallCount) * Math.PI * 2;
        const width = (2 * Math.PI * neckRadius) / wallCount;
        shapes.push({
            type: 'Box',
            position: [Math.sin(angle) * neckRadius, neckY, Math.cos(angle) * neckRadius],
            rotation: [0, angle, 0],
            args: [width * 1.1, neckHeight, 0.4]
        });
    }

    return shapes;
  }, []);

  // Static Body
  const [ref] = useCompoundBody(() => ({
    mass: 0,
    type: 'Static',
    position: [0, -1.5, 0],
    shapes: jarShapes
  }));

  return (
    <group 
        ref={ref}
    >
      {/* 瓶身 - 更好的玻璃材质和形状 - Scale x1.6 */}
      {/* Visual mesh inside the physics group. Position 0,0,0 relative to group. */}
      <group scale={[1.6, 1.6, 1.6]}>
          
          {/* Main Body (Lathe) */}
          {/* raycast 禁用：避免瓶身拦截点击事件，让射线可以“穿过去”命中星星 */}
          <mesh castShadow receiveShadow raycast={() => null}>
            <latheGeometry args={[lathePoints, 128]} />
            <meshPhysicalMaterial 
              color="#ffffff" 
              transmission={1.0}  
              opacity={0.5}       
              roughness={0.0}    
              metalness={0.1}
              ior={1.1}           
              thickness={0.2}     
              envMapIntensity={5.0} 
              clearcoat={1.0}     
              clearcoatRoughness={0}
              side={THREE.DoubleSide}
              transparent={true}  
            />
          </mesh>

          {/* 瓶颈螺纹 */}
          <group position={[0, 3.8, 0]}>
             {/* 瓶口金属圈同样禁用 raycast，防止遮挡星星点击 */}
             <mesh position={[0, 0.1, 0]} rotation={[Math.PI/2, 0, 0]} raycast={() => null}>
                <torusGeometry args={[1.0, 0.03, 16, 100]} />
                 <meshPhysicalMaterial 
                  color="#ffffff" 
                  transmission={1.0} 
                  opacity={0.5} 
                  roughness={0.0} 
                  metalness={0.1}
                  ior={1.1}
                  thickness={0.2}
                  clearcoat={1.0}
                  clearcoatRoughness={0}
                  envMapIntensity={5.0}
                  transparent={true}
                />
             </mesh>
             <mesh position={[0, -0.1, 0]} rotation={[Math.PI/2, 0, 0]} raycast={() => null}>
                <torusGeometry args={[1.0, 0.03, 16, 100]} />
                 <meshPhysicalMaterial 
                  color="#ffffff" 
                  transmission={1.0} 
                  opacity={0.5} 
                  roughness={0.0} 
                  metalness={0.1}
                  ior={1.1}
                  thickness={0.2}
                  clearcoat={1.0}
                  clearcoatRoughness={0}
                  envMapIntensity={5.0}
                  transparent={true}
                />
             </mesh>
          </group>

      </group>

      {/* 瓶子阴影 (Contact Shadows) - 稳固扎根 */}
      <ContactShadows 
        position={[0, 0, 0]} // Relative to group center? No, ContactShadows usually world.
        // Wait, ContactShadows inside a moving group will move with it.
        // Group center is -1.5. Shadow should be at bottom of visual.
        // Visual bottom is at local Y=0 (relative to scale origin? No, Lathe starts at 0,0)
        // Group is at -1.5. Visual mesh is inside group.
        // Lathe points start at 0,0. So visual bottom is at Group Origin.
        // So ContactShadows at [0,0,0] inside group means at -1.5 world Y.
        // Correct.
        opacity={0.8} 
        scale={10} 
        blur={1.5} 
        far={1} 
        color="#000000"
        // 阴影平面也不参与点击
        raycast={() => null}
      />
      
      {/* 
         Children (Stars) cannot be children of Kinematic Body in React-Three-Cannon 
         if they are separate dynamic bodies. 
         They must be siblings in Physics.
         We will render them outside this component in the main StarJar.
      */}
    </group>
  );
};

// 全局星星点击控制器：直接监听 Canvas DOM，射线优先选择最近的星星
const StarClickController = ({ onStarClick }) => {
  const { gl, scene, camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    const handlePointerDown = (event) => {
      if (!onStarClick) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (!intersects.length) return;

      let closestStar = null;
      let closestDistance = Infinity;

      for (const hit of intersects) {
        let obj = hit.object;
        while (obj) {
          if (obj.userData && obj.userData.isStar && obj.userData.star) {
            if (hit.distance < closestDistance) {
              closestDistance = hit.distance;
              closestStar = obj.userData.star;
            }
            break;
          }
          obj = obj.parent;
        }
      }

      if (closestStar) {
        onStarClick(closestStar);
      }
    };

    const dom = gl.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gl, scene, camera, raycaster, pointer, onStarClick]);

  return null;
};

// 单个星星在瓶子里的表现 (物理实体)
const StarInJar = ({ star, index, onStarClick }) => {
  const startPos = useMemo(() => [
    (Math.random() - 0.5) * 2.0,  // X 范围限制在瓶身中部
    2.0 + Math.random(),          // Y：2.0 ~ 3.0 区间内随机掉落
    (Math.random() - 0.5) * 2.0   // Z 范围限制在瓶身中部
  ], [index]);

  const [ref] = useBox(() => ({
    mass: 0.1,
    args: [0.4, 0.4, 0.25], // Increase collider size to match visual scale (0.25)
    position: startPos,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    angularVelocity: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
    friction: 0.5,
    restitution: 0.2,
    linearDamping: 0.5,
    angularDamping: 0.5
  }));

  const handleClick = (e) => {
    e.stopPropagation();
    if (onStarClick) {
      onStarClick(star);
    }
  };

  return (
    <group ref={ref}>
      <group userData={{ isStar: true, star: star }} onClick={handleClick}>
        <LuckyStar3D 
          color={star.color} 
          isPuffed={true} 
          position={[0,0,0]} 
          rotation={[0,0,0]}
          scale={0.25}
        />
      </group>
    </group>
  );
};

const StarJar = ({ stars, onDelete }) => {
  const [selectedStar, setSelectedStar] = useState(null);

  const handleDelete = () => {
    if (selectedStar && onDelete) {
      onDelete(selectedStar.id);
      setSelectedStar(null);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Scene Container */}
      <div className="w-full h-full">
        <Canvas 
            shadows 
            dpr={[1, 2]} 
            camera={{ position: [0, 9, 20], fov: 45 }}
            onCreated={(state) => state.camera.lookAt(0, 6, 0)}
            gl={{ alpha: true, antialias: true }} 
          >
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={3.0} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-5, 5, 5]} intensity={1.0} />
          <directionalLight position={[10, 2, 0]} intensity={1.0} />
          <Environment preset="studio" />

          {/* 全局星星点击控制器：确保星星优先于一切被选中 */}
          <StarClickController onStarClick={setSelectedStar} />
          
          <Physics gravity={[0, -9.8, 0]} allowSleep={false}>
            {/* Interactive Bottle (Static) */}
            <InteractiveJar />
            
            {/* Dynamic Stars */}
            {stars.map((star, index) => (
                <StarInJar 
                key={star.id} 
                star={star} 
                index={index}
                onStarClick={setSelectedStar}
                />
            ))}
          </Physics>

        </Canvas>
      </div>
      {/* ... Modal ... */}
      <AnimatePresence>
        {selectedStar && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/10"
            onClick={() => setSelectedStar(null)}
          >
            <motion.div
              initial={{ scale: 0.2, y: 100, opacity: 0 }}
              animate={{ 
                  scale: 1, 
                  y: 0, 
                  opacity: 1,
                  transition: { type: "spring", stiffness: 300, damping: 25 }
              }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
              className="bg-white/90 rounded-2xl p-8 shadow-2xl max-w-sm w-full relative overflow-hidden border border-white/40"
              onClick={e => e.stopPropagation()}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full -mr-16 -mt-16 blur-2xl"
                style={{ backgroundColor: selectedStar.color }}
              ></div>

              <button 
                onClick={() => setSelectedStar(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100/50 transition-colors z-10"
              >
                <X size={20} className="text-gray-400" />
              </button>

              <div className="mb-6 flex justify-center">
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1, transition: { delay: 0.1, type: "spring" } }}
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-lg ring-4 ring-white/50"
                  style={{ backgroundColor: selectedStar.color }}
                >
                  ★
                </motion.div>
              </div>

              <h3 className="text-center text-lg font-medium text-gray-800 mb-2">
                一颗幸运星
              </h3>
              
              <div className="bg-white/50 rounded-xl p-6 text-center border border-gray-100">
                <p className="text-gray-600 font-handwriting text-lg leading-relaxed">
                  "{selectedStar.message}"
                </p>
              </div>
              
              <div className="mt-4 flex gap-2 justify-center">
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 text-red-400 text-xs rounded-full hover:bg-red-100 transition-colors"
                >
                    删除
                </button>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-400">
                {new Date(selectedStar.timestamp).toLocaleDateString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StarJar;
