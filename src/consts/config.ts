import dotenv from "dotenv";

dotenv.config();

export const config = {
  NODE_ENV: process.env['NODE_ENV'] || "development",
  PORT: parseInt(process.env['PORT'] || "3001", 10),

  HOSTAWAY: {
    API_KEY: process.env['HOSTAWAY_API_KEY'] || "f94377ebbbb479490bb3ec364649168dc443dda2e4830facaf5de2e74ccc9152",
    ACCOUNT_ID: process.env['HOSTAWAY_ACCOUNT_ID'] || "61148",
    BASE_URL: process.env['HOSTAWAY_BASE_URL'] || "https://api.hostaway.com/v1",
  },

  GOOGLE: {
    PLACES_API_KEY: process.env['GOOGLE_PLACES_API_KEY'] || "",
  },

  CLIENT_URL: process.env['CLIENT_URL'] || "http://localhost:5173",
  API_BASE_URL: process.env['API_BASE_URL'] || "http://localhost:3001",
};

export default config;
