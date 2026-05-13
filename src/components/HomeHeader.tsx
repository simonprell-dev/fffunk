import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export function HomeHeader() {
  return (
    <header className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:text-fire-500 transition-colors">
          <Radio className="w-6 h-6 text-fire-500" />
          <h1 className="text-xl font-bold tracking-tight">FFFunk</h1>
          <span className="text-xs text-dark-400 font-normal ml-1">Feuerwehr-Funk-Trainer</span>
        </Link>
        <div className="text-sm text-dark-400">
          Interaktives Funk-Training
        </div>
      </div>
    </header>
  );
}
