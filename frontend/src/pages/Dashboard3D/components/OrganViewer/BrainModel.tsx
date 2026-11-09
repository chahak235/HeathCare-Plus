import React from 'react';
import * as THREE from 'three';

interface BrainModelProps {
  hoveredPart: string | null;
  setHoveredPart: (part: string | null) => void;
  setHoverPosition: (pos: { x: number; y: number }) => void;
}

export const BrainModel: React.FC<BrainModelProps> = ({ 
  hoveredPart, 
  setHoveredPart,
  setHoverPosition 
}) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Left Hemisphere */}
      <mesh
        position={[-0.8, 0.2, 0]}
        onPointerEnter={(e) => {
          setHoveredPart('left-hemisphere');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial
          color="#A78BFA"
          roughness={0.3}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Right Hemisphere */}
      <mesh
        position={[0.8, 0.2, 0]}
        onPointerEnter={(e) => {
          setHoveredPart('right-hemisphere');
          setHoverPosition({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => setHoveredPart(null)}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial
          color="#A78BFA"
          roughness={0.3}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Cerebellum */}
      <mesh position={[0, -0.6, -0.3]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshPhysicalMaterial color="#7C3AED" roughness={0.4} />
      </mesh>
    </group>
  );
};
