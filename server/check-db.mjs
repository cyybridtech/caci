import net from 'net';

const client = new net.Socket();
client.connect(3306, '127.0.0.1', () => {
  console.log('Connected to port 3306');
});

client.on('data', (data) => {
  console.log('Handshake from server:', data.toString('utf8', 5, 50));
  client.destroy();
});

client.on('error', (err) => {
  console.error('Connection error:', err.message);
});
