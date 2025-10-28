import React from 'react';
import { Tooth } from '../data/model.tooth';
import { ISOTeeth } from '../data/types';
import { permanentTeethPositions } from '../data/teeth-positions';
import ToothItem from './ToothItem';

interface PermanentTeethLayoutProps {
  teeth: Record<number, Tooth>;
  onToothClick?: (ISO: number) => void;
}

export default function PermanentTeethLayout({ teeth, onToothClick }: PermanentTeethLayoutProps) {
  return (
    <div className="teeth-layout" style={{ position: 'relative', width: '440px', height: '300px', margin: '0 auto' }}>
      {/* رسم الدوائر للفكين */}
      <svg width="440" height="300" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx="220" cy="80" r="150" stroke="#ddd" strokeWidth="1.5" fill="#f8f8f8" />
        <circle cx="220" cy="220" r="150" stroke="#ddd" strokeWidth="1.5" fill="#f8f8f8" />
        <text x="220" y="80" textAnchor="middle" fontSize="10" fill="#999" dominantBaseline="middle">الفك العلوي</text>
        <text x="220" y="220" textAnchor="middle" fontSize="10" fill="#999" dominantBaseline="middle">الفك السفلي</text>
        <path d="M 220 10 L 220 150" stroke="#eee" strokeWidth="1" strokeDasharray="4" />
        <path d="M 220 150 L 220 290" stroke="#eee" strokeWidth="1" strokeDasharray="4" />
      </svg>

      {/* عرض الأسنان الدائمة */}
      {ISOTeeth.permanent.map(ISO => {
        const tooth = teeth[ISO];
        if (!tooth) return null;

        const position = permanentTeethPositions[ISO];
        return (
          <ToothItem
            key={ISO}
            tooth={tooth}
            onClick={onToothClick}
            position={position}
          />
        );
      })}
    </div>
  );
}
