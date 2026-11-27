<?php

// POST { currentPassword, newPassword }

require_once __DIR__ . "/profile_common.php";

if ($userId <= 0) {
    respond(401, ["success" => false, "message" => "Your session has ended. Please sign in again."]);
}

$current = $data["currentPassword"] ?? "";
$next = $data["newPassword"] ?? "";

if (!is_string($current) || $current === "") {
    respond(422, ["success" => false, "message" => "Enter your current password."]);
}

if (!is_string($next) || strlen($next) < 8 || strlen($next) > 200) {
    respond(422, ["success" => false, "message" => "Your new password must contain at least 8 characters."]);
}

try {
    require_once __DIR__ . "/db.php";

    $find = $pdo->prepare("SELECT password_hash FROM sustansyabox WHERE user_id = :user_id");
    $find->execute([":user_id" => $userId]);
    $user = $find->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($current, $user["password_hash"])) {
        respond(400, [
            "success" => false,
            "message" => "Your current password is incorrect. Signed up with Google? Use “Forgot password” on the sign-in page to set one."
        ]);
    }

    $pdo->prepare("UPDATE sustansyabox SET password_hash = :hash WHERE user_id = :user_id")
        ->execute([
            ":hash" => password_hash($next, PASSWORD_DEFAULT),
            ":user_id" => $userId,
        ]);

    respond(200, ["success" => true, "message" => "Password changed."]);

} catch (Throwable $error) {
    error_log("change_password: " . $error->getMessage());
    respond(500, ["success" => false, "message" => "Unable to change your password right now."]);
}