'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
const env_switcher_common_1 = require('./env-switcher.common');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

class EnvSwitcherAndroid extends env_switcher_common_1.EnvSwitcherCommon {
    /**
     * <appResourcesPath>/src/main/res
     */
    // androidAppResourcesFolder;
    /**
     * platforms/android
     */
    androidPlatformFolder;
    androidResourcesMigrationService;
    projectData;

    get androidAppResourcesFolder() {
        let androidAppResourcesFolder;

        androidAppResourcesFolder = path.join(this.projectData.appResourcesDirectoryPath, 'Android');

        if (this.androidResourcesMigrationService.hasMigrated(this.projectData.appResourcesDirectoryPath)) {
            androidAppResourcesFolder = path.join(androidAppResourcesFolder, 'src', 'main', 'res');
        }

        return androidAppResourcesFolder;
    }

    constructor(androidResourcesMigrationService, logger, platformData, projectData, environmentName) {
        super(logger, platformData, projectData, environmentName);
        this.projectData = projectData;
        this.androidPlatformFolder = path.join(this.projectData.platformsDir, 'android');
        this.androidResourcesMigrationService = androidResourcesMigrationService;
    }

    updateGradle() {
        let gradleFilePath;
        let gradleBackupPath;
        let currentGradleFile;
        let oldApplicationId;
        let newApplicationId;
        let modifiedGradleFile;

        gradleFilePath = this.projectData.appGradlePath;
        gradleBackupPath = gradleFilePath + '.bak';

        this.logger.info(`Updating Gradle file ${gradleFilePath} applicationId to ${this.currentEnvironment.packageId}`);

        if (!fs.existsSync(gradleFilePath)) {
            this.logger.fatal(`Unable to find Gradle file, looked at ${gradleFilePath}`);

            return;
        }

        currentGradleFile = fs.readFileSync(gradleFilePath).toString();
        fs.writeFileSync(gradleBackupPath, currentGradleFile);

        oldApplicationId = /applicationId = "([A-Za-z]{1}[A-Za-z\d_]*\.)*[A-Za-z][A-Za-z\d_]*"/;
        newApplicationId = `applicationId = "${this.currentEnvironment.packageId}"`;
        modifiedGradleFile = currentGradleFile.replace(oldApplicationId, newApplicationId);
        fs.writeFileSync(gradleFilePath, modifiedGradleFile);
    }

    updateAppDisplayName() {
        let oldName;
        let newName;
        let stringsFilePath;
        let currentFile;
        let modifiedFile;

        stringsFilePath = path.join(this.androidAppResourcesFolder, 'values', 'strings.xml');

        this.logger.info(`Updating app display name to ${this.currentEnvironment.appName}`);

        if (!fs.existsSync(stringsFilePath)) {
            this.logger.fatal(`Unable to find strings file, looked at ${stringsFilePath}`);

            return;
        }

        currentFile = fs.readFileSync(stringsFilePath).toString();

        oldName = /<string name="app_name">([_A-Za-z ]*)<\/string>/;
        newName = `<string name="app_name">${this.currentEnvironment.appName}</string>`;
        modifiedFile = currentFile.replace(oldName, newName);

        oldName = /<string name="title_activity_kimera">([_A-Za-z ]*)<\/string>/;
        newName = `<string name="title_activity_kimera">${this.currentEnvironment.appName}</string>`;
        modifiedFile = modifiedFile.replace(oldName, newName);

        fs.writeFileSync(stringsFilePath, modifiedFile);
    }

    updateVersion() {

    }

    copyResources() {
        super.copyResources();

        // Copy nativescript.config.ts from white-label dir to project root
        // srcPath = path.join(this.currentEnvironment.resourcesDir, 'nativescript.config.ts');
        // destPath = path.join(this.projectData.$projectHelper.projectDir, 'nativescript.config.ts');
        // this.copyResource(srcPath, destPath);
        //
        // if (this.currentEnvironment.copyResources) {
        //     this.currentEnvironment.copyResources.forEach(copyResource => {
        //         srcPath = path.join(this.currentEnvironment.resourcesDir, copyResource.sourceFile);
        //         destPath = path.join(this.projectData.$projectHelper.projectDir, copyResource.destinationFile);
        //         this.copyResource(copyResource.sourceFile, copyResource.destinationFile);
        //     });
        // }

        this.projectData.initializeProjectData();

        this.copyFiles(this.androidAppResourcesFolder);
    }

    run() {
        if (this.currentEnvironment.packageId === this.getCurrentPackageId()) {
            // Do not copy any files
            return;
        }

        super.run();
        this.updateAppDisplayName();
    }
}

exports.EnvSwitcherAndroid = EnvSwitcherAndroid;
