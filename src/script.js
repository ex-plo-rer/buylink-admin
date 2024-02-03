function loadContent(page){
  // fetch the content of the specified page
  fetch(page).then(res => res.text()).then(data => {
    // replace the content of the body with the content of the page
    document.getElementById("main-content").innerHTML = data;
  })
  .catch(err => console.error("An error occured",err))
}

// automatically load the main dashboard content
loadContent("./pages/dashboard.html")


