import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ImageCropperModal from "../../components/ImageCropperModal";
import { 
  Save, 
  ChevronLeft, 
  Loader2, 
  Image as ImageIcon, 
  Hash, 
  User as UserIcon,
  Send,
  AlertTriangle,
  Crop,
  X
} from "lucide-react";

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form States
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Romance");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch Existing Story Data
  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await API.get(`/stories/${id}`);
        const story = res.data;

        const storyAuthor = (story.author || "").toLowerCase().trim();
        const currentUser = (user?.username || "").toLowerCase().trim();

        if (storyAuthor !== currentUser && user?.role !== 'admin') {
          setError(`Not authorized. This story belongs to ${story.author}`);
          return;
        }

        setTitle(story.title || "");
        setAuthor(story.author || "");
        setContent(story.content || "");
        setCategory(story.category || "Romance");
        setImage(story.image || "");
        setStatus(story.status || "draft");
        
      } catch (err) {
        console.error("Fetch Error Details:", err.response);
        if (err.response?.status === 404) {
          setError("Story not found");
        } else {
          setError("Failed to load story details. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchStory();
    }
  }, [id, user]);

  // Handle Image Selection (opens cropper)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Maximum size is 5MB.");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle Cropped Image
  const handleCropComplete = (croppedImageUrl) => {
    setImage(croppedImageUrl);
  };

  // Remove Image
  const handleRemoveImage = () => {
    if (window.confirm("Are you sure you want to remove the cover image?")) {
      setImage("");
    }
  };

  // Update Story Logic
  const handleUpdate = async (newStatus) => {
    if (!title.trim()) {
      alert("Please enter a story title");
      return;
    }
    
    if (!content.trim()) {
      alert("Please enter story content");
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        title: title.trim(),
        author: author.trim(),
        content: content.trim(),
        category,
        image,
        status: newStatus
      };

      await API.put(`/stories/${id}`, updatedData);
      
      const successMsg = newStatus === 'published' 
        ? "Manuscript updated and published! ✨" 
        : "Manuscript saved as draft! 📁";
      
      alert(successMsg);
      navigate("/admin/manage");
      
    } catch (err) {
      console.error("Update Error:", err.response?.data);
      const errorMsg = err.response?.data?.msg || "Update failed. Please try again.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="font-black uppercase tracking-widest text-slate-400">Loading Manuscript...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="mx-auto max-w-[550px] mt-20 p-12 bg-red-50 rounded-[40px] border border-red-100 text-center animate-in zoom-in duration-300 shadow-2xl shadow-red-100/50">
        <AlertTriangle size={50} className="text-red-500 mx-auto mb-5" />
        <p className="text-sm font-black text-red-700 uppercase tracking-widest leading-relaxed mb-8">{error}</p>
        <button 
          onClick={() => navigate('/admin/manage')} 
          className="flex items-center gap-2 mx-auto rounded-2xl bg-white border border-red-200 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft size={14} /> Back to Management
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-all"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Management
        </button>
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest 
          ${status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          Current Status: {status === 'published' ? 'Published' : 'Draft'}
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Title Input */}
        <div className="group">
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            Manuscript Title
          </label>
          <input 
            type="text"
            placeholder="Enter story title..."
            className="w-full rounded-[25px] border border-slate-100 bg-slate-50 p-6 text-2xl font-black tracking-tighter text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Author, Category, Image Row */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Author */}
          <div>
            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
              Author Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 pl-12 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                placeholder="Author name"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
              Genre
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-100 bg-slate-50 p-4 pl-12 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="Romance">Romance ❤️</option>
                <option value="Thriller">Thriller 🔥</option>
                <option value="Action">Action ⚡</option>
                <option value="Horror">Horror 👻</option>
                <option value="Fan-Fiction">Fan-Fiction ✨</option>
              </select>
            </div>
          </div>

          {/* Cover Image Upload with Cropper - Landscape */}
          <div>
            <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
              Cover Artwork (Landscape)
            </label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-500 group">
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-400">
                    {image ? "Change Image" : "Upload Landscape Cover"}
                  </span>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleImageSelect} 
                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(image);
                    setShowCropper(true);
                  }}
                  className="px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  title="Crop Image"
                >
                  <Crop size={20} className="text-emerald-500" />
                </button>
              )}
            </div>
            
            {image && (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={image} 
                    alt="Preview" 
                    className="h-16 w-24 rounded-lg object-cover shadow-md border border-slate-200" 
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Click crop button ✂️ to adjust landscape cover</p>
              </div>
            )}
          </div>
        </div>

        {/* Story Content */}
        <div>
          <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            Story Narrative
          </label>
          <textarea 
            rows="15"
            placeholder="Write your story here..."
            className="w-full rounded-[35px] border border-slate-100 bg-slate-50 p-8 font-serif text-lg leading-relaxed text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 border-t border-slate-50 pt-10">
          <button 
            type="button"
            disabled={saving}
            onClick={() => handleUpdate('draft')}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-100 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save as Draft
          </button>

          <button 
            type="button"
            disabled={saving}
            onClick={() => handleUpdate('published')}
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-emerald-600 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Update & Publish
          </button>
        </div>
        
      </div>

      {/* Image Cropper Modal - Landscape Mode */}
      {showCropper && (
        <ImageCropperModal
          image={selectedImage}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
          onCropComplete={handleCropComplete}
          aspect={16/9}
        />
      )}
    </div>
  );
}