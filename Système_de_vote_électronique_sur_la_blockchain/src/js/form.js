document.getElementById('candidateForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const candidateName = document.getElementById('candidate-name').value;
  const candidateId = document.getElementById('candidate-id').value;
  const position = document.getElementById('position').value;

  $.ajax({
    type: 'POST',
    url: '/submit-candidacy',
    data: {
      candidateName: candidateName,
      candidateId: candidateId,
      position: position
    },
    success: function(response) {
      alert(response);
    },
    error: function(error) {
      alert('Error submitting form');
    }
  });
});
