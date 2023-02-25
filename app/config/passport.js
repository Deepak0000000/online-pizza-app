const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')
const bcrypt = require("bcrypt")

function init(passport) {
    passport.use(new LocalStrategy({usernameField: 'email'},async(email,password,done) =>{
        // login 
        // check if email exists 
       const user =  await User.findOne({email:email})
       if(!user){
        return done(null,false,{message:'Email is not valid'})
       }
       bcrypt.compare(password,user.password).then(match =>{
        if(match){
            return done(null,user,{message:'Logged in succesfully'})
        }
        return done(null,false,{message:'Wrong username or password'})
       }).catch(err =>{
        return done(null,false,{message:'Something went wrong'})
       })


    }))
    // store the user id in the database that tells us user is login or logedout 
    passport.serializeUser((user,done)=>{
        done(null,user._id)
    })

    passport.deserializeUser((id,done)=>{
        User.findById(id,(err,user) =>{
            done(err,user)
        })
    })


}
module.exports = init;