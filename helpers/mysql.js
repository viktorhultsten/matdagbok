const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')

dotenv.config()


const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

async function createUser(user) {
    const { username, password } = user

    const hashedPassword = bcrypt.hashSync(password + process.env.PASSWORD_SALT, 10);

    const con = mysql.createConnection(config);
    const queryResult = await con.promise().query("insert into users (username, password) values (?,?)", [username, hashedPassword])
        .then(data => true)
        .catch(err => false)
        .then(data => {
            con.end()
            return data
        })
    return queryResult
}

async function validateUser(username, password) {
    const con = await mysql.createConnection(config)
    const [rows] = await con.promise().execute('SELECT id, username, password FROM users WHERE username = ?', [username])
    con.end()

    if (rows.length != 1) return { status: false }


    const user = rows[0]
    const verification = bcrypt.compareSync(password + process.env.PASSWORD_SALT, user.password)

    if (verification == false) return { status: false }

    return { status: true, user_id: user.id }
}

async function addIngredients(ingredients) {
    const con = mysql.createConnection(config)
    const queryResult = await con.promise().query("INSERT INTO ingredients (name, calories, owner) VALUES ?", [ingredients])
        .then(data => true)
        .catch(err => false)
        .then(data => {
            con.end()
            return data
        })
    return queryResult
}

async function getIngredients() {
    const con = mysql.createConnection(config)
    const queryResult = await con.promise().query("SELECT id, name, calories, standard_portion FROM ingredients")
        .then(([rows, fields]) => { return { ok: true, data: rows } })
        .catch(err => { return { status: false } })
        .then(data => {
            con.end()
            return data
        })
    return queryResult
}

async function addMeal(mealName, date, userId, consumption) {
    const con = mysql.createConnection(config)
    const queryResult = await con.promise().query("INSERT INTO meals (name, user_id, date) VALUES (?, ?, ?)", [mealName, userId, date])
    let insertedId = await con.promise().query("SELECT LAST_INSERT_ID() as id")
    insertedId = insertedId[0][0].id

    consumption = consumption.map(c => [...c, insertedId, date])
    console.log(consumption)
    const addConsumption = await con.promise().query("INSERT INTO consumption (name, amount, amount_unit, calories, calorie_type, meal_id, date) VALUES ?", [consumption])
    con.end()

    return { status: true }
}

async function getMeal(mealId, userId) {
    const con = mysql.createConnection(config)
    const mealResult = await con.promise().query("SELECT * FROM meals WHERE id = ? AND user_id = ?", [mealId, userId])

    if (mealResult[0].length != 1) return { status: false, msg: "No meal found" }

    const mealName = mealResult[0][0].name
    const regDate = mealResult[0][0].reg_date

    const consumptionResult = await con.promise().query("SELECT * FROM consumption WHERE meal_id = ?", [mealId])

    const consumption = consumptionResult[0].map(c => {
        return { id: c.id, name: c.name, amount: c.amount, amountUnit: c.amount_unit, calories: c.calories, total_calories: (c.calorie_type == "Normal") ? Math.round(c.amount * c.calories / 100) : c.calories, calorieCategory: c.calorie_type }
    })

    const data = {
        meal_name: mealName,
        reg_date: regDate,
        consumption
    }

    return { status: true, data }
}

async function getConsumptionFromDay(userId, regDate) {
    const con = mysql.createConnection(config)
    const mealResult = await con.promise().query("SELECT * FROM meals WHERE user_id = ? AND date >= ? AND date < (? + INTERVAL 1 DAY)", [userId, regDate, regDate])

    if (mealResult[0].length == 0) return { status: true, data: [] }

    const mealIds = mealResult[0].map(m => m.id)
    const consumptionResult = await con.promise().query("SELECT * FROM consumption WHERE meal_id IN (?)", [mealIds])

    const data = mealResult[0].map(m => {
        const ingredients = consumptionResult[0].filter(c => c.meal_id == m.id).map(c => { return { id: c.id, name: c.name, amount: c.amount, amountUnit: c.amount_unit, calories: c.calories, total_calories: (c.calorie_type == "Normal") ? Math.round(c.amount * c.calories / 100) : c.calories, calorieCategory: c.calorie_type } })
        return {
            meal_id: m.id,
            meal_name: m.name,
            reg_date: m.reg_date,
            ingredients
        }
    })

    return { status: true, data }
}

module.exports = { createUser, validateUser, addIngredients, getIngredients, addMeal, getMeal, getConsumptionFromDay }