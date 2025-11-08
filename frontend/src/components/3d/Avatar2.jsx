// src/components/3d/Avatar2.js
import React from 'react';

const Avatar2 = React.forwardRef((props, ref) => {
  const { name, summary, onAvatarClick } = props;

  return (
    <group 
      ref={ref} 
      position={[-15, 1, 5]} 
      onClick={() => onAvatarClick ? onAvatarClick(name, summary) : console.warn('onAvatarClick is not defined')}
    >
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="peachpuff" />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="pink" />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="pink" />
      </mesh>
      <mesh position={[0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="pink" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="darkblue" />
      </mesh>
      <mesh position={[0.2, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="darkblue" />
      </mesh>
    </group>
  );
});

export default Avatar2;
