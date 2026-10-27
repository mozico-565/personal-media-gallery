# Personal Media Gallery

Social Gallery V2 is a personal, local gallery with three independent browsing experiences:

- Instagram: photos and photo albums, stories, explore, profile and saved photos.
- TikTok: videos only, with vertical swipe, playback, audio and seeking controls.
- X: private text notes with draft persistence, editing, deletion, replies, quotes and simulated reposts.

Use the add button in Instagram or TikTok, or Settings, to choose device media. Files are copied into this browser's IndexedDB and never uploaded by the app. Notes and interactions stay in localStorage. Clearing site data removes local copies and notes. Hiding a photo does not delete the original file.

This web app cannot scan the Android gallery automatically. MediaStore integration and AI personalities remain planned/inactive. Sample video clips require internet. Demo accounts and counts are simulations.

See [V2 validation](docs/V2_VALIDATION.md) for test evidence and remaining verification.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/86693adb-58ea-4289-ba0a-21b3e6b99b69).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
