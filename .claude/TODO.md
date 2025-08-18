Agent: mark tasks in this document as complete once done.
- [x] Added FLAG_SECURE to expo compile time, not in ephemeral ./android folder
- [x] Why not add screen capture protection to the outermost component of the app, instead of on each route?  Also disable screen shots completely at the build level. Add this to spec documentation.
- [ ] Evaluate with security audit agent if we should disable accessibility features at the app level which would allow malware to control the app. If so, add this to the spec documentation.
- [ ] Every file or text which has the string PIN, pin, should be replaced with Password.
- [ ] remove all console.log and console.error mentions, and use secure logging instead.
- [ ] add a lint check which forbids use of console printing
