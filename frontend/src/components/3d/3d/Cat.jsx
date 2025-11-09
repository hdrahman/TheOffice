import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const Cat = () => {
  const catRef = useRef();
  let angle = 0;

  useFrame(() => {
    angle += 0.01;
    catRef.current.position.x = Math.cos(angle) * 2;
    catRef.current.position.z = Math.sin(angle) * 2;
  });

  return (
    <group ref={catRef}>
      {/* Cat Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 0.5, 0.5]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>

      {/* Cat Head */}
      <mesh position={[0, 1, 0.4]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>

      {/* Cat Ears */}
      <mesh position={[-0.2, 1.3, 0.4]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.15, 0.3, 4]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>
      <mesh position={[0.2, 1.3, 0.4]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.15, 0.3, 4]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>

      {/* Cat Tail */}
      <mesh position={[0, 0.5, -0.5]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 32]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>

      {/* Cat Legs */}
      <mesh position={[-0.3, 0.1, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>
      <mesh position={[0.3, 0.1, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>
      <mesh position={[-0.3, 0.1, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>
      <mesh position={[0.3, 0.1, -0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
        <meshStandardMaterial color="#d3a27a" />
      </mesh>
    </group>
  );
};

export default Cat;
