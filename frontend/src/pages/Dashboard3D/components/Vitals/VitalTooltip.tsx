import React from 'react';

interface VitalTooltipProps {
  part: string;
  position: { x: number; y: number };
  visible: boolean;
}

export const VitalTooltip: React.FC<VitalTooltipProps> = ({ part, position, visible }) => {
  if (!visible || !part) return null;

  const formatPartName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div
      className="fixed z-50 px-3 py-2 rounded-lg bg-primary-900/95 text-white text-sm font-medium shadow-xl border border-white/10 pointer-events-none transition-opacity duration-150"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(12px, 12px)',
      }}
    >
      {formatPartName(part)}
    </div>
  );
};
