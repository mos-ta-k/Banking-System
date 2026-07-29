const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");

/**
 * - validate request
 * - validate idempotencyKey
 * - check account status
 * - derive sender balance from ledger
 * - create transaction (PENDING)
 * - create DEBIT ledger entry
 * - create CREDIT ledger entry
 * - mark transaction COMPLETED
 * - commit mongoDB session
 * - send email notification
 */

async function createTransaction(req, res) {
  /** 1. validate request */

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "From account, to account, amount and idempotencykey is required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromAccount || !toAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  /** 2. validate idempotency key */

  const isTransactioAlreadyExists = await transactionModel.findOne({
    idemopotencyKey: idempotencyKey,
  });

  if (isTransactioAlreadyExists) {
    if (isTransactioAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already proceeded",
        transaction: isTransactioAlreadyExists,
      });
    }

    if (isTransactioAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Trasaction is still processing",
      });
    }

    if (isTransactioAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "previous transaction attempt failed, please try again",
      });
    }

    if (isTransactioAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction was reversed, please retry",
      });
    }
  }

  /** 3. check account status */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both account must be active",
    });
  }

  /** 4. sender balance from ledger */
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}`,
    });
  }

  /** 5. create transaction(PENDING) */
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = await transactionModel.create(
    {
      fromAccount,
      toAccount,
      amount,
      idemopotencyKey,
      status: "PENDING",
    },
    { session },
  );

  const debitLedgerEntry = await ledgerModel.create(
    {
      account: fromAccount,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT",
    },
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    {
      account: toAccount,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT",
    },
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });

  session.endSession();
}
