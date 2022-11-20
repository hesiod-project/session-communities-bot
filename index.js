const fs = require('fs')
const SessionClient = require('../node-session-client/session-client.js')

const client = new SessionClient()

// load last message we've seen
if (fs.existsSync('lastHash.txt')) {
  client.lastHash = fs.readFileSync('lastHash.txt').toString()
}

const LokinetURL = 'http://open.getsession.org/lokinet?public_key=a03c383cf63c3c4efe67acc52112a6dd734b3a946b9545f488aaa93da7991238'

client.loadIdentity({
  seed: fs.existsSync('seed_community.txt') && fs.readFileSync('seed_community.txt').toString(),
  displayName: 'Hesiod-Project\'s Session Communities Bot',
  //avatarFile: '5f16f4fd7ca8def05968bbca_Jk79urotkJJtMHZNO3kduoJLgAW6X6kgceEjnbI2VeeOseBujKs6ok_IbYl3OHxaaHLUmtMVRNk.png',
}).then(async() => {
  console.log(client.identityOutput)
  const lokinetHandle = await client.joinOpenGroupV3(LokinetURL)
  if (!lokinetHandle) {
    console.error('failed to join lokinet community')
    process.exit(1)
  }

  // if we open here we will miss the initial messages sitting in the dm inbox
  // which is usually desired
  await client.open()

  // save received messages state
  client.on('updateLastHash', hash => {
    console.log('setLast', hash)
    fs.writeFileSync('lastHash.txt', hash)
  })

  // handle recieved messages
  client.on('messages', msgs => {
    msgs.forEach(async msg => {
      if (!msg) {
        console.warn('wtf, falsish msg')
        return
      }

      // handle blinded and regular dms
      // blinded source will start with 15
      // regular DM source will start with 05
      if (!msg.roomHandle && msg.body) {
        // you can receive the same DM more than once though
        // so be careful
        console.log('DM from', msg.source, msg.profile?.displayName + ':', msg.body)
      }

      // handle blinded open/public messages
      if (msg.roomHandle && msg.body) {
        // all rooms
        if (msg.body.match(/^\/botdir/) || msg.body.match(/^\/botdirectory/) || msg.body.match(/^\/botbot/)) {
          msg.roomHandle.send('Contact Vector0\'s bot directory at:')
          msg.roomHandle.send('05c87493c457b29a4137c091b59998cb5ffd7fd727d19ba0046deff47abb7adf35')
          console.log('responded', msg.source, msg.body)
        }

        if (msg.body.match(/^\/buildbot/) || msg.body.match(/^\/buildabot/)) {
          msg.roomHandle.send('https://github.com/hesiod-project/node-session-client/')
          console.log('responded', msg.source, msg.body)
        }

        if (msg.body.match(/^\/help/)) {
          msg.roomHandle.send('There is no help for you')
          console.log('responded', msg.source, msg.body)
        }
      }

    })
  })

  // notify of startup/restart
  //client.send(YOUR_SESSION_ID, 'Session Communities Bot startup', {})
})
