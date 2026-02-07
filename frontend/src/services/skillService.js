import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URI}`;

// Fetch all skills
export const fetchSkills = async () => {
  try {
    const response = await axios.get(`${API_URL}/getskills`);
    return response.data;
  } catch (error) {
    console.error("Error fetching skills:", error);
    throw error;
  }
};
