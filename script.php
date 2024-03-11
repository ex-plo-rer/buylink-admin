<?php

class Admin
{
    private $servername = "localhost";
    private $username = "buylllnf_cake143";
    private $password = 'MSmE$gg3.B!!';
    private $dbname = "buylllnf_cake143";

    public function getUser($id)
    {
        // Code to retrieve user data
    }

    public function auth_admin($data)
    {
        // Code to authenticate a user
        $conn = $this->connect();

        $email = $this->sanitize($data['email']);
        $password = $data['password'];

        // Query the database for the user's record
        $stmt = $conn->prepare("SELECT id, `name`, `type`, `password_hash` FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->bind_result($id, $name, $role, $password_hash);
        $stmt->fetch();

        $response = [];

        // If a record is found, compare the password hash
        if ($id !== null) {
            if ($password_hash == $this->hash_input($password)) {

                // check that the user is a buylink admin
                if ($role == "bl_admin") {
                    // Passwords match, login successful
                    $response = (object) [
                        "error" => false,
                        "data" => [
                            "id" => $id,
                            "name" => $name,
                            "msg" => "login successful"
                        ]
                    ];

                    // set cookie
                    session_start();

                    // Set session variable(s)
                    $_SESSION['auth_session'] = $this->hash_input($password);

                    // Set session cookie
                    setcookie(session_name(), session_id(), [
                        'expires' => 0,
                        'path' => '/',
                        'domain' => '',
                        'secure' => false,
                        'httponly' => true,
                        'samesite' => 'Lax'
                    ]);
                } else {
                    $response = (object) [
                        "error" => true,
                        "data" => [
                            "msg" => "not an admin"
                        ]
                    ];
                }
            } else {
                $response = (object) [
                    "error" => true,
                    "data" => [
                        "msg" => "incorrect password"
                    ]
                ];
            }
        } else {
            $response = (object) [
                "error" => true,
                "data" => [
                    "msg" => "user not found"
                ]
            ];
        }

        // Close the statement and the connection
        $stmt->close();
        $conn->close();

        return $response;
    }

    // fetch relevant data to display on dashboard
    public function fetch_dashboard_data($data)
    {
        $start_date = isset($data["start_date"]) ? $data["start_date"] : null;
        $stop_date = isset($data["stop_date"]) ? $data["stop_date"] : null;

        // return $data;

        // Connect to your database (assuming you have a method to handle database connection)
        $conn = $this->connect();

        // Initialize query parameters
        $params = [];

        // Add date range conditions if start_date and stop_date are provided
        $dateRangeCondition = "";
        if ($start_date && $stop_date) {
            $dateRangeCondition = " AND created BETWEEN ? AND ?";
            $params[] = $start_date;
            $params[] = $stop_date;
        }

        // Query to get the count of active daily users
        $activeDailyUsersQuery = "SELECT COUNT(*) AS active_daily_users FROM users WHERE modified >= CURDATE()";
        $stmt = $conn->prepare($activeDailyUsersQuery);

        $stmt->execute();
        $stmt->bind_result($activeDailyUsers);
        $stmt->fetch();
        $stmt->close();

        // Query to get the count of posts created
        $postsCreatedQuery = "SELECT COUNT(*) AS posts_created FROM products WHERE 1 $dateRangeCondition";
        $stmt = $conn->prepare($postsCreatedQuery);
        // Bind parameters if date range conditions are applied
        if ($dateRangeCondition) {
            $stmt->bind_param("ss", ...$params);
        }
        $stmt->execute();
        $stmt->bind_result($postsCreated);
        $stmt->fetch();
        $stmt->close();

        // Query to get the count of stores created
        $storesCreatedQuery = "SELECT COUNT(*) AS stores_created FROM stores WHERE 1 $dateRangeCondition";
        $stmt = $conn->prepare($storesCreatedQuery);
        // Bind parameters if date range conditions are applied
        if ($dateRangeCondition) {
            $stmt->bind_param("ss", ...$params);
        }
        $stmt->execute();
        $stmt->bind_result($storesCreated);
        $stmt->fetch();
        $stmt->close();

        // Query to get the count of accounts created
        $accountsCreatedQuery = "SELECT COUNT(*) AS accounts_created FROM users WHERE 1 $dateRangeCondition";
        $stmt = $conn->prepare($accountsCreatedQuery);
        // Bind parameters if date range conditions are applied
        if ($dateRangeCondition) {
            $stmt->bind_param("ss", ...$params);
        }
        $stmt->execute();
        $stmt->bind_result($accountsCreated);
        $stmt->fetch();
        $stmt->close();

        // Close the database connection
        $conn->close();

        return (object) [
            "error" => false,
            "data" => [
                'active_daily_users' => $activeDailyUsers,
                'products_uploaded' => $postsCreated,
                'stores_created' => $storesCreated,
                'accounts_created' => $accountsCreated
            ]
        ];

    }

    // fetch the paginated list of users
    public function fetch_users($data)
    {
        // Connect to the database
        $conn = $this->connect();

        // Define variables
        $page = isset($data['page']) ? intval($data['page']) : 1; // Default to page 1 if not provided
        $limit = 50; // Number of users per page
        $start_id = ($page - 1) * $limit; // Calculate the starting id value

        // Prepare SQL query to fetch total count of users
        $countQuery = "SELECT COUNT(*) AS total FROM users";
        $countResult = $conn->query($countQuery);
        if (!$countResult) {
            return (object) ["error" => true, "message" => "Error fetching total count of users"];
        }
        $totalCount = $countResult->fetch_assoc()['total'];

        // Prepare SQL query to fetch paginated list of users
        $query = "SELECT `name`, email, stores_count, searches_count, modified, created FROM users ORDER BY id DESC LIMIT ?, ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return (object) ["error" => true, "message" => "Error preparing SQL query"];
        }
        $stmt->bind_param("ii", $start_id, $limit);
        // Execute the statement
        $stmt->execute();

        // Bind result variables
        $stmt->bind_result($name, $email, $storesCount, $searchCount, $lastSeen, $created);

        // Fetch users
        $users = [];
        while ($stmt->fetch()) {
            $users[] = [
                'name' => $name,
                'email' => $email,
                'storesCount' => $storesCount,
                'searchesCount' => $searchCount,
                'lastSeen' => $lastSeen,
                'created' => $created
            ];
        }

        // Return paginated list of users and total count
        return (object) [
            "error" => false,
            "data" => [
                'users' => $users,
                'totalCount' => $totalCount
            ]
        ];
    }

