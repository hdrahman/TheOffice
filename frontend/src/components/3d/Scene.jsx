// src/components/3d/Scene.jsx
import React, { useRef, Suspense, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SmallWall, Wall, Desk, Chair, Floor, Floor2, OfficePlant, TallOfficePlant, OfficeDisplay, AdjustableWall, DoubleGlassDoors, BoardroomTable } from './OfficeComponents';
import Avatar from './Avatar';
import { ConferenceSeating } from './ConferenceSeating';
import { OfficeDivider } from './OfficeDivider';
import { Sofa } from './Sofa';
import { LoungeArea } from './LoungeArea';
import { PoolTable } from './PoolTable';
import Avatar2 from './Avatar2';
import OfficeLighting from './OfficeLighting';
import Cat from './Cat';
import socketManager from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';

// Throttle function to limit how often we send position updates
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

// Component to render other players
function RemotePlayer({ player }) {
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current && player.position) {
      meshRef.current.position.set(
        player.position.x || 0,
        player.position.y || 1,
        player.position.z || 0
      );
      meshRef.current.rotation.y = player.rotation || 0;
    }
  }, [player.position, player.rotation]);

  return (
    <group ref={meshRef}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="lightgreen" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="green" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <mesh position={[0.5, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="green" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="darkgreen" />
      </mesh>
      <mesh position={[0.2, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="darkgreen" />
      </mesh>
      {/* Username label above head */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1, 0.3, 0.01]} />
        <meshBasicMaterial color="white" opacity={0.8} transparent />
      </mesh>
    </group>
  );
}

function Scene({ isFirstPerson, onAvatarClick }) {
  const avatarRef = useRef();
  const controlsRef = useRef();
  const { camera } = useThree();
  const { user } = useAuth();

  // State for connected players
  const [otherPlayers, setOtherPlayers] = useState({});

  const speed = 0.1;
  const keysPressed = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false });

  // Connect to Socket.IO and set up multiplayer
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Connecting to multiplayer...');
    
    // Connect socket
    socketManager.connect(user.id, user.username || user.email);

    // Listen for current players when joining
    socketManager.onCurrentPlayers((players) => {
      console.log('👥 Current players:', players);
      const playersMap = {};
      players.forEach(p => {
        if (p.sid !== socketManager.socket.id) {
          playersMap[p.sid] = p;
        }
      });
      setOtherPlayers(playersMap);
    });

    // Listen for new players joining
    socketManager.onPlayerJoined((player) => {
      console.log('👤 Player joined:', player.username);
      setOtherPlayers(prev => ({ ...prev, [player.sid]: player }));
    });

    // Listen for player movement
    socketManager.onPlayerMoved((data) => {
      setOtherPlayers(prev => {
        if (!prev[data.sid]) return prev;
        return {
          ...prev,
          [data.sid]: {
            ...prev[data.sid],
            position: data.position,
            rotation: data.rotation
          }
        };
      });
    });

    // Listen for players leaving
    socketManager.onPlayerLeft((data) => {
      console.log('👋 Player left:', data.sid);
      setOtherPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[data.sid];
        return newPlayers;
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting from multiplayer...');
      socketManager.disconnect();
    };
  }, [user]);

  // Throttled function to broadcast position
  const broadcastPosition = useRef(
    throttle((position, rotation) => {
      socketManager.emitPlayerMove(
        { x: position.x, y: position.y, z: position.z },
        rotation
      );
    }, 100) // Send updates every 100ms (10 times per second)
  ).current;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keysPressed.current.hasOwnProperty(e.key)) keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e) => {
      if (keysPressed.current.hasOwnProperty(e.key)) keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    // Camera movement with arrow keys
    if (keysPressed.current.ArrowUp) camera.position.z -= speed;
    if (keysPressed.current.ArrowDown) camera.position.z += speed;
    if (keysPressed.current.ArrowLeft) camera.position.x -= speed;
    if (keysPressed.current.ArrowRight) camera.position.x += speed;

    if (controlsRef.current) controlsRef.current.update();

    // Broadcast avatar position if it exists
    if (avatarRef.current) {
      const position = avatarRef.current.position;
      const rotation = avatarRef.current.rotation;
      broadcastPosition(position, rotation.y);
    }
  });

  useEffect(() => {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight />
      <pointLight position={[20, 20, 20]} />

      {/* Floors */}
      <Floor />
      <Floor2 />

      {/* Walls */}
      <Wall position={[-20, 2.5, 0]} args={[0.2, 5, 40]} />
      <Wall position={[20, 2.5, 0]} args={[0.2, 5, 40]} />
      <Wall position={[0, 2.5, 20]} args={[40, 5, 0.2]} />
      <AdjustableWall position={[12.5, 2.5, -20]} width={15} />
      <AdjustableWall position={[-12.5, 2.5, -20]} width={15} />

      {/* Extra Small Walls */}
      <SmallWall position={[-5, 2.5, -25]} args={[0.2, 5, 8]} />
      <SmallWall position={[5, 2.5, -25]} args={[0.2, 5, 8]} />
      <SmallWall position={[-5, 2.5, -37.5]} args={[0.2, 5, 8]} />
      <SmallWall position={[5, 2.5, -37.5]} args={[0.2, 5, 8]} />

      {/* Additional Walls */}
      <Wall position={[-20, 2.5, -40]} args={[0.2, 5, 40]} />
      <Wall position={[20, 2.5, -40]} args={[0.2, 5, 40]} />
      <Wall position={[0, 2.5, -60]} args={[40, 5, 0.2]} />

      {/* Furniture */}
      <Desk position={[14, 0.55, 17]} />
      <Chair position={[14, 0.5, 18]} />
      <Desk position={[12, 0.55, 16]} />
      <Chair position={[12, 0.5, 17]} />
      <Desk position={[10, 0.55, 14]} />
      <Chair position={[10, 0.5, 13]} />
      <Desk position={[-8, 0.55, -13]} />
      <Chair position={[-8, 0.5, -14]} />
      <Desk position={[8, 0.55, -13]} />
      <Chair position={[8, 0.5, -14]} />
      <Desk position={[8, 0.55, 13]} />
      <Chair position={[8, 0.5, 14]} />

      {/* Dividers */}
      <OfficeDivider position={[15, 1, 2]} scale={1.5} />
      <OfficeDivider position={[-15, 1, 2]} scale={1.5} />

      <group position={[0, 0, -15]} rotation={[0, Math.PI / 2, 0]}>
        <OfficeDivider position={[-30, 1, 0]} scale={1.5} />
      </group>

      {/* Plants */}
      <OfficePlant position={[-10, 0, 15]} scale={1.5} />
      <TallOfficePlant position={[-9, 0, 12]} scale={1.5} />

      {/* Displays */}
      <OfficeDisplay receiveShadow castShadow position={[-6, 3, 9.5]} scale={4} />
      <OfficeDisplay receiveShadow castShadow position={[6, 3, 9.5]} scale={4} />

      {/* Conference Seating */}
      <ConferenceSeating position={[0, 0, 5]} scale={1.5} />
      <ConferenceSeating position={[-5, 0, -5]} scale={1.5} />
      <ConferenceSeating position={[5, 0, -5]} scale={1.5} />

      {/* Boardroom Table */}
      <BoardroomTable position={[-12.5, 2.5, -40]} />
      <BoardroomTable position={[12.5, 2.5, -40]} />

      {/* Doors */}
      <DoubleGlassDoors position={[0, 0, -20]} scale={5} />

      {/* Miscellaneous Furniture */}
      <Sofa position={[0, 0.5, -15]} />
      <LoungeArea position={[15, 0, -17]} scale={1.5} />
      <PoolTable position={[-15, 0, 7.5]} scale={2} />

      <group position={[0, 0, 0]} rotation={[0, Math.PI / 5, 0]}>
        <Sofa position={[-6, 0.5, -5]} scale={1.5} />
        <Sofa position={[-8, 0.5, -2]} scale={1.5} />
      </group>

      <group position={[0, 0, 0]} rotation={[0, -Math.PI / 5, 0]}>
        <Sofa position={[8, 0.5, -1]} scale={1.5} />
        <Sofa position={[5.5, 0.5, -4]} scale={1.5} />
      </group>

      {/* Your Avatar */}
      <Suspense fallback={null}>
        <Avatar ref={avatarRef} isFirstPerson={isFirstPerson} />
      </Suspense>

      {/* Render Other Players */}
      {Object.values(otherPlayers).map((player) => (
        <Suspense key={player.sid} fallback={null}>
          <RemotePlayer player={player} />
        </Suspense>
      ))}

      <OrbitControls ref={controlsRef} />

      <SmallWall position={[-10, 2.5, 6]} args={[0.2, 5, 8]} />
      <SmallWall position={[-6, 2.5, 10]} args={[8, 5, 0.2]} />

      <SmallWall position={[10, 2.5, 6]} args={[0.2, 5, 8]} />
      <SmallWall position={[6, 2.5, 10]} args={[8, 5, 0.2]} />

      <SmallWall position={[10, 2.5, -2]} args={[0.2, 5, 8]} />
      <SmallWall position={[4, 2.5, -10]} args={[8, 5, 0.2]} />

      <SmallWall position={[-10, 2.5, -2]} args={[0.2, 5, 8]} />
      <SmallWall position={[-4, 2.5, -10]} args={[8, 5, 0.2]} />

      <OfficeLighting />

      <OfficeDisplay receiveShadow castShadow position={[-12.5, 3, -30]} scale={4} />
      <OfficeDisplay receiveShadow castShadow position={[12.5, 3, -30]} scale={4} />

      <Cat position={[10, 0, 10]} />

      {/* Static NPC Avatar */}
      <Avatar2 
        position={[-20, 2.5, 20]} 
        name="Sophia Harper" 
        summary="Working on integrating a machine learning model into a customer support platform to automatically classify and prioritize support tickets based on urgency and topic" 
        onAvatarClick={onAvatarClick} 
      />
    </>
  );
}

export default Scene;