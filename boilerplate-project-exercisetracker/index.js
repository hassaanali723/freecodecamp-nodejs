const express = require('express')
const app = express()
const cors = require('cors')
// require('dotenv').config()
require('dotenv').config({ path: 'sample.env' });
const BodyParser = require("body-parser");
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

var subSchema = mongoose.Schema({ 

},{ _id : false }); 


const {Schema} = mongoose;
const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  log:[
    
    { 
      _id: false,
      description:{
      type: String,
    },
      duration:{
        type: Number
      },
      date:{
        type: Date
      }
    }
  ]
})


const User = mongoose.model('User',userSchema);

app.use(
  BodyParser.urlencoded({
    extended: false,
  })
);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',(req,res) => {
  const { username: reqUser } = req.body;
  console.log(reqUser);
  User.findOne({username: reqUser}, (err, resUser) => {
    if (err){
      console.log('findOne error')
    }
    if(resUser){
      res.send("Username already registered")
    }
     else{
    let newUser = new User({username: reqUser,log:[]})
    newUser.save((err, savedUser) => {
      if(err){
        console.log(err)
      }
      const {username, _id} = savedUser;
      res.json({username,_id});
    })
  }
    
  })
   
  
})

app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    if (err) return;
    res.json(users);
    console.log(users);
  });
});

app.post('/api/users/:_id/exercises',(req,res) => {
  const {description, duration, date } = req.body; 
  const {_id} = req.params;
  console.log(_id);
  console.log(req.params);
  console.log(req.body);
  const log = {
    description,
    duration,
    date
  }
  User.findOneAndUpdate({_id},
                        {
                           $push: {
                                  log
                                  }
                        }, 
                        {new: true},
                       (err, userFound) => {
                         if (err){console.log("findOneAndUpdate error")}
                         console.log(userFound);
                         if(userFound !== null){
                           console.log("here");
                           const {username} = userFound;
                           res.json({
                             _id,
                             username,
                             description,
                             duration,
                             date: new Date(date).toDateString()
                           })
                         }
                         else{
                           res.send('unknown id')
                         }
                         
                       })
})

app.get('/api/users/:id/logs',(req,res) => {
  const {id } = req.params;
  console.log(id);
  User.findOne({_id: id}, (err, userFound) => {
    if(err) console.log('finOne error');
    console.log(userFound);
    if (userFound){
      const {from, to, limit} = req.query;
      console.log(from);
      const { username, log } = userFound;
      let responseLog = [...log];
      console.log(responseLog);
      if(from) {
        console.log('from')
        responseLog = responseLog.filter(exercise => exercise.date > from);
      }
      if (to){
        console.log('to')
        responseLog = responseLog.filter(exercise => exercise.date < to);
      }
      if(limit){
        console.log('limit')
      responseLog = responseLog.slice(0, limit);
    }

       responseLog = responseLog
        .sort((firstExercise, secondExercise) => firstExercise.date > secondExercise.date)
        .map(exercise => ({
          // detail the fields of the output formatting the date into the desired format
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        }));
      
      res.json({
      _id: userFound._id,
      username: userFound.username,
      count: responseLog.length,
      log: responseLog
    });
      
    }
    else{
      res.send('User not found')
    }
    
  })
} )


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
