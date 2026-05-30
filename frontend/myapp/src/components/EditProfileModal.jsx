import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import ImageCropperModal from "./ImageCropperModal";
import { X, User, Mail, Lock, Loader2, Camera, CheckCircle, AlertCircle } from "lucide-react";

export default function EditProfileModal({ isOpen, onClose, onProfileUpdate }) {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImageFile, setCroppedImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
    
    if (name === "newPassword" && value) {
      if (value.length < 6) {
        setPasswordStrength("weak");
      } else if (value.length < 10) {
        setPasswordStrength("medium");
      } else {
        setPasswordStrength("strong");
      }
    } else if (name === "newPassword" && !value) {
      setPasswordStrength("");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (formData.newPassword && !formData.currentPassword) {
      setError("Please enter your current password to set a new password");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const updateData = { username: formData.username };
      
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const res = await API.put("/user/profile", updateData);
      setUser(res.data);
      setSuccess("Profile updated successfully!");
      
      if (onProfileUpdate) onProfileUpdate(res.data);
      
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      setTimeout(() => onClose(), 2000);
      
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection - opens cropper
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large! Maximum 5MB");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, WEBP images are allowed");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image and upload to Cloudinary
  const handleCropComplete = async (croppedImageUrl) => {
    // Convert cropped image URL to File object
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
    setCroppedImageFile(file);
    setPreviewImage(croppedImageUrl);
    
    // Auto-upload after cropping
    await uploadProfilePicture(file);
  };

  // Upload profile picture to Cloudinary (via backend)
  const uploadProfilePicture = async (file) => {
    setUploadingPic(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
      const res = await API.post('/user/profile/upload-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data);
      if (onProfileUpdate) onProfileUpdate(res.data);
      setSuccess("Profile picture updated! 🎉");
      setCroppedImageFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to upload picture");
      setPreviewImage(null);
    } finally {
      setUploadingPic(false);
    }
  };

  const getImageSource = () => {
    if (previewImage) return previewImage;
    if (user?.image) return user.image;
    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="mx-4 w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800">Edit Profile</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* Profile Picture Section */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                {getImageSource() ? (
                  <img
                    src={getImageSource()}
                    className="w-full h-full object-cover"
                    alt={user?.username}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-emerald-600">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingPic ? (
                  <Loader2 className="animate-spin text-white" size={24} />
                ) : (
                  <Camera className="text-white" size={24} />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploadingPic}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">Click to upload & adjust</p>
            <p className="mt-1 text-[9px] text-emerald-500">✨ Drag, zoom & rotate to fit perfectly</p>
            {uploadingPic && (
              <p className="mt-1 text-[10px] text-emerald-500">Uploading to Cloudinary...</p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-500 flex items-center gap-2 justify-center">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-500 flex items-center gap-2 justify-center">
              <CheckCircle size={14} /> {success}
            </div>
          )}
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-sm font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-[8px] text-amber-600 flex items-center gap-1">
                <AlertCircle size={10} /> Email cannot be changed for security reasons
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Change Password (Optional)
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="currentPassword"
                    placeholder="Current Password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password (min 6 chars)"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  {passwordStrength && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase ${
                      passwordStrength === 'weak' ? 'text-red-500' :
                      passwordStrength === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength}
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-emerald-500 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-600 disabled:opacity-50">
                {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Save Changes"}
              </button>
            </div>
          </form>
          
          <div className="mt-4 rounded-xl bg-blue-50 p-3">
            <p className="text-[9px] text-blue-600 text-center">
              💡 Images are uploaded to Cloudinary cloud storage for better performance
            </p>
          </div>
        </div>
      </div>
      
      {/* Image Cropper Modal */}
      {showCropper && (
        <ImageCropperModal
          image={selectedImage}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
          onCropComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </>
  );
}