<?php

// POST { email, code }  → returns a one-time reset token (valid 15 minutes)

require_once __DIR__ . "/recovery_common.php";

$code = preg_replace("/\D/", "", (string) ($data["code"] ?? ""));
$invalid = ["success" => false, "message" => "The code is incorrect or has expired."];

if (strlen($code) !== 6) {
    respond(422, ["success" => false, "message" => "Please enter the 6-digit code."]);
}

try {
    $find = $pdo->prepare("
        SELECT r.reset_id, r.code_hash, r.attempts,
               r.code_expires_at > NOW() AS still_valid
        FROM password_resets r
        JOIN sustansyabox u ON u.user_id = r.user_id
        WHERE u.email = :email AND r.used_at IS NULL
        ORDER BY r.reset_id DESC
        LIMIT 1
    ");
    $find->execute([":email" => $email]);
    $reset = $find->fetch();

    if (!$reset || !(int) $reset["still_valid"]) {
        respond(400, $invalid);
    }

    if ((int) $reset["attempts"] >= 5) {
        respond(429, [
            "success" => false,
            "message" => "Too many wrong tries. Please request a new code."
        ]);
    }

    if (!password_verify($code, $reset["code_hash"])) {
        $pdo->prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE reset_id = :id")
            ->execute([":id" => $reset["reset_id"]]);

        $left = 4 - (int) $reset["attempts"];

        respond(400, [
            "success" => false,
            "message" => $left > 0
                ? "Incorrect code. $left " . ($left === 1 ? "try" : "tries") . " left."
                : "Too many wrong tries. Please request a new code."
        ]);
    }

    $token = bin2hex(random_bytes(32));

    $pdo->prepare("
        UPDATE password_resets
        SET token_hash = :token_hash, token_expires_at = NOW() + INTERVAL 15 MINUTE
        WHERE reset_id = :id
    ")->execute([
        ":token_hash" => hash("sha256", $token),
        ":id" => $reset["reset_id"]
    ]);

    respond(200, ["success" => true, "token" => $token]);

} catch (Throwable $error) {
    error_log("verify_reset_code: " . $error->getMessage());
    respond(500, ["success" => false, "message" => "Unable to check the code right now."]);
}