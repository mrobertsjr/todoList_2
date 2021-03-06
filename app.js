const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

const dburl = process.env.DATABASEURL || 'mongodb://localhost:27017/todolistDB'

mongoose.connect(dburl, {
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useFindAndModify: false 
});

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({
  name: 'Welcome to your todo list'
});

const item2 = new Item ({
  name: 'Hit the + button to add a new item'
});

const item3 = new Item ({
  name: '<-- Hit this to delete an item'
});

const defaultItems = [item1, item2, item3];

const listSchema = ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res){
  // const day = date.getDate();
  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err)
          } else {
            console.log('Successfully inserted items!')
            res.redirect('/');
          }
        });
      } else {
        res.render('list', {listTitle: 'Today', newListItems: foundItems});
      }
    }
  });
});

app.get('/:listName', function(req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, function(err, foundList) {
    if (!err) {
      if(foundList) {
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      } else {
        const list = new List ({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + listName);
      }
    }
  });
});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
});

app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log('Successfully deleted item');
        res.redirect('/');
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }
});


app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on port 3000.");
});