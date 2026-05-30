const getKey = (username) => `userData_${username}`;

export const getUserData = (username) => {
  const data = localStorage.getItem(getKey(username));
  return data ? JSON.parse(data) : { favorites: [], reading: [] };
};

export const saveUserData = (username, data) => {
  localStorage.setItem(getKey(username), JSON.stringify(data));
};