    // restrict / unrestrict an entity
    public function restrict($data)
    {
        // Connect to the database
        $conn = $this->connect();

        switch ($data["type"]) {
            case "user": {
                // select user where email = $data["data"];
                $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->bind_param("s", $data["data"]);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $attribute = $row["_restrict"];
                $newValue = ($attribute == "yes") ? "no" : "yes";
                $stmt = $conn->prepare("UPDATE users SET _restrict = ? WHERE email = ?");
                $stmt->bind_param("ss", $newValue, $data["data"]);
                $stmt->execute();
                break;
            }
            case "post": {
                // select post where id = $data["data"];
                $stmt = $conn->prepare("SELECT * FROM posts WHERE id = ?");
                $stmt->bind_param("i", $data["data"]);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $attribute = $row["_restrict"];
                $newValue = ($attribute == "yes") ? "no" : "yes";
                $stmt = $conn->prepare("UPDATE posts SET _restrict = ? WHERE id = ?");
                $stmt->bind_param("si", $newValue, $data["data"]);
                $stmt->execute();
                break;
            }
            case "store": {
                // select store where id = $data["data"];
                $stmt = $conn->prepare("SELECT * FROM stores WHERE id = ?");
                $stmt->bind_param("i", $data["data"]);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $attribute = $row["_restrict"];
                $newValue = ($attribute == "yes") ? "no" : "yes";
                $stmt = $conn->prepare("UPDATE stores SET _restrict = ? WHERE id = ?");
                $stmt->bind_param("si", $newValue, $data["data"]);
                $stmt->execute();
                break;
            }
        }

        // Close statement and connection
        $stmt->close();
        $conn->close();

        // Return paginated list of users and total count
        return (object) [
            "error" => false,
            "data" => []
        ];
    }

