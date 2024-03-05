const express = require('express');
const router = express.Router();

const passwordController = require('../controllers/password');

router.post('/forgot-password', passwordController.forgotPassword);
router.get('/reset-password/:id', passwordController.resetPassword);
router.get('/update-password/:id', passwordController.updatePassword);


module.exports = router;