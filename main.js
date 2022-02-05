const express = require('express');
var cors = require('cors')
var HOST_NAME = 'localhost';
var PORT_EXT = 3004;
var app = express();


var router = express.Router();
var bodyParser = require("body-parser");

const fs = require('fs');
const { promisify } = require('util')
// TO USE IT ASYNC maybe writeFileSync() is better
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

// add it to allow files and not get a payload to long 413 error
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(cors())
app.options('*', cors());
app.use(router);


app.listen(PORT_EXT, HOST_NAME, function () {
    console.log("Server listen  http://" + HOST_NAME + ":" + PORT_EXT);
});


router.route('/scenarios')
    .get(async function (req, res) {
        const scenariosFolders = 'data/scenarios';
       const scenariosData = fs.readdirSync(scenariosFolders).map(  folder => {
           const scenario =  fs.readdirSync(scenariosFolders+'/'+folder).reduce( (acumulator,subContent) => {
               if(subContent.includes('.json')){
                   const data = fs.readFileSync(scenariosFolders+'/'+folder+'/'+subContent)
                   const dataParsed = JSON.parse(data)
                   dataParsed.title = folder
                   const reponsesData =  dataParsed.properties.questions.default
                   dataParsed.properties.questions.default = reponsesData.map(reponseData => {
                       if (reponseData.responses.Images){
                           reponseData.responses.Images = reponseData.responses.Images.map(image => {
                               const image_in_base64  = fs.readFileSync(image.path, 'base64');
                               // we must get the extension of file
                               const fileExt = image.path.split('.')[1]
                               image.file = 'data:image/'+fileExt+';base64,'+image_in_base64;
                               delete image.path
                               return image;
                           })
                       }
                       if (reponseData.responses.Videos){
                           reponseData.responses.Videos = reponseData.responses.Videos.map(video => {
                               const video_in_base64  = fs.readFileSync(video.path, 'base64');
                               // we must get the extension of file
                               const fileExt = video.path.split('.')[1]
                               video.file = 'data:image/'+fileExt+';base64,'+video_in_base64;
                               delete video.path
                               return video;
                           })
                       }
                       return reponseData;
                   })
                   // maybe get the files and change them in base 64 ?
                   acumulator = {...acumulator,...dataParsed };
               }
               return acumulator
           },{});
           return scenario
       });
        res.json(scenariosData);

    })
    .post( async (req, res) => {
        let schema = req.body.data;
        // first we need to create a direcory
        // if the directory alredy exist we try a dirName1 in recursive ? like windaube do
        const mainDirectoryName =  'data/scenarios/' + req.body.fileName
        if (!fs.existsSync(mainDirectoryName)){
            fs.mkdirSync(mainDirectoryName,{ recursive: true });
            fs.mkdirSync(mainDirectoryName+'/images');
            fs.mkdirSync(mainDirectoryName+'/videos');
        }
        if (schema.properties.questions){
            let i = 0;
            for await (question of schema.properties.questions.default) {
                //const question = schema.properties.questions[i];
                // we need to separate the files
                // after we save the files and we get te path of each file
                // add the path to the questionnary
                if (question.responses){
                question.responses.Images = await Promise.all(question.responses.Images.map(async (image) => {
                    let base64Array = image.file.split(';base64,');
                    const type = base64Array[0].split('data:image/')[1];
                    const path = mainDirectoryName + '/images/' + image.title + '.' + type;
                    await writeFileAsync(path, base64Array[1], {encoding: 'base64'});
                    delete image.file;
                    return {path: path, ...image}
                }));
                question.responses.Videos = await Promise.all(question.responses.Videos.map(async (video) => {
                    let base64Array = video.file.split(';base64,');
                    const type = base64Array[0].split('data:video/')[1];
                    const path = mainDirectoryName + '/videos/' + video.title + '.' + type;
                    await writeFileAsync(path, base64Array[1], {encoding: 'base64'});
                    delete video.file;
                    return {path: path, ...video}
                }));
                    schema.properties.questions.default[i] = question;
                    i++;

                }

            }
        }
        const jsonContent = JSON.stringify(schema);
        const fullPath = mainDirectoryName+'/'+req.body.fileName+'.json';
        await writeFileAsync( fullPath, jsonContent, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
        });

        res.json({data : req.body,
            methode: req.method});
    })
    .delete(function (req, res) {
        const scenariosFolders = 'data/scenarios/';
        let scenarioName = req.body.title;
        let targetDir = scenariosFolders + scenarioName;
        if (fs.existsSync(targetDir)){
            fs.rmSync(targetDir, { recursive: true, force: true });
            res.json('Scenario deleted');
        }else {
            res.json('Scenario not found');
        }




    })
    .put(function (req, res) {

    });
