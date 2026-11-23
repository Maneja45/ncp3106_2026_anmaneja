<?php

// ============================================
// SustansyaBox — meals API (per logged-in user)
//
//   GET     meals.php            → list the user's meals
//   POST    meals.php            → add meals   { "meals": [ ... ] }
//   PATCH   meals.php            → edit a meal { "id", "food", "date", "compartment" }
//   DELETE  meals.php?id=123     → delete a meal
// ============================================

header("Content-Type: application/json; charset=utf-8");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (preg_match("/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/", $origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

require_once __DIR__ . "/session.php";
require_once __DIR__ . "/db.php";

// ---------- must be logged in ----------
sustansya_start_session();

$userId = (int) ($_SESSION["user_id"] ?? 0);

if ($userId <= 0) {
    respond(401, [
        "success" => false,
        "message" => "Your session has ended. Please sign in again."
    ]);
}

// ---------- helpers ----------
function meal_row(array $row): array
{
    return [
        "id" => (int) $row["meal_id"],
        "food" => $row["food"],
        "emoji" => $row["emoji"],
        "compartment" => (int) $row["compartment"],
        "weight" => (float) $row["weight"],
        "caloriesPer100g" => (float) $row["calories_per_100g"],
        "sugarPer100g" => (float) $row["sugar_per_100g"],
        "sodiumPer100g" => (float) $row["sodium_per_100g"],
        "eatenAt" => $row["eaten_at"]
    ];
}

function read_json(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        respond(400, [
            "success" => false,
            "message" => "Invalid request data."
        ]);
    }

    return $data;
}

function valid_number($value, float $min, float $max): bool
{
    return is_numeric($value) &&
        is_finite((float) $value) &&
        (float) $value >= $min &&
        (float) $value <= $max;
}

function valid_datetime($value): bool
{
    if (!is_string($value)) return false;
    $date = DateTime::createFromFormat("Y-m-d H:i:s", $value);
    return $date !== false && $date->format("Y-m-d H:i:s") === $value;
}

function valid_food($value): bool
{
    return is_string($value) &&
        strlen(trim($value)) >= 1 &&
        strlen(trim($value)) <= 100;
}

$method = $_SERVER["REQUEST_METHOD"];

try {

    // ================= LIST =================
    if ($method === "GET") {
        $statement = $pdo->prepare("
            SELECT *
            FROM meals
            WHERE user_id = :user_id
            ORDER BY eaten_at DESC, meal_id DESC
            LIMIT 1000
        ");
        $statement->execute([":user_id" => $userId]);

        respond(200, [
            "success" => true,
            "meals" => array_map("meal_row", $statement->fetchAll())
        ]);
    }

    // ================= ADD =================
    if ($method === "POST") {
        $data = read_json();
        $items = $data["meals"] ?? null;

        if (!is_array($items) || count($items) === 0 || count($items) > 3) {
            respond(422, [
                "success" => false,
                "message" => "Send between 1 and 3 meals."
            ]);
        }

        foreach ($items as $item) {
            if (
                !is_array($item) ||
                !valid_food($item["food"] ?? null) ||
                !is_string($item["emoji"] ?? null) ||
                strlen($item["emoji"]) > 16 ||
                !in_array((int) ($item["compartment"] ?? 0), [1, 2, 3], true) ||
                !valid_number($item["weight"] ?? null, 0.1, 5000) ||
                !valid_number($item["caloriesPer100g"] ?? null, 0, 1000) ||
                !valid_number($item["sugarPer100g"] ?? null, 0, 100) ||
                !valid_number($item["sodiumPer100g"] ?? null, 0, 50000) ||
                !valid_datetime($item["eatenAt"] ?? null)
            ) {
                respond(422, [
                    "success" => false,
                    "message" => "Some meal information is invalid."
                ]);
            }
        }

        $insert = $pdo->prepare("
            INSERT INTO meals
                (user_id, food, emoji, compartment, weight,
                 calories_per_100g, sugar_per_100g, sodium_per_100g, eaten_at)
            VALUES
                (:user_id, :food, :emoji, :compartment, :weight,
                 :calories, :sugar, :sodium, :eaten_at)
        ");

        $select = $pdo->prepare("SELECT * FROM meals WHERE meal_id = :id");

        $saved = [];

        $pdo->beginTransaction();

        foreach ($items as $item) {
            $insert->execute([
                ":user_id" => $userId,
                ":food" => trim($item["food"]),
                ":emoji" => $item["emoji"],
                ":compartment" => (int) $item["compartment"],
                ":weight" => (float) $item["weight"],
                ":calories" => (float) $item["caloriesPer100g"],
                ":sugar" => (float) $item["sugarPer100g"],
                ":sodium" => (float) $item["sodiumPer100g"],
                ":eaten_at" => $item["eatenAt"]
            ]);

            $select->execute([":id" => (int) $pdo->lastInsertId()]);
            $saved[] = meal_row($select->fetch());
        }

        $pdo->commit();

        respond(201, [
            "success" => true,
            "message" => "Meal saved.",
            "meals" => $saved
        ]);
    }

    // ================= EDIT =================
    if ($method === "PATCH") {
        $data = read_json();
        $id = (int) ($data["id"] ?? 0);
        $date = $data["date"] ?? null;

        if (
            $id <= 0 ||
            !valid_food($data["food"] ?? null) ||
            !in_array((int) ($data["compartment"] ?? 0), [1, 2, 3], true) ||
            !is_string($date) ||
            DateTime::createFromFormat("Y-m-d", $date) === false
        ) {
            respond(422, [
                "success" => false,
                "message" => "Please check the meal details."
            ]);
        }

        // Keep the original time of day, change only the date.
        $statement = $pdo->prepare("
            UPDATE meals
            SET food = :food,
                compartment = :compartment,
                eaten_at = CONCAT(:date, ' ', TIME(eaten_at))
            WHERE meal_id = :id AND user_id = :user_id
        ");
        $statement->execute([
            ":food" => trim($data["food"]),
            ":compartment" => (int) $data["compartment"],
            ":date" => $date,
            ":id" => $id,
            ":user_id" => $userId
        ]);

        $select = $pdo->prepare("
            SELECT * FROM meals WHERE meal_id = :id AND user_id = :user_id
        ");
        $select->execute([":id" => $id, ":user_id" => $userId]);
        $row = $select->fetch();

        if (!$row) {
            respond(404, [
                "success" => false,
                "message" => "Meal not found."
            ]);
        }

        respond(200, [
            "success" => true,
            "message" => "Meal updated.",
            "meal" => meal_row($row)
        ]);
    }

    // ================= DELETE =================
    if ($method === "DELETE") {
        $id = (int) ($_GET["id"] ?? 0);

        $statement = $pdo->prepare("
            DELETE FROM meals WHERE meal_id = :id AND user_id = :user_id
        ");
        $statement->execute([":id" => $id, ":user_id" => $userId]);

        if ($statement->rowCount() === 0) {
            respond(404, [
                "success" => false,
                "message" => "Meal not found."
            ]);
        }

        respond(200, [
            "success" => true,
            "message" => "Meal deleted."
        ]);
    }

    respond(405, [
        "success" => false,
        "message" => "Method not allowed."
    ]);

} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($error->getMessage());

    respond(500, [
        "success" => false,
        "message" => "Unable to process meals right now."
    ]);
}