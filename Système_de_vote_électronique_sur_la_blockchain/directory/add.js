const express = require('express');
const path = require('path');
const Web3 = require('web3');
const contract = require('@truffle/contract');

require('dotenv').config();

const mysqlPromise = require('mysql2/promise');
const pool = mysqlPromise.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'voter_db'
});

module.exports = pool;
const VotingContract = require('./build/contracts/Voting.json'); // Adjust path to your contract's JSON file
const RPC_URL = "http://localhost:7545"
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function addCandidatesAutomatically() {
  try {
    const [candidates] = await pool.query('SELECT candidate_name, candidate_id FROM candidates;');

    const contractAddress = VotingContract.networks['5777'].address; // Adjust network ID as needed
    const contract = new web3.eth.Contract(VotingContract.abi, contractAddress);

    for (const candidate of candidates) {
      try {
        const receipt = await contract.methods.addCandidate(candidate.candidate_name, candidate.candidate_id)
          .send({ from: account.address, gas: 6654755 });
        console.log(`Added candidate: ${candidate.candidate_name} - Transaction: ${receipt.transactionHash}`);
      } catch (error) {
        console.error(`Error adding candidate ${candidate.name}: ${error.message}`);
      }
    }
  }
  catch (err) {
    console.error('Error fetching candidates from database:', err.message);
  } 
  } 
addCandidatesAutomatically().catch(err => console.error(err));

