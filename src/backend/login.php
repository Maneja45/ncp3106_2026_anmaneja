<?php

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

// ============================================
// LOGIN RATE LIMIT
// 5 wrong passwords per email, or 20 per device (IP), within 15 minutes
// ============================================

const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_PER_EMAIL = 5;
const LOGIN_MAX_PER_IP = 20;

function minutes_word(int $minutes): string
{
    return $minutes === 1 ? "1 minute" : $minutes . " minutes";
}

// Failed tries in the window, and how old the oldest one is (seconds)
function recent_failures(PDO $pdo, string $column, string $value): array
{
    if (!in_array($column, ["email", "ip_address"], true)) {
        throw new InvalidArgumentException("Bad column");
    }

    $query = $pdo->prepare("
        SELECT COUNT(*) AS total,
               COALESCE(TIMESTAMPDIFF(SECOND, MIN(attempted_at), NOW()), 0) AS age_seconds
        FROM login_attempts
        WHERE {$column} = :value
          AND attempted_at > NOW() - INTERVAL " . LOGIN_WINDOW_MINUTES . " MINUTE
    ");
    $query->execute([":value" => $value]);
    $row = $query->fetch(PDO::FETCH_ASSOC);

    return ["total" => (int) $row["total"], "age_seconds" => (int) $row["age_seconds"]];
}

$ipAddress = substr((string) ($_SERVER["REMOTE_ADDR"] ?? "unknown"), 0, 45);

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
    // Old rows are useless after a day — keep the table small
    $pdo->exec("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 1 DAY");

    // Block if this email or this device has too many recent failed tries
    foreach ([
        ["email", $email, LOGIN_MAX_PER_EMAIL],
        ["ip_address", $ipAddress, LOGIN_MAX_PER_IP],
    ] as [$checkColumn, $checkValue, $limit]) {
        $row = recent_failures($pdo, $checkColumn, $checkValue);

        if ($row["total"] >= $limit) {
            $waitSeconds = max(1, LOGIN_WINDOW_MINUTES * 60 - $row["age_seconds"]);

            header("Retry-After: " . $waitSeconds);
            http_response_code(429);
            echo json_encode([
                "success" => false,
                "message" => "Too many failed sign-in attempts. Please try again in " .
                    minutes_word((int) ceil($waitSeconds / 60)) . " or reset your password."
            ]);
            exit;
        }
    }

    $statement = $pdo->prepare("
        SELECT user_id, full_name, email, password_hash, age, height, weight,
               sex, activity_level
        FROM sustansyabox
        WHERE email = :email
        LIMIT 1
    ");
    $statement->execute([":email" => $email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);

    if (
        !$user ||
        empty($user["password_hash"]) ||
        !password_verify($password, $user["password_hash"])
    ) {
        // Record the failed try
        $pdo->prepare("
            INSERT INTO login_attempts (email, ip_address)
            VALUES (:email, :ip)
        ")->execute([":email" => $email, ":ip" => $ipAddress]);

        // Tell the user how many tries are left for this email
        $left = LOGIN_MAX_PER_EMAIL - recent_failures($pdo, "email", $email)["total"];

        $message = "Incorrect email or password.";
        if ($left > 0 && $left <= 2) {
            $message .= " " . $left . ($left === 1 ? " attempt" : " attempts") . " left before a " .
                LOGIN_WINDOW_MINUTES . "-minute lock.";
        } elseif ($left <= 0) {
            $message = "Too many failed sign-in attempts. Please try again in " .
                minutes_word(LOGIN_WINDOW_MINUTES) . " or reset your password.";
        }

        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => $message
        ]);
        exit;
    }

    // Correct password → clear this email's failed tries
    $pdo->prepare("DELETE FROM login_attempts WHERE email = :email")
        ->execute([":email" => $email]);

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