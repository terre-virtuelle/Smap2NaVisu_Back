const express = require('express');
var cors = require('cors');
//var HOST_NAME = 'localhost';
var HOST_NAME = '93.90.200.21';
var PORT_EXT = 3004;
var app = express();
var router = express.Router();
var bodyParser = require("body-parser");
const fs = require('fs');
const ScenarioModel = require('./ScenarioModel.js');
const scenariosFolders = '../ApiRestNaVisu4D/data/scenarios';


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
    .get(async (req, res) => {
        try {
            // need change here
            const scenariosData = fs.readdirSync(scenariosFolders).map(folder => {
                // maybe a a filter is better
                const scenarioFiles = fs.readdirSync(scenariosFolders + '/' + folder).reduce((acumulator, subContent) => {
                    if (subContent.includes('.json')) {
                        const data = fs.readFileSync(scenariosFolders + '/' + folder + '/' + subContent)
                        const scenarioObj = new ScenarioModel(JSON.parse(data), scenariosFolders);
                        scenarioObj.formatForRes();
                        scenarioObj.fileName = folder;
                        acumulator = {...acumulator, ...scenarioObj};
                    }
                    return acumulator;
                }, {});
                return scenarioFiles;
            });
            res.json(scenariosData);
        } catch (er) {
            console.log(er);
            res.json('error', er);
        }

    })
    .post(async (req, res) => {
        try {
            const scenario = new ScenarioModel(req.body.data, scenariosFolders)
            await scenario.save(req.body.fileName);
            return res.json({
                data: req.body,
                methode: req.method
            });
        } catch (er) {
            console.log(er);
            res.json('error', er);
        }
    })
    .delete(function (req, res) {
        try {
            let scenarioName = req.body.title;
            let targetDir = scenariosFolders + scenarioName;
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, {recursive: true, force: true});
                return res.json('Scenario deleted');
            } else {
                return res.json('Scenario not found');
            }
        } catch (er) {
            console.log(er);
            res.json('error', er);
        }
    })
    .put(function (req, res) {
    });

router.route('/scenarioFilesPath')
    .post((req, res) => {
        try {
            const main_directory_name = scenariosFolders + '/' + req.body.fileName;
            if (!fs.existsSync(main_directory_name)) {
                return res.json('scenario don"t exist');
            }
            if (!fs.existsSync(main_directory_name + '/pdf/' + req.body.fileName + '.pdf')) {
                return res.json('scenario have no exports files');
            }
            let files_paths = {
                'pdf': {'name': 'export', 'path': main_directory_name + '/pdf/' + req.body.fileName + '.pdf'},
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
        } catch (er) {
            console.log(er);
            res.json('error', er);
        }
    })

router.route('/dlFile')
    .get((req, res) => {
        try {
            let path = req.query.path;
            if (fs.existsSync(path)) {
                return res.download(path)
            } else {
                return res.json('scenario don"t exist');
            }
        } catch (er) {
            console.log(er);
            res.json('error', er);
        }
    })
