const { Router } = require('express');
const router = Router();
const profileController = require('../controllers/profileController');

// Profile GET
router.get('/profile/:username', profileController.profile_get);

// Profile Edit GET
router.get('/profile/:username/edit', profileController.profileedit_get);

// Profile Edit POST
router.post('/profile/:username/edit', profileController.profileedit_post);

module.exports = router;
