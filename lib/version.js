const fs = require('fs');
const shell = require('shelljs');

module.exports = function ($logger, $projectData) {
    const platformsDir = $projectData.platformsDir;
    const projectName = $projectData.projectName;

    const version = $projectData.packageJsonData.version;
    const [major, minor, patch] = version.split('.').map((v) => parseInt(v));
    const infoPlist = `${platformsDir}/ios/${projectName}/${projectName}-Info.plist`;
    const androidManifest = `${platformsDir}/android/app/src/main/AndroidManifest.xml`;
    let build = '';

    build = major.toString() + minor.toString().padStart(2, '0') + patch.toString().padStart(2, '0') + '0001';

    $logger.info(`Updating version to ${version} (build=${build})`);

    for (const file of [infoPlist, androidManifest]) {
        if (fs.existsSync(file)) {
            $logger.debug(`Replacing "__VERSION__" with "${version}" in ${file}`);
            $logger.debug(`Replacing "__BUILD__" with "${build}" in ${file}`);
            shell.sed('-i', /__VERSION__/, version, file);
            shell.sed('-i', /__BUILD__/, build, file);
        }
    }
};
