import axios from 'axios';

const BASE_URL = 'https://api.thecatapi.com/v1';

// 🔑 Replace with your actual API key
const API_KEY = 'live_y5cZWZSAqEx1ToArNqle45dMdQGBYoTsI7JJrYfvraNJj31aT3uG11Xncy6yPPiS';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    // ⚠️ Do NOT set Content-Type globally — multipart uploads need axios to
    // set it automatically so the correct boundary gets appended.
  },
});

// ─── Images ───────────────────────────────────────────────────────────────────

export const fetchMyImages = async (limit = 20) => {
  const response = await client.get('/images/', {
    params: { limit, order: 'DESC' },
  });
  return response.data;
};

export const uploadImage = async (fileUri, fileName, mimeType) => {
  // Android sometimes omits the file:// prefix — normalise it
  const uri =
    fileUri.startsWith('file://') || fileUri.startsWith('content://')
      ? fileUri
      : `file://${fileUri}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName || 'cat.jpg',
    type: mimeType || 'image/jpeg',
  });

  // Do NOT pass Content-Type manually — axios sets it automatically with the
  // correct multipart boundary when the body is FormData.
  const response = await client.post('/images/upload', formData);
  return response.data;
};

// ─── Favourites ───────────────────────────────────────────────────────────────

export const fetchFavourites = async () => {
  const response = await client.get('/favourites');
  return response.data;
};

export const addFavourite = async (imageId) => {
  const response = await client.post('/favourites', { image_id: imageId });
  return response.data;
};

export const removeFavourite = async (favouriteId) => {
  await client.delete(`/favourites/${favouriteId}`);
};

// ─── Votes ────────────────────────────────────────────────────────────────────

export const fetchVotes = async () => {
  const response = await client.get('/votes');
  return response.data;
};

export const castVote = async (imageId, value) => {
  // value: 1 = upvote, 0 = downvote
  const response = await client.post('/votes', { image_id: imageId, value });
  return response.data;
};

export const deleteImage = async (imageId) => {
  await client.delete(`/images/${imageId}`);
};