const { Router } = require('express');
const router = Router();
const profileController = require('../controllers/profileController');

// Profile GET
router.get('/profile/:username', profileController.profile_get);

// Profile GET
// router.get('/edit/profile', profileController.profileedit_get);

module.exports = router;
