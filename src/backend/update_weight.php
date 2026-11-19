<?php

require_once "db.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit;
}

if (!isset($_POST["weight"]) ||
    !is_numeric($_POST["weight"])) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid weight"
    ]);

    exit;
}

$weight = floatval($_POST["weight"]);

$stmt = $pdo->prepare(
    "UPDATE food_weight
     SET weight_grams = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = 1"
);

$stmt->execute([$weight]);

echo json_encode([
    "success" => true,
    "weight" => $weight
]);