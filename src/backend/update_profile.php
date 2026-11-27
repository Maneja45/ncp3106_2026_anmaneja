<?php

// POST { fullName, age, height, weight, sex, activityLevel }
// Saves the signed-in user's profile (email cannot be changed here).

require_once __DIR__ . "/profile_common.php";

if ($userId <= 0) {
    respond(401, ["success" => false, "message" => "Your session has ended. Please sign in again."]);
}

$fullName = trim((string) ($data["fullName"] ?? ""));
$age = $data["age"] ?? null;
$height = $data["height"] ?? null;
$weight = $data["weight"] ?? null;
$sex = $data["sex"] ?? null;
$activityLevel = $data["activityLevel"] ?? "sedentary";

if (
    strlen($fullName) < 2 ||
    strlen($fullName) > 100 ||
    !filter_var($age, FILTER_VALIDATE_INT, ["options" => ["min_range" => 13, "max_range" => 120]]) ||
    !is_numeric($height) || (float) $height < 80 || (float) $height > 250 ||
    !is_numeric($weight) || (float) $weight < 15 || (float) $weight > 400 ||
    !in_array($sex, ["male", "female"], true) ||
    !in_array($activityLevel, ["sedentary", "moderate", "vigorous"], true)
) {
    respond(422, ["success" => false, "message" => "Please check your profile information."]);
}

try {
    require_once __DIR__ . "/db.php";

    $pdo->prepare("
        UPDATE sustansyabox
        SET full_name = :full_name,
            age = :age,
            height = :height,
            weight = :weight,
            sex = :sex,
            activity_level = :activity_level
        WHERE user_id = :user_id
    ")->execute([
        ":full_name" => $fullName,
        ":age" => (int) $age,
        ":height" => (float) $height,
        ":weight" => (float) $weight,
        ":sex" => $sex,
        ":activity_level" => $activityLevel,
        ":user_id" => $userId,
    ]);

    $find = $pdo->prepare("
        SELECT user_id, full_name, email, age, height, weight, sex, activity_level
        FROM sustansyabox WHERE user_id = :user_id
    ");
    $find->execute([":user_id" => $userId]);
    $user = $find->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        respond(404, ["success" => false, "message" => "Account not found."]);
    }

    respond(200, ["success" => true, "message" => "Profile saved.", "user" => $user]);

} catch (Throwable $error) {
    error_log("update_profile: " . $error->getMessage());
    respond(500, ["success" => false, "message" => "Unable to save your profile right now."]);
}