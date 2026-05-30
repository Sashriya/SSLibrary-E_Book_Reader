import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import ImageCropperModal from "../../components/ImageCropperModal";
import { 
  PenTool, 
  Image as ImageIcon, 
  Hash, 
  Send, 
  Loader2, 
  ChevronLeft,
  Crop,
  X
} from "lucide-react";

export default function WriteStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", content: "", category: "Romance", image: "", status: "published" });
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Handle Image Selection (opens cropper)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { 
      alert("Only JPG, PNG, WEBP images allowed!"); 
      return; 
    }
    if (file.size > 5 * 1024 * 1024) { 
      alert("Image too large! Max 5MB."); 
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
    handleChange('image', croppedImageUrl);
  };

  // Remove Image
  const handleRemoveImage = () => {
    if (window.confirm("Are you sure you want to remove the cover image?")) {
      handleChange('image', "");
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.content.trim()) return "Content is required";
    if (formData.title.trim().length > 200) return "Title too long (max 200 chars)";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) { alert(error); return; }
    if (!user?.username) { alert("You must be logged in to write stories!"); return; }

    setLoading(true);
    try {
      await API.post("/stories", { ...formData, author: user.username });
      navigate("/admin/manage");
    } catch (err) { 
      alert(err.response?.data?.msg || "Failed to publish story."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 animate-in fade-in duration-700">
      <div className="mb-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-all">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase text-emerald-600">
          Creator Mode Active
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <input 
          type="text" 
          placeholder="Enter Story Title..." 
          maxLength={200}
          className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-5xl font-black tracking-tighter text-slate-900 outline-none focus:border-emerald-500 transition-all"
          value={formData.title} 
          onChange={(e) => handleChange('title', e.target.value)} 
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="group relative">
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-300">Choose Genre</label>
            <Hash className="absolute left-4 top-11 text-slate-400 group-focus-within:text-emerald-500" size={16} />
            <select 
              value={formData.category} 
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-100 bg-slate-50 p-4 pl-12 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
            >
              <option value="Romance">Romance ❤️</option>
              <option value="Thriller">Thriller 🔥</option>
              <option value="Action">Action ⚡</option>
              <option value="Horror">Horror 👻</option>
              <option value="Fan-Fiction">Fan-Fiction ✨</option>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-300">Cover Image (Landscape)</label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-500 group">
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon size={20} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-400">
                    {formData.image ? "Change Image" : "Upload Landscape Cover"}
                  </span>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleImageSelect} 
                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                />
              </label>
              {formData.image && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(formData.image);
                    setShowCropper(true);
                  }}
                  className="px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  title="Crop Image"
                >
                  <Crop size={20} className="text-emerald-500" />
                </button>
              )}
            </div>
            
            {formData.image && (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={formData.image} 
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

        <textarea 
          placeholder="Start writing your novel here..." 
          rows={15}
          className="w-full rounded-[35px] border border-slate-100 bg-slate-50 p-8 font-serif text-xl leading-relaxed text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
          value={formData.content} 
          onChange={(e) => handleChange('content', e.target.value)}
        />

        <div className="flex justify-end pt-6 gap-4">
          <button 
            type="button" 
            disabled={loading} 
            onClick={() => handleChange('status', 'draft')}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-12 py-5 text-xs font-black uppercase tracking-widest text-white shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
            Publish to Site
          </button>
        </div>
      </form>

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