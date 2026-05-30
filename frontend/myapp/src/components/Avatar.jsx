// components/Avatar.jsx
import { useState } from "react";

export default function Avatar({ 
  src, 
  username, 
  size = 40, // size in pixels
  className = "",
  rounded = "full" // 'full' for circle, 'lg' for large rounded, 'md' for medium
}) {
  const [imgError, setImgError] = useState(false);
  
  const getInitial = () => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColor = () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-violet-500'
    ];
    if (!username) return colors[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getRoundedClass = () => {
    switch(rounded) {
      case 'full': return 'rounded-full';
      case 'lg': return 'rounded-2xl';
      case 'md': return 'rounded-xl';
      default: return 'rounded-full';
    }
  };

  const sizeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`
  };

  // If image exists and no error, show image
  if (src && !imgError) {
    return (
      <div 
        className={`overflow-hidden bg-slate-100 ${getRoundedClass()} ${className}`}
        style={sizeStyle}
      >
        <img
          src={src}
          alt={username}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: Show initials with color
  return (
    <div 
      className={`flex items-center justify-center text-white font-bold shadow-sm ${getRoundedClass()} ${getAvatarColor()} ${className}`}
      style={sizeStyle}
    >
      {getInitial()}
    </div>
  );
}