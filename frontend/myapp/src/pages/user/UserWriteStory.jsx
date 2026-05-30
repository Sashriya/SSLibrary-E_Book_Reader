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
  FileText,
  Crop,
  X
} from "lucide-react";

export default function UserWriteStory() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Romance");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const handleCropComplete = (croppedImageUrl) => {
    setImage(croppedImageUrl);
  };

  const handleRemoveImage = () => {
    if (window.confirm("Are you sure you want to remove the cover image?")) {
      setImage("");
    }
  };

  const handleSave = async (statusType) => {
    if (!title || !content) return alert("Title and Content are required! ✍️");

    setLoading(true);
    try {
      const storyData = {
        title,
        content,
        category,
        image,
        author: user?.username,
        status: statusType
      };

      await API.post("/stories", storyData);
      
      const successMsg = statusType === 'published' 
        ? "Story Published Successfully! ✨" 
        : "Story Saved as Draft! 📁";
        
      alert(successMsg);
      navigate("/profile"); 
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check your connection.");
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
        <div className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase text-slate-500 border border-slate-200">
          Manuscript Creator
        </div>
      </div>

      <div className="space-y-10 text-left">
        <input 
          type="text"
          placeholder="Enter Story Title..."
          className="w-full border-b-2 border-slate-100 bg-transparent py-4 text-3xl font-black tracking-tighter text-slate-900 outline-none focus:border-emerald-500 transition-all"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="group relative">
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-300">Choose Genre</label>
            <Hash className="absolute left-4 top-11 text-slate-400 group-focus-within:text-emerald-500" size={16} />
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

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase text-slate-300">Cover Artwork (Landscape)</label>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-500 group">
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon size={20} className="text-slate-400 group-hover:text-emerald-500" />
                  <span className="text-xs font-bold text-slate-400">Select Landscape Image</span>
                </div>
                <input type="file" className="hidden" onChange={handleImageSelect} accept="image/*" />
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
                    className="h-16 w-24 rounded-2xl object-cover shadow-md border border-slate-200" 
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
          placeholder="Once upon a time..."
          rows="15"
          className="w-full rounded-[35px] border border-slate-100 bg-slate-50 p-8 font-serif text-xl leading-relaxed text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>

        <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
          <button 
            type="button"
            onClick={() => handleSave('draft')} 
            disabled={loading} 
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-slate-400 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            Save as Draft
          </button>

          <button 
            type="button"
            onClick={() => handleSave('published')} 
            disabled={loading} 
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 text-xs font-black uppercase tracking-widest text-white shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            Publish to Site
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