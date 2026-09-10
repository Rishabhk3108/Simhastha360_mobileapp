const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// expo prebuild always wipes and regenerates android/ from scratch (with or
// without --clean), so the Mappls map SDK's license file pair - which its own
// Gradle plugin requires directly inside android/app/ (see its README) and
// which can't be committed there since that whole directory is gitignored -
// has to be copied back in on every single prebuild instead of hand-pasted.
const LICENSE_SOURCE_DIR = path.join(__dirname, "..", "mappls-license");

function withMapplsLicense(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const targetDir = path.join(config.modRequest.platformProjectRoot, "app");
      const files = fs.existsSync(LICENSE_SOURCE_DIR) ? fs.readdirSync(LICENSE_SOURCE_DIR) : [];
      const licenseFiles = files.filter((f) => f.endsWith(".a.olf") || f.endsWith(".a.conf"));

      if (licenseFiles.length === 0) {
        throw new Error(
          `No Mappls license files (*.a.olf / *.a.conf) found in ${LICENSE_SOURCE_DIR}. ` +
            "The native Mappls map SDK cannot build without them.",
        );
      }

      for (const file of licenseFiles) {
        fs.copyFileSync(path.join(LICENSE_SOURCE_DIR, file), path.join(targetDir, file));
      }

      return config;
    },
  ]);
}

module.exports = withMapplsLicense;
