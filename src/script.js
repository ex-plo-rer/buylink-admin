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
    } else if (e.classList.contains("pagination-btn")) {
        // default
        let page = localStorage["usersPageCount"];

        // total user count
        const totalCount = localStorage["usersTotalCount"];

        switch (e.dataset.info) {
            case "first": {
                // page is always one
                page = 1
                localStorage["usersPageCount"] = page;
                break;
            }
            case "back": {
                // get current page
                page = localStorage["usersPageCount"];
                if (page > 1) {
                    // decrease it
                    page--;
                }
                break;
            }
            case "next": {
                // get current index
                let currentIndex = Math.ceil(totalCount / 50);

                // prevent an overflow
                if (page < currentIndex) {
                    // increase it
                    page++;
                }
                break;
            }
            case "last": {
                // get last index
                page = Math.ceil(totalCount / 50);
                break;
            }

            // this is for the pagination number buttons
            default: {
                page = parseInt(e.dataset.info);
            }
        }

        const url = 'https://notification.buylink.app/admin.php';
        const postData = {
            endpoint: "fetch_users",
            page,
        };

        // fetch dashboard data
        fetchData(url, postData)
            .then(data => {
                // Handle response data
                if (!data.error) {
                    // set global variable
                    usersData = data.data.users;

                    const totalCount = data.data.totalCount;
                    const dataLen = data.data.users.length;

                    let start = 50 * (page - 1);

                    // entries count
                    qs('.entries-count').innerText = `Showing ${start} - ${start + dataLen} of ${totalCount} entries`;

                    // call a pure function
                    displayUsers(usersData);
                }
            });

    } else if (e.classList.contains("order-by")) {
        displayUsers(orderByField(usersData, e.dataset.order));
    } else if (e.classList.contains("restrict")) {
        const url = 'https://notification.buylink.app/admin.php';
        const postData = {
            endpoint: "restrict",
            data: e.dataset.info,
            type: e.dataset.type
        };

        // fetch dashboard data
        fetchData(url, postData)
            .then(data => {
                // Handle response data
                if (!data.error) {
                    // operation successful
                    if (e.innerText == "Restrict") {
                        e.innerText = "Unrestrict";
                        e.className = "font-medium text-green-600 dark:text-blue-500 hover:underline restrict";
                    } else {
                        e.innerText = "Unrestrict";
                        e.className = "font-medium text-red-600 dark:text-blue-500 hover:underline restrict";
                    }
                } else {
                    // toast("could not complete operation")
                }
            });
    }
}, false);

// We'll be borrowing React style here
let usersData = [];

// a pure function
function displayUsers(users) {
    let index = 1;
    qs(".table-body").innerHTML = "";
    users.forEach(user => {
        qs(".table-body").innerHTML +=
            `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td class="px-6 py-4">
                    ${index}
                </td>
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    ${user.name}
                    </th>
                    <td class="px-6 py-4">
                    ${user.email}
                    </td>
                    <td class="px-6 py-4">
                    ${user.searchesCount}
                    </td>
                    <td class="px-6 py-4">
                    ${user.storesCount}
                    </td>
                    <td class="px-6 py-4">
                    ${user.lastSeen}
                    </td>
                <td class="px-6 py-4">
                    ${user.created}
                    </td>
                    <td class="px-6 py-4">
                        <a href="#" class="font-medium text-red-600 dark:text-blue-500 hover:underline restrict" data-type="user" data-info=${user.email}>Restrict</a>
                    </td>
                </tr>
            `;
        index++;
    });
}

function filterAndDisplayUsers(users, searchTerm) {
    // Convert the search term to lowercase for case-insensitive matching
    const search = searchTerm.toLowerCase();

    // Filter the array based on the search term, storesCount, and searchesCount
    const filteredUsers = users.filter(user => {
        // Check if the name or email contains the search term
        const nameMatch = user.name.toLowerCase().includes(search);
        const emailMatch = user.email.toLowerCase().includes(search);

        // Return true if any of the conditions match
        return nameMatch || emailMatch;
    });

    // Call the display function with the filtered users
    displayUsers(filteredUsers);
}

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
                case "users.html": {
                    // set pageCount in localStorage
                    localStorage["usersPageCount"] = 1;

                    const page = localStorage["usersPageCount"];
                    const url = 'https://notification.buylink.app/admin.php';
                    const postData = {
                        endpoint: "fetch_users",
                        page,
                    };

                    // fetch dashboard data
                    fetchData(url, postData)
                        .then(data => {
                            // Handle response data
                            if (!data.error) {
                                // set global variable
                                usersData = data.data.users;

                                const totalCount = data.data.totalCount;
                                const dataLen = data.data.users.length;

                                // set total to localStorage
                                localStorage["usersTotalCount"] = totalCount;

                                // entries count
                                qs('.entries-count').innerText = `Showing 1 - ${dataLen} of ${totalCount} entries`;

                                // call a pure function
                                displayUsers(usersData);

                                // set up pagination buttons
                                if (localStorage["usersPageCount"] == 1) {
                                    let pagesCount = Math.ceil(totalCount / dataLen);

                                    if (pagesCount > 1) {
                                        const btn_index = qs(".button-pages-index");
                                        btn_index.innerHTML = "";
                                        for (var i = 1; i < pagesCount + 1 && i < 10; i++) {
                                            btn_index.innerHTML +=
                                                `<button class="pagination-btn bg-white px-4 py-2 shadow-md rounded-sm font-semibold text-gray-500" data-info="${i}">${i}</button>`;
                                        }
                                    }
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


// Register keypdown handlers
document.body.addEventListener("keyup", (e) => {
    e = e.target;

    if (e.classList.contains("users-filter")) {
        if (e.value) {
            filterAndDisplayUsers(usersData, e.value);
        } else {
            console.log("empty");
            // display the normal full data
            displayUsers(usersData);
        }
    }
}, false);

// order array
function orderByField(arr, field) {
    return arr.sort((a, b) => {
        if (a[field] < b[field]) {
            return 1;
        }
        if (a[field] > b[field]) {
            return -1;
        }
        return 0;
    });
}
