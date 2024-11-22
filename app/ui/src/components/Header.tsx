import React from 'react';
import { Bird } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-emerald-600 text-white py-6 px-4 mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bird className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Smart Bird Feeder</h1>
        </div>
        <div className="text-sm">
          <p>Last Update: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </header>
  );
}