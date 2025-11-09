// src/components/3d/OfficeLighting.js
import React from 'react';
import { useThree } from '@react-three/fiber';

function OfficeLighting() {
  const { scene } = useThree();

  return (
    <group>
      {/* Ambient Light for general lighting */}
      <ambientLight intensity={0.4} color="#9a8fe1ff" /> 

      {/* Directional Light simulating sunlight, casting shadows */}
      <directionalLight 
        color="#ad8c4eff" 
        intensity={0.5} 
        position={[15, 20, 10]} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-far={50} 
        shadow-camera-left={-20} 
        shadow-camera-right={20} 
        shadow-camera-top={20} 
        shadow-camera-bottom={-20}
      />

      {/* Ceiling Point Lights simulating overhead lights */}
      <pointLight 
        color="#5252cdff" 
        intensity={0.7} 
        distance={25} 
        position={[-8, 8, -8]} 
        decay={2} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight 
        color="#f5f5ff" 
        intensity={0.7} 
        distance={25} 
        position={[8, 8, -8]} 
        decay={2} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight 
        color="#f5f5ff" 
        intensity={0.7} 
        distance={25} 
        position={[-8, 8, 8]} 
        decay={2} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight 
        color="#f5f5ff" 
        intensity={0.7} 
        distance={25} 
        position={[8, 8, 8]} 
        decay={2} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Optional Emissive Ceiling Fixture */}
      <mesh position={[0, 7.5, 0]}>
        <boxGeometry args={[1, 0.2, 4]} />
        <meshStandardMaterial emissive="#6e2727ff" emissiveIntensity={0.5} color="#f0f0ff" />
      </mesh>
    </group>
  );
}

export default OfficeLighting;
