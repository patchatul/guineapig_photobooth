# Guinea Pig Photobooth

A fun summer project for creating cute guineapig photobooth strips.
Capture images from your camera or upload photos, then decorate them with stickers and download the photobooth strip!

- Live site: https://guineapig-photobooth.vercel.app/
- Best experience: open in Google Chrome or on a laptop

## Features

- Real-time photo capture and upload support
- Three-photo strip layout using a custom template
- Emoji and PNG sticker placement and drag interaction
- Download final composition as a PNG image
- Mobile-friendly and shareable output

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Browser camera APIs (`HTMLVideoElement`)
- IndexDB
- IbisPaint X

## Screenshot

![Guinea Pig Photobooth screenshot](/public/screenshot.png)

## Project Structure

```
└── 📁guineapig_photobooth
    └── 📁app
        └── 📁camera
            ├── photoslot.tsx
        └── 📁decorate
            ├── page.tsx
        └── 📁lib
            ├── photosDb.ts
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx
    └── 📁public
        ├── phototemplate.png
    ├── .gitignore
    ├── AGENTS.md
    ├── CLAUDE.md
    ├── eslint.config.mjs
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    └── tsconfig.json
```

## Notes

- The main page prompts mobile users to open the app in Chrome for better compatibility.
- Sticker assets include both emoji and PNG images stored in `public/`.
