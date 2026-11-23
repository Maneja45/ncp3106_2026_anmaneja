<?php

header("Content-Type: application/json; charset=utf-8");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (preg_match("/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/", $origin)) {
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once __DIR__ . "/db.php";
require_once __DIR__ . "/session.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$email = strtolower(trim((string) ($data["email"] ?? "")));
$password = $data["password"] ?? "";

if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !is_string($password) ||
    $password === ""
) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email and password."
    ]);
    exit;
}

try {
    $statement = $pdo->prepare("
        SELECT user_id, full_name, email, password_hash, age, height, weight,
               sex, activity_level
        FROM sustansyabox
        WHERE email = :email
        LIMIT 1
    ");
    $statement->execute([":email" => $email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Incorrect email or password."
        ]);
        exit;
    }

    unset($user["password_hash"]);

    // Remember who is signed in (used by meals.php)
    sustansya_login_session((int) $user["user_id"]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "user" => $user
    ]);
} catch (PDOException $error) {
    error_log($error->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to sign in."
    ]);
}