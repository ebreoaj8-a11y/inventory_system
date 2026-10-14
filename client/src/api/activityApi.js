
import axios from 'axios';

// BACKEND API URL
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// AXIOS CONFIGURATION
const api = axios.create({
  baseURL: `${API_URL}/api/activity`,
  timeout: 15000
});

// GET RECENT ACTIVITIES
export async function getActivities() {
  const response = await api.get('/');
  return response.data;
}

// CONVERT MONGODB ACTIVITY TO FRONTEND FORMAT
export function fromMongoActivity(activity) {
  const date = activity.createdAt
    ? new Date(activity.createdAt)
    : null;

  const formattedTime =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : '';

  return {
    id: activity._id,
    kind: activity.kind,
    text: activity.text,
    time: formattedTime
  };
}
