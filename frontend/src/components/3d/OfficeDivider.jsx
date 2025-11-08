// src/components/3d/OfficeDivider.js
import React from 'react';

export function OfficeDivider({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Divider Panel */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[4, 2, 0.1]} /> {/* Twice the original width (4 units) */}
        <meshStandardMaterial color="#D3D3D3" /> {/* Light grey color for panel */}
      </mesh>

      {/* Frame (Top and Bottom Bars) */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[4, 0.1, 0.1]} /> {/* Top frame bar, updated width */}
        <meshStandardMaterial color="#888888" /> {/* Darker grey frame */}
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[4, 0.1, 0.1]} /> {/* Bottom frame bar, updated width */}
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Frame (Side Bars) */}
      <mesh position={[-2, 1, 0]}>
        <boxGeometry args={[0.1, 2, 0.1]} /> {/* Left side frame bar */}
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[2, 1, 0]}>
        <boxGeometry args={[0.1, 2, 0.1]} /> {/* Right side frame bar */}
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Feet */}
      <mesh position={[-1.5, -0.6, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.4]} /> {/* Left foot, repositioned */}
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[1.5, -0.6, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.4]} /> {/* Right foot, repositioned */}
        <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
  );
}

export default OfficeDivider;
