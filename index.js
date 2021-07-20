const console = require('console');
const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const Campground = require('./models/campground')
const catchAsync = require('./utilities/catchAsync')
const expressError = require('./utilities/expressError')
const { campgroundSchema } = require('./schemas.js')
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');


const mongoose = require('mongoose');  // connecting mongoose (the lines below)
mongoose.connect('mongodb://localhost:27017/yelpcamp', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(()=>{
            console.log("connected")
            })
    .catch((err)=>{
            console.log("error")
            console.log(err)
        })

app.engine('ejs', ejsMate)        
app.set('views',path.join(__dirname,'views')); // to make the views directory sort of global
app.set('view engine','ejs');                 // to set the view engine as ejs
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))            // to have access to methods like delete, patch etc 
app.use(express.static(path.join(__dirname, 'public')))


const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/', userRoutes);
app.use('/campgrounds', campgroundsRoutes)
app.use('/campgrounds/:id/reviews', reviewsRoutes)


app.get('/',(req, res)=>{
    res.render('home')
})


app.all('*', (req, res, next) => {
    next(new expressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () =>{
    console.log("App is listening on port 3000"); // setting up the port we're listening on
})