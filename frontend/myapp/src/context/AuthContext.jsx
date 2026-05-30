import { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserState(null);
        setLoading(false);
        return;
      }
      try {
        const res = await API.get('/auth/me');
        const essentialUserData = {
          _id: res.data._id,
          id: res.data.id || res.data._id,
          username: res.data.username,
          email: res.data.email,
          role: res.data.role,
          image: res.data.image || "",
          coverImage: res.data.coverImage || "",
          favorites: res.data.favorites?.map(f => f._id || f) || [],
          reading: res.data.reading?.map(r => r._id || r) || [],
          completed: res.data.completed?.map(c => c._id || c) || []
        };
        setUserState(essentialUserData);
        localStorage.setItem('user', JSON.stringify(essentialUserData));
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserState(null);
        } else {
          try {
            const saved = localStorage.getItem('user');
            if (saved) {
              const parsed = JSON.parse(saved);
              setUserState(parsed);
            }
          } catch { 
            setUserState(null); 
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password
      });
      const { token, user: userData } = res.data;
      
      const essentialUserData = {
        _id: userData._id,
        id: userData.id || userData._id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        image: userData.image || "",
        coverImage: userData.coverImage || "",
        favorites: userData.favorites?.map(f => f._id || f) || [],
        reading: userData.reading?.map(r => r._id || r) || [],
        completed: userData.completed?.map(c => c._id || c) || []
      };
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(essentialUserData));
      setUserState(essentialUserData);
      
      setTimeout(() => {
        if (userData.role === 'admin') navigate("/admin/dashboard");
        else navigate("/home");
      }, 10);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw err;
    }
  };

  // Google Login
  const googleLogin = async (credential) => {
    try {
      const res = await API.post("/user/google-login", { token: credential });
      const { token, user: userData } = res.data;
      
      const essentialUserData = {
        _id: userData._id,
        id: userData.id || userData._id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        image: userData.image || "",
        coverImage: userData.coverImage || "",
        favorites: userData.favorites?.map(f => f._id || f) || [],
        reading: userData.reading?.map(r => r._id || r) || [],
        completed: userData.completed?.map(c => c._id || c) || []
      };
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(essentialUserData));
      setUserState(essentialUserData);
      
      setTimeout(() => navigate("/home"), 10);
    } catch (err) {
      console.error("Google login error:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserState(null);
    navigate("/");
  };

  const setUser = (userData) => {
    if (!userData) {
      setUserState(null);
      localStorage.removeItem('user');
      return;
    }
    
    const currentUser = user;
    
    const essentialUserData = {
      _id: userData._id || userData.id || currentUser?._id,
      id: userData.id || userData._id || currentUser?.id,
      username: userData.username || currentUser?.username,
      email: userData.email || currentUser?.email,
      role: userData.role || currentUser?.role,
      image: userData.image !== undefined && userData.image !== "" ? userData.image : (currentUser?.image || ""),
      coverImage: userData.coverImage !== undefined && userData.coverImage !== "" ? userData.coverImage : (currentUser?.coverImage || ""),
      favorites: userData.favorites?.map(f => f._id || f) || currentUser?.favorites || [],
      reading: userData.reading?.map(r => r._id || r) || currentUser?.reading || [],
      completed: userData.completed?.map(c => c._id || c) || currentUser?.completed || []
    };
    
    setUserState(essentialUserData);
    localStorage.setItem('user', JSON.stringify(essentialUserData));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };