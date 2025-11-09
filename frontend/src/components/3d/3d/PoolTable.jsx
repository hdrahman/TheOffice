// src/components/3d/PoolTable.js
import React from 'react';

export function PoolTable({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Table Surface */}
      <mesh position={[0, 1.1, 0]}>  {/* Raise it slightly above the frame */}
        <boxGeometry args={[3, 0.1, 1.5]} /> {/* Reduced height to 0.1 */}
        <meshStandardMaterial color="#006400" /> {/* Green felt color */}
      </mesh>

      {/* Table Frame */}
      <mesh position={[0, 1, 0]}>  {/* Slightly lower to avoid covering the surface */}
        <boxGeometry args={[3.2, 0.2, 1.7]} /> {/* Slightly larger for frame */}
        <meshStandardMaterial color="#8B4513" /> {/* Brown wooden frame */}
      </mesh>

      {/* Table Legs */}
      <mesh position={[-1.3, 0.5, -0.6]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} /> {/* Left Front Leg */}
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[1.3, 0.5, -0.6]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} /> {/* Right Front Leg */}
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-1.3, 0.5, 0.6]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} /> {/* Left Back Leg */}
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[1.3, 0.5, 0.6]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} /> {/* Right Back Leg */}
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Pockets */}
      <mesh position={[-1.5, 1.15, -0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[1.5, 1.15, -0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-1.5, 1.15, 0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[1.5, 1.15, 0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0, 1.15, -0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0, 1.15, 0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  );
}

export default PoolTable;
