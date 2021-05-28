const express = require('express')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
var userData = require("./UserData")

const app = express()
const port = 3000

app.use(express.urlencoded({ extended: false })) // middleware, parses incoming requests with JSON payloads
app.use(express.json()) // parses incoming requests with JSON payloads

var mysql = require("mysql")

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Pr",
    database: "project"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

mongoose
    .connect("mongodb://localhost:27017/dbLogin")
    .then(() => {
        console.log("Database is connected");
    })
    .catch(err => {
        console.log("Error is ", err.message);
    });

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.get('/SignUp', (req, res) => {
    res.sendFile(__dirname + "/signup.html")
})

app.get('/Home/pres', (req, res) => {
    res.sendFile(__dirname + "/prescription.html")
})

app.get('/Login', (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

app.get('/Home', (req, res) => {
    res.sendFile(__dirname + "/home.html")
})

app.get('/Home/order', (req, res) => {
    res.sendFile(__dirname + "/order.html")
})

app.get('/Home/payment', (req, res) => {
    res.sendFile(__dirname + "/payment.html")
})

app.get('/Home/user', (req, res) => {
    con.query('SELECT * fROM user', (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.get('/Home/Med', (req, res) => {
    con.query('SELECT * fROM drugdetails', (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.get('/Home/inventory', (req, res) => {
    con.query('SELECT * fROM inventory', (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.post('/Home/drug', (req, res) => {
    var sql = " SELECT * FROM inventory t1,drugdetails t2 WHERE t1.drugId = t2.drugId AND t1.drugId = ?"
    con.query(sql, [req.body.drugId], (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.post('/Home/drugCause', (req, res) => {
    var sql = " SELECT * FROM inventory t1,drugdetails t2 WHERE t1.drugId = t2.drugId AND t2.cause = ?"
    con.query(sql, [req.body.cause], (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.post('/Home/pres', async (req, res) => {
    console.log("inside prescription")
    var presc = {
        userId: req.body.userId,
        name: req.body.name,
        age: req.body.age,
        docName: req.body.docName,
        drugId: req.body.drugId,
        phone: req.body.phone,
        doPr: req.body.doPr
    }
    console.log(presc)
    let val = [presc.drugId, presc.docName, presc.name, presc.doPr, presc.age, presc.phone, presc.userId]
    con.query('insert into prescription values (?,?,?,?,?,?,?)', val, (err, results, fields) => {
        if (err)
            console.log(err)
        else
            console.log(results)
        res.redirect('/Home')
    })
})

app.post('/Home/seepres', (req, res) => {
    var sql = " SELECT * FROM prescription WHERE userId = ?"
    con.query(sql, [req.body.userId], (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})


app.post('/Home/order', async (req, res) => {
    console.log("inside Order")
    var ord = {
        userId: req.body.userId,
        drugId: req.body.drugId,
        quan: req.body.quan
    }

    var todaydate = new Date()
    var id = (Date.now() / 100000000) + (Date.now() % 100000)
    var orderId = ~~id //to convert into int

    var shipDate = new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000));
    var delDate = new Date(new Date().getTime() + (5 * 24 * 60 * 60 * 1000));
    var stat = "shipped"

    await con.query('SELECT *  FROM inventory WHERE drugId = ?', [ord.drugId], (err, results, fields) => {
        if (err)
            console.log(err)
        else
            var price = results[0].priceEach
        var amount = ord.quan * price
        let val = [orderId, amount, ord.quan, todaydate, ord.drugId, ord.userId]
        var sql = 'INSERT INTO orderdetails VALUES (?,?,?,?,?,?)'
        con.query(sql, val, (err, results, fields) => {
            if (err)
                console.log(err)
            else
                console.log(results)
        })
        let val2 = [orderId, shipDate, delDate, stat, ord.userId]
        var sql2 = 'INSERT INTO orderstatus VALUES (?,?,?,?,?)'
        con.query(sql2, val2, (err, results, fields) => {
            if (err)
                console.log(err)
            else
                console.log(results)
        })

    })

    con.query('update inventory set quantity = quantity - ? where drugid = ?', [ord.quan, ord.drugId], (err, results, fields) => {
        if (err)
            console.log(err)
        else
            console.log(results)
    })

    res.send(`<h1>Order Id = ${orderId}</h1>
    <a href="../Home">Home</a>
    <br>
    <a href="/Home/payment"> Proceed to pay </a>`) //add html using res

    //res.redirect('/Home')

})

app.post('/Home/seeorder', (req, res) => {
    var sql = "SELECT * FROM orderdetails t1,orderstatus t2 WHERE t1.orderId = t2.orderId AND t1.userId = ?"
    con.query(sql, [req.body.userId], (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.post('/Home/seeorderId', (req, res) => {
    var sql = 'SELECT * FROM orderdetails t1,orderstatus t2 WHERE t1.orderId = t2.orderId AND t1.orderId = ?'
    con.query(sql, [req.body.orderId], (err, results, fields) => {
        if (!err)
            res.send(results)
        else
            console.log(err)
    })
})

app.post('/Home/payment', (req, res) => {
    console.log("Inside Payment")
    var pay = {
        userId: req.body.userId,
        orderId: req.body.orderId,
        mode: req.body.mode
    }
    var paydate = new Date()
    var payId = (Date.now() / 100000000) + (Date.now() % 10000)
    con.query('select amount from orderdetails where orderId = ?', [pay.orderId], (err, result, fields) => {
        if (err)
            console.log(err)
        else
            amount = result[0].amount
        let val = [pay.orderId, "paid", pay.mode, pay.userId, paydate, amount, payId]
        var sql = 'INSERT INTO paymentdetails VALUES (?,?,?,?,?,?,?)'
        con.query(sql, val, (err, results, fields) => {
            if (err)
                console.log(err)
            else
                console.log(results)
        })
    })
    res.redirect('/Home')
})

app.post('/Home/seePay', (req, res) => {
    var sql = " SELECT * FROM paymentdetails WHERE orderId = ?"
    con.query(sql, [req.body.orderId], (err, rows, fields) => {
        if (!err)
            res.send(rows)
        else
            console.log(err)
    })
})

app.post('/SignUp', async (req, res) => {
    const hashPass = await bcrypt.hash(req.body.Password, 10)
    var newUser = new User({
        email: req.body.email,
        password: req.body.Password, //hashPass
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        dob: req.body.dob
    })
    console.log(newUser)
    console.log("Registered Successfully")
    let val1 = [newUser.name, newUser.email, newUser.phone, newUser.address, newUser.dob]
    con.query('insert into user (name,email,phone,address,dob) values (?,?,?,?,?)', val1, (err, results, fields) => {
        if (err)
            console.log(err)
        else
            console.log(results)
    })
    await newUser
        .save()
        .then(() => {
            res.redirect('/')
        })
        .catch(err => {
            console.log("Error is ", err.message)
        })
})

app.post('/Login', async (req, res) => {
    var data = {
        email: req.body.email,
        pass: req.body.Password
    }
    await User.findOne({ email: data.email })
        .then(profile => {
            if (!profile) {
                res.send("User does not exist")
                console.log("User does not exist")
            } else {
                if (profile.password == data.pass) {
                    console.log("Authenticated")
                    res.redirect('/Home')
                } else {
                    res.send("Incorrect Email Id/ Password")
                    console.log("Unauthorized")
                }
            }
        })
        .catch(err => {
            console.log("Error is ", err.message)
        })
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
