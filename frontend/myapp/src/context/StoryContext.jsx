import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api/axios';

export const StoryContext = createContext();

export const StoryProvider = ({ children }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/stories");
      setStories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch stories:", err);
      setError(err.response?.data?.msg || "Failed to load stories");
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filteredStories = useMemo(() => {
    if (!searchTerm.trim()) return stories;
    const term = searchTerm.toLowerCase().trim();
    return stories.filter(story => {
      const title = (story.title || "").toLowerCase();
      const author = (story.author || "").toLowerCase();
      return title.includes(term) || author.includes(term);
    });
  }, [stories, searchTerm]);

  return (
    <StoryContext.Provider value={{
      stories: filteredStories, allStories: stories, loading, error,
      fetchStories, searchTerm, setSearchTerm
    }}>
      {children}
    </StoryContext.Provider>
  );
};