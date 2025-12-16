const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Sync database and start server
sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
    
    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      sequelize.sync({ alter: true }).then(() => {
        logger.info('Database synced');
      });
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});
