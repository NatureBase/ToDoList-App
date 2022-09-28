const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-alam:tes123@cluster0.x1tr5i2.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = new mongoose.Schema ({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add new item."
});
const item3 = new Item({
    name: "<--- Hit this button to delete the item"
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("Lists", listSchema);

app.get("/", function(req, res) {
    const day = date.getDay();
    Item.find({}, function(err, items) {
        if (items.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully insert items to database");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: day, newItem: items});
        }
    });
});

app.get("/:input", function(req, res) {
    const customListName = _.capitalize(req.params.input);
    List.findOne({name: customListName}, function(err, foundList) {
       if (!err) {
        if (!foundList) {
            // Create a custom list
            const list = new List ({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            // display whats already there
            res.render("list", {listTitle: foundList.name, newItem: foundList.items});
        }
       } else {
        console.log(err);
       }
    });
});

app.post("/", function(req, res) {
    const newItem = req.body.addItem;
    const newList = req.body.list;
    const item = new Item ({
        name: newItem
    });
    if (newList === date.getDay()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: newList}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + newList);
        });
    }
});

app.post("/delete", function(req, res) {
    const deletedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === date.getDay()) {
        Item.findByIdAndDelete({_id: deletedItemId}, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Sucessfully deleted an item document");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deletedItemId}}}, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

const port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("Server has started successfully");
});