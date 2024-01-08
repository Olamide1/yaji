const fs = require('fs');

const dotenv = require('dotenv'); // better to call first, before using process.env.*
dotenv.config();

module.exports = {
  development: {
    "username": process.env.DEV_DB_USERNAME,
    "user": process.env.DEV_DB_USERNAME, // knex uses 'user'
    "password": process.env.DEV_DB_PASSWORD,
    "database": process.env.DEV_DB_NAME,
    "host": process.env.DEV_DB_HOSTNAME,
    "dialect": process.env.DEV_DB_DIALECT,
    logging: console.log, // https://sequelize.org/docs/v6/getting-started/#logging
    "port": process.env.DEV_DB_PORT,
    "ssl": false,
    "dialectOptions": {
        "ssl": {
          "require": true, // This will help you. But you will see new error
          "rejectUnauthorized": false // This line will fix new error
        }
    },
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
    "seederStorage": "sequelize", // save seeding history
  
  },
  production: {
    "username": process.env.PROD_DB_USERNAME,
    "user": process.env.PROD_DB_USERNAME, // knex uses 'user'
    "password": process.env.PROD_DB_PASSWORD,
    "database": process.env.PROD_DB_NAME,
    "host": process.env.PROD_DB_HOSTNAME,
    "dialect": process.env.PROD_DB_DIALECT,
    
    "port": process.env.PROD_DB_PORT,
    "ssl": true,
    "dialectOptions": {
        "ssl": {
          "require": true,
          "rejectUnauthorized": false
        }
    },
    "pool": {
      "max": 5,
      "min": 0,
      "acquire": 30000,
      "idle": 10000
    },
    "seederStorage": "sequelize", // save seeding history
  }
}
