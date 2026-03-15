export default function SiteFooter() {
  return (
    <footer className="mt-auto py-6 bg-white border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm" style={{ fontFamily: "var(--font-display)" }}>
          <img src="/logo.png" alt="" className="w-4 h-4 rounded" />
          ModKit Swatch
        </div>
        <p className="text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} &middot; Built for the Gunpla &amp; scale model community.
        </p>
      </div>
    </footer>
  );
}
