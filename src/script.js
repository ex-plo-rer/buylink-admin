function loadContent(page) {
    fetch(page)
        .then(response => response.text())
        .then(content => {
            document.getElementById('main-content').innerHTML = content;
        })
        .catch(error => console.error('Error fetching content:', error));
}

// Load default content on page load
loadContent('pages/dashboard.html');
