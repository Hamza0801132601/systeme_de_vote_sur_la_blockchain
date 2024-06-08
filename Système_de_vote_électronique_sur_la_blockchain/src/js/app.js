const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts);

window.App = {
  eventStart: function() {
    window.ethereum.request({ method: 'eth_requestAccounts' });
    VotingContract.setProvider(window.ethereum);
    VotingContract.defaults({ from: window.ethereum.selectedAddress, gas: 6654755 });

    // Load account data
    App.account = window.ethereum.selectedAddress;
    $("#accountAddress").html("Compte: " + window.ethereum.selectedAddress);
    VotingContract.deployed().then(function(instance) {
      instance.getCountCandidates().then(function(countCandidates) {

        $(document).ready(function() {
          $('#addCandidate').click(function() {
            var nameCandidate = $('#name').val();
            var partyCandidate = $('#party').val();
            instance.addCandidate(nameCandidate, partyCandidate).then(function(result) {});
          });

          $('#addDate').click(function() {
            var startDate = document.getElementById("startDate").value;
            var startTime = document.getElementById("startTime").value;
            var endDate = document.getElementById("endDate").value;
            var endTime = document.getElementById("endTime").value;

            var startDateTime = new Date(`${startDate}T${startTime}`).getTime() / 1000;
            var endDateTime = new Date(`${endDate}T${endTime}`).getTime() / 1000;

            instance.setDates(startDateTime, endDateTime).then(function(rslt) {
              console.log("Dates set");
            });
          });

          instance.getDates().then(function(result) {
            var startDate = new Date(result[0] * 1000);
            var endDate = new Date(result[1] * 1000);

            function formatDateFR(date) {
              let day = String(date.getDate()).padStart(2, '0');
              let month = String(date.getMonth() + 1).padStart(2, '0');
              let year = date.getFullYear();
              let hours = String(date.getHours()).padStart(2, '0');
              let minutes = String(date.getMinutes()).padStart(2, '0');
              let seconds = String(date.getSeconds()).padStart(2, '0');
              return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            }

            $("#dates").text(formatDateFR(startDate) + " - " + formatDateFR(endDate));
          }).catch(function(err) {
            console.error("ERROR! " + err.message);
          });
        });

        for (var i = 0; i < countCandidates; i++) {
          instance.getCandidate(i + 1).then(function(data) {
            var id = data[0];
            var name = data[1];
            var party = data[2];
            var voteCount = data[3];
            var viewCandidates = `<tr><td> <input class="form-check-input" type="checkbox" name="candidate" value="${id}" id=${id}>` + name + "</td><td>" + party + "</td><td>" + voteCount + "</td></tr>";
            $("#boxCandidate").append(viewCandidates);
          });
        }

        window.countCandidates = countCandidates;
      });

      instance.checkVote().then(function(voted) {
        console.log(voted);
        if (!voted) {
          $("#voteButton").attr("disabled", false);
        }
      });

    }).catch(function(err) {
      console.error("ERROR! " + err.message);
    });
  },

  vote: function() {
    var candidateIDs = [];
    $("input[name='candidate']:checked").each(function() {
      candidateIDs.push(parseInt($(this).val()));
    });
    if (candidateIDs.length === 0) {
      $("#msg").html("<p>Please vote for at least one candidate.</p>");
      return;
    }
    VotingContract.deployed().then(function(instance) {
      instance.voteForCandidates(candidateIDs).then(function(result) {
        $("#voteButton").attr("disabled", true);
        $("#msg").html("<p>Voted</p>");
        window.location.reload(1);
      });
    }).catch(function(err) {
      console.error("ERROR! " + err.message);
      $("#msg").html("<p>Error: " + err.message + "</p>");
    });
  }
};

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask");
    window.eth = new Web3(window.ethereum);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
  window.App.eventStart();
});
