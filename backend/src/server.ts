import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Monitor-Anemia AI Backend is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
