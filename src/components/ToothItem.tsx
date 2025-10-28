import { Tooth, getToothName } from '../data/model.tooth';

interface ToothItemProps {
  tooth: Tooth;
  onClick?: (ISO: number) => void;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

export default function ToothItem({ tooth, onClick, position, size = { width: 30, height: 30 } }: ToothItemProps) {
  const handleClick = () => {
    if (onClick) onClick(tooth.ISO);
  };

  return (
    <div
      className="tooth-item"
      title={getToothName(tooth.ISO)}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: '#f8f8f8',
        border: '1px solid #ccc',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 'bold',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        zIndex: tooth.concern ? 2 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transform: tooth.concern ? 'scale(1.05)' : 'scale(1)'
      }}
      onClick={handleClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = tooth.concern ? 'scale(1.05)' : 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      {/* رقم السن */}
      <span style={{ color: '#333', userSelect: 'none' }}>
        {tooth.ISO}
      </span>

      {tooth.concern && (
        <span
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'red',
            border: '1px solid white'
          }}
        />
      )}
    </div>
  );
}
