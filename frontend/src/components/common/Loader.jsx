import React from 'react';

function Loader() {
  return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading SMS...</p>
    </div>
  );
}

export default Loader;