<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit;
}

// Honeypot: real visitors leave this empty, bots fill it in
if (!empty($_POST['website'])) {
  header('Location: refer.html?sent=1');
  exit;
}

// Strip newlines so nobody can inject extra email headers
function clean(string $v): string
{
  return trim(preg_replace('/[\r\n]+/', ' ', $v));
}

function rate_limited(string $dir, string $ip, int $max = 3, int $window = 3600): bool
{
  if (!is_dir($dir)) {
    mkdir($dir, 0700, true);
  }

  // Occasional cleanup so old files don't pile up
  if (random_int(1, 100) === 1) {
    foreach (glob("$dir/*.json") as $f) {
      if (filemtime($f) < time() - 86400) {
        unlink($f);
      }
    }
  }

  $fh = fopen($dir . '/' . hash('sha256', $ip) . '.json', 'c+');
  if (!$fh) {
    return false;
  }   // fail open: a broken limiter shouldn't block real visitors

  flock($fh, LOCK_EX);
  $now  = time();
  $hits = json_decode(stream_get_contents($fh), true) ?: [];
  $hits = array_values(array_filter($hits, fn($t) => $t > $now - $window));

  $limited = count($hits) >= $max;
  if (!$limited) {
    $hits[] = $now;
  }

  ftruncate($fh, 0);
  rewind($fh);
  fwrite($fh, json_encode($hits));
  flock($fh, LOCK_UN);
  fclose($fh);

  return $limited;
}

$name  = clean($_POST['your-name'] ?? '');
$email = clean($_POST['your-email'] ?? '');
$cat   = clean($_POST['cat-name'] ?? '');
$where = clean($_POST['cat-location'] ?? '');
$story = trim($_POST['cat-story'] ?? '');

if ($name === '' || $cat === '' || $story === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  header('Location: refer.html?error=1');
  exit;
}

// NEW: length caps, enforced on the server
if (
  mb_strlen($name) > 100 || mb_strlen($email) > 254 || mb_strlen($cat) > 100
  || mb_strlen($where) > 100 || mb_strlen($story) > 5000
) {
  header('Location: refer.html?error=1');
  exit;
}

// NEW: rate limit (and the $priv line moved up here)
$priv = dirname(__DIR__) . '/whiskers-private';

if (rate_limited("$priv/ratelimit", $_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
  header('Location: refer.html?error=2');
  exit;
}

$body = "Referred by: $name ($email)\n"
  . "Cat's name: $cat\n"
  . "Location: " . ($where ?: 'Not provided') . "\n\n"
  . "Story:\n$story\n";

// --- This section replaces the old mail() call ---
require "$priv/phpmailer/src/Exception.php";
require "$priv/phpmailer/src/PHPMailer.php";
require "$priv/phpmailer/src/SMTP.php";
$cfg = require "$priv/smtp-config.php";

$mail = new PHPMailer(true);
try {
  $mail->isSMTP();
  $mail->Host       = $cfg['host'];
  $mail->Port       = $cfg['port'];
  $mail->SMTPAuth   = true;
  $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  $mail->Username   = $cfg['user'];
  $mail->Password   = $cfg['token'];
  $mail->Timeout    = 10;
  $mail->CharSet    = 'UTF-8';
  $mail->setFrom($cfg['user'], 'Whiskers Wanted');
  $mail->addAddress($cfg['to']);
  $mail->addReplyTo($email, $name);
  $mail->Subject = "Cat referral: $cat";
  $mail->Body    = $body;
  $mail->send();
  $ok = true;
} catch (Exception $e) {
  error_log(date('c') . ' ' . $mail->ErrorInfo . "\n", 3, "$priv/errors.log");
  $ok = false;
}
// --- end of replacement ---

header('Location: refer.html?' . ($ok ? 'sent=1' : 'error=1'));
