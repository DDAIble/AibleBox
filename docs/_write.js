const fs = require("fs");
const content = fs.readFileSync(0, "utf8");
fs.writeFileSync("UTILITY_ONBOARDING.md", content);
console.log("bytes", fs.statSync("UTILITY_ONBOARDING.md").size);
