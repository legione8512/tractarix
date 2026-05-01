<?php
header("Content-Type: application/json; charset=UTF-8");

function sendJsonResponse($success, $message) {
    echo json_encode([
        "success" => $success,
        "message" => $message
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendJsonResponse(false, "Metodă invalidă.");
}

$name = trim($_POST["name"] ?? "");
$email = trim($_POST["email"] ?? "");
$message = trim($_POST["mesaj"] ?? "");
$website = trim($_POST["website"] ?? "");

// Honeypot anti-spam.
// If this field is completed, it is probably a bot.
// We return success, but we do not send the email.
if (!empty($website)) {
    sendJsonResponse(true, "Mesajul a fost trimis cu succes.");
}

if ($name === "" || $email === "" || $message === "") {
    sendJsonResponse(false, "Te rugăm să completezi toate câmpurile.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(false, "Adresa de e-mail nu este validă.");
}

// Basic cleanup to reduce header injection risk.
$name = str_replace(["\r", "\n"], " ", $name);
$email = str_replace(["\r", "\n"], "", $email);

$to = "contact@tractarix.ro";
$subject = "Mesaj nou de pe site-ul TractariX";

$emailBody = "Ai primit un mesaj nou de pe site-ul TractariX.\n\n";
$emailBody .= "Nume: " . $name . "\n";
$emailBody .= "E-mail: " . $email . "\n\n";
$emailBody .= "Mesaj:\n" . $message . "\n";

$headers = [];
$headers[] = "From: TractariX Website <no-reply@tractarix.ro>";
$headers[] = "Reply-To: " . $name . " <" . $email . ">";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

$sent = mail($to, $subject, $emailBody, implode("\r\n", $headers));

if ($sent) {
    sendJsonResponse(true, "Mesajul a fost trimis cu succes.");
}

sendJsonResponse(false, "A apărut o eroare. Te rugăm să ne contactezi telefonic.");
?>