const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const {
  connectDB,
  getUser,
  verifyPassword,
  getConferences,
  createConference,
  addParticipant,
  removeParticipant,
} = require('./database')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())

// Соединение с базой данных
connectDB()

// Авторизация
app.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await getUser(username)
  if (!user || !(await verifyPassword(username, password))) {
    return res.status(401).json({ message: 'Неверный логин или пароль' })
  }
  res.json({ role: user.role })
})

// Получение конференций
app.get('/conferences', async (req, res) => {
  const conferences = await getConferences()
  res.json(conferences)
})

// Создание конференции
app.post('/create-conference', async (req, res) => {
  const { name, creator, password, autoRecord } = req.body
  const conference = await createConference(name, creator, password, autoRecord)
  res.json(conference)
})

// Веб-сокеты для видеочата
io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id)

  socket.on('join-room', async (roomId) => {
    socket.join(roomId)
    await addParticipant(roomId, socket.id)
    io.to(roomId).emit('user-connected', socket.id)
  })

  socket.on('leave-room', async (roomId) => {
    socket.leave(roomId)
    await removeParticipant(roomId, socket.id)
    io.to(roomId).emit('user-disconnected', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected: ' + socket.id)
  })
})

// Запуск сервера
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
