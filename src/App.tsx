import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ScenarioList } from '@/components/ScenarioList';
import { PracticeScreen } from '@/components/PracticeScreen';
import { HomeHeader } from '@/components/HomeHeader';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900 text-white noise-bg flex flex-col">
        <HomeHeader />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
          <Routes>
            <Route path="/" element={<ScenarioList />} />
            <Route path="/scenario/:id" element={<PracticeScreen />} />
          </Routes>
        </main>
        <footer className="py-4 text-center text-dark-500 text-sm">
          FFFunk – Feuerwehr Funk Trainer
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
