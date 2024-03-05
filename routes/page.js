const router = require('express').Router();

const pageController = require('../controllers/pages');

router.get('/ezchat', pageController.sendChatPage);
router.get('/',pageController.sendMainPage);


module.exports = router;