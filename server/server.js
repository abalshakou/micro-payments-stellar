require('dotenv').config();
const express = require('express');
const { Keypair, TransactionBuilder, Operation, Asset, Networks } = require('stellar-sdk');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Stellar SDK for Testnet connection
var StellarSdk = require('@stellar/stellar-sdk');
var server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Middleware to parse JSON
app.use(cors());
app.use(express.json());

// Endpoint to create a new Stellar wallet
app.post('/create-wallet', async (req, res) => {
    try {
        const pair = Keypair.random();

        // Use Friendbot to activate the account on Testnet
        const friendbotResponse = await axios.get(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
  
        res.json({
            publicKey: pair.publicKey(),
            secret: pair.secret(),
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating and activating wallet' });
    }
});

// Endpoint to check the balance of a Stellar account
app.post('/check-balance', async (req, res) => {
    const { publicKey } = req.body;
    if (!publicKey) {
        return res.status(400).json({ error: 'Public key is required' });
    }

    try {
        const account = await server.loadAccount(publicKey);
        const balances = account.balances.map((balance) => ({
            asset_type: balance.asset_type,
            balance: balance.balance,
        }));
        res.json({ balances });
    } catch (error) {
        res.status(400).json({ error: 'Failed to load account', details: error.message });
    }
});

// Endpoint to send a payment
app.post('/send-payment', async (req, res) => {
    const { sourceSecret, destination, amount } = req.body;
    const sourceKeypair = Keypair.fromSecret(sourceSecret);
    const BASE_FEE = '100'; // Stellar base fee in stroops

    try {
        // Load the source account
        const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

        // Create a transaction
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(
            Operation.payment({
                destination,
                asset: Asset.native(),
                amount: amount.toString(),
            })
        )
        .setTimeout(30)
        .build();

        // Sign the transaction
        transaction.sign(sourceKeypair);

        // Submit the transaction
        const result = await server.submitTransaction(transaction);
        res.json({ result });
    } catch (error) {
        res.status(400).json({ error: 'Transaction failed', details: error.response?.data || error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
