# QTCaptions

To create the stack:

```bash
docker compose up -d
```

To re-build frontend JS:

```bash
bun build ./src/app.js --outdir ./public/js
```

`STREAM_URL` is defined in `src/app.js`.

This project was created using `bun init` in bun v1.1.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
