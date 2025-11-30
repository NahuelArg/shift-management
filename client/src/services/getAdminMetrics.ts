import axios from "axios";

const API_URL = "http://localhost:3000";

export async function getAdminMetrics(params:{
    userId: string;
    businessId: string;
    from: string;
    to: string;
    groupBy: string;
}, token:string) {
  try {
    const response = await axios.get(`${API_URL}/admin/metrics`, { params, 
    headers: 
    { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch admin metrics");
  }
};
