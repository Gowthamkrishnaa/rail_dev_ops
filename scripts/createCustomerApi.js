const execSync = require('child_process').execSync;

(async ()=>{
    let dynamoTable = null;

    // Get Outputs from CloudFormation based off Access Key environment
    const exports = await execSync(`aws cloudformation list-exports`);
    var {Exports: results} = JSON.parse(exports.toString('utf-8'));
    results.forEach(exp => {
        if(exp.Name.includes('RailApi')) {
            if(exp.Name.includes(':DynamoDbTableName')) {
                console.log('DynamoDB Table Name', exp.Value);
                dynamoTable = exp.Value;
            }
        }
    });

    if(dynamoTable) {
        // File path requires script to be run from repo's root
        const results6 = await execSync(`aws dynamodb put-item --table-name ${dynamoTable} --item file://scripts/config/api_customer.json`);
        console.log('Created Company Record', results6.toString('utf-8'));
    }
    else {
        console.log('Failed to create customer api record');
    }
})()
