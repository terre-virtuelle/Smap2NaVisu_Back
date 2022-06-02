const fs = require('fs');
const {default: axios} = require("axios");

class ScenarioModel {
    constructor(datas, scenariosFolders) {
        this.fileName = datas.fileName;
        this.title = datas.title;
        this.description = datas.description;
        this.origin = datas.origin;
        this.date = datas.date;
        this.bbox = datas.bbox;
        this.introduction = datas.introduction;
        this.questions = datas.questions ? datas.questions : [];
        this.imgIndex = 1;
        this.videoIndex = 1
        this.cmd = "scenario"
        this.scenariosFolders = scenariosFolders
    }

    getScenario() {
        return {
            fileName: this.fileName,
            title: this.title,
            description: this.description,
            origin: this.origin,
            date: this.date,
            bbox: this.bbox,
            introduction: this.introduction,
            questions: this.questions,
            cmd: this.cmd
        };
    }

    formatForRes() {
        this.questions = this.questions.map((question) => {
            if (question.response) {
                question.response.Images = this.formatImagesForRes(question.response.Images);
                question.response.Videos = this.formatVideosForRes(question.response.Videos);
            }
            return question;
        })
    }

    formatImagesForRes(imagesArray) {
        try {
            return imagesArray.map(image => {
                const image_in_base64 = fs.readFileSync(image.path, 'base64');
                // we must get the extension of file
                const fileExt = image.path.split('.')[1];
                image.file = 'data:image/' + fileExt + ';base64,' + image_in_base64;
                delete image.path;
                return image;
            })
        } catch (er) {
            console.log(er)
        }
    }

    formatVideosForRes(videosArray) {
        try {
            return videosArray.map(video => {
                const video_in_base64 = fs.readFileSync('../ApiRestNaVisu4D' + video.path, 'base64');
                // we must get the extension of file
                const fileExt = video.path.split('.')[1];
                video.file = 'data:image/' + fileExt + ';base64,' + video_in_base64;
                delete video.path;
                return video;
            })
        } catch (er) {
            console.log(er)
        }
    }

   async save(fileName) {
        try {
            this.mainDirectoryName = this.scenariosFolders + '/' + fileName;
            this.checkDirectory();
            this.saveQuestions();
            const jsonContent = JSON.stringify(this.getScenario());
            const fullPath = this.mainDirectoryName + '/' + fileName + '.json';
            fs.writeFileSync(fullPath, jsonContent, 'utf8');
            await this.exportScenario(fileName);
        } catch (er) {
            console.log(er)
        }
    }

    checkDirectory() {
        if (!fs.existsSync(this.mainDirectoryName)) {
            fs.mkdirSync(this.mainDirectoryName, {recursive: true});
            fs.mkdirSync(this.mainDirectoryName + '/images');
            fs.mkdirSync(this.mainDirectoryName + '/videos');
        }
    }

    saveQuestions() {
        this.questions = this.questions.map((question) => {
            if (question.response
            ) {
                question.response.Images = this.saveImages(question.response.Images);
                question.response.Videos = this.saveVideos(question.response.Videos);
            }
            return question;
        })
    }

    saveImages(imagesArray) {
        try {
            return imagesArray.map((image) => {
                let base64Array = image.file.split(';base64,');
                const type = base64Array[0].split('data:image/')[1];
                const imageName = 'img' + this.imgIndex;
                const path = this.mainDirectoryName + '/images/' + imageName + '.' + type;
                fs.writeFileSync(path, base64Array[1], {encoding: 'base64'});
                delete image.file;
                this.imgIndex++;
                return {path: path, ...image}
            });
        }
     catch (er) {
        console.log(er)
    }
    }

    saveVideos(VideosArray) {
        try{
        return VideosArray.map((video) => {
            let base64Array = video.file.split(';base64,');
            const type = base64Array[0].split('data:video/')[1];
            const videoName = 'video' + this.videoIndex;
            const path = this.mainDirectoryName + '/videos/' + videoName + '.' + type;
            fs.writeFileSync(path, base64Array[1], {encoding: 'base64'});
            delete video.file;
            this.videoIndex++;
            return {path: path, ...video}
        });
        } catch (er) {
            console.log(er)
        }
    }

    async exportScenario(fileName) {
        const exportUrl = 'http://93.90.200.21:3003/export?cmd=scenario&origin=TV&target=' + fileName;
       await axios.put(exportUrl);


    }


}

module.exports = ScenarioModel
