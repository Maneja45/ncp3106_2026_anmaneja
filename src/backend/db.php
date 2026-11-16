
<?php

// SustansyaBox Database Configuration

$host = "127.0.0.1";
$dbname = "sustansyabox_db";
$username = "root";
$password = "";

try {
    // Connect to MariaDB using PDO
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

} catch (PDOException $error) {

    // Log the error without exposing database credentials
    error_log($error->getMessage());

    http_response_code(500);

    header("Content-Type: application/json");

    echo json_encode([
        "success" => false,
        "message" => "Unable to connect to SustansyaBox database."
    ]);

    exit;
}
