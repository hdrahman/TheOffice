// src/components/3d/Scene.js
import React, { useRef, Suspense, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SmallWall, Wall, Desk, Chair, Floor, Floor2, OfficePlant, TallOfficePlant, OfficeDisplay, AdjustableWall, DoubleGlassDoors, BoardroomTable } from './OfficeComponents';
import Avatar from './Avatar';
import { ConferenceSeating } from './ConferenceSeating';
import { OfficeDivider } from './OfficeDivider';
import { GridHelper, AxesHelper } from 'three';
import { Sofa } from './Sofa';
import { LoungeArea } from './LoungeArea';
import { PoolTable } from './PoolTable';
import Avatar2 from './Avatar2';
import OfficeLighting from './OfficeLighting';
import Cat from './Cat';

function Scene({ isFirstPerson, onAvatarClick }) {
  const avatarRef = useRef();
  const controlsRef = useRef();

  const speed = 0.1;
  const { camera } = useThree();

  const keysPressed = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false });

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
    if (keysPressed.current.ArrowUp) camera.position.z -= speed;
    if (keysPressed.current.ArrowDown) camera.position.z += speed;
    if (keysPressed.current.ArrowLeft) camera.position.x -= speed;
    if (keysPressed.current.ArrowRight) camera.position.x += speed;

    if (controlsRef.current) controlsRef.current.update();
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

      {/* Avatars */}
      <Suspense fallback={null}>
        <Avatar ref={avatarRef} isFirstPerson={isFirstPerson} />
      </Suspense>
      <OrbitControls ref={controlsRef} />


      <SmallWall position={[-10, 2.5, 6]} args={[0.2, 5, 8]} />
      <SmallWall position={[-6, 2.5, 10]} args={[8, 5, 0.2]} />


      <SmallWall position={[10, 2.5, 6]} args={[0.2, 5, 8]} />
      <SmallWall position={[6, 2.5, 10]} args={[8, 5, 0.2]} />

      <SmallWall position={[10, 2.5, -2]} args={[0.2, 5, 8]} />
      <SmallWall position={[4, 2.5, -10]} args={[8, 5, 0.2]} />

      <SmallWall position={[-10, 2.5, -2]} args={[0.2, 5, 8]} />
      <SmallWall position={[-4, 2.5, -10]} args={[8, 5, 0.2]} />

      <OfficeLighting/>

      <OfficeDisplay receiveShadow castShadow position={[-12.5, 3, -30]} scale={4} />
      <OfficeDisplay receiveShadow castShadow position={[12.5, 3, -30]} scale={4} />

      <Cat position={[10, 0, 10]} />

      {/* Avatar2 with click handler passed as prop */}
      <Avatar2 position={[-20, 2.5, 20]} name="Sophia Harper" summary="Working on integrating a machine learning model into a customer support platform to automatically classify and prioritize support tickets based on urgency and topic" 
      onAvatarClick={onAvatarClick} />
    </>
  );
}

export default Scene;
