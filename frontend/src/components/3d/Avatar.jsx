// src/components/3d/Avatar.jsx
import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { wallBoundingBox } from "./OfficeComponents";

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

const Avatar = forwardRef(({ isFirstPerson, debugCamera = false }, ref) => {
  const groupRef = useRef();
  const { camera, scene } = useThree();

  // movement / physics constants (units per second where appropriate)
  const speed = 3.0; // units / second
  const rotationSpeed = THREE.MathUtils.degToRad(120); // rad / second
  const jumpStrength = 4.5; // initial upward velocity (units/sec)
  const gravity = 9.8; // units / s^2

  // input tracking
  const keysPressed = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  // physics refs (synchronous per-frame state)
  const velocityY = useRef(0);
  const isGrounded = useRef(true);

  // expose group ref to parent
  useImperativeHandle(ref, () => groupRef.current);

  const logFirstPerson = throttle(
    (mode) => console.log("Avatar: First-person mode:", mode),
    1000
  );

  useEffect(() => {
    logFirstPerson(isFirstPerson);
  }, [isFirstPerson]);

  // keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event) => {
      const k = event.key;
      if (k === "w" || k === "W") keysPressed.current.forward = true;
      if (k === "s" || k === "S") keysPressed.current.backward = true;
      if (k === "a" || k === "A") keysPressed.current.left = true;
      if (k === "d" || k === "D") keysPressed.current.right = true;
      if (event.code === "Space") keysPressed.current.jump = true;
    };

    const handleKeyUp = (event) => {
      const k = event.key;
      if (k === "w" || k === "W") keysPressed.current.forward = false;
      if (k === "s" || k === "S") keysPressed.current.backward = false;
      if (k === "a" || k === "A") keysPressed.current.left = false;
      if (k === "d" || k === "D") keysPressed.current.right = false;
      if (event.code === "Space") keysPressed.current.jump = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // temp objects reused per-frame (not mutated across uses)
  const tmpDir = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());
  const worldPos = useRef(new THREE.Vector3());
  const worldQuat = useRef(new THREE.Quaternion());
  const desiredCamPos = useRef(new THREE.Vector3());
  const debugMarkerRef = useRef();

  // optional debug marker for desired camera position
  useEffect(() => {
    if (!debugCamera) return;
    const geo = new THREE.SphereGeometry(0.08, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const m = new THREE.Mesh(geo, mat);
    debugMarkerRef.current = m;
    scene.add(m);
    return () => {
      scene.remove(m);
      mat.dispose();
      geo.dispose();
    };
  }, [debugCamera, scene]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // -------- movement & rotation (frame-rate independent) ----------
    // rotation
    if (keysPressed.current.left) group.rotation.y += rotationSpeed * delta;
    if (keysPressed.current.right) group.rotation.y -= rotationSpeed * delta;

    // movement direction local-forward/back
    tmpDir.current.set(
      0,
      0,
      (keysPressed.current.forward ? -1 : 0) +
        (keysPressed.current.backward ? 1 : 0)
    );

    // rotate to world direction using group's world quaternion to be robust
    group.getWorldQuaternion(tmpQuat.current);
    tmpDir.current.applyQuaternion(tmpQuat.current);

    // compute tentative next world position
    group.getWorldPosition(worldPos.current);
    const nextWorldPos = new THREE.Vector3()
      .copy(worldPos.current)
      .add(tmpDir.current.multiplyScalar(speed * delta));

    // If you keep group.position as the authoritative source (the group might be parented)
    // we compute and then set group.position relative to its parent so it moves correctly.
    // We'll convert nextWorldPos back to the group's local coordinates before writing.
    // If the group has no parent, local == world.
    let newLocalPos = nextWorldPos;
    if (group.parent) {
      group.parent.worldToLocal(newLocalPos);
    }

    // Simple collision: check with wallBoundingBox (which is in world space)
    if (wallBoundingBox && wallBoundingBox.current) {
      // block move if nextWorldPos center is inside the wall box
      if (!wallBoundingBox.current.containsPoint(nextWorldPos)) {
        group.position.copy(newLocalPos);
      } else {
        // blocked — do nothing. Could implement sliding here.
      }
    } else {
      group.position.copy(newLocalPos);
    }

    // ---------- jumping & gravity (refs for synchronous updates) ----------
    if (keysPressed.current.jump && isGrounded.current) {
      velocityY.current = jumpStrength;
      isGrounded.current = false;
    }

    if (!isGrounded.current) {
      velocityY.current -= gravity * delta;
      group.position.y += velocityY.current * delta;
      if (group.position.y <= 1) {
        group.position.y = 1;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    } else {
      // keep it from sinking
      group.position.y = Math.max(group.position.y, 1);
    }

    // ---------- camera follow (defensive world-based calculation) ----------
    // compute world position & orientation fresh (important!)
    group.getWorldPosition(worldPos.current);
    group.getWorldQuaternion(worldQuat.current);

    if (!isFirstPerson) {
      const offsetLocal = new THREE.Vector3(0, 5, 8);
      // clone before applying quaternion so offsetLocal isn't mutated globally
      const offsetWorld = offsetLocal.clone().applyQuaternion(worldQuat.current);

      desiredCamPos.current.copy(worldPos.current).add(offsetWorld);

      // debug marker
      if (debugCamera && debugMarkerRef.current) {
        debugMarkerRef.current.position.copy(desiredCamPos.current);
      }

      // smoothing factor (exponential) depending on delta
      const followSpeed = 8.0;
      const t = 1 - Math.exp(-followSpeed * delta);

      camera.position.lerp(desiredCamPos.current, t);

      // Force camera up vector so it never flips
      camera.up.set(0, 1, 0);

      // compute look target: a stable point slightly above avatar's head in world space
      const lookTarget = worldPos.current.clone().add(new THREE.Vector3(0, 1.2, 0));
      // Avoid degenerate lookAt when camera is almost coincident with lookTarget
      if (camera.position.distanceToSquared(lookTarget) > 1e-6) {
        camera.lookAt(lookTarget);
      }
    } else {
      // first-person: put camera at head position and look forward
      const headLocal = new THREE.Vector3(0, 1.6, 0);
      const headWorld = headLocal.clone().applyQuaternion(worldQuat.current).add(worldPos.current);

      const fpFollowSpeed = 60.0;
      const t = 1 - Math.exp(-fpFollowSpeed * delta);
      camera.position.lerp(headWorld, t);
      camera.up.set(0, 1, 0);

      // forward target: head + forward vector in world space
      const forwardWorld = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat.current);
      const lookPoint = headWorld.clone().add(forwardWorld.multiplyScalar(10));
      if (camera.position.distanceToSquared(lookPoint) > 1e-6) {
        camera.lookAt(lookPoint);
      }
    }

    // optional debug logging when camera flip/stall symptoms occur:
    if (debugCamera) {
      // Print quaternion and camera position occasionally
      // (throttle to avoid spamming)
      // Using throttle inline to avoid defining extra closures
      // Quick naive throttle:
      if (!Avatar._lastDbg || state.clock.getElapsedTime() - Avatar._lastDbg > 0.5) {
        Avatar._lastDbg = state.clock.getElapsedTime();
        console.log("WORLD POS:", worldPos.current.toArray());
        console.log(
          "WORLD QUAT:",
          worldQuat.current.x.toFixed(3),
          worldQuat.current.y.toFixed(3),
          worldQuat.current.z.toFixed(3),
          worldQuat.current.w.toFixed(3)
        );
        console.log("CAM POS:", camera.position.toArray());
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
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
});

Avatar.displayName = "Avatar";

export default Avatar;
