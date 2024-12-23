const { MongoClient } = require('mongodb')
const bcrypt = require('bcrypt')

const uri = 'mongodb://localhost:27017'
const dbName = 'university_chat'
let db

const connectDB = async () => {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  await client.connect()
  db = client.db(dbName)
}

const getUser = async (username) => {
  const user = await db.collection('users').findOne({ username })
  return user
}

const createUser = async (username, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  await db
    .collection('users')
    .insertOne({ username, password: hashedPassword, role })
}

const verifyPassword = async (username, password) => {
  const user = await getUser(username)
  if (!user) return false
  return bcrypt.compare(password, user.password)
}

const getConferences = async () => {
  return await db.collection('conferences').find().toArray()
}

const createConference = async (name, creator, password, autoRecord) => {
  const conference = { name, creator, password, autoRecord, participants: [] }
  await db.collection('conferences').insertOne(conference)
  return conference
}

const addParticipant = async (conferenceId, participant) => {
  await db
    .collection('conferences')
    .updateOne({ _id: conferenceId }, { $push: { participants: participant } })
}

const removeParticipant = async (conferenceId, participant) => {
  await db
    .collection('conferences')
    .updateOne({ _id: conferenceId }, { $pull: { participants: participant } })
}

module.exports = {
  connectDB,
  getUser,
  createUser,
  verifyPassword,
  getConferences,
  createConference,
  addParticipant,
  removeParticipant,
}
