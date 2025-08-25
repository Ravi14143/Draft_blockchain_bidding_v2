require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: process.env.GANACHE_URL,
      chainId: 1337,
      accounts: [process.env.GANACHE_PRIVATE_KEY]
    }
  }
};
