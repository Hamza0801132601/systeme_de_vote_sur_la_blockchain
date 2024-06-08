const express = require('express');
const path = require('path');
const Web3 = require('web3');


var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window);

require('dotenv').config();

const VotingContract = require('./build/contracts/Voting.json'); // Adjust path to your contract's JSON file
const RPC_URL = "http://localhost:7545"
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function displayCandidates() {
  try {
    const contractAddress = VotingContract.networks['5777'].address; // Adjust network ID as needed
    const contract = new web3.eth.Contract(VotingContract.abi, contractAddress);

    const countCandidates = await contract.methods.getCountCandidates().call();

    $("#boxCandidate").empty();

    for (let i = 0; i <= countCandidates; i++) {
      try {
        const candidateData = await contract.methods.getCandidate(i).call();

        const id = candidateData[0];
        const name = candidateData[1];
        const party = candidateData[2];
        const voteCount = candidateData[3];

        const viewCandidate = `<tr><td><input class="form-check-input" type="radio" name="candidate" value="${id}" id="${id}">${name}</td><td>${party}</td><td>${voteCount}</td></tr>`;

        $("#boxCandidate").append(viewCandidate);
      } catch (error) {
        console.error(`Error retrieving candidate data for candidate at index ${i}: ${error.message}`);
      }
    }
  } catch (err) {
    console.error('Error interacting with smart contract:', err.message);
  }
}

