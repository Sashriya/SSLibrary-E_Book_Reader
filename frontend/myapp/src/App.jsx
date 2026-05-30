import { Routes, Route } from "react-router-dom";
import { StoryProvider } from "./context/StoryContext";

/* Layouts */
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

/* Public & User Pages */
import LandingPage from "./pages/LandingPage/LandingPage";
import Home from "./pages/user/Home";
import StoryView from "./pages/user/StoryView";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import UserProfile from "./pages/user/UserProfile";
import Categories from "./pages/user/Categories";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";

/* Admin Pages */
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import WriteStory from "./pages/admin/WriteStory";
import ManageStories from "./pages/admin/ManageStories";
import EditStory from "./pages/admin/EditStory";

/* User Write/Edit */
import UserWriteStory from "./pages/user/UserWriteStory";
import UserEditStory from "./pages/user/UserEditStory";
import UserProfileView from "./pages/user/UserProfileView";

/* Protected Route Wrapper */
import ProtectedRoute from "./components/ProtectedRoute";

/* Styles */
import "./App.css";

export default function App() {
  return (
    <StoryProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected User Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="story/:id" element={<StoryView />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="categories" element={<Categories />} />
          <Route path="write-story" element={<UserWriteStory />} />
          <Route path="edit-story/:id" element={<UserEditStory />} />
          <Route path="user/:userId" element={<UserProfileView />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute admin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="write" element={<WriteStory />} />
          <Route path="manage" element={<ManageStories />} />
          <Route path="edit/:id" element={<EditStory />} />
        </Route>

        {/* 404 - Not Found */}
        <Route
          path="*"
          element={
            <div className="flex h-screen flex-col items-center justify-center bg-white text-center px-4">
              <h1 className="text-7xl sm:text-9xl font-black text-slate-100">404</h1>
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                Page Not Found
              </p>
              <button
                onClick={() => window.location.href = "/home"}
                className="mt-8 rounded-full bg-slate-900 px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-500"
              >
                Back to Library
              </button>
            </div>
          }
        />
      </Routes>
    </StoryProvider>
  );
}