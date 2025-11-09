// src/components/3d/Sofa.js
import React from 'react';

export function Sofa({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0] }) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2, 0.5, 1]} /> {/* Dimensions: width, height, depth */}
        <meshStandardMaterial color="#8b9cb0" /> {/* Light gray-blue for a modern look */}
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.75, -0.45]}>
        <boxGeometry args={[2, 0.5, 0.2]} />
        <meshStandardMaterial color="#556b7a" /> {/* Darker color for contrast */}
      </mesh>

      {/* Left Armrest */}
      <mesh position={[-1.05, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color="#556b7a" />
      </mesh>

      {/* Right Armrest */}
      <mesh position={[1.05, 0.5, 0]}>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color="#556b7a" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.8, -0.25, 0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.8, -0.25, 0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.8, -0.25, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.8, -0.25, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export default Sofa;
