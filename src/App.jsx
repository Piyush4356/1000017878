import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from "react-router-dom";
import URLShortener from "./URLShortener";

const App = () => {
  const [shortenedUrls, setShortenedUrls] = useState([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<URLShortener shortenedUrls={shortenedUrls} setShortenedUrls={setShortenedUrls} />}
        />
        <Route
          path="/:shortcode"
          element={<RedirectHandler shortenedUrls={shortenedUrls} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

const RedirectHandler = ({ shortenedUrls }) => {
  const { shortcode } = useParams();
  const found = shortenedUrls.find(u => u.shortcode === shortcode);

  if (!found) {
    return <div style={{ padding: 50 }}>Short URL not found or expired.</div>;
  }

  const now = new Date();
  if (now > found.expiry) {
    return <div style={{ padding: 50 }}>Short URL has expired.</div>;
  }

  // Perform redirect
  window.location.href = found.original;
  return <div style={{ padding: 50 }}>Redirecting...</div>;
};

export default App;
