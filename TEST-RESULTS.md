# v0.7.1 — spoken dialogue verification

201 game checks and 307 audio checks passed. All 76 voice files exist, decode as MPEG audio, have valid durations and are distinct. The voice map covers every introduction, question, answer, follow-up and final-reveal line in Story 02. Five voices cover Evelyn, Ada, Theo, Eleanor and the player.

Browser checks passed: actual audio playback with readyState 4 and advancing playback time; player/character voice changes; replay; mute and mute persistence after reload; cancellation on advancing into the question menu; only one audio player during an exchange; cancellation on closing; audio completion stops speaking movement; muted animation contains only listening and blink frames; pausing motion keeps audio playing. Reload restores the written line and offers Play voice when the browser blocks automatic playback. Mobile voice controls are at least 44 px high and have no horizontal overflow. No console errors appeared in the final audio check.

The five-chapter walkthrough, all 22 clues, puzzles, both endings, export/import and mobile chapter layouts were verified for v0.7.0. Their game code remains unchanged in this audio update. The automated game checks were rerun for v0.7.1. Story 01 and Stories 03–05 remain unchanged.

Audio files are bundled locally; the website does not call a speech service or require a subscription to play them. Voice playback restarts the current line after reload, rather than restoring an audio timestamp. Mouth movement follows playback with alternating expression frames; it is not phonetic lip-sync. The recording puzzle still uses written fragments. Browser testing used a local HTTP preview because the browser tool blocks direct file navigation.

## v0.7.2 lead-in verification

15 timer and playback checks passed: no playback before 900 ms; playback starts at audio time zero; no mouth movement during the pause; completion stops mouth movement; stopping, muting or disconnecting cancels the pending line; repeated replay cancels the previous timer and starts only the latest line. The previous 508 game/audio checks apply to the retained gameplay and unchanged voice files.

## v0.7.4 replaceable-audio verification

All 76 voice-map entries use readable chapter/speaker/purpose filenames and match AUDIO-SCRIPTS.csv. Every mapped MP3 exists. The player preloads before its one-second opening pause, begins at audio time zero, keeps speaking movement off during that pause, and holds the finished state for one second after the clip ends. Stop, advance, replay, mute and close cancel pending pauses.
