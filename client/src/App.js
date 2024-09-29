// client/src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [wallet, setWallet] = useState({ publicKey: '', secret: '' });
  const [balance, setBalance] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');

  // Function to create a new wallet
  const createWallet = async () => {
    try {
      const response = await axios.post('http://localhost:5000/create-wallet');
      setWallet(response.data);
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  // Function to check balance
  const checkBalance = async () => {
    try {
      const response = await axios.post('http://localhost:5000/check-balance', {
        publicKey: wallet.publicKey,
      });
      setBalance(response.data.balances);
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  // Function to send payment
  const sendPayment = async () => {
    const destination = prompt('Enter destination public key:');
    const amount = prompt('Enter amount to send:');
    try {
      const response = await axios.post('http://localhost:5000/send-payment', {
        sourceSecret: wallet.secret,
        destination,
        amount,
      });
      setPaymentStatus('Payment successful');
      console.log(response.data);
    } catch (error) {
      setPaymentStatus('Payment failed');
      console.error('Error sending payment:', error);
    }
  };

  return (
    <div className="App">
      <h1>Stellar Micro-Payments DAPP</h1>
      <button onClick={createWallet}>Create Wallet</button>
      {wallet.publicKey && (
        <div>
          <p>Public Key: {wallet.publicKey}</p>
          <p>Secret Key: {wallet.secret}</p>
          <button onClick={checkBalance}>Check Balance</button>
          <button onClick={sendPayment}>Send Payment</button>
          <h3>Balance:</h3>
          <ul>
            {balance.map((b, index) => (
              <li key={index}>
                {b.asset_type}: {b.balance}
              </li>
            ))}
          </ul>
          <h3>{paymentStatus}</h3>
        </div>
      )}
    </div>
  );
}

export default App;
