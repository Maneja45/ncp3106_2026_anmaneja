<?php

// POST { email, token, password }  → saves the new password

require_once __DIR__ . "/recovery_common.php";

$token = (string) ($data["token"] ?? "");
$password = $data["password"] ?? "";

if (!preg_match("/^[a-f0-9]{64}$/", $token)) {
    respond(400, ["success" => false, "message" => "This reset link is no longer valid. Please start again."]);
}

if (!is_string($password) || strlen($password) < 8 || strlen($password) > 200) {
    respond(422, ["success" => false, "message" => "Your password must contain at least 8 characters."]);
}

try {
    $find = $pdo->prepare("
        SELECT r.reset_id, r.user_id
        FROM password_resets r
        JOIN sustansyabox u ON u.user_id = r.user_id
        WHERE u.email = :email
          AND r.token_hash = :token_hash
          AND r.token_expires_at > NOW()
          AND r.used_at IS NULL
        LIMIT 1
    ");
    $find->execute([
        ":email" => $email,
        ":token_hash" => hash("sha256", $token)
    ]);
    $reset = $find->fetch();

    if (!$reset) {
        respond(400, ["success" => false, "message" => "This reset session has expired. Please request a new code."]);
    }

    $pdo->beginTransaction();

    $pdo->prepare("UPDATE sustansyabox SET password_hash = :hash WHERE user_id = :user_id")
        ->execute([
            ":hash" => password_hash($password, PASSWORD_DEFAULT),
            ":user_id" => $reset["user_id"]
        ]);

    // This code and any other open codes stop working
    $pdo->prepare("UPDATE password_resets SET used_at = NOW() WHERE user_id = :user_id AND used_at IS NULL")
        ->execute([":user_id" => $reset["user_id"]]);

    // A new password unlocks the account (clears failed sign-in tries)
    $pdo->prepare("DELETE FROM login_attempts WHERE email = :email")
        ->execute([":email" => $email]);

    $pdo->commit();

    respond(200, ["success" => true, "message" => "Your password has been changed. You can now sign in."]);

} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("reset_password: " . $error->getMessage());
    respond(500, ["success" => false, "message" => "Unable to change your password right now."]);
}