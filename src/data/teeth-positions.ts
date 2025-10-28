// حساب مواقع الأسنان على شكل دائري
function calculateCirclePoint(centerX: number, centerY: number, radius: number, angle: number) {
  // تحويل الزاوية من درجات إلى راديان
  const radians = (angle * Math.PI) / 180;

  // حساب الإحداثيات على الدائرة
  const x = centerX + radius * Math.cos(radians);
  const y = centerY + radius * Math.sin(radians);

  return { x: Math.round(x), y: Math.round(y) };
}

// مركز الدوائر
const centerX = 220;
const upperCenterY = 80;
const lowerCenterY = 220;

// نصف قطر الدوائر
const upperRadius = 150; // نصف قطر دائرة الفك العلوي
const lowerRadius = 150; // نصف قطر دائرة الفك السفلي

// مواقع الأسنان الدائمة في التخطيط الدائري
export const permanentTeethPositions: Record<number, { x: number; y: number }> = {
  // الفك العلوي - اليمين (من 180 إلى 135 درجة)
  18: calculateCirclePoint(centerX, upperCenterY, upperRadius, 180),
  17: calculateCirclePoint(centerX, upperCenterY, upperRadius, 170),
  16: calculateCirclePoint(centerX, upperCenterY, upperRadius, 160),
  15: calculateCirclePoint(centerX, upperCenterY, upperRadius, 150),
  14: calculateCirclePoint(centerX, upperCenterY, upperRadius, 140),
  13: calculateCirclePoint(centerX, upperCenterY, upperRadius, 130),
  12: calculateCirclePoint(centerX, upperCenterY, upperRadius, 120),
  11: calculateCirclePoint(centerX, upperCenterY, upperRadius, 110),

  // الفك العلوي - اليسار (من 45 إلى 0 درجة)
  21: calculateCirclePoint(centerX, upperCenterY, upperRadius, 70),
  22: calculateCirclePoint(centerX, upperCenterY, upperRadius, 60),
  23: calculateCirclePoint(centerX, upperCenterY, upperRadius, 50),
  24: calculateCirclePoint(centerX, upperCenterY, upperRadius, 40),
  25: calculateCirclePoint(centerX, upperCenterY, upperRadius, 30),
  26: calculateCirclePoint(centerX, upperCenterY, upperRadius, 20),
  27: calculateCirclePoint(centerX, upperCenterY, upperRadius, 10),
  28: calculateCirclePoint(centerX, upperCenterY, upperRadius, 0),

  // الفك السفلي - اليسار (من 0 إلى -45 درجة)
  38: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 0),
  37: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 350),
  36: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 340),
  35: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 330),
  34: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 320),
  33: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 310),
  32: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 300),
  31: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 290),

  // الفك السفلي - اليمين (من -135 إلى -180 درجة)
  41: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 250),
  42: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 240),
  43: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 230),
  44: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 220),
  45: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 210),
  46: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 200),
  47: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 190),
  48: calculateCirclePoint(centerX, lowerCenterY, lowerRadius, 180)
};

// مواقع الأسنان اللبنية في التخطيط الدائري
export const deciduousTeethPositions: Record<number, { x: number; y: number }> = {
  // الفك العلوي - اليمين
  55: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 160),
  54: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 150),
  53: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 140),
  52: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 130),
  51: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 120),

  // الفك العلوي - اليسار
  61: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 60),
  62: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 50),
  63: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 40),
  64: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 30),
  65: calculateCirclePoint(centerX, upperCenterY, upperRadius * 0.8, 20),

  // الفك السفلي - اليسار
  75: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 340),
  74: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 330),
  73: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 320),
  72: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 310),
  71: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 300),

  // الفك السفلي - اليمين
  81: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 240),
  82: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 230),
  83: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 220),
  84: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 210),
  85: calculateCirclePoint(centerX, lowerCenterY, lowerRadius * 0.8, 200)
};
