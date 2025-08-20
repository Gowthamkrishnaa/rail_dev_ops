
const cdk = require('aws-cdk-lib');
const cb = require('aws-cdk-lib/aws-codebuild');
const CodeBuildResource = cb.CfnProject;

module.exports = class CBRailApiDeploy extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const projectName = `RailApi${props.env.suffix}-Direct`;
        const environmentVars = [
          {
            name: 'ACCOUNT_ID', 
            value: props.accountId || '569575870388', 
            type: 'PLAINTEXT'
          },
          {
            name: 'REGION', 
            value: process.env.REGION || 'us-east-1', 
            type: 'PLAINTEXT'
          },
          {
            name: 'ENV', 
            value: props.stackSuffix || 'Dev', 
            type: 'PLAINTEXT'
          },
          {
            name: 'STACK_SUFFIX', 
            value: props.stackSuffix || 'Dev', 
            type: 'PLAINTEXT'
          },
          {
            name: 'DOMAIN_NAME', 
            value: props.apiDomainName || 'digitaltwin.loram.com',
            type: 'PLAINTEXT'
          },
        ];

        const codeBuildDirect = new CodeBuildResource(this, 'RailApiDirect', {
            artifacts: { 
              type: 'NO_ARTIFACTS', 
            },
            environment: { 
              computeType: 'BUILD_GENERAL1_SMALL', 
              image: 'aws/codebuild/standard:7.0', 
              type: 'LINUX_CONTAINER', 
              privilegedMode: true, // Must be true to run docker build
              environmentVariables: environmentVars
            },
            name: projectName, 
            serviceRole: props.serviceRole,
            source: { 
              type: 'GITHUB', 
              auth: {
                type: 'OAUTH', 
              },
              buildSpec: 'direct-buildspec.yml',
              gitCloneDepth: 1,
              gitSubmodulesConfig: {
                fetchSubmodules: false 
              },
              location: "https://github.com/Loram-Technologies/rail-api.git",
              reportBuildStatus: false,
            },
            badgeEnabled: false,
            cache: {
              type: 'NO_CACHE', 
            },
            description: 'Rail Api Direct Build',
            logsConfig: {
              cloudWatchLogs: {
                status: 'ENABLED', 
              },
              s3Logs: {
                status: 'DISABLED', 
              }
            },
            queuedTimeoutInMinutes: 8*60,
            tags: [
              {
                key: 'Name',
                value: projectName
              }
            ],
            timeoutInMinutes: 240,
        });

        new cdk.CfnOutput(this, 'RailApiARN', {
            value: codeBuildDirect.attrArn,
            exportName: `${id}:RailApiDirect`,
        });
    }
}
