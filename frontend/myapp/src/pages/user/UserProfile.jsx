/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import API from "../../api/axios";
import EditProfileModal from "../../components/EditProfileModal";
import FollowersModal from "../../components/FollowersModal";
import Cropper from "react-easy-crop";
import {
  Heart,
  BookOpen,
  CheckCircle,
  PenTool,
  Loader2,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  LogOut,
  Mail,
  Edit2,
  ThumbsUp,
  MessageCircle,
  Camera,
  ChevronDown,
  X,
  ZoomIn,
  ZoomOut,
  UserPlus,
  Users,
  MapPin,
  Link2,
  FileText
} from "lucide-react";

export default function UserProfile() {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("reading");
  const [libraryStories, setLibraryStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // Followers/Following Modal
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userStoriesCount, setUserStoriesCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user profile with followers count
      const profileRes = await API.get(`/user/profile/${user._id}`);
      setFollowersCount(profileRes.data.followersCount);
      setFollowingCount(profileRes.data.followingCount);
      setUserStoriesCount(profileRes.data.storiesCount);
      
      if (activeTab === "my-stories") {
        const res = await API.get("/stories");
        const myManuscripts = res.data.filter(
          (s) => s.author?.toLowerCase() === user.username?.toLowerCase(),
        );
        setLibraryStories(myManuscripts);
      } else {
        const res = await API.get(`/user/library?type=${activeTab}`);
        let stories = res.data || [];

        if (activeTab === "reading") {
          const completedIds = new Set(
            (user?.completed || []).map((c) => c?.toString()),
          );
          stories = stories.filter((s) => !completedIds.has(s._id?.toString()));
        }

        const seen = new Set();
        const unique = stories.filter((item) => {
          const itemId = item?._id?.toString();
          if (seen.has(itemId)) return false;
          seen.add(itemId);
          return true;
        });

        setLibraryStories(unique);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      } else {
        console.error("Fetch Error:", err);
      }
      setLibraryStories([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user, logout]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  useEffect(() => {
    if (user) {
      setRefetchKey((prev) => prev + 1);
    }
  }, [
    user?.reading?.length,
    user?.completed?.length,
    user?.favorites?.length,
    user?.coverImage,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteStory = async (storyId) => {
    setMenuOpen(null);
    if (!window.confirm("Are you sure you want to delete this manuscript?"))
      return;
    try {
      await API.delete(`/stories/${storyId}`);
      setLibraryStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        logout();
      } else {
        alert(err.response?.data?.msg || "Delete failed.");
      }
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Maximum 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, WEBP images are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    const file = new File([blob], "cover-photo.jpg", { type: "image/jpeg" });

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("coverImage", file);

    try {
      const res = await API.post("/user/upload-cover", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        setUser(res.data);
        setRefetchKey((prev) => prev + 1);
        alert("Cover image updated successfully! 🎉");
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      alert(err.response?.data?.msg || "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      setShowCropper(false);
      setSelectedImage(null);
    }
  };

  const hasCoverImage = user?.coverImage && user.coverImage !== "";

  const placeholderPattern = {
    backgroundImage: `radial-gradient(circle at 25% 40%, rgba(255,255,255,0.1) 1%, transparent 1%)`,
    backgroundSize: '30px 30px'
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* PROFILE HEADER */}
        <div className="relative mb-6 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
          {/* COVER PHOTO */}
          <div
            className="relative w-full h-56 sm:h-32 md:h-36 bg-gradient-to-r from-emerald-600 to-teal-600"
            style={!hasCoverImage ? placeholderPattern : {}}
          >
            {hasCoverImage && (
              <img
                src={user.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}

            {hasCoverImage && (
              <div className="absolute inset-0 bg-black/30"></div>
            )}

            {/* Change Cover Button */}
            <label className="absolute bottom-2 right-2 z-10 cursor-pointer rounded-full bg-black/60 backdrop-blur-md px-2 py-1 text-white transition-all hover:bg-black/80 text-[8px] sm:text-[9px] flex items-center gap-1">
              {uploadingCover ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <>
                  <Camera size={10} />
                  <span className="hidden xs:inline">Change Cover</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploadingCover}
              />
            </label>

            {/* PROFILE INFO OVERLAY */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-12 pb-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                {/* Profile Picture */}
                <div className="relative shrink-0 self-center sm:self-auto -mt-8 sm:-mt-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                    <img
                      src={
                        user?.image ||
                        `https://ui-avatars.com/api/?background=10b981&color=fff&bold=true&length=1&size=80&name=${user?.username?.charAt(0) || "U"}`
                      }
                      className="w-full h-full object-cover"
                      alt={user?.username}
                    />
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-0.5 sm:p-1 text-white shadow-lg transition-all hover:bg-emerald-600 hover:scale-110"
                  >
                    <Edit2 size={10} />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex  items-center gap-1 sm:gap-2 justify-center sm:justify-start flex-wrap">
                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white drop-shadow-lg">
                      {user?.username}
                    </h1>

                    {/* Dropdown Button */}
                    <div className="relative" ref={profileDropdownRef}>
                      <button
                        onClick={() =>
                          setProfileDropdownOpen(!profileDropdownOpen)
                        }
                        className="p-0.5 rounded-full transition-all hover:bg-white/20 text-white"
                      >
                        <ChevronDown size={12} />
                      </button>

                      {profileDropdownOpen &&
                        createPortal(
                          <div
                            className="fixed w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-[9999]"
                            style={{
                              top: profileDropdownRef.current?.getBoundingClientRect().top - 20 + window.scrollY,
                              left: profileDropdownRef.current?.getBoundingClientRect().left,
                            }}
                          >
                            <button
                              onClick={() => {
                                setIsEditModalOpen(true);
                                setProfileDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-t-lg"
                            >
                              <Edit2 size={12} /> Edit Profile
                            </button>
                            <button
                              onClick={logout}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-b-lg border-t border-slate-100"
                            >
                              <LogOut size={12} /> Logout
                            </button>
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>

                  {/* Bio Section */}
                  {user?.bio && (
                    <p className="mt-1 text-white/90 text-xs max-w-md">
                      {user.bio}
                    </p>
                  )}

                  <div className="mt-0.5 flex items-center justify-center sm:justify-start gap-1 text-white/80 text-[9px] sm:text-[10px]">
                    <Mail size={9} />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {user?.email}
                    </span>
                  </div>

                  {/* Followers/Following Stats */}
                  <div className="mt-2 flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                    <button
                      onClick={() => setUserStoriesCountModal(true)}
                      className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                    >
                      <FileText size={12} />
                      <span className="text-[10px] sm:text-xs font-medium">
                        {userStoriesCount} stories
                      </span>
                    </button>
                    <button
                      onClick={() => setFollowersModalOpen(true)}
                      className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                    >
                      <Users size={12} />
                      <span className="text-[10px] sm:text-xs font-medium">
                        {followersCount} followers
                      </span>
                    </button>
                    <button
                      onClick={() => setFollowingModalOpen(true)}
                      className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
                    >
                      <UserPlus size={12} />
                      <span className="text-[10px] sm:text-xs font-medium">
                        {followingCount} following
                      </span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center sm:justify-end mt-2 sm:mt-0">
                  <Link
                    to="/write-story"
                    className="flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 text-slate-800 hover:bg-white transition-colors text-[9px] sm:text-[10px] font-bold uppercase"
                  >
                    <PenTool size={12} />
                    Write
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 text-slate-800 hover:bg-red-500 hover:text-white transition-colors text-[9px] sm:text-[10px] font-bold uppercase"
                  >
                    <LogOut size={12} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Followers/Following Modals */}
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={user?._id}
          type="followers"
          title="Followers"
        />
        <FollowersModal
          isOpen={followingModalOpen}
          onClose={() => setFollowingModalOpen(false)}
          userId={user?._id}
          type="following"
          title="Following"
        />

        {/* Cover Image Cropper Modal */}
        {showCropper && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80">
            <div className="w-[90%] max-w-md bg-white rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-sm font-bold">Adjust Cover</h3>
                <button
                  onClick={() => setShowCropper(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative h-64 bg-slate-900">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1200 / 300}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <ZoomIn size={14} />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <ZoomOut size={14} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCropper(false)}
                    className="flex-1 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropAndUpload}
                    disabled={uploadingCover}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    {uploadingCover ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* TABS */}
        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            {
              id: "reading",
              label: "Reading Now",
              icon: <BookOpen size={14} />,
            },
            {
              id: "completed",
              label: "Finished",
              icon: <CheckCircle size={14} />,
            },
            { id: "favorites", label: "Loved", icon: <Heart size={14} /> },
            {
              id: "my-stories",
              label: "My Manuscripts",
              icon: <PenTool size={14} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMenuOpen(null);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* STORIES LIST */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center py-12">
              <Loader2 className="animate-spin text-emerald-500" size={24} />
              <p className="mt-2 text-xs text-slate-400">Loading...</p>
            </div>
          ) : libraryStories.length > 0 ? (
            libraryStories.map((story) => (
              <div
                key={story._id}
                className="group bg-white rounded-lg overflow-hidden border border-slate-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-100">
                  <img
                    src={
                      story.image ||
                      "https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=400&h=225&fit=crop"
                    }
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={story.title}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.style.background =
                        "linear-gradient(135deg, #e2e8f0, #f1f5f9)";
                    }}
                  />

                  <div className="absolute left-1 top-1">
                    <span
                      className={`px-1 py-0.5 text-[6px] font-bold uppercase rounded ${
                        story.status === "published"
                          ? "bg-emerald-500 text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {story.status === "published" ? "PUB" : "DRF"}
                    </span>
                  </div>

                  {activeTab === "reading" && (
                    <div className="absolute right-1 top-1">
                      <span className="px-1 py-0.5 text-[6px] font-bold uppercase rounded bg-blue-500 text-white">
                        READ
                      </span>
                    </div>
                  )}
                  {activeTab === "completed" && (
                    <div className="absolute right-1 top-1">
                      <span className="px-1 py-0.5 text-[6px] font-bold uppercase rounded bg-emerald-500 text-white">
                        DONE
                      </span>
                    </div>
                  )}
                  {activeTab === "favorites" && (
                    <div className="absolute right-1 top-1">
                      <span className="px-1 py-0.5 text-[6px] font-bold uppercase rounded bg-rose-500 text-white">
                        LOVE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-600">
                    {story.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">
                    {story.author || "Unknown"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[7px] text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Eye size={6} /> {story.views || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp size={6} /> {story.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle size={6} /> {story.comments?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="absolute top-1 right-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === story._id ? null : story._id);
                    }}
                    className="p-1 bg-black/50 rounded text-white hover:bg-black/70"
                  >
                    <MoreVertical size={10} />
                  </button>

                  {menuOpen === story._id && (
                    <div className="absolute right-0 top-5 z-50 w-24 bg-white rounded-lg shadow-lg border">
                      <Link
                        to={`/story/${story._id}`}
                        onClick={() => setMenuOpen(null)}
                        className="block px-2 py-1.5 text-[9px] hover:bg-slate-50"
                      >
                        View
                      </Link>
                      {activeTab === "my-stories" && (
                        <>
                          <Link
                            to={`/edit-story/${story._id}`}
                            onClick={() => setMenuOpen(null)}
                            className="block px-2 py-1.5 text-[9px] hover:bg-slate-50 border-t"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteStory(story._id)}
                            className="block w-full text-left px-2 py-1.5 text-[9px] text-red-500 hover:bg-red-50 border-t"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center py-12 text-center">
              <PenTool size={32} className="text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">
                {activeTab === "my-stories"
                  ? "No manuscripts yet. Start writing!"
                  : "No stories found"}
              </p>
              {activeTab === "my-stories" && (
                <Link
                  to="/write-story"
                  className="mt-3 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600"
                >
                  Write Your First Story
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, "image/jpeg", 0.9);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}