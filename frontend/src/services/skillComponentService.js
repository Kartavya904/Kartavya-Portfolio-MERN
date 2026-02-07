import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URI}`;

// Fetch all skill components
export const fetchSkillsComponents = async () => {
  try {
    const response = await axios.get(`${API_URL}/getskillcomponents`);
    return response.data;
  } catch (error) {
    console.error("Error fetching skill components:", error);
    throw error;
  }
};
