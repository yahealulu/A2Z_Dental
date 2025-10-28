import React from 'react';

// نظام ترقيم الأسنان FDI (World Dental Federation notation)
interface ToothProps {
  number: number; // رقم السن حسب نظام FDI
  condition: 'healthy' | 'filled' | 'missing' | 'crown' | 'root-canal' | 'implant' | 'bridge' | 'caries';
  notes?: string;
  onClick: (number: number) => void;
}

interface PermanentTeethSVGProps {
  teeth: {
    number: number;
    condition: 'healthy' | 'filled' | 'missing' | 'crown' | 'root-canal' | 'implant' | 'bridge' | 'caries';
    notes?: string;
  }[];
  onToothClick: (number: number) => void;
}

// تعريف حالات الأسنان وألوانها - مطابقة لمشروع apexo-master
const toothConditions = [
  { id: 'healthy', label: 'سليم', color: 'transparent', borderColor: '#000000' },
  { id: 'filled', label: 'حشو', color: '#FFE082', borderColor: '#000000' },
  { id: 'missing', label: 'مفقود', color: '#BDBDBD', borderColor: '#000000' },
  { id: 'crown', label: 'تاج', color: '#B2EBF2', borderColor: '#000000' },
  { id: 'root-canal', label: 'علاج عصب', color: '#D1C4E9', borderColor: '#000000' },
  { id: 'implant', label: 'زرعة', color: '#b2dfdb', borderColor: '#000000' },
  { id: 'bridge', label: 'جسر', color: '#F48FB1', borderColor: '#000000' },
  { id: 'caries', label: 'تسوس', color: '#FFCDD2', borderColor: '#000000' }
];

// تحويل حالات الأسنان من مشروعنا إلى حالات مشروع apexo-master
const mapCondition = (condition: string): string => {
  const mapping: { [key: string]: string } = {
    'healthy': 'sound',
    'filled': 'filled',
    'missing': 'missing',
    'crown': 'rotated',
    'root-canal': 'endo',
    'implant': 'displaced',
    'bridge': 'gum-recessed',
    'caries': 'compromised'
  };
  return mapping[condition] || 'sound';
};

// الحصول على لون السن بناءً على حالته - مطابق لمشروع apexo-master
const getToothColor = (conditionId: string): string => {
  const condition = mapCondition(conditionId);
  if (condition === 'compromised') {
    return "#FFCDD2";
  } else if (condition === 'endo') {
    return "#D1C4E9";
  } else if (condition === 'filled') {
    return "#FFE082";
  } else if (condition === 'missing') {
    return "#BDBDBD";
  } else if (condition === 'rotated') {
    return "#B2EBF2";
  } else if (condition === 'gum-recessed') {
    return "#F48FB1";
  } else if (condition === 'displaced') {
    return "#b2dfdb";
  } else {
    return "transparent";
  }
};

