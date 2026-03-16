import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMyArtists,
  getArtist,
  createArtist,
  updateArtist,
  deleteArtist,
  getVideos,
  uploadVideo,
  deleteVideo,
  getCompositions,
  createComposition,
  getPublishingRoyalties,
  switchArtist
} from '../controllers/artistController';
import { getSpotifyAuthUrl, spotifyCallback, checkSpotifyStatus } from '../controllers/spotifyController';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyArtists);
router.get('/my-artists', getMyArtists);
router.get('/videos', getVideos);
router.post('/videos', uploadVideo);
router.delete('/videos/:id', deleteVideo);
router.get('/compositions', getCompositions);
router.post('/compositions', createComposition);
router.get('/publishing-royalties', getPublishingRoyalties);
router.post('/switch/:id', switchArtist);

// Spotify
router.get('/spotify/auth', getSpotifyAuthUrl);
router.get('/spotify/callback', spotifyCallback);
router.get('/spotify/status', checkSpotifyStatus);

router.get('/:id', getArtist);
router.post('/', createArtist);
router.put('/:id', updateArtist);
router.delete('/:id', authorize('admin'), deleteArtist);

export default router;
