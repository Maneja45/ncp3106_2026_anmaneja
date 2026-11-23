<?php

// Shared setup for forgot_password.php, verify_reset_code.php, reset_password.php

header("Content-Type: application/json; charset=utf-8");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (preg_match("/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/", $origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, ["success" => false, "message" => "Method not allowed."]);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    respond(400, ["success" => false, "message" => "Invalid request data."]);
}

$email = strtolower(trim((string) ($data["email"] ?? "")));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    respond(422, ["success" => false, "message" => "Please enter a valid email address."]);
}

require_once __DIR__ . "/db.php";