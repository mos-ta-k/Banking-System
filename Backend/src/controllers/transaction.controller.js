const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");

async function createTransaction(req, res) {
  const session = await mongoose.startSession();

  try {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // 1. validate request
    if (
      !fromAccount ||
      !toAccount ||
      amount === undefined ||
      amount === null ||
      !idempotencyKey
    ) {
      return res.status(400).json({
        message:
          "fromAccount, toAccount, amount and idempotencyKey are required",
      });
    }

    const transferAmount = Number(amount);
    if (Number.isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const [fromUserAccount, toUserAccount] = await Promise.all([
      accountModel.findById(fromAccount),
      accountModel.findById(toAccount),
    ]);

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        message: "Invalid fromAccount or toAccount",
      });
    }

    // 2. validate idempotency key
    const existingTransaction = await transactionModel.findOne({
      idempotencyKey,
    });

    if (existingTransaction) {
      switch (existingTransaction.status) {
        case "COMPLETED":
          return res.status(200).json({
            message: "Transaction already completed",
            transaction: existingTransaction,
          });
        case "PENDING":
          return res.status(200).json({
            message: "Transaction is still processing",
          });
        case "FAILED":
          return res.status(500).json({
            message: "Previous transaction attempt failed, please retry",
          });
        case "REVERSED":
          return res.status(500).json({
            message: "Transaction was reversed, please retry",
          });
        default:
          return res.status(500).json({
            message: "Transaction already exists with unknown status",
          });
      }
    }
    // 3. check account status
    if (
      fromUserAccount.status !== "ACTIVE" ||
      toUserAccount.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        message: "Both accounts must be active",
      });
    }

    /** 4. sender balance from ledger */
    const balance = await fromUserAccount.getBalance();
    if (balance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Current balance is ${balance}`,
      });
    }

    // 5. create transaction (pending)

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount: transferAmount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    );

    const createdTransaction = transaction[0];

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: transferAmount,
          transaction: createdTransaction._id,
          type: "DEBIT",
        },
        {
          account: toAccount,
          amount: transferAmount,
          transaction: createdTransaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    createdTransaction.status = "COMPLETED";
    await createdTransaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction: createdTransaction,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Transaction creation failed:", error);
    return res.status(500).json({
      message: "Unable to process transaction",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  createTransaction,
};
