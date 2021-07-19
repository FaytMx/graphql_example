const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./schema/schema");
const mongoose = require("mongoose");
const auth = require("./utils/auth");

mongoose
  .connect("mongodb://localhost/coursedb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Conectado a Mongo DB");
  })
  .catch((err) => {
    console.log("Error al conectar a la DB");
  });

const app = express();

app.use(auth.checkHeaders);

app.use(
  "/graphql",
  graphqlHTTP((req) => {
    return {
      schema,
      context: {
        user: req.user,
      },
      graphiql: true,
    };
  })
);

app.listen(3131, () => {
  console.log("Escuchando del puerto: 3131");
});
