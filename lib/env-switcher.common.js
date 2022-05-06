'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

class EnvSwitcherCommon {
    logger;
    platformData;
    projectData;
    environmentName;
    rules;

    constructor(logger, platformData, projectData, environmentName) {
        this.logger = logger;
        this.platformData = platformData;
        this.projectData = projectData;
        this.environmentName = environmentName;
        this.rules = this.readRules();

        this.logger.info(`Using ${this.environmentName}.`);
    }

    get currentEnvironment() {
        let foundRules;

        foundRules = this.rules.environments.find(envs => envs.name === this.environmentName);

        if (foundRules) {
            return foundRules;
        } else {
            this.logger.fatal('Unable to find Rules for Environment: ' + this.environmentName);
        }
    }

    readRules() {
        const ruleFile = this.getProjectRules();

        if (fs.existsSync(ruleFile)) {
            this.logger.debug('Environment Rules found, reading contents');

            return JSON.parse(fs.readFileSync(ruleFile).toString());
        } else {
            this.logger.fatal('Environment Rules File does not exist, Skipping....');
        }
    }

    copyFiles(inputDir) {
        let matchesRules = [];
        let dirName;
        let dirItems;

        dirName = inputDir.indexOf(this.projectData.$projectHelper.cachedProjectDir) < 0 ? path.join(this.projectData.$projectHelper.cachedProjectDir, inputDir) : inputDir;
        dirItems = fs.readdirSync(dirName);

        if (Array.isArray(this.currentEnvironment.copyRules)) {
            matchesRules = this.currentEnvironment.copyRules;
        } else {
            matchesRules.push(this.currentEnvironment.copyRules);
        }

        this.logger.info('Using copyRules:', matchesRules, 'in directory ' + inputDir);

        // Loop each rule in sync and directories recursively so rules are applied in correct order
        matchesRules.forEach(matchesRule => {
            dirItems.forEach(dirItem => {
                this.testForRelease(dirItem, inputDir, matchesRule);
            });
        });
    }

    copyResources() {
        let srcPath;
        let destPath;

        // Copy nativescript.config.ts from white-label dir to project root
        srcPath = path.join(this.currentEnvironment.resourcesDir, 'nativescript.config.ts');
        destPath = path.join(this.projectData.$projectHelper.projectDir, 'nativescript.config.ts');
        this.copyResource(srcPath, destPath);

        if (this.currentEnvironment.copyResources) {
            this.currentEnvironment.copyResources.forEach(copyResource => {
                srcPath = path.join(this.currentEnvironment.resourcesDir, copyResource.sourceFile);
                destPath = path.join(this.projectData.$projectHelper.projectDir, copyResource.destinationFile);
                this.copyResource(copyResource.sourceFile, copyResource.destinationFile);
            });
        }
    }

    copyResource(srcPath, destPath) {
        if (this.isFileEqual(srcPath, destPath)) {
            return;
        }

        this.logger.info(`Copying resource from ${srcPath} to ${destPath}`);
        fse.copySync(srcPath, destPath,  { overwrite: true });
    }

