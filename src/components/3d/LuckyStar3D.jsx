import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';

// 生成噪声纹理用于模拟纸张质感
const createNoiseTexture = () => {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
};

const LuckyStar3D = ({ color, isPuffed, position, rotation, scale = 1, onPointerDown, onPointerUp }) => {
  const meshRef = useRef();
  const geometryRef = useRef();
  
  // 生成几何体数据
  const { positions, normals, indices } = useMemo(() => {
    // 参数定义 (基于侧视图调整：更厚实，侧面有体积感)
    const outerRadius = 1.0;
    const innerRadius = 0.65; // 增加内半径，让星星更"胖"
    
    // 厚度参数 (High Z for center, Medium Z for rim)
    const centerZ = 0.6; // 中心隆起高度 (很厚)
    const rimZ = 0.15;   // 边缘厚度 (侧面不是锋利的，是有厚度的)
    
    const vertices = [];
    
    // --- Front Face Vertices ---
    // 0: Front Center
    vertices.push(0, 0, centerZ);
    
    // 1-5: Front Outer Rim (Tips)
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 * Math.PI) / 180;
      vertices.push(Math.sin(angle) * outerRadius, Math.cos(angle) * outerRadius, rimZ);
    }
    
    // 6-10: Front Inner Rim (Valleys/Pinches)
    for (let i = 0; i < 5; i++) {
      const angle = ((i * 72 + 36) * Math.PI) / 180;
      // 内凹点稍微薄一点，模拟捏合效果
      vertices.push(Math.sin(angle) * innerRadius, Math.cos(angle) * innerRadius, rimZ * 0.8);
    }
    
    // --- Back Face Vertices ---
    // 11: Back Center
    vertices.push(0, 0, -centerZ);
    
    // 12-16: Back Outer Rim
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 * Math.PI) / 180;
      vertices.push(Math.sin(angle) * outerRadius, Math.cos(angle) * outerRadius, -rimZ);
    }
    
    // 17-21: Back Inner Rim
    for (let i = 0; i < 5; i++) {
      const angle = ((i * 72 + 36) * Math.PI) / 180;
      vertices.push(Math.sin(angle) * innerRadius, Math.cos(angle) * innerRadius, -rimZ * 0.8);
    }

    // 构建三角形索引
    const indices = [];
    
    // 1. Front Face (10 triangles)
    // Center(0) -> Outer(i) -> Inner(i)
    // Center(0) -> Inner(prev) -> Outer(i)
    for (let i = 0; i < 5; i++) {
      const center = 0;
      const outer = 1 + i;
      const innerPrev = 6 + ((i + 4) % 5);
      const innerNext = 6 + i;
      
      // Face 1: Center -> Outer -> InnerNext (Right side of point)
      indices.push(center, outer, innerNext); 
      // Face 2: Center -> InnerPrev -> Outer (Left side of point)
      indices.push(center, innerPrev, outer);
    }

    // 2. Back Face (10 triangles)
    // BackCenter(11) -> Inner -> Outer (Reverse order for normals)
    for (let i = 0; i < 5; i++) {
      const center = 11;
      const outer = 12 + i;
      const innerPrev = 17 + ((i + 4) % 5);
      const innerNext = 17 + i;
      
      // Face 1: Center -> InnerNext -> Outer
      indices.push(center, innerNext, outer);
      // Face 2: Center -> Outer -> InnerPrev
      indices.push(center, outer, innerPrev);
    }

    // 3. Side Wall (Connecting Front Rim to Back Rim)
    // We have 10 segments along the rim (5 Outer-Inner, 5 Inner-Outer)
    for (let i = 0; i < 5; i++) {
      // Segment 1: Outer(i) -> Inner(i)
      const fOuter = 1 + i;
      const fInner = 6 + i;
      const bOuter = 12 + i;
      const bInner = 17 + i;
      
      // Quad: fOuter -> fInner -> bInner -> bOuter
      // Tri 1: fOuter -> fInner -> bOuter
      indices.push(fOuter, fInner, bOuter);
      // Tri 2: bOuter -> fInner -> bInner
      indices.push(bOuter, fInner, bInner);
      
      // Segment 2: Inner(prev) -> Outer(i)
      // Note: loop index i connects Outer(i) to Inner(i) (Right side)
      // We need to connect Inner(prev) to Outer(i) (Left side)
      // Or simply loop 0..4 and handle both segments? 
      // Let's do Inner(i) -> Outer(next)
      
      const fOuterNext = 1 + ((i + 1) % 5);
      const bOuterNext = 12 + ((i + 1) % 5);
      
      // Quad: fInner -> fOuterNext -> bOuterNext -> bInner
      // Tri 1: fInner -> fOuterNext -> bInner
      indices.push(fInner, fOuterNext, bInner);
      // Tri 2: bInner -> fOuterNext -> bOuterNext
      indices.push(bInner, fOuterNext, bOuterNext);
    }

    return {
      positions: new Float32Array(vertices),
      indices: indices
    };
  }, []);

  // 动画控制
  useEffect(() => {
    if (!geometryRef.current || !meshRef.current) return;
    
    const posAttribute = geometryRef.current.attributes.position;
    
    // Target Values
    const tCenterZ = isPuffed ? 0.6 : 0.01;
    const tRimZ = isPuffed ? 0.15 : 0.01;
    
    // 动画对象
    const anim = { 
      centerZ: posAttribute.getZ(0) || 0,
      rimZ: posAttribute.getZ(1) || 0,
    };

    // 如果是变成立体状态 (Pop Moment)
    if (isPuffed) {
        // Reset scale for the pop effect
        meshRef.current.scale.set(0.1, 0.1, 0.1);
        
        // Scale Animation: 0.1 -> Target Scale
        const targetScale = typeof scale === 'number' ? scale : (scale[0] || 1);
        const startScale = targetScale * 0.1;

        gsap.to(meshRef.current.scale, {
            x: targetScale, y: targetScale, z: targetScale,
            duration: 0.8,
            ease: "elastic.out(1, 0.5)",
            startAt: { x: startScale, y: startScale, z: startScale }
        });
        
        // Geometry Animation (Thickness)
        gsap.to(anim, {
            centerZ: tCenterZ,
            rimZ: tRimZ,
            duration: 1.2,
            ease: "elastic.out(1, 0.5)",
            onUpdate: () => {
                // Update Front Center
                posAttribute.setZ(0, anim.centerZ);
                // Update Back Center
                posAttribute.setZ(11, -anim.centerZ);
                
                // Update Front Rim (Outer 1-5, Inner 6-10)
                for (let i = 1; i <= 5; i++) posAttribute.setZ(i, anim.rimZ);
                for (let i = 6; i <= 10; i++) posAttribute.setZ(i, anim.rimZ * 0.8);
                
                // Update Back Rim (Outer 12-16, Inner 17-21)
                for (let i = 12; i <= 16; i++) posAttribute.setZ(i, -anim.rimZ);
                for (let i = 17; i <= 21; i++) posAttribute.setZ(i, -anim.rimZ * 0.8);
                
                posAttribute.needsUpdate = true;
                geometryRef.current.computeVertexNormals();
            }
        });
    }
    
  }, [isPuffed]);

  const noiseMap = useMemo(() => createNoiseTexture(), []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      castShadow
      receiveShadow
    >
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={new Uint16Array(indices)}
          count={indices.length}
          itemSize={1}
        />
      </bufferGeometry>
      <meshPhysicalMaterial
        color={color}
        roughness={0.8} // 纸张表面粗糙
        metalness={0.0} // 非金属
        transmission={0.0} // 不透明纸张
        opacity={1.0}
        transparent={false} // Ensure it's opaque for depth writing
        depthWrite={true}   // Force depth write
        flatShading={true} // 保留折痕感
        bumpMap={noiseMap}
        bumpScale={0.05} // 增强纸张纹理
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default LuckyStar3D;
