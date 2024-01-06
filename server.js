require("dotenv").config();
const path = require("path");

const express = require("express");
const fs = require("fs");

const _BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://<some-name>.herokuapp.com"
    : process.env.NODE_ENV === "staging"
    ? "https://<some-name>.herokuapp.com"
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
const port = 3000;

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

app.get("/get-orders", (req, res) => {
  fs.readFile("orders.json", (err, data) => {
    if (err) {
      res.status(500).send("Error reading file");
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.post("/add-menu-item", async (req, res) => {
  try {
    // TODO: there must be a sizes available

    let newItem = req.body; // Your new menu item from the request

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

        // default_price_data: {}, // we are making a separate request to create a new price object?
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
    }

    // Read the current menu from menu.json
    fs.readFile("menu.json", (err, data) => {
      if (err) throw err;
      let menu = JSON.parse(data);
      // Add the new item with a new unique id
      newItem.id = menu.length + 1; // Simple example to generate a new ID
      menu.push(newItem);
      // Write the updated menu back to menu.json
      fs.writeFile(
        "menu.json",
        JSON.stringify(menu, null, 2),
        "utf-8",
        (err) => {
          if (err) {
            res.status(500).json({ message: "Error adding menu", err });
          } else {
            res.json({ message: "New item added successfully" });
          }
        }
      );
    });
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

    console.log("newOrder", newOrder);

    if (!newOrder.food_menu) {
      res.status(500).json({ message: "Must order for something" });

      return;
    }

    let orderOnStripe = null;

    if (Array.isArray(newOrder.food_menu)) {
      orderOnStripe = newOrder.food_menu?.map((item) => ({
        price: item,
        quantity: 1,
      }));

      if (orderOnStripe?.length < 1) {
        res.sendStatus(500);

        return;
      }
    } else if (typeof newOrder.food_menu === "string") {
      orderOnStripe = [{ quantity: 1, price: newOrder.food_menu }];
    } else {
      // nothing else.
      // return error?
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

      console.log("session", session);

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

    fs.readFile("menu.json", "utf-8", (err, data) => {
      if (err) {
        res.status(500).send("Error reading file");
      } else {
        // todo: filter the ones without stipe data

        const _data = JSON.parse(data)?.filter(
          (m) =>
            m?.sizes?.length > 0 &&
            m?.sizes?.every((i) => !!i?.productPriceOnStripeId)
        );
        res.json(_data);
      }
    });
  } catch (error) {
    console.error("Error getting menu data:", error);
    // Respond with an error message
    res.status(500).json({ error: "Error getting menu data" });
  }
});

// Endpoint to update order status
app.post("/update-order-status/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;

  // Read the orders data from orders.json
  fs.readFile("orders.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading orders data:", err);
      res.status(500).json({ error: "Error reading orders data" });
      return;
    }

    try {
      let orders = JSON.parse(data); // Parse the JSON data

      // Find the order in the orders array and update its status
      const orderIndex = orders.findIndex((order) => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;

        // Write the updated orders data back to orders.json
        fs.writeFile(
          "orders.json",
          JSON.stringify(orders, null, 2),
          "utf8",
          (err) => {
            if (err) {
              console.error("Error updating order status:", err);
              res
                .status(500)
                .json({ message: "Error updating order status", err });
            } else {
              res.json(orders[orderIndex]); // Return the updated order as JSON
            }
          }
        );
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (parseError) {
      console.error("Error parsing orders data:", parseError);
      res.status(500).json({ error: "Error parsing orders data" });
    }
  });
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

  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  // console.log("what is session", session);

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