const PermanentTeethSVG: React.FC<PermanentTeethSVGProps> = ({ teeth, onToothClick }) => {
  // الحصول على حالة السن بناءً على رقمه
  const getToothById = (number: number) => {
    return teeth.find(t => t.number === number);
  };

  // رسم سن واحد
  const renderTooth = (number: number) => {
    const tooth = getToothById(number);
    const condition = tooth?.condition || 'healthy';
    const color = getToothColor(condition);

    return (
      <g key={number} onClick={() => onToothClick(number)} style={{ cursor: 'pointer' }}>
        {/* استخدام الشكل المناسب للسن بناءً على رقمه */}
        {renderToothShape(number, color)}

        {/* إضافة رقم السن */}
        <text
          x={getToothTextPosition(number).x}
          y={getToothTextPosition(number).y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#000"
        >
          {number}
        </text>

        {/* إضافة مؤشر للملاحظات إذا وجدت */}
        {tooth?.notes && (
          <circle
            cx={getToothTextPosition(number).x + 10}
            cy={getToothTextPosition(number).y - 10}
            r={3}
            fill="#ef4444"
          />
        )}
      </g>
    );
  };

  // تحديد موقع النص لكل سن
  const getToothTextPosition = (number: number) => {
    // تحديد مواقع النصوص بناءً على رقم السن
    const positions: { [key: number]: { x: number, y: number } } = {
      // الربع الأول (1-8)
      11: { x: 240, y: 70 },
      12: { x: 200, y: 70 },
      13: { x: 160, y: 70 },
      14: { x: 120, y: 70 },
      15: { x: 90, y: 70 },
      16: { x: 60, y: 70 },
      17: { x: 30, y: 70 },
      18: { x: 10, y: 70 },

      // الربع الثاني (9-16)
      21: { x: 320, y: 70 },
      22: { x: 360, y: 70 },
      23: { x: 400, y: 70 },
      24: { x: 440, y: 70 },
      25: { x: 470, y: 70 },
      26: { x: 500, y: 70 },
      27: { x: 530, y: 70 },
      28: { x: 550, y: 70 },

      // الربع الثالث (17-24)
      31: { x: 320, y: 130 },
      32: { x: 360, y: 130 },
      33: { x: 400, y: 130 },
      34: { x: 440, y: 130 },
      35: { x: 470, y: 130 },
      36: { x: 500, y: 130 },
      37: { x: 530, y: 130 },
      38: { x: 550, y: 130 },

      // الربع الرابع (25-32)
      41: { x: 240, y: 130 },
      42: { x: 200, y: 130 },
      43: { x: 160, y: 130 },
      44: { x: 120, y: 130 },
      45: { x: 90, y: 130 },
      46: { x: 60, y: 130 },
      47: { x: 30, y: 130 },
      48: { x: 10, y: 130 }
    };

    return positions[number] || { x: 0, y: 0 };
  };

  // رسم شكل السن بناءً على رقمه
  const renderToothShape = (number: number, color: string) => {
    // تعريف أشكال الأسنان بناءً على رقم السن
    switch (number) {
      // الربع الأول - الأمامية
      case 11:
        return (
          <path
            d="M250 40C243.82 27.09 230 35 234.76 50.06C243.07 76.34 250 85 255 80C274.85 74.77 246.37 51.77 250 40Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 12:
        return (
          <path
            d="M200 50C192.45 27.88 210 20 219 39.43C224.92 52.24 223.59 86.21 210.92 93.27C196.58 101.26 205.27 65.43 200 50Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      // الربع الثاني - الأمامية
      case 21:
        return (
          <path
            d="M310 40C316.17 27.09 330 35 325.24 50.06C316.93 76.34 310 85 305 80C285.15 74.77 313.63 51.77 310 40Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 22:
        return (
          <path
            d="M360 50C367.55 27.88 350 20 341 39.43C335.08 52.24 336.41 86.21 349.08 93.27C363.42 101.26 354.73 65.43 360 50Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      // الربع الرابع - الأمامية
      case 41:
        return (
          <path
            d="M250 160C246.54 171.28 235 165 237.43 152C241.66 129.21 245 120 250 125C263.41 128.64 247 150 250 160Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 42:
        return (
          <path
            d="M200 150C194.09 172.54 210 180 217.44 160.07C222.34 146.94 219.15 113.11 206.72 106.81C192.66 99.69 204.13 134.29 200 150Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      // الربع الثالث - الأمامية
      case 31:
        return (
          <path
            d="M310 160C313.46 171.28 325 165 322.57 152C318.34 129.21 315 120 310 125C296.59 128.64 313 150 310 160Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      case 32:
        return (
          <path
            d="M360 150C365.91 172.54 350 180 342.56 160.07C337.66 146.94 340.85 113.11 353.28 106.81C367.34 99.69 355.87 134.29 360 150Z"
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
      // الأسنان الأخرى - استخدام شكل بسيط
      default:
        // تحديد حجم وموقع السن بناءً على رقمه
        const position = getToothTextPosition(number);
        return (
          <ellipse
            cx={position.x}
            cy={position.y}
            rx={20}
            ry={15}
            fill={color}
            stroke="#000"
            strokeWidth="1.5"
          />
        );
    }
  };

  return (
    <svg width="560" height="200" viewBox="0 0 560 200">
      {/* تسميات الأرباع */}
      <text x="125" y="20" fontSize="12" textAnchor="middle" fill="#666">الربع الأول (1-8)</text>
      <text x="435" y="20" fontSize="12" textAnchor="middle" fill="#666">الربع الثاني (9-16)</text>
      <text x="125" y="180" fontSize="12" textAnchor="middle" fill="#666">الربع الرابع (41-48)</text>
      <text x="435" y="180" fontSize="12" textAnchor="middle" fill="#666">الربع الثالث (31-38)</text>

      {/* خط فاصل */}
      <line x1="280" y1="30" x2="280" y2="170" stroke="#ddd" strokeWidth="1" strokeDasharray="4" />

      {/* رسم الأسنان */}
      {[11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48].map(number => renderTooth(number))}
    </svg>
  );
};

export default PermanentTeethSVG;
