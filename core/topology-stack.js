
const cdk = require('aws-cdk-lib');
const sqs = require('aws-cdk-lib/aws-sqs');
const sns = require('aws-cdk-lib/aws-sns');

const topology = require('./config/topology.json');
const CfnQueuePolicy = sqs.CfnQueuePolicy;
const CfnSubscription = sns.CfnSubscription;

module.exports = class TopologyStack extends cdk.Stack {
    constructor(parent, id, props) {
        super(parent, id, props);

        const subscriptions = [];
        const topics = [];
        const queues = [];

        /* Creates SQS Topics for each domain */
        topology.domains.map(domain => {
            const topicName = `tpc${domain.name}`;
            // Topic
            const tpc = new sns.Topic(this, topicName);
            new cdk.CfnOutput(this, `tpcArn${domain.name}`, { value: tpc.topicArn, exportName: `${id}:tpcArn${domain.name}`});
            topics.push(tpc);

            // Dead Letter Queue
            const dlq = new sqs.Queue(this, `dlq${domain.name}`, {});

            // Message Queue
            const queueName = `mq${domain.name}`;
            const mq = new sqs.Queue(this, queueName, {
                visibilityTimeout: cdk.Duration.seconds(300),
                deadLetterQueue: {
                    queue: dlq,
                    maxReceiveCount: 25
                }
            });
            new cdk.CfnOutput(this, `mqArn${domain.name}`, { value: mq.queueArn, exportName: `${id}:mqArn${domain.name}`});
            new cdk.CfnOutput(this, `mqUrl${domain.name}`, { value: mq.queueUrl, exportName: `${id}:mqUrl${domain.name}`});
            queues.push(mq);

            domain.subscriptions.map(sub => {
                const domainSub = sub;
                domainSub.domain = domain.name;
                subscriptions.push(domainSub);
            });
        });

        /* Create IAM Policy's for each domain topic to send messages */
        for (let i = 0; i < topology.domains.length; i++) {
            const domain = topology.domains[i];
            const domainQueue = queues.find(q => q.node.id === `mq${domain.name}`);
            const statements = domain.subscriptions.map(s => {
                const subTopic = topics.find(t => t.node.id === `tpc${s.name}`);
                return {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 'SQS:SendMessage',
                    Resource: domainQueue.queueArn,
                    Condition: {
                        ArnEquals: {
                            'aws:SourceArn': subTopic.topicArn
                        }
                    }
                };
            });
            if (statements.length > 0) {
                new CfnQueuePolicy(this, `mqPol${domain.name}`, {
                    queues: [domainQueue.queueUrl],
                    policyDocument: {
                        Statement: statements
                    }
                });
            }
        }

        // Create Topic Subscriptions 
        subscriptions.map(sub => {
            const topicNames = topics.map(topic => {
                return topic.node.id;
            });

            const queueNames = queues.map(queue => {
                return queue.node.id;
            });

            if (!(topicNames.indexOf(`tpc${sub.name}`) > -1)) {
                console.log(`${sub.name} topic not configured.`);
                process.exit(1);
            }
            const subTopic = topics[topicNames.indexOf(`tpc${sub.name}`)];

            if (!(queueNames.indexOf(`mq${sub.domain}`) > -1)) {
                console.log(`${sub.domain} queue not configured.`);
                process.exit(1);
            }
            const domainQueue = queues[queueNames.indexOf(`mq${sub.domain}`)];
            new CfnSubscription(this, `tpcSub${sub.domain}To${sub.name}`, {
                endpoint: domainQueue.queueArn,
                protocol: sns.SubscriptionProtocol.SQS,
                topicArn: subTopic.topicArn,
                rawMessageDelivery: true,
                filterPolicy: sub.filterPolicy
            });
        });

        new cdk.CfnOutput(this, 'version', {
            value: process.env.VERSION,
            exportName: `${id}:version`
        });
    }
}
