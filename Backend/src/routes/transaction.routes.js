const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');

const transcationRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transcationRoutes.post("/", authMiddleware.authMiddleware);

module.exports = transcationRoutes;