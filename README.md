# Yaji Lagos.

To run;

for backend:
```cmd
> yarn|npm run start
```

> Open localhost:3000

To deploy to heroku:

```cmd
git push heroku main
```

To see heroku logs
```cmd
heroku logs -n 1500 --app sth-here >> heroku.logs
```

See the app here:
sth-here-3c1f4d8efc12.herokuapp.com

### Common Sequelize commands

1. Generate a migration file.
 ```cmd
 npx sequelize-cli migration:generate --name migration-file-name
 ```
2. Generate a seed file
```cmd
npx sequelize-cli seed:generate --name first-products
```

### TODOs
02.01.2024
* In admin, navigate to menu list, and the out of stock issue.
* Add payments.
* List orders by most recent.


#### Later TODO:
* Have a timestamp of the time and order status was changed.