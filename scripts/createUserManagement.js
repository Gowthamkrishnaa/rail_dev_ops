
const execSync = require('child_process').execSync;

(async ()=>{
    const userName = process.env.ADMIN_USER || 'paul.a.peccia@loram.com';
    const customAuth = `Name="custom:auth",Value="'{\\"role\\":\\"loram\\",\\"landingPageModuleKey\\":\\"dash\\",\\"created\\":\\"2022-01-01T00:00:00.000Z\\",\\"modified\\":\\"2022-02-03T19:03:58.529Z\\",\\"customerId\\":\\"453c2512-fea2-5904-9951-c55a8e672050\\",\\"modules\\":[\\"dash\\",\\"rail\\"]}'"`;
    const customMeta = `Name="custom:meta",Value="'{\\"created\\":\\"2022-01-25T14:39:13.293Z\\",\\"modified\\":\\"2022-02-09T21:58:13.244Z\\"}'"`;

    console.log('Getting User Management Exports');
    // Set Default Values
    var dynamoTable = 'RailUserManagementDev-Table-T9G3O89RP998';
    var userPoolId = 'us-east-1_F0WrFkYpS';
    // Get Outputs from CloudFormation based off Access Key environment
    const exports = await execSync(`aws cloudformation list-exports`);
    var {Exports: results} = JSON.parse(exports.toString('utf-8'));
    results.forEach(exp => {
        if(exp.Name.includes('RailUserManagement')) {
            if(exp.Name.includes(':tableName')) {
                console.log('DynamoDB Table Name', exp.Value);
                dynamoTable = exp.Value;
            }
            else if(exp.Name.includes(':UserPoolId')) {
                console.log('UserPool Id', exp.Value);   
                userPoolId = exp.Value;
            }
        }
    });

    console.log('Starting to initialize Rail User Management Stack');

    const results1 = await execSync(`aws cognito-idp admin-create-user --user-pool-id ${userPoolId} --username ${userName}`);
    console.log('Created User', results1.toString('utf-8'))

    const results2 = await execSync(`aws cognito-idp admin-update-user-attributes --user-pool-id ${userPoolId} --username ${userName} --user-attributes ${customAuth}`);
    console.log('Added Custom:Auth', results2.toString('utf-8'));

    const results3 = await execSync(`aws cognito-idp admin-update-user-attributes --user-pool-id ${userPoolId} --username ${userName} --user-attributes ${customMeta}`);
    console.log('Added Custom:Meta', results3.toString('utf-8'));

    const results4 = await execSync(`aws cognito-idp admin-update-user-attributes --user-pool-id ${userPoolId} --username ${userName} --user-attributes Name="given_name",Value="Admin"`);
    console.log('Added GivenName', results4.toString('utf-8'));
    
    const results5 = await execSync(`aws cognito-idp admin-update-user-attributes --user-pool-id ${userPoolId} --username ${userName} --user-attributes Name="family_name",Value="Loram"`);
    console.log('Added FamilyName', results5.toString('utf-8'));

    // File path requires script to be run from repo's root
    const results6 = await execSync(`aws dynamodb put-item --table-name ${dynamoTable} --item file://scripts/config/user_customer.json`);
    console.log('Created Company Record', results6.toString('utf-8'));
})()
