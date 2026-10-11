const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  const f1 = path.join(__dirname, 'index.html');
  const f2 = path.join(__dirname, 'Index.html');
  if (fs.existsSync(f1)) return res.sendFile(f1);
  if (fs.existsSync(f2)) return res.sendFile(f2);
  return res.sendFile(path.join(__dirname, 'mkbet.html'));
});
let gameState='BETTING'; let multiplier=1.00; let crashPoint=2.00; let gameLoop=null;
function generateCrashPoint(){
  const r=Math.random();
  if(r<0.05) return parseFloat((1+Math.random()*0.3).toFixed(2));
  const crash=(0.99/(1-r));
  return parseFloat(Math.min(crash,100).toFixed(2));
}
function startNewRound(){
  gameState='BETTING'; multiplier=1.00; crashPoint=generateCrashPoint();
  console.log('New Round Crash at '+crashPoint+'x');
  io.emit('betting_start',{time:5});
  setTimeout(()=>{
    gameState='FLYING';
    io.emit('flying_start',{});
    let start=Date.now();
    gameLoop=setInterval(()=>{
      let elapsed=(Date.now()-start)/1000;
      multiplier=parseFloat(Math.pow(1.08,elapsed).toFixed(2));
      io.emit('multiplier',{multiplier});
      if(multiplier>=crashPoint){
        clearInterval(gameLoop);
        gameState='CRASHED';
        io.emit('crashed',{crashPoint});
        setTimeout(startNewRound,3000);
      }
    },100);
  },5000);
}
io.on('connection',(socket)=>{
  socket.emit('game_state',{gameState,multiplier});
});
server.listen(PORT,()=>{
  console.log('MKBET running '+PORT);
  startNewRound();
});
