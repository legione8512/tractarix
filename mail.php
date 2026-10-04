<?php
header("Content-Type: application/json; charset=UTF-8");

// Maximum number of messages one visitor (IP address) can send per hour.
const RATE_LIMIT_MESSAGES = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

function sendJsonResponse($success, $message) {
    echo json_encode([
        "success" => $success,
        "message" => $message
    ]);
    exit;
}

function textLength($text) {
    return function_exists("mb_strlen") ? mb_strlen($text, "UTF-8") : strlen($text);
}

function isValidPhone($phone) {
    if (!preg_match('/^\+?[0-9\s.\-()]+$/', $phone)) {
        return false;
    }

    $digits = preg_replace('/\D/', "", $phone);

    return strlen($digits) >= 9 && strlen($digits) <= 15;
}

// Simple per-IP limit stored in the server's temp folder.
// If the file cannot be read or written, the message is still sent.
function isRateLimited($ip) {
    $file = sys_get_temp_dir() . "/tractarix-form-" . hash("sha256", $ip) . ".json";
    $now = time();
    $timestamps = [];

    $saved = @file_get_contents($file);

    if ($saved !== false) {
        $decoded = json_decode($saved, true);

        if (is_array($decoded)) {
            $timestamps = $decoded;
        }
    }

    $timestamps = array_values(array_filter($timestamps, function ($timestamp) use ($now) {
        return is_int($timestamp) && $timestamp > $now - RATE_LIMIT_WINDOW_SECONDS;
    }));

    if (count($timestamps) >= RATE_LIMIT_MESSAGES) {
        return true;
    }

    $timestamps[] = $now;
    @file_put_contents($file, json_encode($timestamps), LOCK_EX);

    return false;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJsonResponse(false, "Metodă invalidă.");
}

$name = trim($_POST["name"] ?? "");
$phone = trim($_POST["telefon"] ?? "");
$email = trim($_POST["email"] ?? "");
$message = trim($_POST["mesaj"] ?? "");
$website = trim($_POST["website"] ?? "");

// Honeypot anti-spam.
// If this field is completed, it is probably a bot.
// We return success, but we do not send the email.
if (!empty($website)) {
    sendJsonResponse(true, "Mesajul a fost trimis cu succes.");
}

if ($name === "" || $phone === "" || $message === "") {
    sendJsonResponse(false, "Te rugăm să completezi numele, telefonul și mesajul.");
}

if (textLength($name) > 100 || textLength($email) > 254 || textLength($message) > 2000) {
    sendJsonResponse(false, "Mesajul este prea lung. Te rugăm să îl scurtezi.");
}

if (!isValidPhone($phone)) {
    sendJsonResponse(false, "Numărul de telefon nu este valid.");
}

// E-mail is optional, but if it is filled in it must be valid.
if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(false, "Adresa de e-mail nu este validă.");
}

if (isRateLimited($_SERVER["REMOTE_ADDR"] ?? "unknown")) {
    sendJsonResponse(false, "Ai trimis deja mai multe mesaje. Pentru urgențe, sună-ne la 0733 188 388.");
}

// Basic cleanup to reduce header injection risk.
$name = str_replace(["\r", "\n"], " ", $name);
$email = str_replace(["\r", "\n"], "", $email);

$to = "contact@tractarix.ro";
$subject = "Mesaj nou de pe site-ul TractariX";

$emailBody = "Ai primit un mesaj nou de pe site-ul TractariX.\n\n";
$emailBody .= "Nume: " . $name . "\n";
$emailBody .= "Telefon: " . $phone . "\n";
$emailBody .= "E-mail: " . ($email !== "" ? $email : "-") . "\n\n";
$emailBody .= "Mesaj:\n" . $message . "\n";

$headers = [];
$headers[] = "From: TractariX Website <no-reply@tractarix.ro>";

if ($email !== "") {
    $headers[] = "Reply-To: " . $email;
}

$headers[] = "Content-Type: text/plain; charset=UTF-8";

$sent = mail($to, $subject, $emailBody, implode("\r\n", $headers));

if ($sent) {
    sendJsonResponse(true, "Mesajul a fost trimis cu succes.");
}

sendJsonResponse(false, "A apărut o eroare. Te rugăm să ne contactezi telefonic.");
?>
