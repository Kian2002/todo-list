const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const { ATLAS } = require("./config"); // Uncomment this line if you are using a local config file
const ATLAS = process.env.ATLAS;

mongoose.set("strictQuery", true);

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect(ATLAS);

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("list", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const pencil = new Item({ name: "Welcome to your todo list!" });
const pen = new Item({ name: "<-- Click to remove an item." });
const eraser = new Item({ name: "Hit the + to add an item." });

const defaultItems = [pencil, pen, eraser];

app.get("/", (req, res) => {
  Item.find({}, (err, results) => {
    if (results.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: results });
    }
  });
});

app.get("/list/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();

        res.redirect("/list/" + customListName);
      } else {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, results) => {
      if (err) {
        console.log(err);
      } else {
        results.items.push(item);
        results.save();
        res.redirect("/list/" + listName);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(id, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        console.log("Item deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: id } } },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          Item.findByIdAndRemove(id, (err) => {
            if (err) {
              console.log(err);
              res.redirect("/list/" + listName);
            } else {
              console.log("Item deleted");
              res.redirect("/list/" + listName);
            }
          });
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port 3000");
});
