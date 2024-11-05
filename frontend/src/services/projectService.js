import axios from 'axios';

const API_URL = "http://localhost:5000/api";

// Fetch all projects
export const fetchProjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/getprojects`);
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Fetch a specific project by projectLink
export const fetchProjectByLink = async (projectLink) => {
  try {
    const response = await axios.get(`${API_URL}/getprojects/${projectLink}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project by link:", error);
    throw error;
  }
};