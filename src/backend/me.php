<?php

// GET → returns the signed-in user (used when the page is refreshed)

header("Content-Type: application/json; charset=utf-8");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (preg_match("/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/", $origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/session.php";

sustansya_start_session();

$userId = (int) ($_SESSION["user_id"] ?? 0);

if ($userId <= 0) {
    // Not signed in — a normal answer, not an error
    echo json_encode(["success" => true, "user" => null]);
    exit;
}

try {
    require_once __DIR__ . "/db.php";

    $find = $pdo->prepare("
        SELECT user_id, full_name, email, age, height, weight, sex, activity_level
        FROM sustansyabox
        WHERE user_id = :user_id
        LIMIT 1
    ");
    $find->execute([":user_id" => $userId]);
    $row = $find->fetch(PDO::FETCH_ASSOC);

    $user = $row ? [
        "user_id"        => (int) $row["user_id"],
        "full_name"      => (string) ($row["full_name"] ?? ""),
        "email"          => (string) $row["email"],
        "age"            => $row["age"] !== null ? (int) $row["age"] : null,
        "height"         => $row["height"] !== null ? (float) $row["height"] : null,
        "weight"         => $row["weight"] !== null ? (float) $row["weight"] : null,
        "sex"            => $row["sex"] ?? null,
        "activity_level" => $row["activity_level"] ?? "sedentary",
    ] : null;

    // Never send an empty answer: replace any broken characters (e.g. ñ saved as latin1)
    $json = json_encode(
        ["success" => true, "user" => $user],
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    if ($json === false) {
        throw new RuntimeException("json_encode failed: " . json_last_error_msg());
    }

    echo $json;

} catch (Throwable $error) {
    error_log("me: " . $error->getMessage());
    http_response_code(500);
    echo json_encode(
        ["success" => false, "message" => "Unable to check your session.", "detail" => $error->getMessage()],
        JSON_INVALID_UTF8_SUBSTITUTE
    );
}