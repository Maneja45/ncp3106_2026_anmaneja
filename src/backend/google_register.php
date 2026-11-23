<?php

header("Content-Type: application/json; charset=UTF-8");

// ============================================
// CORS CONFIGURATION
// ============================================

$allowedOrigins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
$origin = rtrim(trim($origin), "/");

header("Vary: Origin");

if ($origin !== "" && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
} else {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Origin not allowed.",
        "received_origin" => $origin
    ]);

    exit;
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 600");

// Handle browser preflight requests.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Only allow POST requests.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// ============================================
// RESPONSE HELPER
// ============================================

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// ============================================
// GOOGLE CLIENT CONFIGURATION
// ============================================

$googleClientId = "243161573573-1i6njpk8gqimr23drb661dtft66v6vth.apps.googleusercontent.com";

// ============================================
// LOAD GOOGLE LIBRARY
// ============================================

require_once __DIR__ . "/vendor/autoload.php";

// ============================================
// VALIDATE REQUEST
// ============================================

$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

if (stripos($contentType, "application/json") !== 0) {
    respond(415, [
        "success" => false,
        "message" => "JSON request required."
    ]);
}

$data = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($data)) {
    respond(400, [
        "success" => false,
        "message" => "Invalid request data."
    ]);
}

$credential = $data["credential"] ?? null;
$age = $data["age"] ?? null;
$height = $data["height"] ?? null;
$weight = $data["weight"] ?? null;
$sex = $data["sex"] ?? null;
$activityLevel = $data["activityLevel"] ?? "sedentary";

if (
    !is_string($credential) ||
    $credential === "" ||
    strlen($credential) > 16384
) {
    respond(400, [
        "success" => false,
        "message" => "A valid Google credential is required."
    ]);
}

// ============================================
// VALIDATE PROFILE INFORMATION
// ============================================

$validAge = filter_var(
    $age,
    FILTER_VALIDATE_INT,
    [
        "options" => [
            "min_range" => 13,
            "max_range" => 120
        ]
    ]
);

if (
    $validAge === false ||
    !is_numeric($height) ||
    !is_numeric($weight)
) {
    respond(422, [
        "success" => false,
        "message" => "Please complete your profile information."
    ]);
}

$height = (float) $height;
$weight = (float) $weight;

if (
    !is_finite($height) ||
    !is_finite($weight) ||
    $height < 80 ||
    $height > 250 ||
    $weight < 15 ||
    $weight > 400
) {
    respond(422, [
        "success" => false,
        "message" => "Please check your profile information."
    ]);
}

// Needed to estimate calories (FAO/WHO/UNU energy requirements).
if (
    !in_array($sex, ["male", "female"], true) ||
    !in_array($activityLevel, ["sedentary", "moderate", "vigorous"], true)
) {
    respond(422, [
        "success" => false,
        "message" => "Please choose your sex and activity level."
    ]);
}

// ============================================
// VERIFY GOOGLE ID TOKEN
// ============================================

try {
    $client = new Google\Client();

    $client->setClientId($googleClientId);

    $payload = $client->verifyIdToken($credential);

    if (
        !is_array($payload) ||
        ($payload["aud"] ?? "") !== $googleClientId ||
        !in_array(
            $payload["iss"] ?? "",
            [
                "accounts.google.com",
                "https://accounts.google.com"
            ],
            true
        ) ||
        ($payload["exp"] ?? 0) <= time() ||
        ($payload["email_verified"] ?? false) !== true
    ) {
        respond(401, [
            "success" => false,
            "message" => "Google account verification failed."
        ]);
    }

    $googleId = $payload["sub"] ?? null;
    $email = $payload["email"] ?? null;
    $fullName = $payload["name"] ?? null;

    if (
        !is_string($googleId) ||
        $googleId === "" ||
        strlen($googleId) > 255 ||
        !is_string($email) ||
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        strlen($email) > 150 ||
        !is_string($fullName)
    ) {
        respond(401, [
            "success" => false,
            "message" => "Google account information is incomplete."
        ]);
    }

    $email = strtolower(trim($email));
    $fullName = trim($fullName);

    if (
        strlen($fullName) < 2 ||
        strlen($fullName) > 100
    ) {
        respond(422, [
            "success" => false,
            "message" => "A valid full name is required."
        ]);
    }

    // ========================================
    // CONNECT TO DATABASE
    // ========================================

    require_once __DIR__ . "/db.php";

    // ========================================
    // PREVENT DUPLICATE ACCOUNTS
    // ========================================

    $check = $pdo->prepare("
        SELECT user_id, google_id
        FROM sustansyabox
        WHERE email = :email
           OR google_id = :google_id
        LIMIT 1
    ");

    $check->execute([
        ":email" => $email,
        ":google_id" => $googleId
    ]);

    if ($check->fetch(PDO::FETCH_ASSOC)) {
        respond(409, [
            "success" => false,
            "message" =>
                "This account already exists. Please sign in instead."
        ]);
    }

    // ========================================
    // CREATE GOOGLE ACCOUNT
    // ========================================

    // Google users do not choose a password.
    // Store a hash of a random value instead.

    $unusablePasswordHash = password_hash(
        bin2hex(random_bytes(32)),
        PASSWORD_DEFAULT
    );

    $statement = $pdo->prepare("
        INSERT INTO sustansyabox
        (
            full_name,
            email,
            password_hash,
            age,
            height,
            weight,
            sex,
            activity_level,
            google_id
        )
        VALUES
        (
            :full_name,
            :email,
            :password_hash,
            :age,
            :height,
            :weight,
            :sex,
            :activity_level,
            :google_id
        )
    ");

    $statement->execute([
        ":full_name" => $fullName,
        ":email" => $email,
        ":password_hash" => $unusablePasswordHash,
        ":age" => (int) $validAge,
        ":height" => $height,
        ":weight" => $weight,
        ":sex" => $sex,
        ":activity_level" => $activityLevel,
        ":google_id" => $googleId
    ]);

    $userId = (int) $pdo->lastInsertId();

    // ========================================
    // CREATE LOGIN SESSION
    // ========================================

    ini_set("session.use_strict_mode", "1");

    session_set_cookie_params([
        "httponly" => true,
        "secure" =>
            !empty($_SERVER["HTTPS"]) &&
            $_SERVER["HTTPS"] !== "off",
        "samesite" => "Lax"
    ]);

    session_start();
    session_regenerate_id(true);

    $_SESSION["user_id"] = $userId;

    // ========================================
    // RETURN CREATED USER
    // ========================================

    respond(201, [
        "success" => true,
        "message" => "Google account created successfully.",
        "user" => [
            "user_id" => $userId,
            "full_name" => $fullName,
            "email" => $email,
            "age" => (int) $validAge,
            "height" => $height,
            "weight" => $weight,
            "sex" => $sex,
            "activity_level" => $activityLevel
        ]
    ]);

} catch (PDOException $error) {

    error_log($error->getMessage());

    if ($error->getCode() === "23000") {
        respond(409, [
            "success" => false,
            "message" => "This account already exists."
        ]);
    }

    respond(500, [
        "success" => false,
        "message" => "Unable to create Google account."
    ]);

} catch (Throwable $error) {

    error_log($error->getMessage());

    respond(500, [
        "success" => false,
        "message" =>
            "Google registration failed. Please try again."
    ]);
}