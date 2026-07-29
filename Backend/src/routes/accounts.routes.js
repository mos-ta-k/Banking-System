const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * - POST /api/accounts
 * - create a new account
 * - protected route
 */
router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAccountController,
);

module.exports = router;
