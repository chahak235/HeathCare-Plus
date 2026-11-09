import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useVitals } from '../../../../contexts/VitalsContext';

interface HeartModelProps {
  hoveredPart: string | null;
  setHoveredPart: (part: string | null) => void;
  setHoverPosition: (pos: { x: number; y: number }) => void;
}

export const HeartModel: React.FC<HeartModelProps> = ({ 
  hoveredPart, 
  setHoveredPart,
  setHoverPosition 
}) => {
  const { currentVitals, getVitalStatus } = useVitals();
  const groupRef = useRef<THREE.Group>(null);
  const heartRef = useRef<THREE.Mesh>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Pulse animation based on real heart rate
  useFrame(({ clock, camera, mouse: mousePos, raycaster: rc, scene }) => {
    if (heartRef.current && currentVitals) {
      const pulseSpeed = currentVitals.heartRate / 60; // Convert BPM to Hz
      const pulse = Math.sin(clock.getElapsedTime() * pulseSpeed * Math.PI * 2) * 0.02 + 1;
      heartRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // Get color based on vital status
  const getHeartColor = () => {
    if (!currentVitals) return '#ff4757';
    
    const hrStatus = getVitalStatus('heartRate', currentVitals.heartRate);
    const bpStatus = getVitalStatus('bloodPressureSystolic', currentVitals.bloodPressureSystolic);
    
    if (hrStatus === 'critical' || bpStatus === 'critical') return '#ff0000';
    if (hrStatus === 'warning' || bpStatus === 'warning') return '#ffa500';
    return '#ff4757';
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main Heart Muscle */}
      <mesh
        ref={heartRef}
        position={[0, 0, 0]}
        onPointerEnter={(e) => {
          setHoveredPart('heart');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshPhysicalMaterial
          color={getHeartColor()}
          emissive={getHeartColor()}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.8}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Coronary Arteries (glowing based on blood pressure) */}
      <mesh position={[0.4, 0.2, 0.8]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshPhysicalMaterial
          color="#ff3333"
          emissive="#ff0000"
          emissiveIntensity={currentVitals?.bloodPressureSystolic > 130 ? 0.8 : 0.3}
        />
      </mesh>

      <mesh position={[-0.4, 0.2, 0.8]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshPhysicalMaterial
          color="#ff3333"
          emissive="#ff0000"
          emissiveIntensity={currentVitals?.bloodPressureDiastolic > 85 ? 0.8 : 0.3}
        />
      </mesh>

      {/* Left Atrium - hoverable */}
      <mesh
        position={[-0.8, 0.8, 0.3]}
        onPointerEnter={(e) => {
          setHoveredPart('left-atrium');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial color="#ff6b81" roughness={0.3} />
      </mesh>

      {/* Right Atrium - hoverable */}
      <mesh
        position={[0.8, 0.8, 0.3]}
        onPointerEnter={(e) => {
          setHoveredPart('right-atrium');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial color="#ff6b81" roughness={0.3} />
      </mesh>

      {/* Aorta */}
      <mesh position={[0, 1.2, 0.2]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 16]} />
        <meshPhysicalMaterial color="#ff4757" roughness={0.4} />
      </mesh>
    </group>
  );
};
