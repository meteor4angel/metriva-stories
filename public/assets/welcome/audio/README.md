# Welcome voices

No audio files were supplied. The welcome is silent with captions; missing clips are never fetched.

Add the following prerecorded clips under `female/` and `male/`, then list the available relative paths in `welcome-experience.json` → `audio.availableClips`:

- female/welcome.mp3
- female/stories.mp3
- female/return.mp3
- female/another-story.mp3
- female/disappointed.mp3
- male/curious.mp3
- male/choose.mp3
- male/love-us.mp3
- male/goodbye.mp3

Example: `"availableClips": ["female/welcome.mp3", "male/curious.mp3"]`.

The sound toggle requires a user gesture on the current page, even if sound was enabled previously. Captions remain on.
