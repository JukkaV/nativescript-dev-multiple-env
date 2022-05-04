const fs = require('fs');
const shell = require('shelljs');

module.exports = function ($logger, $projectData) {
    const platformsDir = $projectData.platformsDir;
    const projectName = $projectData.projectName;
    //1.2.3-beta.3
    const versionAndBuild = $projectData.packageJsonData.version.split('-');
    const version = versionAndBuild[0];
    let buildVersion = 5000;
    let statusAndBuild;
    let status = 'final';

    if (versionAndBuild.length > 1) {
        statusAndBuild = versionAndBuild[1].split('.');
        if (statusAndBuild.length === 2) {
            //1.2.3-beta.3
            status = statusAndBuild[0]; // beta
            buildVersion = parseInt(statusAndBuild[1]); // 3

            if (status === 'beta') {
                buildVersion = buildVersion + 1000;
            } else if (status === 'rc') {
                buildVersion = buildVersion + 2000;
            } else if (status === 'final') {
                buildVersion = buildVersion + 5000;
            }
        } else if (statusAndBuild.length === 1) {
            // 1.2.3-1
            buildVersion = 5000 + parseInt(statusAndBuild[0]); // 1
        } else {
            $logger.info(`Invalid version in package.json: ${versionAndBuild}`);
        }
    }

    const [major, minor, patch] = version.split('.').map((v) => parseInt(v));
    const infoPlist = `${platformsDir}/ios/${projectName}/${projectName}-Info.plist`;
    const androidManifest = `${platformsDir}/android/app/src/main/AndroidManifest.xml`;
    let build = major.toString() + minor.toString().padStart(2, '0') + patch.toString().padStart(2, '0') + buildVersion.toString();

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
