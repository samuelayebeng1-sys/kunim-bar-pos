import { Router } from "express";

const router = Router();

router.post("/notify/send", async (req, res) => {
  const { to, message } = req.body as { to?: string; message?: string };

  if (!to || !message) {
    res.status(400).json({ error: "'to' and 'message' are required" });
    return;
  }

  const username = process.env["AT_USERNAME"];
  const apiKey = process.env["AT_API_KEY"];

  if (!username || !apiKey) {
    res.status(503).json({ error: "SMS not configured. Set AT_USERNAME and AT_API_KEY in environment secrets." });
    return;
  }

  const isSandbox = process.env["AT_SANDBOX"] === "true";
  const endpoint = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, to, message }).toString(),
    });

    const data = await resp.json() as unknown;
    req.log.info({ to, data }, "Notification sent");
    res.json({ ok: true, data });
  } catch (err) {
    req.log.error({ err }, "Notification send failed");
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
