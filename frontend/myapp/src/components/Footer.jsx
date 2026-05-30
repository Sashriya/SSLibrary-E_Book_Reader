export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-800 bg-slate-900 py-12 text-slate-400">
      <div className="container mx-auto px-6 text-center">
        
        {/* Brand/Logo Area */}
        <div className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
            SM Tamil <span className="text-emerald-500">Novels</span>
          </h2>
        </div>

        {/* Copyright Info */}
        <p className="text-sm font-medium">
          © {new Date().getFullYear()} — All Rights Reserved
        </p>
        
        {/* Tagline */}
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-emerald-400 cursor-default">
          Built for Tamil Story Readers
        </p>

        {/* Optional Social/Links Placeholder */}
        <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
        </div>

      </div>
    </footer>
  );
}