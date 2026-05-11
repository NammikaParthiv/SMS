import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-9xl font-black text-slate-200 absolute select-none">404</div>
      <div className="relative z-10">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">You've reached the void.</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 hover:-translate-y-1 transition-all cursor-pointer shadow-lg shadow-indigo-200"
        >
          Take Me Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;