<?php

// ============================================
// SustansyaBox — shared session helper
// Used by login.php, google_login.php, google_register.php and meals.php
// ============================================

function sustansya_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set("session.use_strict_mode", "1");

    session_set_cookie_params([
        "httponly" => true,
        "secure" =>
            !empty($_SERVER["HTTPS"]) &&
            $_SERVER["HTTPS"] !== "off",
        "samesite" => "Lax"
    ]);

    session_start();
}

// Call right after a successful login or registration.
function sustansya_login_session(int $userId): void
{
    sustansya_start_session();
    session_regenerate_id(true);
    $_SESSION["user_id"] = $userId;
}