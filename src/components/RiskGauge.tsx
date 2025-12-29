import { useMemo } from 'react';

interface RiskGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const RiskGauge = ({ score, size = 'md', showLabel = true }: RiskGaugeProps) => {
  const dimensions = {
    sm: { width: 80, height: 40, strokeWidth: 6, fontSize: 14 },
    md: { width: 120, height: 60, strokeWidth: 8, fontSize: 18 },
    lg: { width: 160, height: 80, strokeWidth: 10, fontSize: 24 },
  };

  const { width, height, strokeWidth, fontSize } = dimensions[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  
  const { color, label } = useMemo(() => {
    if (score >= 71) return { color: 'hsl(0, 72%, 51%)', label: 'Critical' };
    if (score >= 31) return { color: 'hsl(38, 92%, 50%)', label: 'Review' };
    return { color: 'hsl(142, 71%, 45%)', label: 'Normal' };
  }, [score]);

  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={width} 
        height={height + 10} 
        viewBox={`0 0 ${width} ${height + 10}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${height} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${height}`}
          fill="none"
          stroke="hsl(217, 33%, 18%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc with gradient */}
        <defs>
          <linearGradient id={`gauge-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
            <stop offset="50%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 72%, 51%)" />
          </linearGradient>
        </defs>
        
        <path
          d={`M ${strokeWidth / 2} ${height} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${height}`}
          fill="none"
          stroke={`url(#gauge-gradient-${score})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        
        {/* Score text */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fill="currentColor"
          fontSize={fontSize}
          fontWeight="bold"
          className="fill-foreground"
        >
          {Math.round(score)}
        </text>
      </svg>
      
      {showLabel && (
        <span 
          className="text-xs font-semibold mt-1 uppercase tracking-wide"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default RiskGauge;
