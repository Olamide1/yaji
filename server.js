require("dotenv").config();
const path = require("path");

const express = require("express");
const fs = require("fs");

const db = require('./models')

// only for development
// db.sequelize
// .sync({force: true})
// .then(
//   (_done) => {
//     console.log(`Done syncing tables`);
//   },
//   (_err) => {
//     console.error(`err syncing tables:\n\n`, _err);
//   }
// )
// .catch((_reason) => {
//   // catches .VIRTUAL data type when altering db
//   console.error(`caught this error while syncing tables:\n\n`, _reason);
// });

const _BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://sth-here-3c1f4d8efc12.herokuapp.com"
    : process.env.NODE_ENV === "staging"
    ? "https://sth-here-3c1f4d8efc12.herokuapp.com"
    : "http://localhost:3000";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
  appInfo: {
    // For sample support and debugging, not required for production:
    name: "stripe-checkout-test-v1",
    version: "0.0.1",
    url: "https://github.com/Olamide1/kb",
  },
});

const cors = require("cors"); // Import CORS module
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static("."));

/**
 * Only save order after a successful response/payment from stripe.
 *
 * will be retired...
 */
app.post("/submit-order", (req, res) => {
  const newOrder = req.body;
  console.log("Received order:", req.body); // Log the incoming order
  fs.readFile("orders.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading file");
      return;
    }
    const orders = JSON.parse(data);
    // Important: adding timestamp so we know when the order came in.
    orders.push({ ...newOrder, timestamp: new Date() });
    fs.writeFile("orders.json", JSON.stringify(orders), (err) => {
      if (err) {
        res.status(500).json({ message: "Issue taking your order...", err });
      } else {
        res.json({ message: "Order saved successfully" });
      }
    });
  });
});

app.get("/get-orders", async (req, res) => {
  

  try {
    const _orders = await db.order.findAll({
      include: [
        {
          model: db.orderitem,
          // where: {}
          include: [{
            model: db.submenu,
            include: db.menu
          }]
        },
        {
          model: db.customer,
        },
        {
          model: db.address,
        },
      ],
      order: [
        ['created_at', 'DESC']
      ],
    })
  
    res.json(_orders);
  } catch (error) {
    console.log('what errro?', error);
    res.sendStatus(500)
  }
  
});

app.get("/get-order-metrics", async (req, res) => {

  try {
    // https://stackoverflow.com/a/49575496/9259701
    let _orders_stat = await db.order.count({
      attributes: ['status'], 
      group: 'status',
    })

    // _orders_stat.map((stat) => ({...stat, status: stat.status.replace('_', ' ')}))
  
    res.json(_orders_stat);
  } catch (error) {
    console.log('what errro?', error);
    res.sendStatus(500)
  }
  
});

app.post("/add-menu-item", async (req, res) => {
  try {
    // TODO: there must be a sizes available

    let newItem = req.body; // Your new menu item from the request

    console.log('newItem', newItem)

    const newMenu = await db.menu.create({ 
      description: newItem.description, name: newItem.name
    })

    // res.sendStatus(200)
    // return;

    /**
     * also create on stripe
     *
     * TODO: (https://stripe.com/docs/api/products/create)
     * 1. add images
     *
     * What we'll do is create a product for each available size.
     */

    for (let i = 0; i < newItem.sizes.length; i++) {
      const size = newItem.sizes[i]; // should we use this?
      const productOnStripe = await stripe.products.create({
        name: newItem.name + ` - ${size.name}`,
        description: newItem.description,
        metadata: {
          biz: "yaji_lagos", // don't change this!
          product_type: "food_menu",
          name: newItem.name,
          size: size.name,
        },
        statement_descriptor: "Yaji Restaurant",

        unit_label: "Meal", // or 'Order'?

        // default_price_data: {}, // we are making a separate request to create a new price object
        shippable: true,
      });

      console.log("productOnStripe", productOnStripe);

      // set the Stripe product id in the size object
      newItem.sizes[i].stripeProductId = productOnStripe.id;

      // create a new price for the product.
      const productPriceOnStripe = await stripe.prices.create({
        product: productOnStripe.id,
        currency: "eur",
        // lookup_key: 'yaji_lagos_' + , // needs to be unique
        billing_scheme: "per_unit",
        unit_amount: size.price * 100, // convert to (euro) cents
      });

      console.log("productPriceOnStripe", productPriceOnStripe);

      // set the Stripe product related price id in the size object
      newItem.sizes[i].productPriceOnStripeId = productPriceOnStripe.id;

      // create submenu in db
      const newSubmenu = await db.submenu.create({ 
        menuId: newMenu.id,
        name: size.name,
        stripe_product_id: productOnStripe.id,
        stripe_product_price_id: productPriceOnStripe.id,
        price: size.price
      })
    }

    res.json({ message: "New item added successfully" });

    // no longer using .json.
    // Read the current menu from menu.json
    // fs.readFile("menu.json", (err, data) => {
    //   if (err) throw err;
    //   let menu = JSON.parse(data);
    //   // Add the new item with a new unique id
    //   newItem.id = menu.length + 1; // Simple example to generate a new ID
    //   menu.push(newItem);
    //   // Write the updated menu back to menu.json
    //   fs.writeFile(
    //     "menu.json",
    //     JSON.stringify(menu, null, 2),
    //     "utf-8",
    //     (err) => {
    //       if (err) {
    //         res.status(500).json({ message: "Error adding menu", err });
    //       } else {
    //         res.json({ message: "New item added successfully" });
    //       }
    //     }
    //   );
    // });
  } catch (error) {
    res.status(500).json({ message: "Error adding menu", error });
  }
});

