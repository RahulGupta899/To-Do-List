
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

mongoose.connect("mongodb+srv://admin-Rahul:RahulPRO2015@cluster0.iqtk2.mongodb.net/toDoListDB",{useNewUrlParser:true});

//items collection
const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({
  name:"Introduction"
});
const item2 = new Item({
  name: "To Save Item (+)"
})
const item3 = new Item({
  name: "To Delete Item (click checkbox)"
})

const defaultItems = [item1,item2,item3];

//lists Collection
const listSchema = new mongoose.Schema({
  title:String,
  items:[itemSchema]
});

const List  = new mongoose.model("List",listSchema);


app.get("/", function(req, res) {
  // Retrieving Data From DATABASE
  Item.find(function(err,dbData){
    if(dbData.length==0){ // When DB is Empty add default items in items collection
      Item.insertMany(defaultItems,function(err){
          if(!err){
            console.log("Successfully Stored Default items in items collection");
          }
      });
      res.redirect("/");
    }
    else{ // Simply pirnt existing items
      res.render("list", {listTitle: "Today" , newListItems: dbData});
    }
  });

});

// Express Dynamic Routes
app.get("/:topic",function(req, res){
  const customListTitleName = _.capitalize(_.toLower(req.params.topic));

  //Now checking if that custom list is already there in DB or not
  List.findOne({title:customListTitleName},function(err,result){
    if(!result){ // no such record present
      console.log("Custom List Not Already there ," +customListTitleName+" Created");
      const newCL = new List({
        title:customListTitleName,
        items:defaultItems      // Initially storing default Items
      });
      newCL.save();
      res.redirect("/"+customListTitleName);
    }
    else{
      console.log("Already exist!");
      res.render("list",{listTitle:customListTitleName,newListItems:result.items});
    }
  });
});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listTitle = req.body.listTitle;
  console.log(listTitle);

  //Create new document
  const newItem = new Item({
    name:item
  });

  if(listTitle === "Today"){ // Then directly store into items collection
    console.log("Stored in Items collection");
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({title:listTitle},function(err,foundRes){
        foundRes.items.push(newItem);
        foundRes.save();
        res.redirect("/"+listTitle);
    });
  }
});

app.post("/delete",function(req,res){
  const clickedItemId = req.body.clickedInputId;
  const listTitleName = req.body.listTitle;
  console.log(listTitleName);

  if(listTitleName === "Today"){
    Item.findByIdAndRemove(clickedItemId,function(err){ // To Remove the record From DB, whose id is specified
      if(!err){
        console.log("Successfully Deleted Item having id: "+clickedItemId);
      }
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({title:listTitleName}, {$pull: {items:{_id:clickedItemId}}}, function(err,result){
      if(!err){
        console.log("Removed item Successfully from ,"+listTitleName);
        res.redirect("/"+listTitleName);
      }
    });
  }

});