    testForRelease(file, inputFolder, matchesRule) {
        let filePath;
        let stat;
        let fileContents;
        let newFileName;
        let newFilePath;
        let matchesRuleRegExp;

        filePath = path.join(inputFolder, file);

        try {
            stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                fs.readdirSync(filePath).forEach(dirItem => {
                    this.testForRelease(dirItem, filePath, matchesRule);
                });
            } else {
                matchesRuleRegExp = new RegExp(matchesRule);

                if (matchesRuleRegExp.test(file)) {
                    // fileContents = fs.readFileSync(filePath).toString();
                    newFileName = this.getNewFilename(file);
                    newFilePath = path.join(inputFolder, newFileName);

                    if (this.isFileEqual(filePath, newFilePath)) {
                        return;
                    }

                    this.logger.info('Copying file ' + file + ' to ' + newFileName + ' in dir ' + inputFolder);
                    fse.copySync(filePath, newFilePath, {overwrite: true, preserveTimestamps: true});
                }
            }
        } catch (_a) {
            this.logger.info('Renaming file failed:', _a);
        }
    };

    isFileEqual(sourcePath, destinationPath) {
        if (fs.existsSync(sourcePath) && fs.existsSync(destinationPath)) {
            const sourceFile = fs.readFileSync(sourcePath);
            const destinationFile = fs.readFileSync(destinationPath);

            if (sourceFile.equals(destinationFile)) {
                // Files are identical in content
                return true;
            }
        }

        return false;
    }

    getNewFilename(file) {
        // If file name is separated by mulitple dots then only remove environment name
        // Like File Name en.default.staging.json
        let fileNameParts = file.split('.');
        let ext = fileNameParts[fileNameParts.length - 1];
        let fileName = fileNameParts.splice(0, fileNameParts.length - 2).join('.');

        return `${fileName}.${ext}`;
    }

    doesSourceMatchDestination(sourcePath, destinationPath) {
        let sourceFileContents, destinationFileContents;
        if (fs.existsSync(sourcePath)) {
            sourceFileContents = fs.readFileSync(sourcePath).toString();
        } else {
            this.logger.fatal('Source File: (' + sourcePath + ') does not exist!');
        }
        if (fs.existsSync(destinationPath)) {
            destinationFileContents = fs.readFileSync(destinationPath).toString();
        } else {
            this.logger.debug('Destination File: ( ' + destinationPath + ' ) does not exist!');
            return false;
        }
        return sourceFileContents === destinationFileContents;
    }

    changePackageId() {
        this.logger.info(`Updating project Identifier to ${this.currentEnvironment.packageId}`);
        // const packageJSONFile = path.join(this.projectData.projectDir, 'package.json');
        // const packageJSONBackup = path.join(this.projectData.projectDir, 'package.orig.json');
        // const packageJSON = JSON.parse(fs.readFileSync(packageJSONFile).toString());

        this.projectData.projectIdentifiers.ios = this.projectData.projectIdentifiers.android = this.currentEnvironment.packageId;
    }

    updateNativeScriptConfigFile() {
        let nativescriptConfigFile;
        let nativescriptConfigBackup;
        let currentNativescriptConfigFile;
        let oldId;
        let newId;
        let modifiedNativescriptConfigFile;

        this.logger.info(`Updating nativescript project Identifier to ${this.currentEnvironment.packageId}`);
        nativescriptConfigFile = path.join(this.projectData.projectDir, 'nativescript.config.ts');
        nativescriptConfigBackup = path.join(this.projectData.projectDir, 'nativescript.config.orig.ts');

        if (!fs.existsSync(nativescriptConfigFile)) {
            this.logger.fatal(`Unable to find nativescript config file, looked at ${nativescriptConfigFile}`);

            return;
        }

        currentNativescriptConfigFile = fs.readFileSync(nativescriptConfigFile).toString();
        fs.writeFileSync(nativescriptConfigBackup, currentNativescriptConfigFile);

        oldId = /id: '([A-Za-z]{1}[A-Za-z\d_]*\.)*[A-Za-z][A-Za-z\d_]*'/;
        newId = `id: '${this.currentEnvironment.packageId}'`;
        modifiedNativescriptConfigFile = currentNativescriptConfigFile.replace(oldId, newId);
        fs.writeFileSync(nativescriptConfigFile, modifiedNativescriptConfigFile);
    }

    // Check if there is different file for different environment other wise return default environment-rules file
    getProjectRules() {
        const fileName = 'environment-rules.' + this.platformData.platformNameLowerCase + '.json';
        const projectRules = path.join(this.projectData.projectDir, fileName);

        if (fs.existsSync(projectRules)) {
            return projectRules;
        } else {
            const defaultFileName = 'environment-rules.json';

            return path.join(this.projectData.projectDir, defaultFileName);
        }
    }

    maybeCreateEnvironmentRules() {
        const projectRules = this.getProjectRules();
        if (!fs.existsSync(projectRules)) {
            this.logger.info('Environment Rules file does not exist, creating a basic one now.');
            const environmentRules = {
                'version': '1.0.0',
                'default': 'staging',
                'extraPaths': [
                    'app/environments'
                ],
                'environments': [
                    create_environment('staging'),
                    create_environment('release')
                ]
            };
            fs.writeFileSync(projectRules, JSON.stringify(environmentRules, null, 4));
        }
    }

    copyExtraFolders() {
        this.rules.extraPaths.forEach((filePath) => {
            this.copyFiles(filePath);
        });
    }

    run() {
        this.maybeCreateEnvironmentRules();
        this.copyResources();
        this.copyExtraFolders();
        this.changePackageId();
        this.updateNativeScriptConfigFile();
    }
}

exports.EnvSwitcherCommon = EnvSwitcherCommon;

function create_environment(versionName) {
    return {
        name: versionName,
        packageId: `org.nativescript.appName.${versionName}`,
        copyRules: `(.*\\.${versionName}\\..*)`
    };
}
