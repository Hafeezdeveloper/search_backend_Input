const express = require("express");
const CategoryModel = require("../../Models/Category/Category");
const CategoryRouter = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { sendResponse } = require("../../Helper/helper");
const uploadFile = require("../../Helper/Firebase/FirebaseBuket");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../uploads/');
        // Check if the directory exists, create it if not
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, `${new Date().getTime()}-${file.originalname}`);
    }
});

CategoryRouter.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

const upload = multer({ storage: storage });

CategoryRouter.get("/getCategory/all", async (req, res) => {
    try {
        let result = await CategoryModel.find({}).sort({ id: -1 })
        if (!result) {
            res.send(sendResponse(false, null, "Data Not Found", "error")).status(400)
        } else {
            res.send(sendResponse(true, result, "Data Found", "succes")).status(200)
        }
    } catch (error) {
        res.send(sendResponse(true, null, "Internal error ", "errr")).status(400)
    }

})


CategoryRouter.get("/getCategory/search", async (req, res) => {
    try {
        let q = req.query.q || 0 // skip
        let pageLimt = req.query.pageLimt || 10 // limit 
        let { name } = req.body  // search 

        let result;
        if (q || name) {
        // if lenght bejay gah 1 time 10 length then  2 time 20 length tu 10 skip hotay rhe ge
            result = await CategoryModel.find({ name: { $regex: name, $options: 'i' } }).limit(pageLimt).skip(q);
        } else if (pageLimt) {
            // if srif 20 ya 25 ya 30 ka case hoga tu aysy he uth kr ay jae gah 
            result = await CategoryModel.find({}).limit(pageLimt).skip(q);
        } else {
            result = await CategoryModel.find({}).limit(10);
        }
        if (!result || result.length === 0) {
            res.status(400).send(sendResponse(false, null, "Data Not Found", "error"));
        } else {
            res.status(200).send(sendResponse(true, result, "Data Found", "success"));
        }
    } catch (error) {
        res.status(500).send(sendResponse(false, null, "Internal error", "error"));
    }
});

CategoryRouter.get("/getCategory/all/search", async (req, res) => {
    try {
        let result = await CategoryModel.find({})
        if (!result) {
            res.send(sendResponse(false, null, "Data Not Found", "error")).status(400)
        } else {
            res.send(sendResponse(true, result, "Data Found", "succes")).status(200)
        }
    } catch (error) {
        res.send(sendResponse(true, null, "Internal error ", "errr")).status(400)
    }

})

CategoryRouter.post("/category/save", upload.single("img"), async (req, res) => {
    let { name, stockQuantity } = req.body
    console.log("Awd", req.file.path)
    try {
        let img = await uploadFile(req.file.path, req.file.filename)
        let obj = { name, stockQuantity, img }
        let arrRequired = ["name", "stockQuantity"]
        let errArr = []
        arrRequired.map((x) => {
            if (!obj[x]) {
                errArr.push(x)
            }
        })
        if (errArr.length > 0) {
            res.send(sendResponse(false, errArr, "Enter required Feilds", "error"))
        } else {
            let result = new CategoryModel(obj)
            await result.save()
            if (!result) {
                res.send(sendResponse(false, null, "Data Not save", "error")).status(404)
            } else {
                res.send(sendResponse(true, result, "Data save sucessfully", "succes")).status(200)
            }
        }

    } catch (e) {
        console.log(e)
    }
})


CategoryRouter.put("/category/save/:categoryId", upload.single("img"), async (req, res) => {
    try {
        const id = req.params.categoryId
        let { name,   stockQuantity , numberofProduct , StockWorth } = req.body
        let obj = { name ,  stockQuantity , numberofProduct , StockWorth }
        obj.img = ""
        if (req.file) {
            let image = await uploadFile(req.file.path, req.file.filename)
            obj.img = image
        } else {
            obj.img = req.body.img
        }

        let catId = await CategoryModel.findById(id)
        if (!catId) {
            res.send(sendResponse(false, null, "Data Id Not Found", "error")).status(404)
        } else {
            let result = await CategoryModel.findByIdAndUpdate(id,  obj , { new: true })
            if (!result) {
                res.send(sendResponse(false, null, "Data Not Update", "error")).status(404)
            } else {
                res.send(sendResponse(true, result, "Data Update sucessfully", "succes")).status(200)
            }
        }

    } catch (e) {
        console.log(e)
    }
})

CategoryRouter.delete("/category/save/:categoryId", upload.single("img"), async (req, res) => {
    try {
        const id = req.params.categoryId

        let catId = await CategoryModel.findById(id)
        if (!catId) {
            res.send(sendResponse(false, null, "Data Id Not Found", "error")).status(404)
        } else {
            let result = await CategoryModel.findByIdAndDelete(id)
            
            if (!result) {
                res.send(sendResponse(false, null, "Data Not Deleted", "error")).status(404)
            } else {
                res.send(sendResponse(true, null, "Data Deleted sucessfully", "succes")).status(200)
            }
        }

    } catch (e) {
        console.log(e)
    }
})

module.exports = CategoryRouter
