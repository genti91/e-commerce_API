require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const getApiGames = require('./services/getApiGames');
const getApiPlatforms = require('./services/getApiPlatforms');
const getApiGenres = require('./services/getApiGenres');
const {
  DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT
} = process.env;


let sequelize =
  process.env.NODE_ENV === "production"
    ? new Sequelize({
        database: DB_NAME,
        dialect: "postgres",
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USER,
        password: DB_PASSWORD,
        pool: {
          max: 3,
          min: 1,
          idle: 10000,
        },
        dialectOptions: {
          ssl: {
            require: true,
            // Ref.: https://github.com/brianc/node-postgres/issues/2009
            rejectUnauthorized: false,
          },
          keepAlive: true,
        },
        ssl: true,
      })
    : new Sequelize(
        `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/videogames`,
        { logging: false, native: false }
      );
      
/*const sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@localhost/videogames`, {
  logging: false, // set to console.log to see the raw SQL queries
  native: false, // lets Sequelize know we can use pg-native for ~30% more speed
});*/
const basename = path.basename(__filename);

const modelDefiners = [];

fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

modelDefiners.forEach(model => model(sequelize));

let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

const { Products, Users, Reviews, Platforms, Genre, Screenshots, AuthUsers, UsedGenre , UsedPlatforms } = sequelize.models;

Products.belongsToMany(Users, { through: "wishList", timestamps: false})
Users.belongsToMany(Products, { through: "wishList", timestamps: false })

Products.belongsToMany(AuthUsers, { through: "Favorites", timestamps: false})
AuthUsers.belongsToMany(Products, { through: "Favorites", timestamps: false })

Products.belongsToMany(Users, { through: "Order"})
Users.belongsToMany(Products, { through: "Order"})

Products.belongsToMany(AuthUsers, { through: "order"})
AuthUsers.belongsToMany(Products, { through: "order"})

Products.belongsToMany(Platforms, { through: "PlatformGame", timestamps:false})
Platforms.belongsToMany(Products, { through: "PlatformGame", timestamps:false})

Genre.belongsToMany(Products, { through: "ProductGenre", timestamps:false})
Products.belongsToMany(Genre, { through: "ProductGenre", timestamps:false})

Screenshots.belongsToMany(Products, { through: "ProductScreenshot", timestamps:false})
Products.belongsToMany(Screenshots, { through: "ProductScreenshot", timestamps:false})

console.log('Relations created')

setTimeout(async function load(){
  let products = await Products.findAll();
  if (products.length === 0) {
    setTimeout(async function loadDb() {
      try{
        await getApiPlatforms(Platforms);
        await getApiGenres(Genre);
        await getApiGames(Products, Platforms, Genre, Screenshots, UsedGenre, UsedPlatforms);
      }catch(err){
        console.log(err);
        console.log('error on load db');
      }
    }, 5000);
  }else{
    console.log('Games already loaded ')
  }
}, 2000);


module.exports = {
  ...sequelize.models, 
  conn: sequelize,  
};
