import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
export const __dirname = path.dirname(fileURLToPath(import.meta.url));
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";


//disckstorage => almacenamiento en memoria
const storageFiles = multer.diskStorage({
    //destino de las imagenes a guardar
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,"/public/img"))
    },
    //filename: nombre del archivo a guardar
    filename: function(req,file,cb){
        cb(null,Date.now()+"-"+file.originalname)
    }
});

//mildware del multer
export const uploader = multer({storage:storageFiles});

export const createHash = (password)=>{
    return bcrypt.hashSync(password,bcrypt.genSaltSync());
};

export const isValidPassword = (userDB,password)=>{
    return bcrypt.compareSync(password,userDB.password);
}

//token gmail para que el link mantenga el token actualizado
export const validateToken = (token)=>{
    try {
        const info = jwt.verify(token,config.gmail.secretToken);
        return info.email;
    } catch (error) {
        console.log("Error con el token", error.message);
        return null;
    }
};

//MULTER
//filtro para nuestra carga de imagenes de perfil
const multerProfileFilter = (req,file,cb)=>{
    const valid = checkValidFields(req.body);
    if(valid){
        cb(null, true);
    } else {
        cb(null, false);
    }
}

//configuracion para guardar las imagenes de los usuarios
const profileStorage = multer.diskStorage({
    //donde voy a guardar los archivos
    destination: function(req,file,cb){
        cb(null, path.join(__dirname,"/multer/users/img"))
    },
    //con que nombre vamos a guardar el archivo.
    filename: function(req,file,cb){
        cb(null, `${req.body.email}-perfil-${file.originalname}`)
    }
});
//creamos uploader de profiles images
export const uploaderProfile = multer({storage:profileStorage, fileFilter:multerProfileFilter});


//configuracion para guardar las imagenes de los productos
const productsStorage = multer.diskStorage({
    //donde voy a guardar los archivos
    destination: function(req,file,cb){
        cb(null, path.join(__dirname,"/multer/products/img"))
    },
    //con que nombre vamos a guardar el archivo.
    filename: function(req,file,cb){
        cb(null, `${req.body.code}-product-${file.originalname}`)
    }
});
//creamos uploader de images de productos
export const uploaderProduct = multer({storage:productsStorage});


//configuracion para guardar los documentos de los usuarios
const documentsStorage = multer.diskStorage({
    //donde voy a guardar los archivos
    destination: function(req,file,cb){
        cb(null, path.join(__dirname,"/multer/users/documents"))
    },
    //con que nombre vamos a guardar el archivo.
    filename: function(req,file,cb){
        cb(null, `${req.user.email}-documento-${file.originalname}`)
    }
});
//creamos uploader de profiles images
export const uploaderDocuments = multer({storage:documentsStorage});