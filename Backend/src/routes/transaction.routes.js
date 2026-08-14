const { Router } = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const {transactionController} = require("../controllers/transaction.controller")

const transcationRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transcationRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * - POST /api/transcations/system/initial-funds
 * - create initial funds transcation from system user
 */
transcationRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)


module.exports = transcationRoutes;