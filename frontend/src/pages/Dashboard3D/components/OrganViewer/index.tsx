import React, { useState, Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Loader } from '@react-three/drei';
import { HeartModel } from './HeartModel';
import { VitalTooltip } from '../Vitals/VitalTooltip';
import { OrganSelector } from './OrganControls';

// Lazy load other organ models
const LungsModel = lazy(() => import('./LungsModel').then(module => ({ default: module.LungsModel })));
const BrainModel = lazy(() => import('./BrainModel').then(module => ({ default: module.BrainModel })));

interface OrganViewerProps {
  className?: string;
}

export const OrganViewer: React.FC<OrganViewerProps> = ({ className }) => {
  const [selectedOrgan, setSelectedOrgan] = useState<'heart' | 'lungs' | 'brain'>('heart');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  return (
    <div className={`relative w-full h-full min-h-[600px] bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-3xl overflow-hidden ${className}`}>
      {/* Organ Selector Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <OrganSelector selected={selectedOrgan} onSelect={setSelectedOrgan} />
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            rotateSpeed={0.5}
            zoomSpeed={1.2}
            minDistance={4}
            maxDistance={12}
            dampingFactor={0.05}
          />

          {selectedOrgan === 'heart' && (
            <HeartModel
              hoveredPart={hoveredPart}
              setHoveredPart={setHoveredPart}
              setHoverPosition={setHoverPosition}
            />
          )}

          {selectedOrgan === 'lungs' && (
            <Suspense fallback={null}>
              <LungsModel
                hoveredPart={hoveredPart}
                setHoveredPart={setHoveredPart}
                setHoverPosition={setHoverPosition}
              />
            </Suspense>
          )}

          {selectedOrgan === 'brain' && (
            <Suspense fallback={null}>
              <BrainModel
                hoveredPart={hoveredPart}
                setHoveredPart={setHoveredPart}
                setHoverPosition={setHoverPosition}
              />
            </Suspense>
          )}

          {/* Soft grid for depth reference */}
          <gridHelper args={[10, 20, '#CBD5E0', '#E2E8F0']} position={[0, -1.5, 0]} />
        </Suspense>
      </Canvas>

      {/* Loading indicator */}
      <Loader 
        containerStyles={{ background: 'transparent', backdropFilter: 'blur(8px)' }}
        innerStyles={{ background: 'linear-gradient(135deg, #1E3556, #274A73)' }}
      />

      {/* Hover Tooltip */}
      <VitalTooltip
        part={hoveredPart || ''}
        position={hoverPosition}
        visible={!!hoveredPart}
      />
    </div>
  );
};
