import { useState, useContext } from "react";
import { StoryContext } from "../../context/StoryContext";
import StoryCard from "../../components/StoryCard";
import { LayoutGrid, Flame, Heart, Book, Sparkles, Loader2 } from "lucide-react";

const CATEGORIES = [
  { name: "Romance", icon: <Heart size={16} /> },
  { name: "Thriller", icon: <Flame size={16} /> },
  { name: "Action", icon: <Sparkles size={16} /> },
  { name: "Horror", icon: <Book size={16} /> },
  { name: "Fan-Fiction", icon: <LayoutGrid size={16} /> }
];

export default function Categories() {
  const { stories, loading } = useContext(StoryContext);
  const [selected, setSelected] = useState("Romance");

  // Filter Logic: Story category matches selected category
  const filteredStories = stories.filter((story) => {
    const categoryMatch = story.category?.toLowerCase() === selected.toLowerCase();
    const isPublished = story.status === "published";
    return categoryMatch && isPublished;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            Explore <span className="text-emerald-500">Genres</span>
          </h2>
          <p className="mt-1 sm:mt-2 text-sm text-slate-400 italic">Select a category to discover manuscripts.</p>
        </div>

        {/* Category Selection Pills */}
        <div className="mb-8 sm:mb-10 flex flex-wrap gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelected(cat.name)}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                selected === cat.name
                  ? "bg-slate-900 text-white shadow-lg scale-105"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              <span className={selected === cat.name ? "text-emerald-400" : ""}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Section - Reduced bottom gap */}
        <div className="min-h-[400px]">
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {filteredStories.map((story) => (
                <StoryCard key={story._id} story={story} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-slate-100 text-3xl sm:text-4xl grayscale opacity-50">
                📂
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">No manuscripts found</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-400">
                Currently, no published stories in the{" "}
                <span className="font-bold text-emerald-500">{selected}</span> genre.
              </p>
              <button
                onClick={() => setSelected("Romance")}
                className="mt-4 sm:mt-5 rounded-full bg-emerald-50 px-4 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                Browse other genres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}