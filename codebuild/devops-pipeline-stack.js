
const cdk = require('aws-cdk-lib');
const codePipeline = require('aws-cdk-lib/aws-codepipeline');
const codestarconnections = require('aws-cdk-lib/aws-codestarconnections');

const { Key } = require('aws-cdk-lib/aws-kms');
const { BlockPublicAccess, Bucket, BucketEncryption } = require('aws-cdk-lib/aws-s3');

module.exports = class RailDevOpsPipelineStack extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const bucketName = `digitaltwin-code-pipeline-${props.stackSuffix.toLowerCase()}`;
        // Create Source Output Bucket
        const sourceOutputBucket = new Bucket(this, `RailCodePipelineUI`, {
            bucketName: bucketName,
            // Force encryption to use a Custom Managed Key
            encryption: BucketEncryption.KMS,
            // Create the Encryption Key, with Rotation enabled
            encryptionKey: new Key(this, `RailCodePipelineUI${id}`, { enableKeyRotation: true }),
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            enforceSSL: true
        });

        const codeConnection = new codestarconnections.CfnConnection(this, 'RailCodePipelineConnection', {
            connectionName: `RailCodeConnection${props.stackSuffix}`,
            providerType: 'GitHub'
        });

        const ui_pipeline = new codePipeline.CfnPipeline(this, 'PlatformUI', {
            pipelineName: 'PlatformUI',
            roleArn: props.serviceRole,
            artifactStore: {
                location: bucketName,
                type: 'S3'
            },
            stages: [
                {
                    name: 'SourceStage',
                    region: props.env.region,
                    actions: [{
                        actionTypeId: {
                          category: 'Source',
                          owner: 'AWS',
                          provider: 'CodeStarSourceConnection',
                          version: '1',
                        },
                        name: 'SourceCode',
                        runOrder: 1,
                        outputArtifacts: [{
                            name: 'SourceOutput',
                        }],
                        configuration: {
                            ConnectionArn: codeConnection.attrConnectionArn,
                            FullRepositoryId: props.repositoryUI,
                            BranchName: 'main',
                            OutputArtifactFormat: 'CODEBUILD_CLONE_REF'
                        }
                    }]
                },
                {
                    name: 'BuildStage',
                    region: props.env.region,
                    runOrder: 2,
                    actions: [{
                        actionTypeId: {
                          category: 'Build',
                          owner: 'AWS',
                          provider: 'CodeBuild',
                          version: '1',
                        },
                        inputArtifacts: [{name: 'SourceOutput'}],
                        name: 'BuildUI',
                        configuration:{
                            ['ProjectName']: `RailPlatformUI${props.stackSuffix}-Direct`
                        }
                    }]
                }
            ]
        });
        ui_pipeline.node.addDependency(sourceOutputBucket);

        const api_pipeline = new codePipeline.CfnPipeline(this, 'PlatformAPI', {
            pipelineName: 'PlatformAPI',
            roleArn: props.serviceRole,
            artifactStore: {
                location: bucketName,
                type: 'S3'
            },
            stages: [
                {
                    name: 'SourceStage',
                    region: props.env.region,
                    actions: [{
                        actionTypeId: {
                          category: 'Source',
                          owner: 'AWS',
                          provider: 'CodeStarSourceConnection',
                          version: '1',
                        },
                        name: 'SourceCode',
                        runOrder: 1,
                        outputArtifacts: [{
                            name: 'SourceOutput',
                        }],
                        configuration: {
                            ConnectionArn: codeConnection.attrConnectionArn,
                            FullRepositoryId: props.repositoryAPI,
                            BranchName: 'main',
                            OutputArtifactFormat: 'CODEBUILD_CLONE_REF'
                        }
                    }]
                },
                {
                    name: 'BuildStage',
                    region: props.env.region,
                    runOrder: 2,
                    actions: [{
                        actionTypeId: {
                          category: 'Build',
                          owner: 'AWS',
                          provider: 'CodeBuild',
                          version: '1',
                        },
                        inputArtifacts: [{name: 'SourceOutput'}],
                        name: 'BuildAPI',
                        configuration:{
                            ['ProjectName']: `RailApi${props.stackSuffix}-Direct`
                        }
                    }]
                }
            ]
        });
        api_pipeline.node.addDependency(sourceOutputBucket);

        const simulation_pipeline = new codePipeline.CfnPipeline(this, 'PlatformSimulation', {
            pipelineName: 'PlatformSimulation',
            roleArn: props.serviceRole,
            artifactStore: {
                location: bucketName,
                type: 'S3'
            },
            stages: [
                {
                    name: 'SourceStage',
                    region: props.env.region,
                    actions: [{
                        actionTypeId: {
                          category: 'Source',
                          owner: 'AWS',
                          provider: 'CodeStarSourceConnection',
                          version: '1',
                        },
                        name: 'SourceCode',
                        runOrder: 1,
                        outputArtifacts: [{
                            name: 'SourceOutput',
                        }],
                        configuration: {
                            ConnectionArn: codeConnection.attrConnectionArn,
                            FullRepositoryId: props.repositorySIMULATION,
                            BranchName: 'main',
                            OutputArtifactFormat: 'CODEBUILD_CLONE_REF'
                        }
                    }]
                },
                {
                    name: 'BuildStage',
                    region: props.env.region,
                    runOrder: 2,
                    actions: [{
                        actionTypeId: {
                          category: 'Build',
                          owner: 'AWS',
                          provider: 'CodeBuild',
                          version: '1',
                        },
                        inputArtifacts: [{name: 'SourceOutput'}],
                        name: 'BuildSimulation',
                        configuration:{
                            ['ProjectName']: `RailSimulation${props.stackSuffix}-Direct`
                        }
                    }]
                }
            ]
        });
        api_pipeline.node.addDependency(sourceOutputBucket);

        new cdk.CfnOutput(this, 'CodePipelineUI', {
            value: ui_pipeline.ref,
            exportName: `${id}:CodePipelineUI`,
        });
        new cdk.CfnOutput(this, 'CodePipelineAPI', {
            value: api_pipeline.ref,
            exportName: `${id}:CodePipelineAPI`,
        });
        new cdk.CfnOutput(this, 'CodePipelineSimulation', {
            value: simulation_pipeline.ref,
            exportName: `${id}:CodePipelineSimulation`,
        });
        new cdk.CfnOutput(this, 'CodeConnectionARN', {
            value:  codeConnection.attrConnectionArn,
            exportName: `${id}:CodeConnectionARN`,
        });
    }
}
