
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

// Allow only the configured website origins.
if (
    $origin !== "" &&
    in_array($origin, $allowedOrigins, true)
) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
} else {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Origin not allowed.",
        "received_origin" => $origin
    ]);

    exit;
}

// Handle browser preflight requests.
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 600");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Only accept POST requests.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// ============================================
// JSON RESPONSE HELPER
// ============================================

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// ============================================
// GOOGLE CLIENT ID
// ============================================

$googleClientId =
    "243161573573-1i6njpk8gqimr23drb661dtft66v6vth.apps.googleusercontent.com";

// ============================================
// LOAD DEPENDENCIES
// ============================================

try {
    require_once __DIR__ . "/vendor/autoload.php";
    require_once __DIR__ . "/db.php";
} catch (Throwable $error) {
    error_log($error->getMessage());

    respond(500, [
        "success" => false,
        "message" => "Backend dependencies could not be loaded."
    ]);
}

// ============================================
// RECEIVE GOOGLE CREDENTIAL
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
        "message" => "Invalid JSON request."
    ]);
}

$credential = $data["credential"] ?? "";

if (
    !is_string($credential) ||
    trim($credential) === ""
) {
    respond(400, [
        "success" => false,
        "message" => "Google credential is required."
    ]);
}

// ============================================
// VERIFY GOOGLE ACCOUNT
// ============================================

try {
    $client = new Google\Client();

    $client->setClientId($googleClientId);

    $payload = $client->verifyIdToken($credential);

    if (
        !$payload ||
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
            "message" => "Invalid Google credential."
        ]);
    }

    $googleId = $payload["sub"] ?? "";

    $email = strtolower(
        trim($payload["email"] ?? "")
    );

    if (
        !is_string($googleId) ||
        $googleId === "" ||
        !filter_var($email, FILTER_VALIDATE_EMAIL)
    ) {
        respond(400, [
            "success" => false,
            "message" => "Invalid Google account information."
        ]);
    }

    // ========================================
    // FIND REGISTERED GOOGLE USER
    // ========================================

    $stmt = $pdo->prepare("
        SELECT
            user_id,
            full_name,
            email,
            age,
            height,
            weight
        FROM sustansyabox
        WHERE google_id = :google_id
        LIMIT 1
    ");

    $stmt->execute([
        ":google_id" => $googleId
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ========================================
    // NEW GOOGLE ACCOUNT
    // ========================================

    if (!$user) {
        $checkEmail = $pdo->prepare("
            SELECT user_id
            FROM sustansyabox
            WHERE email = :email
            LIMIT 1
        ");

        $checkEmail->execute([
            ":email" => $email
        ]);

        if ($checkEmail->fetch()) {
            respond(409, [
                "success" => false,
                "message" =>
                    "This email already has an account. Please sign in using your existing password."
            ]);
        }

        respond(409, [
            "success" => false,
            "profileRequired" => true,
            "message" =>
                "Please complete your profile to create a Google account."
        ]);
    }

    // ========================================
    // CREATE AUTHENTICATED SESSION
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

    $_SESSION["user_id"] = (int) $user["user_id"];

    // ========================================
    // SUCCESSFUL GOOGLE LOGIN
    // ========================================

    respond(200, [
        "success" => true,
        "message" => "Google login successful.",
        "user" => $user
    ]);

} catch (Throwable $error) {
    error_log($error->getMessage());

    respond(500, [
        "success" => false,
        "message" =>
            "Google authentication failed. Please try again."
    ]);
}
