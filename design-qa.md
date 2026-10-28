# Bugfix design QA

final result: blocked

Source: user reference crops in docs/bugfix-instagram-focused.jpg and docs/bugfix-tiktok-focused.jpg. Rendered implementation: browser captures in the same files; 430 × 904 CSS px, density 1. Images are independently resized; supplied crops do not encode a matching viewport or theme. TikTok capture predates final navigation adjustment.

- P1: TikTok icon shapes and position need a same-viewport comparison with the reference; current comparison is not sufficient to establish fidelity.
- P2: Instagram reference is dark and after capture is light, with different crops. Wordmark uses a geometric approximation; review it against a matching reference.
- P2: Test on additional phone widths and with real touch, including sheet cancellation and multitouch.
- The source media and captions differ by design; user content was not replaced. Colors, layout, text and image crops have been visually inspected only in the documented non-equivalent states. No claim of pixel accuracy.
- Primary interactions tested: comment handle drag in both platforms, local video import and reload. Cloud browser console contained Vite hot-reload context errors while editing; page reloaded normally. The original sample video could not be loaded in this restricted environment.
