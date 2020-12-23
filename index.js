const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require("mysql");
const { request } = require("express");

const db = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "admin123",
  database: "cap2_api",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/getEmployee", (req, res) => {
  // const query = req.query.variables;
  // console.log("------------------------------");
  // console.log(req.query);
  // const variables = `%_${req.query.variables}_%`;
  const sqlSelect =
    "SELECT id,user_name,gender,country,area,phone, DATE_FORMAT(dateOfBirth, '%d-%m-%Y') as date , concat(' ',id,user_name,gender,country,area,phone,' ') as filter " +
    "FROM db_people ";
  db.query(sqlSelect, (err, data) => {
    res.send(data);
    // console.log(err);
  });
});

app.get("/api/getFilterNoMask", (req, res) => {
  // const startDate = req.query.startDate;
  // const endDate = req.query.endDate;
  // // const startDate = "2020-09-09";
  // // const endDate = "2020-09-10";
  // console.log(startDate, endDate);

  const sqlSelect =
    "SELECT D.stt,D.id, D.user_name, DATE_FORMAT(D.date, '%Y-%m-%d %H:%i:%s') as date,E.gender,E.area, E.country,E.phone, DATE_FORMAT(E.dateOfBirth, '%d/%m/%Y') as birthday, concat(' ',D.id,D.user_name,E.gender,E.country,E.area,E.phone,' ') as filter " +
    "FROM db_people E Inner Join db_viewdata D on E.id = D.id ";
  db.query(sqlSelect, (err, data) => {
    // console.log(err);
    res.send(data);
  });
});

app.get("/api/getFilterMask", (req, res) => {
  const startDate = req.query.startDate;
  const sqlSelect =
    "SELECT distinct E.id, E.user_name,E.gender,E.area, DATE_FORMAT(E.dateOfBirth, '%Y-%m-%d') as date,E.country, E.phone, concat(' ',E.id,E.user_name,E.gender,E.country,E.area,E.phone,' ') as filter " +
    "FROM db_people E Left Join db_viewdata D on E.id = D.id " +
    "Where E.id NOT IN ( Select D.id From db_viewdata D " +
    " Where (D.id IS NOT NULL) AND (DATE_FORMAT(D.date,'%Y-%m-%d') = ? ))";
  db.query(sqlSelect, [startDate], (err, data) => {
    // console.log(err);
    res.send(data);
  });
});

app.delete("/api/deleteEmployee/:id", (req, res) => {
  const id = req.params.id;
  const sqlSelect = "Delete From db_people Where id = ? ";
  db.query(sqlSelect, [id], (err, data) => {
    // console.log(err);
  });
});

app.put("/api/updateEmployee", (req, res) => {
  const id = req.body.id;
  const user_name = req.body.user_name;
  const gender = req.body.gender;
  const dateOfBirth = req.body.dateOfBirth;
  const country = req.body.country;
  const area = req.body.area;
  const phone = req.body.phone;
  const sqlSelect =
    "Update db_people Set user_name = ?, gender = ?, dateOfBirth = DATE(STR_TO_DATE(?,'%d-%m-%Y')), country = ?, area = ?, phone = ? Where id = ? ";
  db.query(
    sqlSelect,
    [user_name, gender, dateOfBirth, country, area, phone, id],
    (err, data) => {
      // console.log(err);
      // console.log(data);
    }
  );
});

app.get("/api/totalEmployee", (req, res) => {
  const sqlSelect = "Select Count(*) As total From db_people";
  db.query(sqlSelect, (err, data) => {
    res.send(data);
  });
});

app.get("/api/totalNoMask", (req, res) => {
  // const data = req.params.currentDay;
  // console.log(data);
  const date = `${req.query.currentDay}%`;
  const sqlSelect =
    "Select Count(distinct id) As total  From db_viewdata Where date Like ?";
  db.query(sqlSelect, [date], (err, data) => {
    res.send(data);
    // console.log(err);
  });
});
app.get("/api/listNoMask", (req, res) => {
  // const data = req.params.currentDay;
  // console.log(data);
  const date = `${req.query.currentDay}%`;
  const sqlSelect =
    "Select D.id,D.user_name,DATE_FORMAT(D.date, '%Y-%m-%d %H:%i:%s') as date,E.area  From db_people E Inner Join db_viewdata D on E.id = D.id Where date Like ?";
  db.query(sqlSelect, [date], (err, data) => {
    res.send(data);
    // console.log(err);
  });
});

app.get("/api/totalPlace", (req, res) => {
  const sqlSelect = "Select Count(distinct area) As total From db_people";
  db.query(sqlSelect, (err, data) => {
    res.send(data);
  });
});
app.get("/api/getArea", (req, res) => {
  const sqlSelect =
    "Select area, Count(id) as total From db_people Group by area";
  db.query(sqlSelect, (err, data) => {
    res.send(data);
  });
});

app.get("/api/noMaskByDate", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  // console.log(startDate, endDate);
  const sqlSelect =
    "Select DATE_FORMAT(D.date, '%d-%m') as date, count(distinct D.id) as totalNoMask " +
    "From db_viewdata D " +
    "Where DATE_FORMAT(D.date,'%m-%d') between ? and ? " +
    "group by DATE_FORMAT(date, '%d-%m')";
  db.query(sqlSelect, [startDate, endDate], (err, data) => {
    res.send(data);
  });
});

app.get("/api/noMaskByMonth", (req, res) => {
  const sqlSelect =
    "Select DATE_FORMAT(D.date, '%m') as date, count(distinct D.id) as totalNoMask " +
    "From db_viewdata D Where DATE_FORMAT(D.date,'%m') between '01' and '12' " +
    "group by DATE_FORMAT(date, '%m') ";
  db.query(sqlSelect, (err, data) => {
    res.send(data);
  });
});

app.post("/api/login", (req, res) => {
  const user_name = req.body.user_name;
  const password = req.body.password;
  // const user_name = "admin";
  // const password = "admin";
  const sqlSelect = "select * from db_login where user_name = ? and password = ?";
  db.query(sqlSelect, [user_name, password], (err, data) => {
    // res.send(data);
    // console.log(err)
    if (err) {
      res.send({ err: err });
      console.log(err)
    }

    if (data.length > 0) {
      res.send(data);
    }
    else {
      res.send({ message: "Wrong username or password combination!" })
    }
  })
})

// app.get("/api")

app.listen(3200, () => {
  console.log("running port 3200");
});
