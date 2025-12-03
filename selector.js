function setupGelSelection() {
  const gelOptions = document.querySelectorAll('.gel-option');
  gelOptions.forEach(option => {
    option.addEventListener('click', () => {
      const gelType = option.dataset.gel;
      // Navigate to ingredients page with gel type
      window.location.href = `ingredients.html?gel=${gelType}`;
    });
  });
  // Set default selection
  document.querySelector('.gel-option[data-gel="precision"]').classList.add('selected');
}

window.onload = () => {
  setupGelSelection();
};