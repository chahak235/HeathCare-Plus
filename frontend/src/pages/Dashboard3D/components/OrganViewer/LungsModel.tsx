import React from 'react';
import * as THREE from 'three';

interface LungsModelProps {
  hoveredPart: string | null;
  setHoveredPart: (part: string | null) => void;
  setHoverPosition: (pos: { x: number; y: number }) => void;
}

export const LungsModel: React.FC<LungsModelProps> = ({ 
  hoveredPart, 
  setHoveredPart,
  setHoverPosition 
}) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Left Lung */}
      <mesh
        position={[-1.2, 0, 0]}
        onPointerEnter={(e) => {
          setHoveredPart('left-lung');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial
          color="#8DA9C4"
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Right Lung */}
      <mesh
        position={[1.2, 0, 0]}
        onPointerEnter={(e) => {
          setHoveredPart('right-lung');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial
          color="#8DA9C4"
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Trachea */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 1.2, 8]} />
        <meshPhysicalMaterial color="#5E81AC" roughness={0.6} />
      </mesh>
    </group>
  );
};
