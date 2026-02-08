// مكون بطاقة الإحصائيات مع Lazy Loading

import React, { Suspense } from 'react';

// نوع البيانات للبطاقة
interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  delay?: string;
  isLoading?: boolean;
}

// مكون البطاقة الأساسي
const StatsCardBase: React.FC<StatsCardProps> = React.memo(({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay = '0s',
  isLoading = false
}) => {
  return (
    <div 
      className={`card animate-slide-in-right ${gradient}`} 
      style={{ animationDelay: delay }}
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-3xl font-bold text-white">
              {isLoading ? (
                <div className="animate-pulse bg-white/20 h-8 w-20 rounded"></div>
              ) : (
                value
              )}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-2xl">
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-white/80">{subtitle}</p>
          <div className="w-full h-2 bg-white/20 rounded-full mt-2">
            <div 
              className="h-2 bg-white/60 rounded-full transition-all duration-1000" 
              style={{ width: isLoading ? '0%' : '75%' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCardBase.displayName = 'StatsCardBase';

// مكون Lazy للبطاقة
const LazyStatsCard: React.FC<StatsCardProps> = React.memo((props) => {
  return (
    <Suspense 
      fallback={
        <div className={`card ${props.gradient} animate-pulse`}>
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="bg-white/20 h-6 w-32 rounded mb-2"></div>
                <div className="bg-white/20 h-8 w-20 rounded"></div>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl">
                <div className="h-8 w-8 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/20 h-4 w-40 rounded"></div>
              <div className="w-full h-2 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      }
    >
      <StatsCardBase {...props} />
    </Suspense>
  );
});

LazyStatsCard.displayName = 'LazyStatsCard';

export default LazyStatsCard;
