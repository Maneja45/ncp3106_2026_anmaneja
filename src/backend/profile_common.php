<?php

// Shared setup for update_profile.php, change_password.php and logout.php

header("Content-Type: application/json; charset=utf-8");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (preg_match("/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/", $origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
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

require_once __DIR__ . "/session.php";

sustansya_start_session();

$userId = (int) ($_SESSION["user_id"] ?? 0);

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = [];
}