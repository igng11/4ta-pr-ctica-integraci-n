import { userDao } from "../dao/index.js";
import { UserService } from "../services/user.services.js";
import { isValidPassword } from "../utils.js";
import { generateEmailToken, recoveryEmail } from "../helpers/gmail.js";
import { validateToken, createHash} from "../utils.js";


export class SessionsController {
    static viewSessions = (req,res)=>{
        console.debug(req.session)
        if(req.session?.user?.username){
            req.session.user.visitas++;
            res.send(`Ya estas logueado ${req.session.user.username} y visitaste esta pagina ${req.session.user.visitas} veces.`);
            console.debug(req.session);
        } else {
            res.send("necesitas estar logueado <br> <a href=/login>Ir a login</a>")
        }
    }

    static signupSession = async(req,res)=>{
        try {
            const signupForm = req.body;
            // console.info("Received POST request:", signupForm);
            //verificar si el usuario ya se registro
            const user = await userDao.getByEmail(signupForm.email);
            // console.debug(user);
            if(user){
                return res.render("signup",{error:"el usuario ya esta registrado"});
            }
            const newUser = {
                first_name:signupForm.first_name,
                email:signupForm.email,
                password: createHash(signupForm.password)
            }
            const result = await userDao.save(newUser);
            res.render("login",{message:"usuario registrado"});
        } catch (error) {
            res.render("signup",{error:error.message});
        }
    }

    static loginSessions = async(req,res)=>{
        try {
            const loginForm = req.body;
            //verificar si el usuario ya se registro
            const user = await userDao.getByEmail(loginForm.email);
            if(!user){
                return res.render("login",{message:"Ingrese sus credenciales"});
            }
            //si el usuario existe, validar la contraseña
            if(isValidPassword(user,loginForm.password)){
                //si la contraseña es valida, creamos la session
                req.session.userInfo = {
                    first_name:user.first_name,
                    email:user.email
                };
                // Redirige al perfil del usuario.
                console.log(req.session.userInfo);
                res.redirect("/profile");
            } else {
                // Redirige a la página de inicio de sesión con un mensaje de error.
                return res.render("login",{error:"Credenciales invalidas <a href=/signup>Registrarse</a>"});
            }
        } catch (error) {
            // Maneja errores, por ejemplo, muestra un mensaje de error en la página de inicio de sesión.
            res.render("login",{error:error.message});
        }
    };


    static profileSessions = async(req,res)=>{
        try {
            const loginForm = req.body;
            // console.debug(loginForm);
            //verificar si el usuario ya se registro
            const user = await userDao.getByEmail(loginForm.email);
            if(!user){
                return res.render("profile",{error:"El usuario no se ha registrado"});
            }
            //si el usuario existe, validar la contraseña
            if(isValidPassword(user,loginForm.password)){
                //si la contraseña es valida, creamos la session
                req.session.userInfo = {
                    first_name:user.first_name,
                    email:user.email
                };
                console.log(req.session.userInfo);
                res.redirect("/profile");
            } else {
                return res.render("login",{error:"Credenciales invalidas. Si olvidó su contraseña puede restaurarla"});
            }
        } catch (error) {
            res.render("profile",{error:error.message});
        }
    }

    // static logoutSessions = (req,res)=>{
    //     req.session.destroy(error=>{
    //         // console.log("userInfo: ", req.session.userInfo);
    //         console.log("session finalizada, session = ",req.session);
    //         if(error) return res.render("profile",{user: req.session.userInfo, error:"No se pudo cerrar la sesion"});
    //         res.redirect("/login");
    //     })
    // }

    static logout = async(req,res)=>{
        try {
            const user = req.user;
            user.last_connection= new Date();
            await UserService.updateUser(user._id, user);
            await req.session.destroy();
            res.json({status:"success", message:"sesion finalizada"});
        } catch (error) {
            console.log(error);
            res.json({status:"error", message:"No se pudo cerrar la sesion"});
        }
    }

    static loginGitSessions = (req,res)=>{
        console.debug('GitHub authentication successful, redirecting to /profile');
        req.session.userInfo = {
            first_name: req.user.first_name,
            email: req.user.email
        };
        res.redirect("/profile");
    }

    static registroSessions = (req,res)=>{
        res.render("signup");
    }

    static perfilSessions = (req,res)=>{
        console.debug(req.session);
        res.render("profile",{user: req.session.userInfo});
    }

    static forgotPassword = async(req,res)=>{
        try {
            const {email} = req.body;
            const user = await UserService.getUserByEmail(email);
            if(!user){
                return res.json({status:"error", message:"No es posible restablecer la constraseña"});
            }
            //generamos el token con el link para este usuario
            const token = generateEmailToken(email,3600); //token de 3 min.
            //Enviar el mensaje al usuario con el enlace
            await recoveryEmail(req,email,token);
            res.send("Correo enviado, volver a <a href=/login>login</a>");
        } catch (error) {
            console.error(error);
            res.json({status:"error", message:"No es posible restablecer la constraseña (recovery)"});
        }
    };

    static resetPassword = async(req,res)=>{
        try {
            const token = req.query.token;
            const {newPassword} = req.body;
            const validEmail = validateToken(token);
            if(validEmail){//token correcto
                const user = await UserService.getUserByEmail(validEmail);
                if(user){
                    user.password = createHash(newPassword);
                    await UserService.updateUser(user._id,user);
                    res.send("Contraseña actualizada <a href='/login'>Ir al login</a>")
                }
            } else {
                return res.send("El token ya caduco, volver a intentarlo <a href='/forgot-password'>Restablecer contraseña</a>");
            }
        } catch (error) {
            console.error(error);
            res.send("No se pudo restablecer la contraseña, volver a intentarlo <a href='/forgot-password'>Restablecer contraseña</a>");
        }
    };

    static redirectLogin = (req,res)=>{
        res.redirect("/login");
    };

    static failSignup = (req,res)=>{
        res.json({status:"error", message:"No se pudo registrar al usuario"});
    };

    static successSignup = (req,res)=>{
        res.json({status:"success", message:"registro exitoso"});
    };

    static successLogin = (req,res)=>{
        res.json({status:"success", message:"login exitoso"});
    };
    static renderProfile = (req,res)=>{
        const user = req.user;
        console.log("user", user);
        res.render("profile",{user});
    };

    static failLogin = (req,res)=>{
        res.json({status:"error", message:"No se pudo Loguear al usuario"});
    };
}