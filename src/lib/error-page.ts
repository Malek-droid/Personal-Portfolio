export function renderErrorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>500 - Server Error</title>
  <style>
    body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; max-width: 480px; padding: 24px; }
    h1 { font-size: 3.5rem; margin: 0; color: #7c3aed; font-family: monospace; }
    h2 { font-size: 1.25rem; margin-top: 1rem; color: #fff; }
    p { color: #888; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>500</h1>
    <h2>Internal Server Error</h2>
    <p>Something went wrong on our end.</p>
  </div>
</body>
</html>`;
}