// Payment page
app.post(
  "/payment",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    /**
     * We're expecting an array of price and quantity
     */
    const newOrder = req.body;

    /**
     * @type {{stripe_price_id: quantity, ...}} orders
     */
    const {address, phone, email, name, total, ...orders} = newOrder

    console.log("newOrder", newOrder);

    console.log("orders", orders);

    // res.sendStatus(200)
    // return

    /**
     * customer name can be different. Multiple times order (without sign up).
     * But usually same email. Fix if email isn't same.
     * 
     * Should we create customers on stripe?? Yes. v2.
     * 
     * Should we update the customer name if it's different???
     * TODO: maybe Let's save the name that was used to place the order somewhere.
     */
    const [customer, isCustomerCreated] = await db.customer.findOrCreate({ 
      where: {
        email: email,
      },
      defaults: {
        name: name
      }
    });

    const [newAddress, isNewAddressCreated] = await db.address.findOrCreate({ 
      where: {
        full_address: address,
        customerId: customer.id,
      }
    });

    const newMealOrder = await db.order.create({ 
      addressId: newAddress.id,
      customerId: customer.id,
      phone: phone,
      total: parseFloat(total)
    });

    // link the address to the order
    const linkedAddr = await db.orderaddress.create({ 
      addressId: newAddress.id,
      orderId: newMealOrder.id,
    });
    console.log('<<<<<<< linkedAddr', linkedAddr);

    let orderOnStripe = [];
    for (const [key, value] of Object.entries(orders)) {
      // link the order items to the submenu (that was ordered)
      if (parseInt(value) > 0) { // only save items with quantity greater than 0
        const _sub_menu = await db.submenu.findOne({ where: { stripe_product_price_id: key } });

        console.log('>>>>>>> created _sub_menu', _sub_menu);
        const orderItem = await db.orderitem.create({
          orderId: newMealOrder.id,
          quantity: parseInt(value)
        })

        console.log('------- created orderItem', orderItem);

        // link the order item, to the submenu item
        const order_item_submenu = await db.orderitemsubmenu.create({
          orderitemId: orderItem.id,
          submenuId: _sub_menu.id,
        })
        console.log('+++++++ order_item_submenu', order_item_submenu);

        orderOnStripe.push({ quantity: parseInt(value), price: key })
      }
      // console.log(`${key}: ${value}`);
    }

    if (orderOnStripe.length === 0) {
      // no food item was selected, so no order can be made.
      res.status(200).json({message: 'Please select at least one menu item.'})
      return
    }
    

    console.log("orderOnStripe", orderOnStripe);

    // TODO: collect price id from the submitted form.
    // Set your secret key. Remember to switch to your live secret key in production.
    // See your keys here: https://dashboard.stripe.com/apikeys

    try {
      const session = await stripe.checkout.sessions.create({
        // TODO: maybe when we so sign up or use cookies to store customer emails or sth.
        // ...(req.session.user.stripeCustomerId && {
        //     customer: req.session.user.stripeCustomerId,
        // }),
        customer_email: newOrder.email,
        line_items: orderOnStripe,
        mode: "payment",

        metadata: {
          customer_name: newOrder.name,
          customer_email: newOrder.email,
          customer_phone: newOrder.phone,
          customer_address: newOrder.address,
        },

        /**
         * {CHECKOUT_SESSION_ID} is a string literal; do not change it!
         * the actual Session ID is returned in the query parameter when your customer
         * is redirected to the success page.
         */
        success_url: `${_BASE_URL}/success-order?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${_BASE_URL}/failed-order`,
      });

      // TODO: pass shipping params to checkout session

      // save the order here.

      console.log("session", session);

      // Save the stripe session id in the stripe_session_id of an order
      newMealOrder.stripe_session_id = session.id;
      await newMealOrder.save();

      // 303 redirect to session.url
      res.redirect(303, session.url);
    } catch (error) {
      console.log("failed to generate stripe payment link", error);
      res.sendStatus(500);
    }
  }
);

// Define a route to handle saving menu data
app.post("/save-menu", async (req, res) => {
  try {
    const menuData = req.body;

    // Assuming you have a menu.json file where you want to save the menu data
    const menuFilePath = "menu.json";

    // Write the menu data to the menu.json file
    fs.writeFile(
      menuFilePath,
      JSON.stringify(menuData, null, 2),
      "utf-8",
      (err) => {
        if (err) {
          res.status(500).json({ message: "Error saving menu data", err });
        } else {
          // Respond with a success message
          res.status(200).json({ message: "Menu data saved successfully" });
        }
      }
    );
  } catch (error) {
    console.error("Error saving menu data:", error);
    // Respond with an error message
    res.status(500).json({ error: "Error saving menu data" });
  }
});

