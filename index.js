const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require("cors")

const dbPath = path.join(__dirname, 'clawEnterprises.db')
const app = express()

app.use(cors())
app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(process.env.PROT || 3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(-1)
  }
}
initializeDBAndServer()

//User Register API
app.post('/user/', async (request, response) => {
  const {id, username, password} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (id, username, password) 
      VALUES 
        (
          ${id}, 
          '${username}',
          '${hashedPassword}'
          )`
    await db.run(createUserQuery)
    response.send(`User created successfully`)
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//User Login API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

//post API for Insert todoItems
app.post('/todos/', async (request, response) => {
  const {id, user_id, description, status} = request.body
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const createUserQuery = `
      INSERT INTO 
        todoItems (id, user_id, description, status) 
      VALUES 
        (
          ${id}, 
          ${user_id},
          '${description}',
          '${status}'
          );`
        await db.run(createUserQuery)
        response.send('created todo items')
      }
    })
  }
})

// PUT API 4 Update todo
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  const {description, status} = requestBody
  console.log(description, status)
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          UPDATE
            todoItems
          SET
            description = '${description}',
            status = '${status}'
           WHERE
            id = ${todoId}`
        data = await db.run(getToDoQuery)

        response.send(data)
      }
    })
  }
})

//Get single todoItem API
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getBooksQuery = `
            SELECT
              *
            FROM
             todoItems
            WHERE
             id = ${todoId};`
        const booksArray = await db.all(getBooksQuery)
        response.send(booksArray)
      }
    })
  }
})

//Get todoItems API
app.get('/todos/', async (request, response) => {
  const getBooksQuery = `
            SELECT
              *
            FROM
             todoItems
            ;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

//DELETE from Post table  API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid Access Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.send('Invalid Access Token')
      } else {
        const getToDoQuery = `
          DELETE FROM
            todoItems
          WHERE
            id = ${todoId};`
        const dbResponse = await db.run(getToDoQuery)
        response.send('Todo Deleted')
      }
    })
  }
})