    private function hash_input($password)
    {
        // hash password
        $hash1 = "CVHDGGRE%^#@%^T(HYB*WV^TBNY(WWMX*OXGXN^*TNFXVYNfcfjyj$^76TFbEIBubiKJfcskvJKJtdtrfyvu5RT^WET&Y(WI8p0WENIF2d8_QR(*W#NR)W8m)(E&)Y";
        $hash2 = "VHdrfgvgsujuy%&^(78NHUgbyVT@Q!#3wT@ec58r&BTY(m8uy8)P()(K&Y(*YHnygihhFVJ%^&^&RB7KJFVugytfR*&%7v5Rvy679t*BN)98nun(YO|*^%NHRi6r7(";

        $hash = hash('sha256', $hash1 . sha1($password) . $hash2);
        return $hash;
    }

    private function sanitize($input)
    {
        // Sanitize the data to prevent XSS attacks
        return htmlspecialchars($input);
    }
    public function connect()
    {
        // Create connection
        $conn = new mysqli($this->servername, $this->username, $this->password, $this->dbname);

        // Check connection
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        return $conn;
    }

    // Function to sanitize file names (slugize)
    private function slugize($fileName)
    {
        // Implement your slugization logic here
        // Example: Replace spaces with hyphens
        $sanitizedFileName = str_replace(' ', '-', $fileName);

        return $sanitizedFileName;
    }

}

class API
{
    private $user;

    public function __construct()
    {
        $this->user = new Admin();
    }

    private function check_empty_array($data)
    {
        // Initialize an array to store any empty field names
        $emptyFields = [];

        foreach ($data as $fieldName => $fieldValue) {
            if (empty($fieldValue)) {
                $emptyFields[] = $fieldName;
            }
        }

        if (!empty($emptyFields)) {
            return (object) [
                "error" => true,
                "data" => [
                    "msg" => "Data fields not filled completely"
                ]
            ];
        }
    }

    public function handleRequest()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $response = "";
        $data = [];


        if ($_SERVER['REQUEST_METHOD'] === 'POST' && stristr($_SERVER['CONTENT_TYPE'], 'multipart/form-data')) {
            $data = $_POST;
        } else {
            $jsonData = file_get_contents('php://input');
            $data = json_decode($jsonData, true);
        }

        $endpoint = $data["endpoint"];

        // check for empty POST data
        $this->check_empty_array($data);

        switch ($endpoint) {
            case 'login':
                $response = $this->user->auth_admin($data);
                break;
            case 'fetch_dashboard_data':
                if (!isset($_SESSION['auth_session'])) {
                    $response = (object) [
                        "error" => true,
                        "session_error" => true,
                        "data" => [
                            "msg" => "Invalid session"
                        ]
                    ];
                }

                $response = $this->user->fetch_dashboard_data($data);
                break;
            case 'fetch_users':
                if (!isset($_SESSION['auth_session'])) {
                    $response = (object) [
                        "error" => true,
                        "session_error" => true,
                        "data" => [
                            "msg" => "Invalid session"
                        ]
                    ];
                }

                $response = $this->user->fetch_users($data);
                break;
            case 'restrict':
                if (!isset($_SESSION['auth_session'])) {
                    $response = (object) [
                        "error" => true,
                        "session_error" => true,
                        "data" => [
                            "msg" => "Invalid session"
                        ]
                    ];
                }

                $response = $this->user->restrict($data);
                break;
            default:
                $response = (object) [
                    "error" => true,
                    "data" => [
                        "msg" => "Invalid endpoint '" . $endpoint . "'"
                    ]
                ];
                break;
        }

        header('Content-Type: application/json');
        echo json_encode($response);
    }
}

$api = new API();
$api->handleRequest();

?>