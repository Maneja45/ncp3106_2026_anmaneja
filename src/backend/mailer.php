<?php

// ============================================
// SustansyaBox — sends emails through Gmail (PHPMailer)
// Needs:  composer require phpmailer/phpmailer
//         mail_config.php  (copy of mail_config.example.php)
// ============================================

use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . "/vendor/autoload.php";

function sustansya_send_reset_code(string $toEmail, string $toName, string $code): void
{
    $configFile = __DIR__ . "/mail_config.php";

    if (!is_file($configFile)) {
        throw new RuntimeException("mail_config.php is missing.");
    }

    $config = require $configFile;

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config["host"];
    $mail->Port = (int) $config["port"];
    $mail->SMTPAuth = true;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Username = $config["username"];
    $mail->Password = $config["password"];
    $mail->CharSet = "UTF-8";

    $mail->setFrom($config["from_email"], $config["from_name"]);
    $mail->addAddress($toEmail, $toName);

    $safeName = htmlspecialchars($toName !== "" ? $toName : "there", ENT_QUOTES, "UTF-8");
    $spaced = implode(" ", str_split($code));

    $mail->isHTML(true);
    $mail->Subject = "Your SustansyaBox password reset code: $code";
    $mail->Body = "
      <div style=\"font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f3d2c\">
        <h2 style=\"font-family:Georgia,serif;margin:0 0 12px\">SustansyaBox</h2>
        <p>Hi $safeName,</p>
        <p>Use this code to reset your SustansyaBox password:</p>
        <p style=\"font-size:32px;font-weight:bold;letter-spacing:6px;background:#eef4ec;
                  padding:16px;border-radius:12px;text-align:center;margin:20px 0\">$spaced</p>
        <p>This code expires in <b>10 minutes</b>.</p>
        <p style=\"color:#6f8176;font-size:13px\">If you didn't ask to reset your password,
          you can ignore this email. Your password stays the same.</p>
      </div>";
    $mail->AltBody =
        "Your SustansyaBox password reset code is $code. It expires in 10 minutes. " .
        "If you didn't ask for this, ignore this email.";

    $mail->send();
}