import React, { useState } from 'react';
import ToothTreatmentsModal from './ToothTreatmentsModal';
import { getToothName } from '../data/model.tooth';

interface CircleTeethChartProps {
  patientId: number;
  onToothClick?: (toothNumber: number) => void;
}



const CircleTeethChart: React.FC<CircleTeethChartProps> = ({ patientId, onToothClick }) => {
  const [showPermanent, setShowPermanent] = useState(true);
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showToothModal, setShowToothModal] = useState(false);

  // دالة لمعالجة النقر على السن
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setShowToothModal(true);

    if (onToothClick) {
      onToothClick(toothNumber);
    }
  };

  // دالة لإنشاء دائرة السن
  const createToothCircle = (toothNumber: number, cx: number, cy: number) => {
    return (
      <g
        key={toothNumber}
        className={`tooth-${toothNumber}`}
        onClick={() => handleToothClick(toothNumber)}
        onMouseEnter={() => setHoveredTooth(toothNumber)}
        onMouseLeave={() => setHoveredTooth(null)}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={circleRadius}
          fill="#f8f8f8"
          stroke="#999"
          strokeWidth="1.5"
        />
        <text
          x={cx}
          y={cy + 1} // تعديل صغير لتحسين المركزية العمودية
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fontWeight="bold"
        >
          {toothNumber}
        </text>
      </g>
    );
  };

  // Función eliminada para evitar duplicación

  // Calcular puntos en el óvalo
  const calculatePointOnOval = (angle: number, cx: number = 280, cy: number = 550, rx: number = 260, ry: number = 400) => {
    // Convertir ángulo de grados a radianes
    const radians = (angle * Math.PI) / 180;
    // Calcular coordenadas
    const x = cx + rx * Math.cos(radians);
    const y = cy + ry * Math.sin(radians);
    return { x, y };
  };

  // Ajustar el tamaño de los círculos según el número de dientes
  const circleRadius = 28;

  // Definir las posiciones de los dientes en el óvalo con mejor distribución
  // Cuadrante 1 (superior izquierdo): dientes 11-18
  const quadrant1Teeth = [
    { number: 18, cx: calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y },
    { number: 17, cx: calculatePointOnOval(180 + 15).x, cy: calculatePointOnOval(180 + 15).y },
    { number: 16, cx: calculatePointOnOval(180 + 25).x, cy: calculatePointOnOval(180 + 25).y },
    { number: 15, cx: calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y },
    { number: 14, cx: calculatePointOnOval(180 + 45).x, cy: calculatePointOnOval(180 + 45).y },
    // Moved tooth 13 up by 2px
    { number: 13, cx: calculatePointOnOval(180 + 55).x, cy: calculatePointOnOval(180 + 55).y - 2 },
    // Moved tooth 12 to the right by 9px and up by 6px
    { number: 12, cx: calculatePointOnOval(180 + 65).x + 9, cy: calculatePointOnOval(180 + 65).y - 6 },
    // Posicionamos el 11 con ajuste final
    { number: 11, cx: 235, cy: 160 },
  ];

  // Cuadrante 2 (superior derecho): dientes 21-28
  const quadrant2Teeth = [
    // Creamos el cuadrante 2 como reflejo del cuadrante 1
    { number: 21, cx: 560 - 235, cy: 160 }, // Reflejo de 11
    { number: 22, cx: 560 - calculatePointOnOval(180 + 65).x - 9, cy: calculatePointOnOval(180 + 65).y - 6 }, // Reflejo de 12
    { number: 23, cx: 560 - calculatePointOnOval(180 + 55).x, cy: calculatePointOnOval(180 + 55).y - 2 }, // Reflejo de 13
    { number: 24, cx: 560 - calculatePointOnOval(180 + 45).x, cy: calculatePointOnOval(180 + 45).y }, // Reflejo de 14
    { number: 25, cx: 560 - calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y }, // Reflejo de 15
    { number: 26, cx: 560 - calculatePointOnOval(180 + 25).x, cy: calculatePointOnOval(180 + 25).y }, // Reflejo de 16
    { number: 27, cx: 560 - calculatePointOnOval(180 + 15).x, cy: calculatePointOnOval(180 + 15).y }, // Reflejo de 17
    { number: 28, cx: 560 - calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y }, // Reflejo de 18
  ];

  // Cuadrante 3 (inferior derecho): dientes 31-38
  const quadrant3Teeth = [
    // Creamos el cuadrante 3 como reflejo del cuadrante 2 pero en la parte inferior
    { number: 31, cx: 560 - 235, cy: 940 }, // Reflejo de 21 en la parte inferior
    { number: 32, cx: 560 - calculatePointOnOval(180 + 65).x - 9, cy: 1100 - calculatePointOnOval(180 + 65).y + 6 }, // Reflejo de 22
    { number: 33, cx: 560 - calculatePointOnOval(180 + 55).x, cy: 1100 - calculatePointOnOval(180 + 55).y + 2 }, // Reflejo de 23
    { number: 34, cx: 560 - calculatePointOnOval(180 + 45).x, cy: 1100 - calculatePointOnOval(180 + 45).y }, // Reflejo de 24
    { number: 35, cx: 560 - calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y }, // Reflejo de 25
    { number: 36, cx: 560 - calculatePointOnOval(180 + 25).x, cy: 1100 - calculatePointOnOval(180 + 25).y }, // Reflejo de 26
    { number: 37, cx: 560 - calculatePointOnOval(180 + 15).x, cy: 1100 - calculatePointOnOval(180 + 15).y }, // Reflejo de 27
    { number: 38, cx: 560 - calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y }, // Reflejo de 28
  ];

  // Cuadrante 4 (inferior izquierdo): dientes 41-48
  const quadrant4Teeth = [
    // Creamos el cuadrante 4 como reflejo del cuadrante 3 en el eje X
    { number: 41, cx: 235, cy: 940 }, // Reflejo de 31
    { number: 42, cx: calculatePointOnOval(180 + 65).x + 9, cy: 1100 - calculatePointOnOval(180 + 65).y + 6 }, // Reflejo de 32
    { number: 43, cx: calculatePointOnOval(180 + 55).x, cy: 1100 - calculatePointOnOval(180 + 55).y + 2 }, // Reflejo de 33
    { number: 44, cx: calculatePointOnOval(180 + 45).x, cy: 1100 - calculatePointOnOval(180 + 45).y }, // Reflejo de 34
    { number: 45, cx: calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y }, // Reflejo de 35
    { number: 46, cx: calculatePointOnOval(180 + 25).x, cy: 1100 - calculatePointOnOval(180 + 25).y }, // Reflejo de 36
    { number: 47, cx: calculatePointOnOval(180 + 15).x, cy: 1100 - calculatePointOnOval(180 + 15).y }, // Reflejo de 37
    { number: 48, cx: calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y }, // Reflejo de 38
  ];

  return (
    <div className="teeth-chart">
      <div className="chart-controls" style={{ marginBottom: '10px', textAlign: 'center' }}>
        <button
          onClick={() => setShowPermanent(true)}
          className={showPermanent ? 'active' : ''}
          style={{
            padding: '5px 10px',
            marginRight: '10px',
            backgroundColor: showPermanent ? '#33819E' : '#f0f0f0',
            color: showPermanent ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          الأسنان الدائمة
        </button>
        <button
          onClick={() => setShowPermanent(false)}
          className={!showPermanent ? 'active' : ''}
          style={{
            padding: '5px 10px',
            backgroundColor: !showPermanent ? '#33819E' : '#f0f0f0',
            color: !showPermanent ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          الأسنان اللبنية
        </button>
      </div>

      {/* مخطط الأسنان */}
      <div className="chart-container" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        height: '700px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        <svg
          version="1.1"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 560 1100"
          style={{ width: '100%', height: '100%' }}
        >
          {/* رسم الشكل البيضاوي للفكين */}
          <ellipse cx="280" cy="550" rx="260" ry="400" stroke="#999" strokeWidth="1.5" fill="none" />

          {/* رسم الأسنان الدائمة - الربع الأول والثاني */}
          {showPermanent && (
            <>
              {/* الربع الأول */}
              <g className="q1">
                {quadrant1Teeth.map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع الثاني */}
              <g className="q2">
                {quadrant2Teeth.map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع الثالث */}
              <g className="q3">
                {quadrant3Teeth.map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع الرابع */}
              <g className="q4">
                {quadrant4Teeth.map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>
            </>
          )}

          {/* رسم الأسنان اللبنية - الربع الأول والثاني */}
          {!showPermanent && (
            <>
              {/* الربع الخامس - الأسنان اللبنية (51-55) */}
              <g className="q5">
                {[
                  { number: 55, cx: calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y },
                  { number: 54, cx: calculatePointOnOval(180 + 20).x, cy: calculatePointOnOval(180 + 20).y },
                  { number: 53, cx: calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y },
                  { number: 52, cx: calculatePointOnOval(180 + 50).x, cy: calculatePointOnOval(180 + 50).y },
                  { number: 51, cx: calculatePointOnOval(180 + 65).x, cy: calculatePointOnOval(180 + 65).y },
                ].map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع السادس - الأسنان اللبنية (61-65) - متناظر مع الربع الخامس */}
              <g className="q6">
                {[
                  { number: 61, cx: 560 - calculatePointOnOval(180 + 65).x, cy: calculatePointOnOval(180 + 65).y },
                  { number: 62, cx: 560 - calculatePointOnOval(180 + 50).x, cy: calculatePointOnOval(180 + 50).y },
                  { number: 63, cx: 560 - calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y },
                  { number: 64, cx: 560 - calculatePointOnOval(180 + 20).x, cy: calculatePointOnOval(180 + 20).y },
                  { number: 65, cx: 560 - calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y },
                ].map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع السابع - الأسنان اللبنية (71-75) - متناظر مع الربع السادس */}
              <g className="q7">
                {[
                  { number: 71, cx: 560 - calculatePointOnOval(180 + 65).x, cy: 1100 - calculatePointOnOval(180 + 65).y },
                  { number: 72, cx: 560 - calculatePointOnOval(180 + 50).x, cy: 1100 - calculatePointOnOval(180 + 50).y },
                  { number: 73, cx: 560 - calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y },
                  { number: 74, cx: 560 - calculatePointOnOval(180 + 20).x, cy: 1100 - calculatePointOnOval(180 + 20).y },
                  { number: 75, cx: 560 - calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y },
                ].map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>

              {/* الربع الثامن - الأسنان اللبنية (81-85) - متناظر مع الربع السابع */}
              <g className="q8">
                {[
                  { number: 81, cx: calculatePointOnOval(180 + 65).x, cy: 1100 - calculatePointOnOval(180 + 65).y },
                  { number: 82, cx: calculatePointOnOval(180 + 50).x, cy: 1100 - calculatePointOnOval(180 + 50).y },
                  { number: 83, cx: calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y },
                  { number: 84, cx: calculatePointOnOval(180 + 20).x, cy: 1100 - calculatePointOnOval(180 + 20).y },
                  { number: 85, cx: calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y },
                ].map(tooth => createToothCircle(tooth.number, tooth.cx, tooth.cy))}
              </g>
            </>
          )}

          {/* طبقة لعرض اسم السن عند hover - تظهر في النهاية لتكون فوق كل العناصر */}
          {hoveredTooth && (
            (() => {
              // البحث عن السن المحدد في جميع الأرباع
              let selectedTooth;

              if (showPermanent) {
                // البحث في الأسنان الدائمة
                selectedTooth = [...quadrant1Teeth, ...quadrant2Teeth, ...quadrant3Teeth, ...quadrant4Teeth]
                  .find(tooth => tooth.number === hoveredTooth);
              } else {
                // البحث في الأسنان اللبنية
                const babyTeeth = [
                  { number: 55, cx: calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y },
                  { number: 54, cx: calculatePointOnOval(180 + 20).x, cy: calculatePointOnOval(180 + 20).y },
                  { number: 53, cx: calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y },
                  { number: 52, cx: calculatePointOnOval(180 + 50).x, cy: calculatePointOnOval(180 + 50).y },
                  { number: 51, cx: calculatePointOnOval(180 + 65).x, cy: calculatePointOnOval(180 + 65).y },
                  { number: 61, cx: 560 - calculatePointOnOval(180 + 65).x, cy: calculatePointOnOval(180 + 65).y },
                  { number: 62, cx: 560 - calculatePointOnOval(180 + 50).x, cy: calculatePointOnOval(180 + 50).y },
                  { number: 63, cx: 560 - calculatePointOnOval(180 + 35).x, cy: calculatePointOnOval(180 + 35).y },
                  { number: 64, cx: 560 - calculatePointOnOval(180 + 20).x, cy: calculatePointOnOval(180 + 20).y },
                  { number: 65, cx: 560 - calculatePointOnOval(180 + 5).x, cy: calculatePointOnOval(180 + 5).y },
                  { number: 71, cx: 560 - calculatePointOnOval(180 + 65).x, cy: 1100 - calculatePointOnOval(180 + 65).y },
                  { number: 72, cx: 560 - calculatePointOnOval(180 + 50).x, cy: 1100 - calculatePointOnOval(180 + 50).y },
                  { number: 73, cx: 560 - calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y },
                  { number: 74, cx: 560 - calculatePointOnOval(180 + 20).x, cy: 1100 - calculatePointOnOval(180 + 20).y },
                  { number: 75, cx: 560 - calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y },
                  { number: 81, cx: calculatePointOnOval(180 + 65).x, cy: 1100 - calculatePointOnOval(180 + 65).y },
                  { number: 82, cx: calculatePointOnOval(180 + 50).x, cy: 1100 - calculatePointOnOval(180 + 50).y },
                  { number: 83, cx: calculatePointOnOval(180 + 35).x, cy: 1100 - calculatePointOnOval(180 + 35).y },
                  { number: 84, cx: calculatePointOnOval(180 + 20).x, cy: 1100 - calculatePointOnOval(180 + 20).y },
                  { number: 85, cx: calculatePointOnOval(180 + 5).x, cy: 1100 - calculatePointOnOval(180 + 5).y },
                ];
                selectedTooth = babyTeeth.find(tooth => tooth.number === hoveredTooth);
              }

              if (!selectedTooth) return null;

              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={selectedTooth.cx - 150}
                    y={selectedTooth.cy - 60}
                    width="300"
                    height="40"
                    rx="8"
                    ry="8"
                    fill="rgba(0, 0, 0, 0.8)"
                    style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3))' }}
                  />
                  <text
                    x={selectedTooth.cx}
                    y={selectedTooth.cy - 35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="20"
                    fontWeight="bold"
                    fill="white"
                    direction="rtl"
                  >
                    {getToothName(hoveredTooth)}
                  </text>
                </g>
              );
            })()
          )}
        </svg>
      </div>

      {/* مودال علاجات السن */}
      {selectedTooth && (
        <ToothTreatmentsModal
          isOpen={showToothModal}
          onClose={() => {
            setShowToothModal(false);
            setSelectedTooth(null);
          }}
          toothNumber={selectedTooth}
          patientId={patientId}
        />
      )}
    </div>
  );
};

export default CircleTeethChart;
