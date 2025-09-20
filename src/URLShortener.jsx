import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { Link as LinkIcon } from "lucide-react";

export const LoggingMiddleware = (action, data) => {
  console.log(`[LOG] ${action}:`, data);
};

const URLShortener = ({ shortenedUrls, setShortenedUrls }) => {
  const [urls, setUrls] = useState([{ original: "", shortcode: "", validity: "", error: "" }]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  // Update stats whenever shortenedUrls changes
  useEffect(() => {
    const now = new Date();
    const activeCount = shortenedUrls.filter(u => u.expiry > now).length;
    const expiredCount = shortenedUrls.filter(u => u.expiry <= now).length;
    setStats({ total: shortenedUrls.length, active: activeCount, expired: expiredCount });
  }, [shortenedUrls]);

  const handleChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    newUrls[index].error = "";
    setUrls(newUrls);
  };

  const generateShortCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  };

  const isValidUrl = (url) => {
    try {
      const obj = new URL(url);
      return obj.protocol === "http:" || obj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleShorten = () => {
    const updatedUrls = [...urls];
    const sessionShortcodes = shortenedUrls.map(u => u.shortcode);

    updatedUrls.forEach(u => {
      const originalUrl = u.original.trim();
      const shortcode = u.shortcode.trim();
      const validityMinutes = parseInt(u.validity) || 30;

      if (!originalUrl) {
        u.error = "URL cannot be empty";
        return;
      }

      const normalizedUrl = originalUrl.startsWith("http") ? originalUrl : "https://" + originalUrl;

      if (!isValidUrl(normalizedUrl)) {
        u.error = "Invalid URL";
        return;
      }

      if (validityMinutes <= 0) {
        u.error = "Validity must be a positive number";
        return;
      }

      const expiry = new Date(Date.now() + validityMinutes * 60 * 1000);

      const finalShortcode = shortcode || generateShortCode();

      if (!/^[a-zA-Z0-9]{4,10}$/.test(finalShortcode)) {
        u.error = "Shortcode must be 4-10 alphanumeric chars";
        return;
      }
      if (sessionShortcodes.includes(finalShortcode) || shortenedUrls.find(su => su.shortcode === finalShortcode)) {
        u.error = "Shortcode already exists";
        return;
      }

      const shortUrl = `http://localhost:3000/${finalShortcode}`;

      const newShortened = { original: normalizedUrl, shortcode: finalShortcode, shortUrl, expiry };
      setShortenedUrls(prev => [...prev, newShortened]);
      LoggingMiddleware("Short URL created", newShortened);
    });

    setUrls(updatedUrls);
    showNotification("URLs processed");
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 3000);
  };

  const addNewInput = () => {
    if (urls.length < 5) setUrls([...urls, { original: "", shortcode: "", validity: "", error: "" }]);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      LoggingMiddleware("URL copied", { shortUrl: text });
      showNotification("Copied to clipboard!");
    } catch {
      showNotification("Failed to copy", "error");
    }
  };

  const deleteUrl = (shortcode) => {
    setShortenedUrls(prev => prev.filter(u => u.shortcode !== shortcode));
    LoggingMiddleware("URL deleted", { shortcode });
    showNotification("URL deleted");
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>🔗 URL Shortener</Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Shorten up to 5 URLs at once. Default validity is 30 minutes.
      </Typography>

      {/* Statistics Section */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" mb={1}>📊 Statistics</Typography>
        <Typography>Total URLs: {stats.total}</Typography>
        <Typography>Active URLs: {stats.active}</Typography>
        <Typography>Expired URLs: {stats.expired}</Typography>
      </Card>

      {urls.map((u, idx) => (
        <Card key={idx} sx={{ mb: 2, p: 2, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Original URL"
                placeholder="https://example.com/long/path"
                fullWidth
                value={u.original}
                onChange={e => handleChange(idx, "original", e.target.value)}
                error={!!u.error}
                helperText={u.error}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Custom Shortcode (optional)"
                placeholder="3-10 alphanumeric chars"
                fullWidth
                value={u.shortcode}
                onChange={e => handleChange(idx, "shortcode", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Validity (minutes)"
                placeholder="30"
                type="number"
                fullWidth
                value={u.validity}
                onChange={e => handleChange(idx, "validity", e.target.value)}
              />
            </Grid>
          </Grid>
        </Card>
      ))}

      <Button variant="outlined" onClick={addNewInput} disabled={urls.length >= 5} sx={{ mr: 2, mb: 3 }}>+ Add URL</Button>
      <Button variant="contained" onClick={handleShorten} sx={{ mb: 3 }}>Shorten URLs</Button>

      {shortenedUrls.length > 0 && (
        <Card sx={{ p: 3, mt: 3, borderRadius: 3 }}>
          <Typography variant="h5" mb={2}>Shortened URLs</Typography>
          {shortenedUrls.map((u, idx) => (
            <Card key={idx} sx={{ mb: 1, p: 1.5 }}>
              <Typography variant="body1"><strong>Original:</strong> {u.original}</Typography>
              <Typography variant="body2" color="primary">
                <LinkIcon size={16} />{" "}
                <a href={u.shortUrl} target="_blank" rel="noopener noreferrer">{u.shortUrl}</a>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expires at: {u.expiry.toLocaleTimeString()}
              </Typography>
              <div style={{ marginTop: 5 }}>
                <Button size="small" onClick={() => copyToClipboard(u.shortUrl)} sx={{ mr: 1 }}>Copy</Button>
                <Button size="small" color="error" onClick={() => deleteUrl(u.shortcode)}>Delete</Button>
              </div>
            </Card>
          ))}
        </Card>
      )}

      <Snackbar
        open={notification.show}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, show: false })}
      >
        <Alert severity={notification.type} onClose={() => setNotification({ ...notification, show: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default URLShortener;
