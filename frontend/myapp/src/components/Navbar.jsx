import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { StoryContext } from "../context/StoryContext";
import { User, LogOut, LayoutGrid, Search, X, Edit2Icon, HomeIcon, Menu, BookOpen, Users, UserPlus } from "lucide-react";
import SearchModal from "../components/SearchModal";
import NotificationBell from "../components/NotificationBell";
import FollowRequestsModal from "../components/FollowRequestsModal";
import API from "../api/axios";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { searchTerm, setSearchTerm } = useContext(StoryContext);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [followRequestsModalOpen, setFollowRequestsModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const fetchPendingRequestsCount = async () => {
    if (!user) return;
    try {
      const res = await API.get("/user/follow-requests/count");
      setPendingRequestsCount(res.data.count);
    } catch (err) {
      console.error("Error fetching requests count:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const profileImageUrl = user?.image && user.image !== "" 
    ? user.image 
    : `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&size=40&name=${user?.username?.charAt(0) || "U"}`;

  const navLinks = [
    { path: "/home", label: "Home", icon: <HomeIcon size={16} /> },
    { path: "/categories", label: "Categories", icon: <LayoutGrid size={16} /> },
    { path: "/write-story", label: "Write", icon: <Edit2Icon size={16} /> },
  ];

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b border-slate-100 bg-white shadow-sm">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4">
          
          {/* ========== DESKTOP LAYOUT ========== */}
          <div className="hidden md:flex items-center justify-between gap-4">
            
            <Link to="/" className="shrink-0 group">
              <div className="flex items-center gap-1.5">
                <BookOpen size={22} className="text-emerald-500" />
                <span className="text-lg font-black text-slate-900 transition-all group-hover:text-emerald-500">
                  SS <span className="text-emerald-500">LIBRARY</span>
                </span>
              </div>
            </Link>

            <div className="relative flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={16} />
                <input
                  type="text"
                  placeholder="Search stories by title or author..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Notification Bell */}
                  <NotificationBell />                  
                  {/* Find Friends Button */}
                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    title="Find Friends"
                  >
                    <Users size={20} className="text-slate-600" />
                  </button>
                  
                  {/* Profile Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowMenu(!showMenu)} 
                      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-gradient-to-br from-slate-100 to-white"
                    >
                      <img 
                        src={profileImageUrl} 
                        alt="profile" 
                        className="h-full w-full object-cover" 
                      />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50">
                        <div className="mb-2 flex items-center gap-3 px-3 py-2 border-b border-slate-100">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 overflow-hidden">
                            <img src={profileImageUrl} alt="profile" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-slate-400">Logged in as</p>
                            <p className="truncate text-sm font-bold text-slate-900">{user?.username}</p>
                          </div>
                        </div>

                        <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600">
                          <User size={16} /> My Profile
                        </Link>
                        
                        <div className="my-1 h-px bg-slate-100"></div>
                        
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-red-500 hover:bg-red-50">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link to="/login" className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-md">
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* ========== MOBILE LAYOUT ========== */}
          <div className="flex md:hidden items-center justify-between">
            
            <Link to="/" className="flex items-center gap-1.5">
              <BookOpen size={18} className="text-emerald-500" />
              <span className="text-sm font-black text-slate-900">
                SS <span className="text-emerald-500">LIBRARY</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {user && <NotificationBell />}              
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Users size={20} className="text-slate-600" />
              </button>
              
              <button
                ref={mobileMenuButtonRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <Menu size={22} className="text-slate-700" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-[200] md:hidden" 
                onClick={() => setMobileMenuOpen(false)} 
              />
              
              <div 
                ref={mobileMenuRef}
                className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[201] flex flex-col"
              >
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={20} className="text-emerald-500" />
                      <h2 className="text-lg font-black text-slate-800">Menu</h2>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {user && (
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-slate-100">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 overflow-hidden flex-shrink-0">
                        <img src={profileImageUrl} alt="profile" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{user.username}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        <Link 
                          to="/profile" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="inline-block mt-1 text-[9px] font-bold text-emerald-600"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {!user && (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-black uppercase tracking-wide text-white"
                    >
                      Login / Register
                    </Link>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <div className="w-6 flex-shrink-0">{link.icon}</div>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  
                  {/* Follow Requests in Mobile Menu */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setFollowRequestsModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <span>Follow Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Find Friends in Mobile Menu */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Users size={18} />
                    <span>Find Friends</span>
                  </button>
                  
                  {user && (
                    <>
                      <div className="my-3 mx-5 h-px bg-slate-100"></div>
                      <div className="px-5 py-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-3">Reading Stats</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-xl bg-emerald-50">
                            <p className="text-xl font-black text-emerald-600">{user?.reading?.length || 0}</p>
                            <p className="text-[7px] font-bold text-slate-500">READING</p>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-blue-50">
                            <p className="text-xl font-black text-blue-600">{user?.completed?.length || 0}</p>
                            <p className="text-[7px] font-bold text-slate-500">COMPLETED</p>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-rose-50">
                            <p className="text-xl font-black text-rose-600">{user?.favorites?.length || 0}</p>
                            <p className="text-[7px] font-bold text-slate-500">FAVORITES</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {user && (
                  <div className="p-5 border-t border-slate-100 bg-white">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-black uppercase tracking-wide text-red-600 hover:bg-red-100"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Modals */}
      <SearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
      
      <FollowRequestsModal 
        isOpen={followRequestsModalOpen}
        onClose={() => {
          setFollowRequestsModalOpen(false);
          fetchPendingRequestsCount();
        }}
      />
    </>
  );
}