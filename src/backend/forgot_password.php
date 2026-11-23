<?php

// POST { email }  → emails a 6-digit code (valid 10 minutes)
// Always answers the same way, so nobody can check which emails have accounts.

require_once __DIR__ . "/recovery_common.php";
require_once __DIR__ . "/mailer.php";

$generic = [
    "success" => true,
    "message" => "If an account uses this email, we sent a 6-digit code to it."
];

try {
    $find = $pdo->prepare("SELECT user_id, full_name FROM sustansyabox WHERE email = :email LIMIT 1");
    $find->execute([":email" => $email]);
    $user = $find->fetch();

    if (!$user) {
        respond(200, $generic);
    }

    $userId = (int) $user["user_id"];

    // Limits: 1 code per 60 seconds, 5 codes per hour
    $recent = $pdo->prepare("
        SELECT
          SUM(created_at > NOW() - INTERVAL 60 SECOND) AS last_minute,
          COUNT(*) AS last_hour
        FROM password_resets
        WHERE user_id = :user_id AND created_at > NOW() - INTERVAL 1 HOUR
    ");
    $recent->execute([":user_id" => $userId]);
    $counts = $recent->fetch();

    if ((int) $counts["last_minute"] > 0) {
        respond(429, [
            "success" => false,
            "message" => "Please wait a minute before asking for another code."
        ]);
    }

    if ((int) $counts["last_hour"] >= 5) {
        respond(429, [
            "success" => false,
            "message" => "Too many codes requested. Please try again in an hour."
        ]);
    }

    $code = str_pad((string) random_int(0, 999999), 6, "0", STR_PAD_LEFT);

    // Older codes stop working
    $pdo->prepare("
        UPDATE password_resets SET used_at = NOW()
        WHERE user_id = :user_id AND used_at IS NULL
    ")->execute([":user_id" => $userId]);

    $pdo->prepare("
        INSERT INTO password_resets (user_id, code_hash, code_expires_at)
        VALUES (:user_id, :code_hash, NOW() + INTERVAL 10 MINUTE)
    ")->execute([
        ":user_id" => $userId,
        ":code_hash" => password_hash($code, PASSWORD_DEFAULT)
    ]);

    $resetId = (int) $pdo->lastInsertId();

    try {
        sustansya_send_reset_code($email, (string) $user["full_name"], $code);
    } catch (Throwable $mailError) {
        // Email failed → remove this code so the user can try again right away
        $pdo->prepare("DELETE FROM password_resets WHERE reset_id = :id")
            ->execute([":id" => $resetId]);
        throw $mailError;
    }

    respond(200, $generic);

} catch (Throwable $error) {
    error_log("forgot_password: " . $error->getMessage());

    respond(500, [
        "success" => false,
        // TEMPORARY for testing: shows the real error.
        // When email works, change this line back to:
        // "message" => "We couldn't send the email right now. Please try again later."
         "message" => "We couldn't send the email right now. Please try again later."
    ]);
}