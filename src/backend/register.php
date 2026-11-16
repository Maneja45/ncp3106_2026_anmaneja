
<?php

header("Content-Type: application/json; charset=utf-8");

// Allow the local Vite development server.
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

require_once __DIR__ . "/db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$fullName = trim((string) ($data["fullName"] ?? ""));
$email = strtolower(trim((string) ($data["email"] ?? "")));
$password = $data["password"] ?? "";
$age = $data["age"] ?? null;
$height = $data["height"] ?? null;
$weight = $data["weight"] ?? null;

if (
    strlen($fullName) < 2 ||
    strlen($fullName) > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 150 ||
    !is_string($password) ||
    strlen($password) < 8 ||
    !filter_var($age, FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 13, "max_range" => 120]
    ]) ||
    !is_numeric($height) ||
    (float) $height < 80 ||
    (float) $height > 250 ||
    !is_numeric($weight) ||
    (float) $weight < 15 ||
    (float) $weight > 400
) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Please check your registration information."
    ]);
    exit;
}

try {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $statement = $pdo->prepare("
        INSERT INTO sustansyabox
            (full_name, email, password_hash, age, height, weight)
        VALUES
            (:full_name, :email, :password_hash, :age, :height, :weight)
    ");

    $statement->execute([
        ":full_name" => $fullName,
        ":email" => $email,
        ":password_hash" => $passwordHash,
        ":age" => (int) $age,
        ":height" => (float) $height,
        ":weight" => (float) $weight
    ]);

    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully!",
        "userId" => (int) $pdo->lastInsertId()
    ]);

} catch (PDOException $error) {
    if ($error->getCode() === "23000") {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "An account with this email already exists."
        ]);
    } else {
        error_log($error->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Unable to create account."
        ]);
    }
}
