import { Brain } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-glow">
          <Brain className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
            YouNote <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-normal">Studio</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Backend Connected
        </div>
      </div>
    </header>
  );
};

export default Header;