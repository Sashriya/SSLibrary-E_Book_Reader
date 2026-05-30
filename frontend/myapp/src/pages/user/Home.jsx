import { useContext } from "react";
import { StoryContext } from "../../context/StoryContext";
import StoryCard from "../../components/StoryCard";
import { Search, Library, Sparkles } from "lucide-react";

export default function Home() {
  const { stories, loading, searchTerm } = useContext(StoryContext);

  // LIVE SEARCH LOGIC: 
  // Title or Author name-la search term irunthaal mattum filter panni edukkurom
  const filteredStories = stories.filter((story) => {
    const isPublished = story.status === "published";
    const matchesSearch = 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.author && story.author.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return isPublished && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-slate-200 py-24 text-center text-white rounded-[60px] shadow-2xl">
        {/* Decorative Background Glows */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]"></div>
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]"></div>

        <div className="relative z-10 container mx-auto px-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 border border-emerald-500/20">
            <Sparkles size={14} />
            Pure Literature
          </div>
          <h1 className="mb-6 text-3xl text-black font-black leading-tight tracking-tighter md:text-5xl">
            Shape your <span className="text-emerald-500">Dreams</span>
          </h1>
          <p className="mx-auto max-w-2xl text-md font-medium text-slate-500 md:text-lg">
            Explore a world of modern Tamil stories, novels,<br/> and fan-fictions crafted by the best authors.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto mt-[-40px] px-5 relative z-20">
        
        {/* Search Status / Title Bar */}
        <div className="mb-10 flex flex-col items-center justify-between gap-4 rounded-[30px] bg-white p-6 shadow-xl shadow-slate-200/50 md:flex-row md:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Library size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {searchTerm ? `Search results for "${searchTerm}"` : "Latest Releases"}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {filteredStories.length} manuscripts
              </p>
            </div>
          </div>

          {/* Quick Filter Tag (Optional) */}
          <div className="flex gap-2">
            <span className="rounded-lg bg-slate-100 px-4 py-2 text-[10px] font-black uppercase text-slate-500">
              All Genres
            </span>
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {filteredStories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-5xl grayscale opacity-50">
              📔
            </div>
            <h3 className="text-2xl font-black text-slate-800">No stories found</h3>
            <p className="mt-2 font-medium text-slate-400">
              Try searching with a different title or author name.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 rounded-xl border-2 border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:border-emerald-500 hover:text-emerald-500"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-24 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          SM Tamil Novels &copy; 2026
        </p>
      </footer>
    </div>
  );
}