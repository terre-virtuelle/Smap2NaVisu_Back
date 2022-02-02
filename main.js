const express = require('express');
var cors = require('cors')
var HOST_NAME = 'localhost';
var PORT_EXT = 3003;
var app = express();


var router = express.Router();
var bodyParser = require("body-parser");

const fs = require('fs');
const { promisify } = require('util')
// TO USE IT ASYNC maybe writeFileSync() is better
const writeFileAsync = promisify(fs.writeFile)

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
    .get(function (req, res) {
        //TODO
        const scenariosFolders = 'data/scenarios'
       const scenariosData = fs.readdirSync(scenariosFolders).map(folder => {
            console.log(folder);

          const scenario =   fs.readdirSync(scenariosFolders+'/'+folder).map(subContent => {
                console.log( 'folderContent      '   ,subContent);
                if(subContent.includes('.json')){
                    // need await
                    const dataFormated =  {}
                    fs.readFileSync(scenariosFolders+'/'+folder+'/'+subContent, (err, data) => {
                        const dataFormated =  JSON.parse(data);
                        console.log( 'dataFormated      '   ,dataFormated);

                    })
                    return dataFormated
                }

            })
           console.log( 'scenario      '   ,scenario);

           return scenario


       });
        console.log( 'scenariosData      '   ,scenariosData);

        res.json({data : {},
            methode: req.method});

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
            for (let i = 0; i < schema.questions.length; i++) {
                const question = schema.questions[i];
            // we need to separate the files
            // after we save the files and we get te path of each file
            // add the path to the questionnary
                question.responses.Images = await Promise.all(question.responses.Images.map(async (image) => {
                let base64Array = image.file.split(';base64,');
                const type = base64Array[0].split('data:image/')[1];
                const path = mainDirectoryName+'/images/'+image.title+'.'+type;
                await writeFileAsync(path, base64Array[1], {encoding: 'base64'});
                delete image.file;
                return  { path: path , ...image}
            }));
                question.responses.Videos =  await Promise.all(question.responses.Videos.map(async (video) => {
                let base64Array = video.file.split(';base64,');
                const type = base64Array[0].split('data:video/')[1];
                const path = mainDirectoryName+'/videos/'+video.title+'.'+type;
                await writeFileAsync(path, base64Array[1], {encoding: 'base64'});
                delete video.file;
                return  { path: path , ...video}
            }));
        }
        // stringify JSON Object to save it
        var jsonContent = JSON.stringify(schema);
        const fullPath = mainDirectoryName+'/'+req.body.fileName+'.json';
        await writeFileAsync( fullPath, jsonContent, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
        });

        res.json({data : req.body,
            methode: req.method});
    })
    .put(function (req, res) {

    });
