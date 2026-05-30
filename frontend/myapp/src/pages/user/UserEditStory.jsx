import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import ImageCropperModal from "../../components/ImageCropperModal";
import { 
  PenTool, 
  Image as ImageIcon, 
  Hash, 
  UploadCloud, 
  Loader2, 
  ChevronLeft,
  FileText,
  AlertTriangle,
  Crop,
  X
} from "lucide-react";

export default function UserEditStory() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Romance");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch existing story data on load
  useEffect(() => {
    const fetchStory = async () => {
      if (!user) return;
      try {
        const res = await API.get(`/stories/${id}`);
        
        const storyAuthor = (res.data.author || "").toLowerCase().trim();
        const loggedUser = (user.username || "").toLowerCase().trim();
        
        if (storyAuthor !== loggedUser && user.role !== 'admin') {
           setError(`Not authorized. This manuscript belongs to ${res.data.author}`);
           return;
        }

        setTitle(res.data.title);
        setContent(res.data.content);
        setCategory(res.data.category);
        setImage(res.data.image);
        setStatus(res.data.status);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Manuscript not found or Server Error.");
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id, user?.username]);

  // Handle Image Selection (opens cropper)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Maximum 5MB");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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

  // Handle Update Logic
  const handleUpdate = async (newStatus) => {
    if (!title.trim() || !content.trim()) return alert("Title and Content cannot be empty! ✍️");

    setUpdateLoading(true);
    try {
      const updatedData = {
        title,
        content,
        category,
        image,
        status: newStatus 
      };

      await API.put(`/stories/${id}`, updatedData);
      
      alert(newStatus === 'published' ? "Manuscript Updated & Published! ✨" : "Draft Saved! 📁");
      navigate("/profile");
    } catch (err) {
      console.error("UPDATE ERROR:", err.response?.data);
      alert(err.response?.data?.msg || "Update failed. Unauthorized access.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="font-black uppercase tracking-widest text-slate-400">Loading Manuscript Data...</p>
    </div>
  );

  if (error) return (
    <div className="mx-auto max-w-[550px] mt-20 p-12 bg-red-50 rounded-[40px] border border-red-100 text-center animate-in zoom-in duration-300 shadow-2xl shadow-red-100/50">
       <AlertTriangle size={50} className="text-red-500 mx-auto mb-5" />
       <p className="text-sm font-black text-red-700 uppercase tracking-widest leading-relaxed mb-8">{error}</p>
       <button 
         onClick={() => navigate('/profile')} 
         className="flex items-center gap-2 mx-auto rounded-2xl bg-white border border-red-200 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
       >
         <ChevronLeft size={14} /> Back to Profile
       </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 animate-in fade-in duration-700">
      
      {/* HEADER NAVIGATION */}
      <div className="mb-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-all">
          <ChevronLeft size={16} /> Discard Changes
        </button>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-[10px] font-black uppercase text-slate-500 border border-slate-200">
          <PenTool size={14} className="text-emerald-500" /> Manuscript Editor
        </div>
      </div>

      <div className="space-y-10 text-left">
        {/* TITLE INPUT */}
        <input 
          type="text"
          placeholder="Enter Story Title..."
          className="w-full border-b-2 border-slate-100 bg-transparent py-6 text-5xl font-black tracking-tighter text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* GENRE SELECT */}
          <div className="group relative">
            <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-300">Manuscript Genre</label>
            <Hash className="absolute left-4 top-12 text-slate-300 group-focus-within:text-emerald-500" size={18} />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-[25px] border border-slate-100 bg-slate-50 p-5 pl-12 font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer shadow-sm"
            >
              <option value="Romance">Romance ❤️</option>
              <option value="Thriller">Thriller 🔥</option>
              <option value="Action">Action ⚡</option>
              <option value="Horror">Horror 👻</option>
              <option value="Fan-Fiction">Fan-Fiction ✨</option>
            </select>
          </div>

          {/* COVER IMAGE UPLOAD WITH CROPPER */}
          <div>
            <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-300">Cover Artwork (Landscape)</label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer rounded-[25px] border border-dashed border-slate-200 bg-slate-50 p-5 transition-all hover:border-emerald-500 hover:bg-emerald-50/30 group">
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon size={20} className="text-slate-400 group-hover:text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                  className="px-4 rounded-[25px] border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
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
                    className="h-16 w-24 rounded-xl object-cover shadow-md border border-slate-200" 
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

        {/* CONTENT AREA */}
        <div className="relative">
            <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-300">Manuscript Narrative</label>
            <textarea 
              placeholder="Start your journey here..."
              rows="15"
              className="w-full rounded-[40px] border border-slate-100 bg-slate-50 p-10 font-serif text-xl leading-relaxed text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner scrollbar-hide"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-end gap-5 pt-10">
          
          <button 
            type="button"
            onClick={() => handleUpdate('draft')} 
            disabled={updateLoading} 
            className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 ${status === 'draft' ? 'border-orange-200 text-orange-400 bg-orange-50/20' : ''}`}
          >
            {updateLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {status === 'draft' ? 'Update Draft' : 'Save as Draft'}
          </button>

          <button 
            type="button"
            onClick={() => handleUpdate('published')} 
            disabled={updateLoading} 
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-12 py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {updateLoading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
            {status === 'published' ? 'Update Manuscript' : 'Publish Now'}
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