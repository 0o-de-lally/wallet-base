Agent: mark tasks in this document as complete once done.
- [x] Added FLAG_SECURE to expo compile time, not in ephemeral ./android folder
- [x] Why not add screen capture protection to the outermost component of the app, instead of on each route?  Also disable screen shots completely at the build level. Add this to spec documentation.
- [x] remove all console.log and console.error mentions, and use secure logging instead.
- [x] add a lint check in package.js which forbids use of console printing outside of secure logging module
- [x] expo blur is not working at runtime on testing devices. I likely needs to be added to a Context used in _layout.tsx
- [x] Evaluate with security audit agent if we should disable accessibility features at the app level which would allow malware to control the app. If so, add this to the spec documentation.
- [x] Every file or text which has the string PIN, pin, should be replaced with Password.
