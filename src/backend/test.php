
<?php

// Return JSON responses
header("Content-Type: application/json; charset=utf-8");

// Connect to the SustansyaBox database
require_once __DIR__ . "/db.php";

try {
    // Check that MariaDB responds
    $statement = $pdo->query("SELECT DATABASE() AS db_name");

    $result = $statement->fetch();

    echo json_encode([
        "success" => true,
        "message" => "SustansyaBox database connected successfully!",
        "database" => $result["db_name"]
    ]);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database test failed."
    ]);
}
