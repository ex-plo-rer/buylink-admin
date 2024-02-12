// Copyright (c) 2024 Buylink 

function qs(tag) {
    return document.querySelector(tag);
}

function qsa(tag) {
    return document.querySelectorAll(tag);
}

function redirectTo(page) {
    window.location = page;
}

async function fetchData(url, data) {
    try {
        // const username = process.env.USERNAME; 
        // const password = process.env.PASSWORD;
        // const basicAuth = 'Basic ' + btoa(username + ':' + password);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': basicAuth 
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        const cookies = response.headers.get('Set-Cookie');

        console.log(document.cookie);
        return responseData;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}

document.body.addEventListener("click", (e) => {
    e = e.target;
    if (e.classList.contains("login-submit-btn")) {
        // check that email and password is not empty
        let email = qs(".login-email");
        let password = qs(".login-password");

        if (email.value && password.value) {
            // disable button
            e.disabled = true;

            const url = 'https://notification.buylink.app/admin.php';
            const postData = {
                email: email.value, password: password.value,
                endpoint: "login"
            };

            fetchData(url, postData)
                .then(data => {
                    // Handle response data
                    if (!data.error) {
                        // set it to localStorage
                        localStorage["__bl_admin__"] = JSON.stringify(data.data);

                        // sign the user in
                        redirectTo("index.html");
                    } else {
                        e.disabled = false;
                        alert(data.data.msg);
                    }
                })
                .catch(error => {
                    // Handle error
                });
        } else {
            // toast
        }
    }
}, false);

function loadContent(page) {
    fetch(page)
        .then(response => response.text())
        .then(content => {
            document.getElementById('main-content').innerHTML = content;

            // set admin name
            let admin = JSON.parse(localStorage["__bl_admin__"]);
            qs(".admin-name").innerText = admin.name;

            let path = page.split("/");

            // query the server
            switch (path[path.length - 1]) {
                case "dashboard.html": {
                    const url = 'https://notification.buylink.app/admin.php';
                    const postData = {
                        endpoint: "fetch_dashboard_data",
                        start_date: "",
                        stop_date: "",
                    };

                    // fetch dashboard data
                    fetchData(url, postData)
                        .then(data => {
                            // Handle response data
                            if (!data.error) {
                                for (const key in data.data) {
                                    qs(`.${key}`).innerText = data.data[key];
                                }
                            } else {
                                // if its a session error
                                if (data.session_error) {
                                    alert("Please login to continue");
                                    redirectTo("login.html");
                                }

                                alert(data.data.msg);
                            }
                        })
                        .catch(error => {
                            // Handle error
                        });
                    break;
                }
            }
        })
        .catch(error => console.error('Error fetching content:', error));
}

// Load default content on page load
if (document.URL.includes("index.html"))
    loadContent('pages/dashboard.html');


document.body.addEventListener("change", (e) => {
    e = e.target;

    if (e.classList.contains("end-date")) {
        // check that the start date has been chosen
        console.log(e.value);
        let startDate = qs(".start-date").value;
        if (startDate) {
            if (startDate > e.value) {
                alert("The start date must me less that the end date");
                e.value = "";
            } else {
                const url = `https://notification.buylink.app/admin.php`;
                const postData = {
                    start_date: startDate,
                    stop_date: e.value,
                    endpoint: "fetch_dashboard_data"
                };

                // send the request to the server 
                fetchData(url, postData)
                    .then(data => {
                        // Handle response data
                        if (!data.error) {
                            for (const key in data.data) {
                                qs(`.${key}`).innerText = data.data[key];
                            }
                        } else {
                            // if its a session error
                            if (data.session_error) {
                                alert("Please login to continue");
                                redirectTo("login.html");
                            }

                            alert(data.data.msg);
                        }
                    })
                    .catch(error => {
                        // Handle error
                    });
            }
        } else {
            alert("Please choose a start date");
        }
    } else if (e.classList.contains("start-date")) {
        // check that the start date has been chosen
        let endDate = qs(".end-date").value;
        if (endDate) {
            if (e.value > endDate) {
                alert("The start date must be less that the end date");
                e.value = "";
            } else {
                const url = `https://notification.buylink.app/admin.php`;
                const postData = {
                    start_date: e.value,
                    stop_date: endDate,
                    endpoint: "fetch_dashboard_data"
                };

                // send the request to the server 
                fetchData(url, postData)
                    .then(data => {
                        // Handle response data
                        if (!data.error) {
                            for (const key in data.data) {
                                qs(`.${key}`).innerText = data.data[key];
                            }
                        } else {
                            // if its a session error
                            if (data.session_error) {
                                alert("Please login to continue");
                                redirectTo("login.html");
                            }

                            alert(data.data.msg);
                        }
                    })
                    .catch(error => {
                        // Handle error
                    });
            }
        }
    }
}, false);