import { useState, useEffect, useCallback } from 'react';
import {
  fetchMyImages,
  fetchFavourites,
  fetchVotes,
  addFavourite,
  removeFavourite,
  castVote,
  deleteImage,
} from '../services/catApi';

export const useGallery = () => {
  const [images, setImages] = useState([]);
  const [favourites, setFavourites] = useState({}); // { imageId: favouriteId }
  const [votes, setVotes] = useState({});           // { imageId: score }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // ─── Derived: merge images with favourites + scores ───────────────────────

  const enrichedImages = images.map((img) => ({
    ...img,
    isFavourited: img.id in favourites,
    favouriteId: favourites[img.id] ?? null,
    score: votes[img.id] ?? 0,
  }));

  // ─── Load all data in parallel ────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [imgsData, favsData, votesData] = await Promise.all([
        fetchMyImages(),
        fetchFavourites(),
        fetchVotes(),
      ]);

      setImages(imgsData);

      const favMap = {};
      favsData.forEach((fav) => {
        favMap[fav.image_id] = fav.id;
      });
      setFavourites(favMap);

      const voteMap = {};
      votesData.forEach((vote) => {
        const current = voteMap[vote.image_id] ?? 0;
        voteMap[vote.image_id] = current + (vote.value === 1 ? 1 : -1);
      });
      setVotes(voteMap);
    } catch (err) {
      console.log('Gallery load error:', err?.response?.status, err?.response?.data, err?.message);
      setError('Failed to load your gallery. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Toggle Favourite ─────────────────────────────────────────────────────

  const toggleFavourite = useCallback(async (imageId, currentFavouriteId) => {
    setActionLoading((prev) => ({ ...prev, [`fav_${imageId}`]: true }));
    try {
      if (currentFavouriteId) {
        await removeFavourite(currentFavouriteId);
        setFavourites((prev) => {
          const next = { ...prev };
          delete next[imageId];
          return next;
        });
      } else {
        const result = await addFavourite(imageId);
        setFavourites((prev) => ({ ...prev, [imageId]: result.id }));
      }
    } catch (err) {
      // Silently revert
    } finally {
      setActionLoading((prev) => ({ ...prev, [`fav_${imageId}`]: false }));
    }
  }, []);

  // ─── Vote (floor at 0) ────────────────────────────────────────────────────

  const vote = useCallback(async (imageId, value) => {
    const currentScore = votes[imageId] ?? 0;

    // Block downvote if score is already at 0
    if (value === 0 && currentScore <= 0) return;

    const delta = value === 1 ? 1 : -1;

    // Optimistic update
    setVotes((prev) => ({ ...prev, [imageId]: (prev[imageId] ?? 0) + delta }));
    setActionLoading((prev) => ({ ...prev, [`vote_${imageId}`]: true }));
    try {
      await castVote(imageId, value);
    } catch (err) {
      // Revert on failure
      setVotes((prev) => ({ ...prev, [imageId]: (prev[imageId] ?? 0) - delta }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`vote_${imageId}`]: false }));
    }
  }, [votes]); // votes in deps so the floor check always reads current value

  // ─── Delete ───────────────────────────────────────────────────────────────

  const removeImage = useCallback(async (imageId) => {
    setActionLoading((prev) => ({ ...prev, [`delete_${imageId}`]: true }));
    try {
      await deleteImage(imageId);
      // Remove from local state immediately — no need to reload the whole list
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      // Clean up associated votes/favourites from local state too
      setVotes((prev) => { const n = { ...prev }; delete n[imageId]; return n; });
      setFavourites((prev) => { const n = { ...prev }; delete n[imageId]; return n; });
    } catch (err) {
      // Could surface a toast here — for now silently fails
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${imageId}`]: false }));
    }
  }, []);

  return {
    images: enrichedImages,
    loading,
    error,
    actionLoading,
    reload: loadAll,
    toggleFavourite,
    vote,
    removeImage,
  };
};