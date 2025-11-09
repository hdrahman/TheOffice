// src/components/3d/ConferenceSeating.js
import React from 'react';

export function ConferenceSeating({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Conference Table */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial color="#849196ff" /> {/* Brown table top */}
      </mesh>

      {/* Table Stand */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color="#333333" /> {/* Dark base */}
      </mesh>

      {/* Chairs */}
      <Chair position={[-1, 0.5, -1.5]} rotation={[0, Math.PI / 4, 0]} />
      <Chair position={[1, 0.5, -1.5]} rotation={[0, -Math.PI / 4, 0]} />
      <Chair position={[-1.5, 0.5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Chair position={[1.5, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Chair position={[-1, 0.5, 1.5]} rotation={[0, -Math.PI / 4, 0]} />
      <Chair position={[1, 0.5, 1.5]} rotation={[0, Math.PI / 4, 0]} />
    </group>
  );
}

function Chair({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Chair Seat */}
      <mesh>
        <boxGeometry args={[0.5, 0.05, 0.5]} />
        <meshStandardMaterial color="#555555" /> {/* Grey seat */}
      </mesh>

      {/* Chair Back */}
      <mesh position={[0, 0.3, -0.2]}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#555555" /> {/* Grey back */}
      </mesh>

      {/* Chair Legs */}
      <mesh position={[-0.2, -0.25, 0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.2, -0.25, 0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.2, -0.25, -0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.2, -0.25, -0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export default ConferenceSeating;
