<?php

require_once "db.php";

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-store");

$stmt = $pdo->query(
    "SELECT weight_grams, updated_at
     FROM food_weight
     WHERE id = 1"
);

$data = $stmt->fetch();

echo json_encode([
    "success" => (bool) $data,
    "weight" => $data
        ? (float) $data["weight_grams"]
        : null,
    "updated_at" => $data["updated_at"] ?? null
]);