'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const env_switcher_common_1 = require('./env-switcher.common');

class EnvSwitcherIOS extends env_switcher_common_1.EnvSwitcherCommon {
    iosPlatformFolder;
    iosAppResourcesFolder;
    projectData;

    constructor(logger, platformData, projectData, environmentName) {
        super(logger, platformData, projectData, environmentName);
        this.projectData = projectData;
        this.iosPlatformFolder = path.join(this.projectData.platformsDir, 'ios');
        this.iosAppResourcesFolder = path.join(this.projectData.appResourcesDirectoryPath, 'iOS');
    }

    copyResources() {
        super.copyResources();

        // Copy nativescript.config.ts from white-label dir to project root
        // srcPath = path.join(this.currentEnvironment.resourcesDir, 'nativescript.config.ts');
        // destPath = path.join(this.projectData.$projectHelper.projectDir, 'nativescript.config.ts');
        // this.logger.info(`Copying resource from ${srcPath} to ${destPath}`);
        // fse.copySync(srcPath, destPath,  { overwrite: true });

        this.projectData.initializeProjectData();

        this.copyFiles(this.iosAppResourcesFolder);
    }
}

exports.EnvSwitcherIOS = EnvSwitcherIOS;
