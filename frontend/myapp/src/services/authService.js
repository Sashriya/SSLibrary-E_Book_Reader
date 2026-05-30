import { saveData, getData } from "../utils/localStorage";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

/* USER REGISTER */
export const registerUser = (username, password) => {

  const users = getData("users") || [];

  const exists = users.find(
    (u) => u.username === username
  );

  if (exists) {
    return { success: false, message: "User already exists" };
  }

  const newUser = { username, password };

  users.push(newUser);

  saveData("users", users);

  return { success: true };
};

/* USER LOGIN */
export const loginUser = (username, password) => {

  const users = getData("users") || [];

  const user = users.find(
    (u) =>
      u.username === username &&
      u.password === password
  );

  if (!user) {
    return { success: false, message: "Invalid credentials" };
  }

  saveData("currentUser", user);

  return { success: true, user };
};

/* ADMIN LOGIN */
export const loginAdmin = (username, password) => {

  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    saveData("admin", true);
    return { success: true };
  }

  return { success: false };
};

/* LOGOUT */
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};