import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Reactor3DProps {
  temperature: number;
  viscosity: number;
  conversion: number;
}

function ReactorModel({ temperature, viscosity, conversion }: Reactor3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/reactor.glb');
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });
  
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  
  const getGlowColor = () => {
    if (temperature > 6.0) return '#ff3300';
    if (temperature > 5.5) return '#ffaa00';
    return '#00ff88';
  };
  
  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1.2} position={[0, -1, 0]} />
      
      {temperature > 5.8 && (
        <pointLight 
          position={[0, 0.5, 0]} 
          intensity={0.8} 
          color={getGlowColor()} 
          distance={5}
        />
      )}
      
      <Html position={[2, 1.8, 0]} distanceFactor={12}>
        <div style={{
          background: 'rgba(0,0,0,0.85)',
          color: '#0f0',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'monospace',
          borderLeft: `3px solid ${getGlowColor()}`,
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div>🌡️ {temperature.toFixed(1)}°C</div>
            <div>💧 {viscosity.toFixed(3)} Па·с</div>
            <div>🔄 {conversion.toFixed(1)}%</div>
          </div>
          {temperature > 6.0 && (
            <div style={{ color: '#ff6600', fontSize: '10px', marginTop: '5px' }}>
              ⚠️ ПЕРЕГРЕВ! Снизьте подачу инициатора
            </div>
          )}
          {viscosity > 0.92 && (
            <div style={{ color: '#ff6600', fontSize: '10px', marginTop: '5px' }}>
              ⚠️ РИСК КОАГУЛЮМА!
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default function Reactor3D({ temperature, viscosity, conversion }: Reactor3DProps) {
  return (
    <div style={{ 
      height: '550px', 
      background: 'linear-gradient(180deg, #0a0a2a 0%, #050515 100%)', 
      borderRadius: '16px', 
      overflow: 'hidden',
      border: '1px solid #2a2a4a',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <Canvas
        camera={{ position: [3, 2, 4], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={1024}
        />
        <pointLight position={[-3, 2, 2]} intensity={0.5} color="#4488ff" />
        <pointLight position={[2, 1, 3]} intensity={0.3} color="#ff8844" />
        
        <gridHelper args={[15, 20, '#336633', '#225522']} position={[0, -1.8, 0]} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          zoomSpeed={0.8}
          rotateSpeed={1}
          minDistance={2}
          maxDistance={8}
        />
        
        <ReactorModel 
          temperature={temperature} 
          viscosity={viscosity} 
          conversion={conversion}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/reactor.glb');
