// src/components/3d/LoungeArea.js
import React from 'react';
import { Sofa } from './Sofa';
import { TallOfficePlant } from './OfficeComponents';

export function LoungeArea({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Sofas arranged in a circle facing inward */}
      <Sofa position={[-2, 0, 2]} rotation={[0, Math.PI / 4, 0]} scale={1.2} />         {/* Left Sofa */}
      <Sofa position={[2, 0, 2]} rotation={[0, -Math.PI / 4, 0]} scale={1.2} />        {/* Right Sofa */}
      <Sofa position={[0, 0, 5]} rotation={[0, Math.PI, 0]} scale={1.2} />            {/* Center Back Sofa */}

      {/* Central Table */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} /> {/* Round table */}
        <meshStandardMaterial color="#8B4513" />       {/* Brown table color */}
      </mesh>

      {/* Plants */}
      <TallOfficePlant position={[2, 0, 7]} scale={1.5} />    {/* Left Plant */}
      <TallOfficePlant position={[0, 0, 0]} scale={1.5} />   {/* Right Plant */}
    </group>
  );
}

export default LoungeArea;