app.get("/menu", async (req, res) => {
  try {
    // const prices = await stripe.prices.list({
    //     type: 'one_time',
    //     // lookup_keys: ['yaji_lagos'],
    //     expand: ['data.product'],
    // })

    // console.log('what we have', prices)

    const _menus = await db.menu.findAll({
      // TODO: nested query, where submenu stripe price/product id not null.
      // where: {

      // }
      // we don't need this include.
      include: [
        {
          model: db.submenu,
          // where: ...
        },
      ]
    });

    res.json(_menus); // use .toJSON() ??

    // fs.readFile("menu.json", "utf-8", (err, data) => {
    //   if (err) {
    //     res.status(500).send("Error reading file");
    //   } else {
    //     // todo: filter the ones without stipe data

    //     const _data = JSON.parse(data)?.filter(
    //       (m) =>
    //         m?.sizes?.length > 0 &&
    //         m?.sizes?.every((i) => !!i?.productPriceOnStripeId)
    //     );
    //     res.json(_data);
    //   }
    // });
  } catch (error) {
    console.error("Error getting menu data:", error);
    // Respond with an error message
    res.status(500).json({ error: "Error getting menu data" });
  }
});

app.post('/update-menu-out-of-stock', async (req, res) => {
  console.log('req.body', req.body)
  
  try {
    await db.menu.update({ out_of_stock: req.body.out_of_stock }, {
      where: {
        id: req.body.menu_id,
      }
    });

    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(500)
  }
})

// Endpoint to update order status
app.post("/update-order-status/:orderId", (req, res) => {

  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    db.order.update({status: newStatus}, {
      where: {
        id: orderId
      },
    })

    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(500)
  }
});

app.post("/update-menu", async (req, res) => {
  try {
    const updatedMenuData = req.body; // Get the updated menu data from the request body

    // Read the current menu data from menu.json
    const currentMenuData = await fs.readFile("menu.json", "utf8");
    const menu = JSON.parse(currentMenuData);

    // Replace the menu data with the updated data
    // You can add more robust logic for merging or validating the data as needed
    // For simplicity, this example replaces the entire menu data
    fs.writeFile(
      "menu.json",
      JSON.stringify(updatedMenuData, null, 2),
      "utf8",
      (err) => {
        if (err) {
          res.status(500).json({ message: "Error updating menu", err });
        } else {
          res.status(200).json({ message: "Menu data updated successfully" });
        }
      }
    );
  } catch (error) {
    console.error("Error updating menu data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin", async (req, res) => {
  const options = {
    root: __dirname,
  };
  const fileName = "admin.html";
  res.sendFile(fileName, options, function (err) {
    if (err) {
      res.json({ message: "Oops", err });
      console.error("Error sending file:", err);
    } else {
      console.log("Sent:", fileName);
    }
  });
});

app.get("/", async (req, res) => {
  const options = {
    root: __dirname,
  };
  const fileName = "index.html";
  res.sendFile(fileName, options, function (err) {
    if (err) {
      res.json({ message: "Oops", err });
      console.error("Error sending file:", err);
    } else {
      console.log("Sent:", fileName);
    }
  });
});

app.get("/success-order", async (req, res) => {
  console.log("req.query", req.query);

  if (!req.query.session_id) {
    res.status(500).json({message: 'Invalid URL'})
    return;
  }

  // what are we doing with this?
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log("what is session", session);

  // save the payment status as paid? Important TODO: Use webhook to do this. Only save if it's false.
  // TODO: don't use stripe session id later, let's use our own id?
  // TODO: let's find a way to know when a session has already been used. Find it first, then conditionally update
  
  const _order_session = await db.order.findOne({ 
    where: {
      stripe_session_id: req.query.session_id,
      // payment_confirmed: false
    } 
  });

  if (_order_session === null) {
    res.status(500).json({message: 'That order doesn\'t exist.'})

    return;
  } else if (_order_session.payment_confirmed === true) {
    res.status(500).json({message: 'That order has been received.'})

    return;
  }
  
  await db.order.update(
    { payment_confirmed: true }, {
    where: {
      stripe_session_id: req.query.session_id,
      payment_confirmed: false
    }
  });

  const options = {
    root: __dirname,
  };
  const fileName = "success.html";
  res.sendFile(fileName, options, function (err) {
    if (err) {
      res.json({ message: "Oops", err });
      console.error("Error sending file:", err);
    } else {
      console.log("Sent:", fileName);
    }
  });
});

app.get("/failed-order", async (req, res) => {
  const options = {
    root: __dirname,
  };
  const fileName = "failed.html";
  res.sendFile(fileName, options, function (err) {
    if (err) {
      res.json({ message: "Oops", err });
      console.error("Error sending file:", err);
    } else {
      console.log("Sent:", fileName);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
