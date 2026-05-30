import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { StoryContext } from "../../context/StoryContext";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, ArrowRight, Loader2 } from "lucide-react";

export default function UserDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { stories, loading: storyLoading } = useContext(StoryContext);
  const navigate = useNavigate();

  if (authLoading || storyLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // FIXED: 'favorite' → 'favorites'
  const favoriteStories = stories.filter((s) =>
    user?.favorites?.some(
      (f) => (f?._id?.toString() ?? f?.toString()) === s._id
    )
  );

  const readingStories = stories.filter((s) =>
    user?.reading?.some(
      (r) => (r?._id?.toString() ?? r?.toString()) === s._id
    )
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 animate-in fade-in slide-in-from-bottom-5 duration-700">

      <header className="relative mb-12 flex flex-col items-center justify-between overflow-hidden rounded-[40px] bg-slate-300 p-10 text-black shadow-2xl md:flex-row md:p-16">
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tighter md:text-5xl">
            Vannakkam, <span className="text-emerald-500">{user?.username}!</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-slate-400">
            Unngaludaiya reading journey-a inge thodarungall.
          </p>
        </div>
        <div className="relative z-10 mt-8 flex h-24 w-24 rotate-6 items-center justify-center rounded-[30px] bg-emerald-500 text-4xl font-black shadow-lg shadow-emerald-500/30 md:mt-0">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Reading Section */}
        <section>
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-800">
              <BookOpen className="text-emerald-500" size={24} /> Currently Reading
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {readingStories.length} Books
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {readingStories.length > 0 ? (
              readingStories.map((story) => (
                <div key={story._id} onClick={() => navigate(`/story/${story._id}`)}
                  className="group flex items-center gap-5 rounded-[25px] border border-slate-100 bg-white p-4 transition-all hover:translate-x-3 hover:border-emerald-500 hover:shadow-xl hover:shadow-slate-100 cursor-pointer">
                  <img src={story.image || "https://via.placeholder.com/150"} alt="" className="h-16 w-16 rounded-xl object-cover shadow-md" />
                  <div className="flex-1">
                    <h4 className="font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">{story.title}</h4>
                    <p className="text-xs font-medium text-slate-400">Continue where you left</p>
                  </div>
                  <ArrowRight className="text-slate-200 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" size={20} />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 p-10 text-center">
                <p className="text-sm font-bold italic text-slate-400">Innum ethuvum padikka aarambikkavillai.</p>
              </div>
            )}
          </div>
        </section>

        {/* Favorites Section */}
        <section>
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-800">
              <Heart className="text-emerald-500" size={24} /> Favorite Collection
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {favoriteStories.length} Saved
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {favoriteStories.length > 0 ? (
              favoriteStories.map((story) => (
                <div key={story._id} onClick={() => navigate(`/story/${story._id}`)}
                  className="group flex items-center gap-5 rounded-[25px] border border-slate-100 bg-white p-4 transition-all hover:translate-x-3 hover:border-emerald-500 hover:shadow-xl hover:shadow-slate-100 cursor-pointer">
                  <img src={story.image || "https://via.placeholder.com/150"} alt="" className="h-16 w-16 rounded-xl object-cover shadow-md" />
                  <div className="flex-1">
                    <h4 className="font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors">{story.title}</h4>
                    <p className="text-xs font-medium text-slate-400">Saved in your library</p>
                  </div>
                  <ArrowRight className="text-slate-200 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" size={20} />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-100 p-10 text-center">
                <p className="text-sm font-bold italic text-slate-400">Priyamaana novels-a inge saekaringall.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}