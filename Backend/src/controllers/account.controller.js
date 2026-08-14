const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    account,
    message: "account created successfully!",
  });
}

async function getUserAccountsController(req, res) {
  const acconts = await accountModel.find({ user: req.user._id });

  res.status(200).json({
    accouts,
  });
}

async function getAccountBalanceController(req, res) {
  const { accountId } = req.params;

  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user_id, 
  });

  if(!account){
    return res.status(404).json({
        message: "Account not found"
    })
  }

  const balance = await account.getBalance();

  return res.status(200).json({
    accountId: account_id,
    balance: balance
  })
}

module.exports = {
  createAccountController,
  getUserAccountsController,
  getAccountBalanceController
};
