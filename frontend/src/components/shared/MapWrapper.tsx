import React, { Suspense, lazy } from 'react';

const Map = lazy(() => import('./Map'));

const MapWrapper = (props: any) => {
  return (
    <Suspense fallback={
      <div className="h-full w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center border border-gray-200">
        <p className="text-gray-400 font-medium flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Map...
        </p>
      </div>
    }>
      <Map {...props} />
    </Suspense>
  );
};

export default MapWrapper;
