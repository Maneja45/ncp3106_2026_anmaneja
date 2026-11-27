<?php

// POST → ends the PHP session

require_once __DIR__ . "/profile_common.php";

$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), "", [
        "expires" => time() - 42000,
        "path" => $params["path"],
        "domain" => $params["domain"],
        "secure" => $params["secure"],
        "httponly" => $params["httponly"],
        "samesite" => "Lax",
    ]);
}

session_destroy();

respond(200, ["success" => true, "message" => "Signed out."]);