const cdk = require('aws-cdk-lib');
const cb = require('aws-cdk-lib/aws-codebuild');
const CodeBuildResource = cb.CfnProject;

module.exports = class CBRailPackagesDeploy extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const codeBuildNPM = new CodeBuildResource(this, `RailCalculationPackage${props.env.suffix}-NPM`, {
            name: `RailCalculationPackage${props.env.suffix}-NPM`,
            artifacts: {
                type: "NO_ARTIFACTS"
            },
            source: {
                type: "GITHUB",
                auth: {
                    type: "OAUTH"
                },
                buildSpec: "buildspec.yml",
                gitCloneDepth: 1,
                gitSubmodulesConfig: {
                    fetchSubmodules: false
                },
                location: "https://github.com/Loram-Technologies/economic_calculations-package.git",
                reportBuildStatus: false
            },
            serviceRole: props.serviceRole,
            environment: {
                image: 'aws/codebuild/standard:7.0',
                computeType: 'BUILD_GENERAL1_SMALL',
                privileged: false,
                type: "LINUX_CONTAINER",
                environmentVariables: []
            },
            badgeEnabled: false,
            cache: {
                type: "NO_CACHE"
            },
            description: "Rail Calculation Package NPM Versioning",
            logsConfig: {
                cloudWatchLogs: {
                    status: "ENABLED"
                },
                s3Logs: {
                    status: "DISABLED"
                }
            },
            queuedTimeoutInMinutes: 8 * 60,
            tags: [{
                key: "Name",
                value: "Rail_CalculationPackage-NPM"
            }],
            timeoutInMinutes: 240
        });

        new cdk.CfnOutput(this, 'RailCalculationPackageNPM', {
            value: codeBuildNPM.attrArn,
            exportName: `${id}:RailCalculationPackageNPM`,
        });
        new cdk.CfnOutput(this, 'version', {
            value: props.version || '0.0.0',
            exportName: `${id}:version`,
        });
    }
}
