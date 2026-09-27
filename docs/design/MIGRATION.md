2026-09-28: extracted local eye-creature-v2 prototype from Biology-C/mousemaze.
Source repository HEAD: 98fb779426f85cba80cdf67b5005339f645b8fac.
The prototype and eye-* tests were untracked; this initial commit is a local snapshot, not recovered Git history.
Old prototype remains locally for rollback. Future development belongs here.

License decision: user requested public source with noncommercial/private-learning permissions, commercial use and public derivative distribution requiring written consent. Root LICENSE covers original additions; retained upstream MIT is in LICENSES/MIT-MouseMaze.txt.
Validation: all 15 test files passed locally with Chrome, including independent root and /eye-creature/ URLs, animation assets, mobile layout and full first-level playthrough. No dependency on the toy checkout or private runtime paths.
