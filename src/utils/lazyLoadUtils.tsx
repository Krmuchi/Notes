import React, { lazy, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';

interface LazyComponentProps {
  fallback?: ReactNode;
  delay?: number;
}

export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) {
  const { fallback = <div>Loading...</div>, delay = 0 } = options;

  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: P) {
    if (delay > 0) {
      const [showFallback, setShowFallback] = React.useState(true);

      React.useEffect(() => {
        const timer = setTimeout(() => {
          setShowFallback(false);
        }, delay);

        return () => clearTimeout(timer);
      }, []);

      if (showFallback) {
        return <>{fallback}</>;
      }
    }

    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export const withLazyLoad = <P extends object>(
  WrappedComponent: ComponentType<P>,
  options: LazyComponentProps = {}
) => {
  const { fallback = <div>Loading...</div> } = options;

  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <WrappedComponent {...props} />
      </Suspense>
    );
  };
};

export default createLazyComponent;