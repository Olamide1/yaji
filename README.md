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
* Have a 404 page, we don't have a page for that url, but we have these meals...

### Design Inspirations
* Tell the 3 step process. Like [this](https://dribbble.com/shots/23193838-Food-Delivery-Web-Landing-Page-UI)
* Show menus. Like [this](https://dribbble.com/shots/15856903-Food-Delivery-Landing-page/attachments/7678659?mode=media)
    * Use this [blog component](https://components.bulma-css.com/components/blog)
    * Or this [shopping component](https://components.bulma-css.com/components/shopping)
    * Should this [list component](https://components.bulma-css.com/components/list) be used for mobile view?
* ... they pay with Stripe.
* Pick out components from [here](https://components.bulma-css.com/components).


#### Later TODO:
* Have a timestamp of the time and order status was changed.