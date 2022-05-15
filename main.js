const express = require('express');
var cors = require('cors')
var HOST_NAME = 'localhost';
var PORT_EXT = 3004;
var app = express();
const axios = require('axios').default;

var router = express.Router();
var bodyParser = require("body-parser");

const fs = require('fs');
const {promisify} = require('util')
const ScenarioModel =  require('./ScenarioModel.js')
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
        // need change here
        const scenariosFolders = 'data/scenarios';
        const scenariosData = fs.readdirSync(scenariosFolders).map(folder => {
            // maybe a a filter is better
            const scenarioFiles = fs.readdirSync(scenariosFolders + '/' + folder).reduce((acumulator, subContent) => {
                if (subContent.includes('.json')) {
                    const data = fs.readFileSync(scenariosFolders + '/' + folder + '/' + subContent)
                    const scenarioObj = new ScenarioModel(JSON.parse(data))
                    scenarioObj.formatForRes();
                    scenarioObj.fileName = folder
                    acumulator = {...acumulator, ...scenarioObj};
                }
                return acumulator
            }, {});
            return scenarioFiles
        });
        res.json(scenariosData);

    })
    .post((req, res) => {
       const scenario = new ScenarioModel(req.body.data)
        scenario.save(req.body.fileName);
        return  res.json({
            data: req.body,
            methode: req.method
        });
    })
    .delete(function (req, res) {
        const scenariosFolders = 'data/scenarios/';
        let scenarioName = req.body.title;
        let targetDir = scenariosFolders + scenarioName;
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, {recursive: true, force: true});
            return res.json('Scenario deleted');
        } else {
            return res.json('Scenario not found');
        }
    })
    .put(function (req, res) {
    });

router.route('/scenariosExport')
    .post(async (req, res) => {
        let schema = req.body.data;
        const mainDirectoryName = 'data/scenarios/' + req.body.fileName
        const exportUrl = 'http://93.90.200.21:3003/export?cmd=scenario&origin=TV&target=' + req.body.fileName;
        axios.get(exportUrl)
            .then(function (response) {
                // handle success
                console.log(response);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                // always executed
            });
        if (!fs.existsSync(mainDirectoryName)) {
            res.json('scenario don"t exist');
        }
        return res.json({
            data: schema,
            methode: req.method
        });
    })


router.route('/scenarioFilesPath')
    .post((req, res) => {
        const main_directory_name = 'data/scenarios/' + req.body.fileName;
        if (!fs.existsSync(main_directory_name)) {
            return res.json('scenario don"t exist');
        }
        if (!fs.existsSync(main_directory_name + '/' + req.body.fileName + '.pdf')) {
            return res.json('scenario have no exports files');
        }
        let files_paths = {
            'pdf': {'name': 'export', 'path': main_directory_name + '/' + req.body.fileName + '.pdf'},
            'img': [], 'videos': []
        }
        if (fs.existsSync(main_directory_name + '/images')) {
            files_paths.img = fs.readdirSync(main_directory_name + '/images').map(imageName => {
                return {'name': imageName, 'path': main_directory_name + '/images/' + imageName};
            })
            files_paths.videos = fs.readdirSync(main_directory_name + '/videos').map(videoNAme => {
                return {'name': videoNAme, 'path': main_directory_name + '/videos/' + videoNAme};
            })
        }
        return res.json(files_paths);
    })

router.route('/dlFile')
    .get((req, res) => {
        let path = req.query.path;
        if (fs.existsSync(path)) {
            return res.download(path)
        } else {
            return res.json('scenario don"t exist');
        }


    })
