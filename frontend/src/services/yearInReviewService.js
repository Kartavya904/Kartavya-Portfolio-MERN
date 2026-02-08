import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URI}`;

// Fetch all Year In Reviews
export const fetchYearInReviews = async () => {
  try {
    const response = await axios.get(`${API_URL}/getyearinreviews`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Year In Reviews:", error);
    throw error;
  }
};
