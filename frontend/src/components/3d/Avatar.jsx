// src/components/3d/Avatar.js
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {wallBoundingBox} from './OfficeComponents';

// import { throttle } from '../../utils/throttle';
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }


function Avatar({ isFirstPerson }) {
  const avatarRef = useRef();
  const { camera } = useThree();

  const speed = 0.075;
  const rotationSpeed = 0.05;
  const jumpStrength = 0.15;
  const gravity = 0.01;
  const keysPressed = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  const [velocityY, setVelocityY] = useState(0); // Vertical velocity for jumping
  const [isGrounded, setIsGrounded] = useState(true); // To track if avatar is on the ground

  const logFirstPerson = throttle((mode) => console.log("Avatar: First-person mode:", mode), 1000); // 1 second delay

  const checkCollision = (nextPosition) => {
    const avatarBox = new THREE.Box3().setFromObject(avatarRef.current);
    avatarBox.translate(nextPosition.clone().sub(avatarRef.current.position));
    return avatarBox.intersectsBox(wallBoundingBox.current);
  };

  useEffect(() => {
    logFirstPerson(isFirstPerson); // Throttled log for first-person mode
  }, [isFirstPerson]);

  // Set up event listeners for keyboard controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'w') keysPressed.current.forward = true;
      if (event.key === 's') keysPressed.current.backward = true;
      if (event.key === 'a') keysPressed.current.left = true;
      if (event.key === 'd') keysPressed.current.right = true;
      if (event.key === ' ') keysPressed.current.jump = true;
    };
    const handleKeyUp = (event) => {
      if (event.key === 'w') keysPressed.current.forward = false;
      if (event.key === 's') keysPressed.current.backward = false;
      if (event.key === 'a') keysPressed.current.left = false;
      if (event.key === 'd') keysPressed.current.right = false;
      if (event.key === ' ') keysPressed.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update avatar's position and rotation each frame
  useFrame(() => {
    if (avatarRef.current) {
      const position = avatarRef.current.position;
      const rotation = avatarRef.current.rotation;
      const direction = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();

      // Rotate avatar based on left and right input
      if (keysPressed.current.left) rotation.y += rotationSpeed;
      if (keysPressed.current.right) rotation.y -= rotationSpeed;

      // Calculate forward/backward movement relative to the avatar's rotation
      quaternion.setFromEuler(rotation);
      direction.set(0, 0, (keysPressed.current.forward ? -1 : 0) + (keysPressed.current.backward ? 1 : 0));
      direction.applyQuaternion(quaternion);

      // Apply movement based on speed
      position.add(direction.multiplyScalar(speed));

      // Update camera position and orientation for first-person mode

    //   if (isFirstPerson) {
    //     camera.position.set(position.x, position.y + 1.5, position.z);
    //     camera.quaternion.copy(quaternion);


    //     // console.log("Camera in first-person mode", camera.position); // Log camera position in first-person
    //   } else {
    //     // console.log("Camera in third-person mode"); // Log camera behavior when in third-person
    //   }


    // if (!checkCollision(nextPosition)) {
    //     position.copy(nextPosition);
    //   }

      const nextPosition = new THREE.Vector3().copy(position).add(direction.multiplyScalar(speed));

      // Now you can use `nextPosition` for any calculations or collision checks
      if (!wallBoundingBox.containsPoint(nextPosition)) {
        position.copy(nextPosition); // Only update position if not colliding with wall
      }
    

    if (keysPressed.current.jump && isGrounded) {
        setVelocityY(jumpStrength); // Set upward velocity
        setIsGrounded(false); // Avatar is now in the air
      }

      // Apply gravity
      if (!isGrounded) {
        setVelocityY((vY) => vY - gravity); // Apply downward force
        position.y += velocityY; // Update vertical position

        // Check if the avatar has landed
        if (position.y <= 1) { // Ground level
          position.y = 1;
          setVelocityY(0);
          setIsGrounded(true);
        }
    }
}



  });

  return (
    <group ref={avatarRef} position={[0, 1, 0]}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="peachpuff" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh position={[0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="blue" />
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
}

export default Avatar;
