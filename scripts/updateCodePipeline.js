const execSync = require('child_process').execSync;
const fs = require('fs');

/* Required parameter for new source branch 
node -r dotenv/config updateCodePipeline.js <branch_name> <list of either UI,API,SIM>
*/
const newSource = process.argv.length > 1 && process.argv[2] || 'main'; // "ppeccia/PLAT-36"
const toModify = process.argv.length > 2 && process.argv[3] || ''; // "UI,API,SIM"
const fileNames = {
    'UI': {
        'file': 'ui_pipeline_output',
        'label': 'PlatformUI'
    },
    'API': {
        'file': 'api_pipeline_output',
        'label': 'PlatformAPI',
    },
    'SIM': {
        'file': 'sim_pipeline_output',
        'label': 'PlatformSimulation',
    } 
};

(async() => {
    console.log(`🚨 Updating CodePipeline for UI to use source branch of ${newSource}`)
    try {
        const pipelinesToModify = toModify.split(",");

        console.log("Processing for Pipelines: ", pipelinesToModify)

        const pipelineList = await execSync(`aws codepipeline list-pipelines`);
        const {pipelines} = JSON.parse(pipelineList.toString('utf-8'));

        await Promise.all(pipelinesToModify.map(async pipeline => {
            const [{name: pipelineName} = platformUi] = pipelines.filter(p => p.name.search(fileNames[pipeline]['label']) >= 0)
            const getPipelineRes = await execSync(`aws codepipeline get-pipeline --name ${pipelineName}`);
            const found_pipeline = JSON.parse(getPipelineRes.toString('utf-8'));
            found_pipeline.pipeline.stages[0].actions[0].configuration.BranchName = newSource;
            delete found_pipeline.metadata;

            await fs.promises.writeFile(`./scripts/output/${fileNames[pipeline]['file']}.json`, JSON.stringify(found_pipeline));
            await execSync(`aws codepipeline update-pipeline --cli-input-json file://./scripts/output/${fileNames[pipeline]['file']}.json`);
            console.log("Finished Updating:", found_pipeline)
        }))
    }
    catch(err) {
        console.log(err);
    }
})()
