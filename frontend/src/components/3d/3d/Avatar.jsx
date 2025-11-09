// src/components/3d/Avatar.jsx
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Avatar = forwardRef(
  (
    {
      isFirstPerson = false,
      startPosition = [0, 1, 0],
      cameraStartPosition = [0, 2, 5], // third-person camera spawn
      cameraStartLookAt = [0, 1.5, 0], // where camera should look initially
    },
    ref
  ) => {
    const groupRef = useRef();
    const { camera, scene } = useThree();

    // movement params
    const speed = 0.075;
    const rotationSpeed = 0.05;
    const jumpStrength = 0.15;
    const gravity = 0.01;

    // input
    const keysPressed = useRef({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });

    // physics refs
    const velocityYRef = useRef(0);
    const isGroundedRef = useRef(true);

    // saved camera transform for restore
    const savedCameraWorld = useRef({
      pos: new THREE.Vector3(...cameraStartPosition),
      quat: new THREE.Quaternion(),
      parent: null,
    });

    useImperativeHandle(ref, () => groupRef.current);

    // Input listeners
    useEffect(() => {
      const down = (e) => {
        const k = e.key;
        if (k === 'w' || k === 'W') keysPressed.current.forward = true;
        if (k === 's' || k === 'S') keysPressed.current.backward = true;
        if (k === 'a' || k === 'A') keysPressed.current.left = true;
        if (k === 'd' || k === 'D') keysPressed.current.right = true;
        if (k === ' ') keysPressed.current.jump = true;
      };
      const up = (e) => {
        const k = e.key;
        if (k === 'w' || k === 'W') keysPressed.current.forward = false;
        if (k === 's' || k === 'S') keysPressed.current.backward = false;
        if (k === 'a' || k === 'A') keysPressed.current.left = false;
        if (k === 'd' || k === 'D') keysPressed.current.right = false;
        if (k === ' ') keysPressed.current.jump = false;
      };
      window.addEventListener('keydown', down);
      window.addEventListener('keyup', up);
      return () => {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
      };
    }, []);

    // Ensure avatar start position
    useEffect(() => {
      if (groupRef.current) {
        const [x, y, z] = startPosition;
        groupRef.current.position.set(x, y, z);
      }
    }, [startPosition]);

    // Deterministic camera spawn on cold mount
    useEffect(() => {
      if (!camera || !scene) return;

      // Debug info to detect other camera owners
      console.log('Avatar mount: camera info', {
        pos: camera.position.toArray(),
        parentType: camera.parent?.type,
        parentName: camera.parent?.name,
      });

      // Set a deterministic third-person start if camera not parented to avatar
      // Only set on cold mount; this makes full reload deterministic.
      if (!groupRef.current || camera.parent !== groupRef.current) {
        camera.position.set(...cameraStartPosition);
        camera.lookAt(...cameraStartLookAt);
        camera.updateMatrixWorld(true);
        // initialize saved restore to this sane start
        savedCameraWorld.current.pos.copy(new THREE.Vector3(...cameraStartPosition));
        savedCameraWorld.current.quat.copy(camera.getWorldQuaternion(new THREE.Quaternion()));
        savedCameraWorld.current.parent = camera.parent || scene;
      }
    }, [camera, scene, cameraStartPosition, cameraStartLookAt]);

    // Parent/unparent camera when toggling first-person
    useEffect(() => {
      if (!camera || !groupRef.current || !scene) return;

      // If entering first-person, save world transform and parent camera to the group:
      if (isFirstPerson) {
        camera.updateMatrixWorld(true);
        camera.getWorldPosition(savedCameraWorld.current.pos);
        camera.getWorldQuaternion(savedCameraWorld.current.quat);
        savedCameraWorld.current.parent = camera.parent || scene;

        groupRef.current.add(camera);
        camera.position.set(0, 1.6, 0);
        camera.quaternion.set(0, 0, 0, 1);
        camera.updateMatrixWorld(true);
        console.log('Switched to FIRST PERSON. Camera parent:', camera.parent?.type);
        return;
      }

      // If exiting first-person, restore camera to saved parent/world transform
      if (camera.parent === groupRef.current) {
        groupRef.current.remove(camera);
        const attachParent = savedCameraWorld.current.parent || scene;
        attachParent.add(camera);

        camera.position.copy(savedCameraWorld.current.pos);
        camera.quaternion.copy(savedCameraWorld.current.quat);
        camera.updateMatrixWorld(true);
        console.log('Switched to THIRD PERSON. Camera restored to:', attachParent.type, camera.position.toArray());
      }
    }, [isFirstPerson, camera, scene]);

    // Cleanup on unmount: best-effort restore
    useEffect(() => {
      return () => {
        if (!camera || !scene) return;
        try {
          if (camera.parent && camera.parent.remove) camera.parent.remove(camera);
          (savedCameraWorld.current.parent || scene).add(camera);
          camera.position.copy(savedCameraWorld.current.pos);
          camera.quaternion.copy(savedCameraWorld.current.quat);
          camera.updateMatrixWorld(true);
        } catch (e) {
          // ignore
        }
      };
    }, [camera, scene]);

    // Frame loop
    useFrame((_, delta) => {
      if (!groupRef.current || !camera) return;
      const position = groupRef.current.position;
      const rotation = groupRef.current.rotation;
      const quaternion = new THREE.Quaternion();
      const direction = new THREE.Vector3();

      // rotation
      if (keysPressed.current.left) rotation.y += rotationSpeed * (delta * 60);
      if (keysPressed.current.right) rotation.y -= rotationSpeed * (delta * 60);

      // movement
      quaternion.setFromEuler(rotation);
      direction
        .set(0, 0, (keysPressed.current.forward ? -1 : 0) + (keysPressed.current.backward ? 1 : 0))
        .applyQuaternion(quaternion);
      position.add(direction.multiplyScalar(speed * (delta * 60)));

      // jumping + gravity
      if (keysPressed.current.jump && isGroundedRef.current) {
        velocityYRef.current = jumpStrength;
        isGroundedRef.current = false;
      }
      if (!isGroundedRef.current) {
        velocityYRef.current -= gravity * (delta * 60);
        position.y += velocityYRef.current * (delta * 60);
        if (position.y <= 1) {
          position.y = 1;
          velocityYRef.current = 0;
          isGroundedRef.current = true;
        }
      }

      // camera follow only when NOT parented to group (third-person)
      if (camera.parent !== groupRef.current) {
        const cameraOffset = new THREE.Vector3(0, 2, 5);
        const targetCameraPosition = new THREE.Vector3().copy(position).add(cameraOffset.applyQuaternion(quaternion));

        if (
          Number.isFinite(targetCameraPosition.x) &&
          Number.isFinite(targetCameraPosition.y) &&
          Number.isFinite(targetCameraPosition.z)
        ) {
          camera.position.lerp(targetCameraPosition, 0.12);
          camera.lookAt(new THREE.Vector3(position.x, position.y + 1.5, position.z));
        }
      } else {
        // camera is parented (first-person) -> sync rotation optionally
        camera.quaternion.copy(groupRef.current.getWorldQuaternion(new THREE.Quaternion()));
      }
    });

    return (
      <group ref={groupRef} position={startPosition}>
        {!isFirstPerson && (
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="peachpuff" />
          </mesh>
        )}
        {/* torso */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.6, 1, 0.4]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        {/* arms */}
        <mesh position={[-0.5, 0.7, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <mesh position={[0.5, 0.7, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        {/* legs */}
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
);

Avatar.displayName = 'Avatar';
export default Avatar;
